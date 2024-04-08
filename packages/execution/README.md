# Execution layer (Eth1 RPC Provider)

NestJS Logger for Catalist Finance projects.
Part of [Catalist NestJS Modules](https://github.com/blockarchivelabs/catalist-nestjs-modules/#readme)

## Install

```bash
yarn add @catalist-nestjs/execution
```

## Usage

### Basic usage

```ts
// Import
import { Injectable, Module } from '@nestjs/common';
import { FallbackProviderModule } from '@catalist-nestjs/execution';
import { MyService } from './my.service';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    FallbackProviderModule.forRoot({
      imports: [],
      urls: ['http://localhost:8545', 'http://fallback:8545'],
      network: 1,
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { SimpleFallbackJsonRpcBatchProvider } from '@catalist-nestjs/execution';

@Injectable
export class MyService {
  constructor(private provider: SimpleFallbackJsonRpcBatchProvider) {}

  async doSomeWork() {
    return await this.provider.getBlock(1000);
  }
}
```

### Async usage

```ts
import { Module } from '@nestjs/common';
import { FallbackProviderModule } from '@catalist-nestjs/execution';
import { ConfigModule, ConfigService } from './my.service';

@Module({
  imports: [
    ConfigModule.forRoot(), // exports ConfigService
    FetchModule.forRoot(),
    FallbackProviderModule.forRootAsync({
      async useFactory(configService: ConfigService) {
        return {
          urls: configService.urls,
          network: configService.network,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class MyModule {}

// Usage
import { SimpleFallbackJsonRpcBatchProvider } from '@catalist-nestjs/execution';

@Injectable
export class MyService {
  constructor(private provider: SimpleFallbackJsonRpcBatchProvider) {}

  async doSomeWork() {
    return await this.provider.getBlock(1000);
  }
}
```
