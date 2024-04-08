import {
  PossibleWC,
  WithdrawalCredentialsExtractorInterface,
  WithdrawalCredentialsHex,
} from '../interfaces';
import 'reflect-metadata';
import { Inject, Injectable } from '@nestjs/common';
import { ImplementsAtRuntime } from '@catalist-nestjs/di';
import { CHAINS } from '@catalist-nestjs/constants';
import { Catalist, CATALIST_CONTRACT_TOKEN } from '@catalist-nestjs/contracts';
import { WITHDRAWAL_CREDENTIALS } from '../constants/constants';
import { bufferFromHexString } from '../common/buffer-hex';
import { MemoizeInFlightPromise } from '@catalist-nestjs/utils';

@Injectable()
@ImplementsAtRuntime(WithdrawalCredentialsExtractorInterface)
export class WithdrawalCredentialsFetcher
  implements WithdrawalCredentialsExtractorInterface
{
  public constructor(
    @Inject(CATALIST_CONTRACT_TOKEN)
    private readonly catalistContract: Catalist,
  ) {}

  /**
   * The value of currentWC should always represent actual on-chain value
   */
  @MemoizeInFlightPromise()
  public async getWithdrawalCredentials(): Promise<WithdrawalCredentialsHex> {
    return this.catalistContract.getWithdrawalCredentials();
  }

  @MemoizeInFlightPromise()
  public async getPossibleWithdrawalCredentials(): Promise<PossibleWC> {
    const currentWC = await this.getWithdrawalCredentials();

    return {
      currentWC: [currentWC, bufferFromHexString(currentWC)],
      previousWC: await this.getPreviousWithdrawalCredentials(),
    };
  }

  @MemoizeInFlightPromise()
  protected async getPreviousWithdrawalCredentials(): Promise<
    PossibleWC['previousWC']
  > {
    const chainId = await this.getChainId();
    const oldWC = WITHDRAWAL_CREDENTIALS[chainId] ?? [];

    return oldWC.map((wc) => [wc, bufferFromHexString(wc)]);
  }

  @MemoizeInFlightPromise()
  public async getChainId(): Promise<CHAINS> {
    const network = await this.catalistContract.provider.getNetwork();

    return network.chainId;
  }
}
