import { Injectable } from '@nestjs/common';
import { ConsensusService } from '@catalist-nestjs/consensus';
import { ValidatorsRegistryInterface, BlockId } from './interfaces';
import {
  BlockHeader,
  Validator,
  ConsensusMeta,
  ConsensusValidatorsAndMetadata,
  Slot,
} from './types';
import { FindOptions, FilterQuery, StorageServiceInterface } from './storage';
import { parseAsTypeOrFail, calcEpochBySlot } from './utils';
import { ConsensusDataInvalidError } from './errors';
import { ConsensusValidatorEntity } from './storage/consensus-validator.entity';
import { EntityManager } from '@mikro-orm/knex';
import { processValidatorsStream } from './utils/validators.stream';
import { IsolationLevel } from '@mikro-orm/core';

@Injectable()
export class ValidatorsRegistry implements ValidatorsRegistryInterface {
  public constructor(
    protected readonly consensusService: ConsensusService,
    protected readonly storageService: StorageServiceInterface,
  ) {}

  /**
   * @inheritDoc
   */
  public async getMeta(): Promise<ConsensusMeta | null> {
    return this.storageService.getConsensusMeta();
  }

  /**
   * @inheritDoc
   */
  public async getValidators(
    pubkeys?: string[],
    where?: FilterQuery<ConsensusValidatorEntity>,
    options?: FindOptions<ConsensusValidatorEntity>,
  ): Promise<ConsensusValidatorsAndMetadata> {
    return this.storageService.getValidatorsAndMeta(pubkeys, where, options);
  }

  protected isNewDataInConsensus(
    previousMeta: ConsensusMeta,
    currentBlockHeader: BlockHeader,
  ): boolean {
    return previousMeta.slot < currentBlockHeader.slot;
  }

  /**
   * @inheritDoc
   */
  public async update(blockId: BlockId): Promise<ConsensusMeta> {
    const previousMeta = await this.storageService.getConsensusMeta();
    const blockHeader = await this.getSlotHeaderFromConsensus(blockId);

    if (previousMeta && !this.isNewDataInConsensus(previousMeta, blockHeader)) {
      return previousMeta;
    }

    const consensusMeta = await this.getConsensusMetaFromConsensus(
      blockHeader.root,
    );

    const validators = await this.getValidatorsFromConsensus(
      consensusMeta.slotStateRoot,
    );

    await this.storageService.updateValidatorsAndMeta(
      validators,
      consensusMeta,
    );

    return consensusMeta;
  }

  public async updateStream(blockId: BlockId): Promise<ConsensusMeta> {
    const previousMeta = await this.storageService.getConsensusMeta();
    const blockHeader = await this.getSlotHeaderFromConsensus(blockId);

    if (previousMeta && !this.isNewDataInConsensus(previousMeta, blockHeader)) {
      return previousMeta;
    }

    const consensusMeta = await this.getConsensusMetaFromConsensus(
      blockHeader.root,
    );

    const em: EntityManager = this.storageService.getEntityManager();

    await em.transactional(
      async () => {
        const validators = await this.getValidatorsFromConsensusStream(
          consensusMeta.slotStateRoot,
        );

        await this.storageService.deleteValidators();
        await this.storageService.updateMeta(consensusMeta);

        const callback = (validatorsChunk: Validator[]) =>
          this.storageService.updateValidators(validatorsChunk);

        await processValidatorsStream(validators, callback);
      },
      { isolationLevel: IsolationLevel.READ_COMMITTED },
    );

    return consensusMeta;
  }

  protected async getValidatorsFromConsensusStream(
    slotRoot: string,
  ): Promise<NodeJS.ReadableStream> {
    const validatorsData: NodeJS.ReadableStream =
      await this.consensusService.getStateValidatorsStream({
        stateId: slotRoot,
      });

    return validatorsData;
  }

  protected async getValidatorsFromConsensus(
    slotRoot: string,
  ): Promise<Validator[]> {
    const validatorsData = await this.consensusService.getStateValidators({
      stateId: slotRoot,
    });

    const validators = validatorsData?.data;

    if (!Array.isArray(validators)) {
      throw new ConsensusDataInvalidError(`Validators must be array`);
    }

    return validators.map((validator) => {
      // runtime type check
      /* istanbul ignore next */
      return parseAsTypeOrFail(
        Validator,
        {
          pubkey: validator.validator?.pubkey,
          index: validator.index,
          status: validator.status,
        },
        (error) => {
          throw new ConsensusDataInvalidError(`Got invalid validators`, error);
        },
      );
    });
  }

  protected async getSlotHeaderFromConsensus(
    blockId: BlockId,
  ): Promise<BlockHeader> {
    const header = await this.consensusService.getBlockHeader({
      blockId: blockId.toString(),
    });

    /* istanbul ignore next */
    const root = header?.data?.root;
    /* istanbul ignore next */
    const slot = header?.data?.header?.message?.slot;

    /**
     * TODO Should we have an option to check `execution_optimistic === false`
     */

    return parseAsTypeOrFail(
      BlockHeader,
      {
        root,
        slot,
      },
      (error) => {
        throw new ConsensusDataInvalidError(`Got invalid block header`, error);
      },
    );
  }

  protected async getConsensusMetaFromConsensus(
    blockId: string,
  ): Promise<ConsensusMeta> {
    const block = await this.consensusService.getBlockV2({
      blockId: blockId,
    });

    /* istanbul ignore next */
    const beaconBlockBody = block?.data?.message?.body;
    const executionPayload =
      beaconBlockBody && 'execution_payload' in beaconBlockBody
        ? beaconBlockBody.execution_payload
        : null;

    if (!executionPayload) {
      throw new ConsensusDataInvalidError(
        `No execution_payload data in a block`,
      );
    }

    /* istanbul ignore next */
    const slot = parseAsTypeOrFail(
      Slot,
      block?.data?.message?.slot,
      (error) => {
        throw new ConsensusDataInvalidError(`Got invalid slot`, error);
      },
    );

    const epoch = calcEpochBySlot(slot);

    /* istanbul ignore next */
    const slotStateRoot = block?.data?.message?.state_root;

    /* istanbul ignore next */
    const blockNumber = executionPayload.block_number;
    const blockHash = executionPayload.block_hash;
    const timestamp = executionPayload.timestamp;

    /* istanbul ignore next */
    return parseAsTypeOrFail(
      ConsensusMeta,
      {
        epoch,
        slot,
        slotStateRoot,
        blockNumber,
        blockHash,
        timestamp,
      },
      (error) => {
        throw new ConsensusDataInvalidError(`Got invalid ConsensusMeta`, error);
      },
    );
  }
}
