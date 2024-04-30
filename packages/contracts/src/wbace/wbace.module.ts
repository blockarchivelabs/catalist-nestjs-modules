import { Module } from '@nestjs/common';
import {
  WBACE_CONTRACT_TOKEN,
  WBACE_CONTRACT_ADDRESSES,
} from './wbace.constants';
import { Wbace__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class WbaceContractModule extends ContractModule {
  static module = WbaceContractModule;
  static contractFactory = Wbace__factory;
  static contractToken = WBACE_CONTRACT_TOKEN;
  static defaultAddresses = WBACE_CONTRACT_ADDRESSES;
}
