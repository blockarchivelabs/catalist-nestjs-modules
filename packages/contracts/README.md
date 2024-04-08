# Contracts Module

NestJS Contracts Module for Catalist Finance projects.
Part of [Catalist NestJS Modules](https://github.com/blockarchivelabs/catalist-nestjs-modules/#readme)

## Install

```bash
yarn add @catalist-nestjs/contracts
```

## Usage

### Basic usage

```ts
// Import
import { Module } from '@nestjs/common';
import { CatalistContractModule } from '@catalist-nestjs/contracts';
import { getDefaultProvider } from '@ethersproject/providers';
import { MyService } from './my.service';

@Module({
  imports: [
    CatalistContractModule.forFeature({
      provider: getDefaultProvider('mainnet'),
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { CATALIST_CONTRACT_TOKEN, Catalist } from '@catalist-nestjs/contracts';
import { Inject } from '@nestjs/common';

export class MyService {
  constructor(@Inject(CATALIST_CONTRACT_TOKEN) private contract: Catalist) {}

  async myMethod() {
    return await this.contract.decimals();
  }
}
```

Specify a different address:

```ts
CatalistContractModule.forFeature({
  address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
});
```

### Global usage

```ts
import { Module } from '@nestjs/common';
import { CatalistContractModule } from '@catalist-nestjs/contracts';

@Module({
  imports: [CatalistContractModule.forRoot()],
})
export class MyModule {}
```

### Async usage

```ts
import { Module } from '@nestjs/common';
import { CatalistContractModule } from '@catalist-nestjs/contracts';
import { ConfigModule, ConfigService } from './config.service';

@Module({
  imports: [
    CatalistContractModule.forRootAsync({
      async useFactory(testService: TestService) {
        return { address: testService.address };
      },
      inject: [TestService],
    }),
  ],
})
export class MyModule {}
```

### Use global provider

```ts
import { Module } from '@nestjs/common';
import { CatalistContractModule } from '@catalist-nestjs/contracts';
import { ProviderModule } from './provider.service';

@Module({
  imports: [ProviderModule.forRoot(), CatalistContractModule.forRoot()],
})
export class MyModule {}
```

## How to add new abi

1. Put ABI into `packages/contracts/abi` folder
2. Set up `packages/contracts/<your name of abi>`: module, contracts
3. Nice to have: add test for ABI: `packages/contracts/test/contracts.spec.ts`
4. Go through install FAQ
5. Enjoy
