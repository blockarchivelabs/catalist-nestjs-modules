import { getDefaultProvider, Provider } from '@ethersproject/providers';
import { getNetwork } from '@ethersproject/networks';
import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Catalist,
  CatalistContractModule,
  CATALIST_CONTRACT_TOKEN,
} from '../src';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  const testModules = async (metadata: ModuleMetadata) => {
    const moduleRef = await Test.createTestingModule(metadata).compile();
    const contract: Catalist = moduleRef.get(CATALIST_CONTRACT_TOKEN);

    expect(contract.name).toBeDefined();
    expect(contract.symbol).toBeDefined();
  };

  test('forRoot with provider', async () => {
    const imports = [CatalistContractModule.forRoot()];
    const metadata = {
      imports,
      providers: [{ provide: Provider, useValue: provider }],
    };
    await testModules(metadata);
  });

  test('forFeature with provider', async () => {
    const imports = [CatalistContractModule.forFeature()];
    const metadata = {
      imports,
      providers: [{ provide: Provider, useValue: provider }],
    };
    await testModules(metadata);
  });

  test('forRoot without provider', async () => {
    const imports = [CatalistContractModule.forRoot()];
    const metadata = { imports };

    await expect(() => testModules(metadata)).rejects.toThrowError();
  });

  test('forFeature without provider', async () => {
    const imports = [CatalistContractModule.forFeature()];
    const metadata = { imports };

    await expect(() => testModules(metadata)).rejects.toThrowError();
  });
});
