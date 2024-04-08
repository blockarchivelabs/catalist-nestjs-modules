import { Module } from '@nestjs/common';
import {
  CATALIST_LOCATOR_CONTRACT_TOKEN,
  CATALIST_LOCATOR_CONTRACT_ADDRESSES,
} from './catalist-locator.constants';
import { CatalistLocator__factory } from '../generated';
import { ContractModule } from '../contract.module';

@Module({})
export class CatalistLocatorContractModule extends ContractModule {
  static module = CatalistLocatorContractModule;
  static contractFactory = CatalistLocator__factory;
  static contractToken = CATALIST_LOCATOR_CONTRACT_TOKEN;
  static defaultAddresses = CATALIST_LOCATOR_CONTRACT_ADDRESSES;
}
