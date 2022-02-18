import { Inject, Injectable } from '@nestjs/common';
import { CallOverrides } from '@ethersproject/contracts';
import { rangePromise } from '@lido-nestjs/utils';
import { Registry, REGISTRY_CONTRACT_TOKEN } from '@lido-nestjs/contracts';
import { RegistryOperator } from '../interfaces/operator.interface';
import { REGISTRY_OPERATORS_BATCH_SIZE } from './operator.constants';

@Injectable()
export class RegistryOperatorFetchService {
  constructor(
    @Inject(REGISTRY_CONTRACT_TOKEN)
    private contract: Registry,
  ) {}

  /** fetches number of operators */
  public async count(overrides: CallOverrides = {}): Promise<number> {
    const bigNumber = await this.contract.getNodeOperatorsCount(overrides);
    return bigNumber.toNumber();
  }

  /** fetches one operator */
  public async fetchOne(
    operatorIndex: number,
    overrides: CallOverrides = {},
  ): Promise<RegistryOperator> {
    const fullInfo = true;
    const operator = await this.contract.getNodeOperator(
      operatorIndex,
      fullInfo,
      overrides,
    );

    const {
      name,
      active,
      rewardAddress,
      stakingLimit,
      stoppedValidators,
      totalSigningKeys,
      usedSigningKeys,
    } = operator;

    return {
      index: operatorIndex,
      active,
      name,
      rewardAddress,
      stakingLimit: stakingLimit.toNumber(),
      stoppedValidators: stoppedValidators.toNumber(),
      totalSigningKeys: totalSigningKeys.toNumber(),
      usedSigningKeys: usedSigningKeys.toNumber(),
    };
  }

  /** fetches operators */
  public async fetch(
    fromIndex = 0,
    toIndex = -1,
    overrides: CallOverrides = {},
  ): Promise<RegistryOperator[]> {
    if (fromIndex > toIndex && toIndex !== -1) {
      throw new Error('fromIndex is greater than or equal to toIndex');
    }

    if (toIndex == null || toIndex === -1) {
      toIndex = await this.count(overrides);
    }

    const fetcher = async (operatorIndex: number) => {
      return await this.fetchOne(operatorIndex, overrides);
    };

    const batchSize = REGISTRY_OPERATORS_BATCH_SIZE;

    return await rangePromise(fetcher, fromIndex, toIndex, batchSize);
  }
}
