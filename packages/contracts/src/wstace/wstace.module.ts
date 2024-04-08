import { Module } from '@nestjs/common';
import {
  WSTACE_CONTRACT_TOKEN,
  WSTACE_CONTRACT_ADDRESSES,
} from './wstace.constants';
import { Wstace__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class WstaceContractModule extends ContractModule {
  static module = WstaceContractModule;
  static contractFactory = Wstace__factory;
  static contractToken = WSTACE_CONTRACT_TOKEN;
  static defaultAddresses = WSTACE_CONTRACT_ADDRESSES;
}
