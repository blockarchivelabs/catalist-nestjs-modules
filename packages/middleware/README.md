# Middleware

NestJS Middleware Module for Catalist Finance projects.
Part of [Catalist NestJS Modules](https://github.com/blockarchivelabs/catalist-nestjs-modules/#readme)

## Install

```bash
yarn add @catalist-nestjs/middleware
```

## Usage

### Basic usage

```ts
// Import
import { Module } from '@nestjs/common';
import { MiddlewareModule } from '@catalist-nestjs/middleware';
import { MyService } from './my.service';

@Module({
  imports: [
    MiddlewareModule.forFeature({
      middlewares: [
        (next) => {
          console.log(1);
          next();
          console.log(3);
        },
      ],
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { MiddlewareService } from '@catalist-nestjs/middleware';

export class MyService {
  constructor(private middlewareService: MiddlewareService) {}

  async myMethod() {
    return await this.middlewareService.go(() => {
      console.log(2);
    });
  }
}
```

### Async usage

```ts
// Import
import { Module } from '@nestjs/common';
import { LoggerModule } from '@catalist-nestjs/logger';
import { MiddlewareModule } from '@catalist-nestjs/middleware';
import { MyService } from './my.service';

@Module({
  imports: [
    LoggerModule,
    MiddlewareModule.forFeatureAsync({
      imports: [LoggerModule],
      async useFactory(loggerService: LoggerService) {
        return {
          middlewares: [
            (next) => {
              loggerService.log(1);
              next();
            },
          ],
        };
      },
      inject: [LoggerService],
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}

// Usage
import { MiddlewareService } from '@catalist-nestjs/middleware';

export class MyService {
  constructor(
    private middlewareService: MiddlewareService,
    private loggerService: LoggerService,
  ) {}

  async myMethod() {
    return await this.middlewareService.go(() => {
      loggerService.log(2);
    });
  }
}
```
