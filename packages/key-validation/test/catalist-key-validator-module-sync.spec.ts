import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CatalistKeyValidatorModule,
  CatalistKeyValidatorInterface,
  CatalistKeyValidator,
  MultiThreadedKeyValidatorExecutor,
  SingleThreadedKeyValidatorExecutor,
} from '../src';
import { CatalistContractModule } from '@catalist-nestjs/contracts';
import { getDefaultProvider } from '@ethersproject/providers';
import { InterfaceTag } from '@catalist-nestjs/di';
import { Type, Abstract } from '@nestjs/common';

describe('CatalistKeyValidator sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  const testModules = async <Interface, TInput>(
    imports: ModuleMetadata['imports'],
    tagOrTypeOrToken:
      | InterfaceTag<Interface>
      | (Type<TInput> | Abstract<TInput> | string | symbol),
  ) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    return moduleRef.get(tagOrTypeOrToken);
  };

  test('forRoot - single threaded', async () => {
    const catalistKeyValidator = await testModules(
      [
        CatalistContractModule.forRoot({ provider }),
        CatalistKeyValidatorModule.forRoot({ multithreaded: false }),
      ],
      CatalistKeyValidatorInterface,
    );

    expect(catalistKeyValidator.validateKey).toBeDefined();
    expect(catalistKeyValidator.validateKeys).toBeDefined();

    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidator);
    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidatorInterface);
    expect(catalistKeyValidator.keyValidator.executor).toBeInstanceOf(
      SingleThreadedKeyValidatorExecutor,
    );
  });

  test('forRoot - multi threaded (default)', async () => {
    const catalistKeyValidator = await testModules(
      [
        CatalistContractModule.forRoot({ provider }),
        CatalistKeyValidatorModule.forRoot(),
      ],
      CatalistKeyValidatorInterface,
    );

    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidator);
    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidatorInterface);
    expect(catalistKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forRoot - multi threaded', async () => {
    const catalistKeyValidator = await testModules(
      [
        CatalistContractModule.forRoot({ provider }),
        CatalistKeyValidatorModule.forRoot({ multithreaded: true }),
      ],
      CatalistKeyValidatorInterface,
    );

    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidator);
    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidatorInterface);
    expect(catalistKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - single threaded', async () => {
    const catalistKeyValidator = await testModules(
      [
        CatalistContractModule.forRoot({ provider }),
        CatalistKeyValidatorModule.forFeature({ multithreaded: false }),
      ],
      CatalistKeyValidatorInterface,
    );

    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidator);
    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidatorInterface);
    expect(catalistKeyValidator.keyValidator.executor).toBeInstanceOf(
      SingleThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - multi threaded (default)', async () => {
    const catalistKeyValidator = await testModules(
      [
        CatalistContractModule.forRoot({ provider }),
        CatalistKeyValidatorModule.forFeature(),
      ],
      CatalistKeyValidatorInterface,
    );

    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidator);
    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidatorInterface);
    expect(catalistKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });

  test('forFeature - multi threaded', async () => {
    const catalistKeyValidator = await testModules(
      [
        CatalistContractModule.forRoot({ provider }),
        CatalistKeyValidatorModule.forFeature({ multithreaded: true }),
      ],
      CatalistKeyValidatorInterface,
    );

    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidator);
    expect(catalistKeyValidator).toBeInstanceOf(CatalistKeyValidatorInterface);
    expect(catalistKeyValidator.keyValidator.executor).toBeInstanceOf(
      MultiThreadedKeyValidatorExecutor,
    );
  });
});
