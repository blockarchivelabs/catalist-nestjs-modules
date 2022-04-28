import { DynamicModule, Module } from '@nestjs/common';
import {
  RegistryModuleSyncOptions,
  RegistryModuleAsyncOptions,
} from './interfaces/module.interface';
import { RegistryService } from './registry.service';
import { RegistryStorageModule } from '../storage/registry-storage.module';
import { RegistryFetchModule } from '../fetch/registry-fetch.module';

@Module({
  imports: [RegistryStorageModule],
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {
  static forRoot(options?: RegistryModuleSyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeature(options),
    };
  }

  static forRootAsync(options: RegistryModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      ...this.forFeatureAsync(options),
    };
  }

  static forFeature(options?: RegistryModuleSyncOptions): DynamicModule {
    return {
      module: RegistryModule,
      imports: [
        ...(options?.imports || []),
        RegistryFetchModule.forFeature(options),
      ],
    };
  }

  public static forFeatureAsync(
    options: RegistryModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: RegistryModule,
      imports: [
        ...(options.imports || []),
        RegistryFetchModule.forFeatureAsync(options),
      ],
    };
  }
}
