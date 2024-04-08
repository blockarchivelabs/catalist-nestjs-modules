import { CHAINS } from '@catalist-nestjs/constants';
import { createInterface } from '@catalist-nestjs/di';

export const GenesisForkVersionServiceInterface =
  createInterface<GenesisForkVersionServiceInterface>(
    'GenesisForkVersionServiceInterface',
  );

export interface GenesisForkVersionServiceInterface {
  getGenesisForkVersion(chainId: CHAINS): Promise<Buffer>;
}
