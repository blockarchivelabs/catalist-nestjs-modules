/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module } from '@nestjs/common';
import {
  Key,
  CatalistKey,
  CatalistKeyValidatorInterface,
  CatalistKeyValidatorModule,
} from '@catalist-nestjs/key-validation';
import { CatalistContractModule } from '@catalist-nestjs/contracts';
import {
  SimpleFallbackJsonRpcBatchProvider,
  FallbackProviderModule,
} from '@catalist-nestjs/execution';

export class Example {
  public constructor(
    // note that `CatalistKeyValidatorInterface` is a Symbol-like interface tag
    // which point to specific implementation
    private readonly catalistKeyValidator: CatalistKeyValidatorInterface,
  ) {}

  public async someMethod() {
    const key1: CatalistKey = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      used: true,
    };

    const key2: CatalistKey = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      used: true,
    };

    // single key
    const resultSingleKey: [Key & CatalistKey, boolean] =
      await this.catalistKeyValidator.validateKey(key1);

    // multiple keys
    const resultMultupleKeys: [Key & CatalistKey, boolean][] =
      await this.catalistKeyValidator.validateKeys([key1, key2]);
  }
}

@Module({
  imports: [
    FallbackProviderModule.forRoot({
      urls: ['http://localhost:8545'],
      network: 1,
    }),
    CatalistContractModule.forRootAsync({
      // needed for getting WithdrawalCredentials and Network chain id
      async useFactory(provider: SimpleFallbackJsonRpcBatchProvider) {
        return { provider: provider };
      },
      inject: [SimpleFallbackJsonRpcBatchProvider],
    }),
    CatalistKeyValidatorModule.forFeature({ multithreaded: true }), // can be multithreaded or single-threaded
  ],
  providers: [Example],
  exports: [Example],
})
export class ExampleModule {}
