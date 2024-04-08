import { Inject, Injectable, LoggerService, Optional } from '@nestjs/common';
import { Registry, REGISTRY_CONTRACT_TOKEN } from '@catalist-nestjs/contracts';
import { EntityManager } from '@mikro-orm/knex';
import { LOGGER_PROVIDER } from '@catalist-nestjs/logger';
import { OneAtTime } from '@catalist-nestjs/decorators';

import EventEmitter from 'events';
import { CronJob } from 'cron';

import { RegistryMetaFetchService } from '../fetch/meta.fetch';
import { RegistryKeyFetchService } from '../fetch/key.fetch';
import { RegistryOperatorFetchService } from '../fetch/operator.fetch';

import { RegistryMetaStorageService } from '../storage/meta.storage';
import { RegistryKeyStorageService } from '../storage/key.storage';
import { RegistryOperatorStorageService } from '../storage/operator.storage';

import { RegistryMeta } from '../storage/meta.entity';
import { RegistryKey } from '../storage/key.entity';
import { RegistryOperator } from '../storage/operator.entity';

import { compareMeta } from '../utils/meta.utils';
import { compareOperators } from '../utils/operator.utils';

import { REGISTRY_GLOBAL_OPTIONS_TOKEN } from './constants';
import { RegistryOptions } from './interfaces/module.interface';
import { chunk } from '@catalist-nestjs/utils';

@Injectable()
export abstract class AbstractRegistryService {
  constructor(
    @Inject(REGISTRY_CONTRACT_TOKEN) protected registryContract: Registry,
    @Inject(LOGGER_PROVIDER) protected logger: LoggerService,

    protected readonly metaFetch: RegistryMetaFetchService,
    protected readonly metaStorage: RegistryMetaStorageService,

    protected readonly keyFetch: RegistryKeyFetchService,
    protected readonly keyStorage: RegistryKeyStorageService,

    protected readonly operatorFetch: RegistryOperatorFetchService,
    protected readonly operatorStorage: RegistryOperatorStorageService,

    protected readonly entityManager: EntityManager,

    @Optional()
    @Inject(REGISTRY_GLOBAL_OPTIONS_TOKEN)
    public options?: RegistryOptions,
  ) {
    this.eventEmitter = new EventEmitter();
    this.cronJob = new CronJob(
      options?.subscribeInterval || '*/10 * * * * *',
      () => this.cronHandler(),
    );
  }

  eventEmitter: EventEmitter;
  cronJob: CronJob;

  @OneAtTime()
  protected async cronHandler() {
    try {
      const result = await this.update('latest');
      if (!result) return;
      this.eventEmitter.emit('result', result);
    } catch (error) {
      this.eventEmitter.emit('error', error);
    }
  }

  protected collectListenerCount() {
    return (
      this.eventEmitter.listenerCount('result') +
      this.eventEmitter.listenerCount('error')
    );
  }

  public subscribe(cb: (error: null | Error, payload: RegistryKey[]) => void) {
    this.cronJob.start();
    const resultCb = (result: RegistryKey[]) => cb(null, result);
    this.eventEmitter.addListener('result', resultCb);
    this.eventEmitter.addListener('error', cb);
    return () => {
      this.eventEmitter.off('result', resultCb);
      this.eventEmitter.off('error', cb);
      if (!this.collectListenerCount()) {
        this.cronJob.stop();
      }
    };
  }

  /** collects changed data from the contract and store it to the db */
  public async update(blockHashOrBlockTag: string | number) {
    const prevMeta = await this.getMetaDataFromStorage();
    const currMeta = await this.getMetaDataFromContract(blockHashOrBlockTag);

    const isSameContractState = compareMeta(prevMeta, currMeta);

    this.logger.log('Collected metadata', { prevMeta, currMeta });

    const previousBlockNumber = prevMeta?.blockNumber ?? -1;
    const currentBlockNumber = currMeta.blockNumber;

    if (previousBlockNumber > currentBlockNumber) {
      this.logger.warn('Previous data is newer than current data');
      return;
    }

    if (isSameContractState) {
      this.logger.debug?.('Same state, no data update required', { currMeta });

      await this.entityManager.transactional(async (entityManager) => {
        await entityManager.nativeDelete(RegistryMeta, {});
        await entityManager.persist(new RegistryMeta(currMeta));
      });

      this.logger.debug?.('Updated metadata in the DB', { currMeta });
      return;
    }

    const blockHash = currMeta.blockHash;

    const previousOperators = await this.getOperatorsFromStorage();
    const currentOperators = await this.getOperatorsFromContract(blockHash);

    this.logger.log('Collected operators', {
      previousOperators: previousOperators.length,
      currentOperators: currentOperators.length,
    });

    const updatedKeys = await this.getUpdatedKeysFromContract(
      previousOperators,
      currentOperators,
      blockHash,
    );

    this.logger.log('Fetched updated keys', {
      updatedKeys: updatedKeys.length,
    });

    await this.save(updatedKeys, currentOperators, currMeta);

    this.logger.log('Saved data to the DB', {
      operators: currentOperators.length,
      updatedKeys: updatedKeys.length,
      currMeta,
    });

    return currMeta;
  }

  /** contract */
  /** returns the meta data from the contract */
  public async getMetaDataFromContract(
    blockHashOrBlockTag: string | number,
  ): Promise<RegistryMeta> {
    const { provider } = this.registryContract;
    const block = await provider.getBlock(blockHashOrBlockTag);
    const blockHash = block.hash;
    const blockTag = { blockHash };

    const keysOpIndex = await this.metaFetch.fetchKeysOpIndex({ blockTag });

    return {
      blockNumber: block.number,
      blockHash,
      keysOpIndex,
      timestamp: block.timestamp,
    };
  }

  /** returns operators from the contract */
  public async getOperatorsFromContract(blockHash: string) {
    const overrides = { blockTag: { blockHash } };
    return await this.operatorFetch.fetch(0, -1, overrides);
  }

  /** returns the right border of the update keys range */
  abstract getToIndex(currOperator: RegistryOperator): number;

  /** returns updated keys from the contract */
  public async getUpdatedKeysFromContract(
    previousOperators: RegistryOperator[],
    currentOperators: RegistryOperator[],
    blockHash: string,
  ) {
    /**
     * TODO: optimize a number of queries
     * it's possible to update keys faster by using different strategies depending on the reason for the update
     */
    const keysByOperator = await Promise.all(
      currentOperators.map(async (currOperator, currentIndex) => {
        // check if the operator in the registry has changed since the last update
        const prevOperator = previousOperators[currentIndex] ?? null;
        const isSameOperator = compareOperators(prevOperator, currOperator);

        // skip updating keys from 0 to `usedSigningKeys` of previous collected data
        // since the contract guarantees that these keys cannot be changed
        const unchangedKeysMaxIndex = isSameOperator
          ? prevOperator.usedSigningKeys
          : 0;

        // get the right border up to which the keys should be updated
        // it's different for different scenarios
        const toIndex = this.getToIndex(currOperator);

        // fromIndex may become larger than toIndex if used keys are deleted
        // this should not happen in mainnet, but sometimes keys can be deleted in testnet by modification of the contract
        const fromIndex =
          unchangedKeysMaxIndex <= toIndex ? unchangedKeysMaxIndex : 0;

        const operatorIndex = currOperator.index;
        const overrides = { blockTag: { blockHash } };

        const result = await this.keyFetch.fetch(
          operatorIndex,
          fromIndex,
          toIndex,
          overrides,
        );

        this.logger.log('Keys fetched', {
          operatorIndex,
          fromIndex,
          toIndex,
          fetchedKeys: result.length,
        });

        return result;
      }),
    );

    return keysByOperator.flat().filter((key) => key);
  }

  /** storage */

  /** returns the latest meta data from the db */
  public async getMetaDataFromStorage() {
    return await this.metaStorage.get();
  }

  /** returns the latest operators data from the db */
  public async getOperatorsFromStorage() {
    return await this.operatorStorage.findAll();
  }

  /** returns all the keys from storage */
  public async getOperatorsKeysFromStorage() {
    return await this.keyStorage.findAll();
  }

  /** saves all the data to the db */
  public async save(
    updatedKeys: RegistryKey[],
    currentOperators: RegistryOperator[],
    currMeta: RegistryMeta,
  ) {
    // save all data in a transaction
    await this.entityManager.transactional(async (entityManager) => {
      await Promise.all(
        // remove all keys from the database that are greater than the total number of keys
        // it's needed to clear the list in db when removing keys from the contract
        currentOperators.map(async (operator) => {
          await entityManager.nativeDelete(RegistryKey, {
            index: { $gte: operator.totalSigningKeys },
            operatorIndex: operator.index,
          });
        }),
      );

      await Promise.all(
        // 500 — SQLite limit in insert operation
        chunk(updatedKeys, 499).map(async (keysChunk) => {
          await entityManager
            .createQueryBuilder(RegistryKey)
            .insert(keysChunk)
            .onConflict(['index', 'operator_index'])
            .merge()
            .execute();
        }),
      );

      await Promise.all(
        // 500 — SQLite limit in insert operation
        chunk(currentOperators, 499).map(async (operatorsChunk) => {
          await entityManager
            .createQueryBuilder(RegistryOperator)
            .insert(operatorsChunk)
            .onConflict('index')
            .merge()
            .execute();
        }),
      );

      // replace metadata with new one
      await entityManager.nativeDelete(RegistryMeta, {});
      await entityManager.persist(new RegistryMeta(currMeta));
    });
  }

  /** clears the db */
  public async clear() {
    await this.entityManager.transactional(async (entityManager) => {
      entityManager.nativeDelete(RegistryKey, {});
      entityManager.nativeDelete(RegistryOperator, {});
      entityManager.nativeDelete(RegistryMeta, {});
    });
  }
}
