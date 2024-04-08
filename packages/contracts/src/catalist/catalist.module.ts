import { Module } from '@nestjs/common';
import {
  CATALIST_CONTRACT_TOKEN,
  CATALIST_CONTRACT_ADDRESSES,
} from './catalist.constants';
import { Catalist__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class CatalistContractModule extends ContractModule {
  static module = CatalistContractModule;
  static contractFactory = Catalist__factory;
  static contractToken = CATALIST_CONTRACT_TOKEN;
  static defaultAddresses = CATALIST_CONTRACT_ADDRESSES;
}
