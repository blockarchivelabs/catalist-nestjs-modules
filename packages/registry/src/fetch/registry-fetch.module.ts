import { DynamicModule, Module } from '@nestjs/common';
import {
  CatalistContractModule,
  RegistryContractModule,
} from '@catalist-nestjs/contracts';
import {
  RegistryFetchModuleSyncOptions,
  RegistryFetchModuleAsyncOptions,
} from './interfaces/module.interface';
import { RegistryOperatorFetchService } from './operator.fetch';
import { RegistryMetaFetchService } from './meta.fetch';
import { RegistryKeyFetchService } from './key.fetch';
import { RegistryFetchService } from './registry-fetch.service';

@Module({
  providers: [
    RegistryFetchService,
    RegistryOperatorFetchService,
    RegistryMetaFetchService,
    RegistryKeyFetchService,
  ],
  exports: [
    RegistryFetchService,
    RegistryOperatorFetchService,
    RegistryMetaFetchService,
    RegistryKeyFetchService,
  ],
})
export class RegistryFetchModule {
  static forRoot(options?: RegistryFetchModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forRootAsync(options: RegistryFetchModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: RegistryFetchModuleSyncOptions): DynamicModule {
    return {
      module: RegistryFetchModule,
      imports: [
        ...(options?.imports || []),
        CatalistContractModule.forFeature({
          address: options?.catalistAddress,
          provider: options?.provider,
        }),
        RegistryContractModule.forFeature({
          address: options?.registryAddress,
          provider: options?.provider,
        }),
      ],
      exports: [CatalistContractModule, RegistryContractModule],
    };
  }

  public static forFeatureAsync(
    options: RegistryFetchModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: RegistryFetchModule,
      imports: [
        ...(options.imports || []),
        CatalistContractModule.forFeatureAsync({
          async useFactory(...args) {
            const config = await options.useFactory(...args);
            const { provider, catalistAddress } = config;

            return { provider, address: catalistAddress };
          },
          inject: options.inject,
        }),
        RegistryContractModule.forFeatureAsync({
          async useFactory(...args) {
            const config = await options.useFactory(...args);
            const { provider, registryAddress } = config;

            return { provider, address: registryAddress };
          },
          inject: options.inject,
        }),
      ],
      exports: [CatalistContractModule, RegistryContractModule],
    };
  }
}
