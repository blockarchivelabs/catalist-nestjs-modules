import { CHAINS } from '@catalist-nestjs/constants';

export const WSTACE_CONTRACT_TOKEN = Symbol('wstaceContract');

export const WSTACE_CONTRACT_ADDRESSES = {
  [CHAINS.Mainnet]: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  [CHAINS.Goerli]: '0x6320cd32aa674d2898a68ec82e869385fc5f7e2f',
  [CHAINS.Holesky]: '0x8d09a4502Cc8Cf1547aD300E066060D043f6982D',
  [CHAINS.Sepolia]: '0xB82381A3fBD3FaFA77B3a7bE693342618240067b',
  [CHAINS.EnduranceMainnet]: '0xE5194F495BEB478945d69BeaA8B1a8ee6C7f8A6F',
};
