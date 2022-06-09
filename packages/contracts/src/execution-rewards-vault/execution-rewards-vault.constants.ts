import { CHAINS } from '@lido-nestjs/constants';

export const EXECUTION_REWARDS_VAULT_CONTRACT_TOKEN =
  Symbol('registryContract');

export const EXECUTION_REWARDS_VAULT_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x388C818CA8B9251b393131C08a736A67ccB19297',
  [CHAINS.Goerli]: '0x94750381bE1AbA0504C666ee1DB118F68f0780D4',
  [CHAINS.Kiln]: '0xe3e01f9E940dDec242C3fdD7bbb855c3770bF999',
};