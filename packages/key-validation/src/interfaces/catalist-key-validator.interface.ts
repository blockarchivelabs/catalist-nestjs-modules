import { Key, CatalistKey } from './common';
import { createInterface } from '@catalist-nestjs/di';

export const CatalistKeyValidatorInterface =
  createInterface<CatalistKeyValidatorInterface>(
    'CatalistKeyValidatorInterface',
  );

export interface CatalistKeyValidatorInterface {
  validateKey<T>(
    key: CatalistKey & T,
  ): Promise<[Key & CatalistKey & T, boolean]>;
  validateKeys<T>(
    keys: (CatalistKey & T)[],
  ): Promise<[Key & CatalistKey & T, boolean][]>;
}
