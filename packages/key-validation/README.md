# Key-validation

NestJS key validation for Catalist Finance projects.
Part of [Catalist NestJS Modules](https://github.com/blockarchivelabs/catalist-nestjs-modules/#readme)

## Install

```bash
yarn add @catalist-nestjs/key-validation
```

## Usage

### Basic key validation

```ts
import { Module } from '@nestjs/common';
import {
  KeyValidatorModule,
  Key,
  KeyValidatorInterface,
  GENESIS_FORK_VERSION,
} from '@catalist-nestjs/key-validation';
import { CHAINS } from '@catalist-nestjs/constants';

@Module({
  imports: [KeyValidatorModule.forFeature({ multithreaded: true })], //
  providers: [Example],
  exports: [Example],
})
export class ExampleModule {}

export class Example {
  public constructor(
    // note that `KeyValidatorInterface` is a Symbol-like interface tag
    // which point to specific implementation
    private readonly keyValidator: KeyValidatorInterface,
  ) {}

  public async basicValidation() {
    const key: Key = {
      key: '0x00...1',
      depositSignature: '0x00...1',
      withdrawalCredentials: Buffer.alloc(32),
      genesisForkVersion:
        GENESIS_FORK_VERSION[CHAINS.Mainnet] ?? Buffer.alloc(32),
    };

    const resultSingleKey: boolean = await this.keyValidator.validateKey(key);

    const resultMultipleKeys: [Key, boolean][] =
      await this.keyValidator.validateKeys([key]);
  }
}
```

### Catalist key validation

```ts
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
```

### Troubleshooting

When you try to install the key-validation module, you may encounter an unexpected
problem related to the inability to install @chainsafe/blst dependencies under darwin arm64.

#### Why does it happen?!

It happens because https://www.npmjs.com/package/@chainsafe/blst doesn't provide native C binding to https://github.com/supranational/blst under darwin arm64.
Such as there no native binding, a user has to compile C binding to blst lab manually for darwin arm64.
@chainsafe/blst has compile option but inside itself for downloading dependencies this lib uses Python language.
Historically MacOs uses alias python3 for python. So then @chainsafe/blst fails with an error that it could not install all dependencies.
To fix it on MacOs just create alias python for python3.

```bash
ln -s /opt/homebrew/bin/python3 /usr/local/bin/python
```

More info here - https://github.com/ChainSafe/lodestar/issues/4767#issuecomment-1640631566

See more examples in the `./examples/` folder.
