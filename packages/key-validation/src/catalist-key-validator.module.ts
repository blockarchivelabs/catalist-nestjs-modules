import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  GenesisForkVersionService,
  CatalistKeyValidator,
  WithdrawalCredentialsFetcher,
} from './services';
import { KeyValidatorModuleSyncOptions } from './interfaces/module.options';
import { KeyValidatorModule } from './key-validator.module';
import {
  GenesisForkVersionServiceInterface,
  CatalistKeyValidatorInterface,
  WithdrawalCredentialsExtractorInterface,
} from './interfaces';
import { CatalistContractModule } from '@catalist-nestjs/contracts';

export const getDefaultCatalistKeyValidatorModuleProviders = (): Provider[] => [
  {
    provide: CatalistKeyValidatorInterface,
    useClass: CatalistKeyValidator,
  },
  {
    provide: GenesisForkVersionServiceInterface,
    useClass: GenesisForkVersionService,
  },
  {
    provide: WithdrawalCredentialsExtractorInterface,
    useClass: WithdrawalCredentialsFetcher,
  },
];

@Module({})
export class CatalistKeyValidatorModule {
  static forRoot(options?: KeyValidatorModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forFeature(options?: KeyValidatorModuleSyncOptions): DynamicModule {
    return {
      module: CatalistKeyValidatorModule,
      imports: [
        CatalistContractModule,
        KeyValidatorModule.forFeature({
          multithreaded: options ? options.multithreaded : true,
        }),
      ],
      providers: getDefaultCatalistKeyValidatorModuleProviders(),
      exports: [CatalistKeyValidatorInterface],
    };
  }
}
