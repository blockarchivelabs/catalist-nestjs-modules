import { CHAINS } from '@lido-nestjs/constants';

export const ORACLE_REPORT_SANITY_CHECKER_TOKEN = Symbol(
  'oracleReportSanityChecker',
);

export const ORACLE_REPORT_SANITY_CHECKER_ADDRESSES = {
  [CHAINS.Mainnet]: '0x9305c1Dbfe22c12c66339184C0025d7006f0f1cC',
  [CHAINS.Goerli]: '0xbf74600040F91D3560d5757280727FB00c64Fd2E',
  [CHAINS.Holesky]: '0xF0d576c7d934bBeCc68FE15F1c5DAF98ea2B78bb',
};
