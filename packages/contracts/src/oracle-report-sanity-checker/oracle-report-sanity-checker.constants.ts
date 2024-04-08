import { CHAINS } from '@catalist-nestjs/constants';

export const ORACLE_REPORT_SANITY_CHECKER_TOKEN = Symbol(
  'oracleReportSanityChecker',
);

export const ORACLE_REPORT_SANITY_CHECKER_ADDRESSES = {
  [CHAINS.Mainnet]: '0x9305c1Dbfe22c12c66339184C0025d7006f0f1cC',
  [CHAINS.Goerli]: '0xbf74600040F91D3560d5757280727FB00c64Fd2E',
  [CHAINS.Holesky]: '0xF0d576c7d934bBeCc68FE15F1c5DAF98ea2B78bb',
  [CHAINS.Sepolia]: '0xbac2A471443F18aC5C31078b96C5797A78fCc680',
  [CHAINS.EnduranceDevnet]: '0x9a60911f5213140414DD57e95886c05d5f55FFbC',
  [CHAINS.EnduranceMainnet]: '0x45B0AD8EE592F256bb460FA08cDc361E1e9EDa0D',
};
