import { CHAINS } from '@catalist-nestjs/constants';

export const VALIDATORS_EXIT_BUS_ORACLE_HASH_CONSENSUS_TOKEN = Symbol(
  'validatorsExitBusOracleHashConsensus',
);

export const VALIDATORS_EXIT_BUS_ORACLE_HASH_CONSENSUS_ADDRESSES = {
  [CHAINS.Mainnet]: '0x7FaDB6358950c5fAA66Cb5EB8eE5147De3df355a',
  [CHAINS.Goerli]: '0x8374B4aC337D7e367Ea1eF54bB29880C3f036A51',
  [CHAINS.Holesky]: '0xe77Cf1A027d7C10Ee6bb7Ede5E922a181FF40E8f',
  [CHAINS.Sepolia]: '0x098a952BD200005382aEb3229e38ae39A7616F56',
  [CHAINS.EnduranceDevnet]: '0x39F95E8182E4a58e2cf20aB963bD279C9033665A',
  [CHAINS.EnduranceMainnet]: '0x345939d22Ee479D710CcFEc82E70B49458cdb276',
};
