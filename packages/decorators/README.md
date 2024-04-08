# Nestjs Decorators

Nestjs Decorators for Catalist Finance projects.
Part of [Catalist NestJS Modules](https://github.com/blockarchivelabs/catalist-nestjs-modules/#readme)

## Install

```bash
yarn add @catalist-nestjs/decorators
```

## Usage

### OneAtTime

The decorator does not allow to call the method more than once at a time.

```ts
import { OneAtTime } from '@catalist-nestjs/decorators';

export class TestService {
  @OneAtTime()
  async foo() {
    // do some async work
  }
}
```
