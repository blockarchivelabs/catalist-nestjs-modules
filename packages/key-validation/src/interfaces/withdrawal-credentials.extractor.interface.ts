import { createInterface } from '@catalist-nestjs/di';
import { PossibleWC, WithdrawalCredentialsHex } from './common';
import { CHAINS } from '@catalist-nestjs/constants';

export const WithdrawalCredentialsExtractorInterface =
  createInterface<WithdrawalCredentialsExtractorInterface>(
    'WithdrawalCredentialsExtractorInterface',
  );

export interface WithdrawalCredentialsExtractorInterface {
  /**
   * Returns all possible (current and historic) WC
   */
  getPossibleWithdrawalCredentials(): Promise<PossibleWC>;

  /**
   * Returns current WC as string (hexed)
   */
  getWithdrawalCredentials(): Promise<WithdrawalCredentialsHex>;

  /**
   * Returns current chain id
   */
  getChainId(): Promise<CHAINS>;
}
