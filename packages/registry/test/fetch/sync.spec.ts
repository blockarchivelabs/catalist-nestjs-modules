import { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getNetwork } from '@ethersproject/networks';
import { hexZeroPad } from '@ethersproject/bytes';
import { getDefaultProvider, Provider } from '@ethersproject/providers';
import { RegistryFetchModule, RegistryFetchService } from '../../src';
import { CATALIST_CONTRACT_TOKEN, Catalist } from '@catalist-nestjs/contracts';
import { REGISTRY_CONTRACT_TOKEN, Registry } from '@catalist-nestjs/contracts';

describe('Sync module initializing', () => {
  const provider = getDefaultProvider(process.env.EL_RPC_URL);

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  const testModules = async (metadata: ModuleMetadata) => {
    const moduleRef = await Test.createTestingModule(metadata).compile();
    const fetchService: RegistryFetchService =
      moduleRef.get(RegistryFetchService);

    expect(fetchService).toBeDefined();
    return moduleRef;
  };

  test('forRoot', async () => {
    const imports = [RegistryFetchModule.forRoot({ provider })];
    await testModules({ imports });
  });

  test('forFeature', async () => {
    const imports = [RegistryFetchModule.forFeature({ provider })];
    await testModules({ imports });
  });

  test('forFeature global provider', async () => {
    const imports = [RegistryFetchModule.forFeature()];
    const metadata = {
      imports,
      providers: [{ provide: Provider, useValue: provider }],
    };
    await testModules(metadata);
  });

  test('forFeature addresses', async () => {
    const catalistAddress = hexZeroPad('0x01', 20);
    const registryAddress = hexZeroPad('0x02', 20);

    const imports = [
      RegistryFetchModule.forFeature({
        provider,
        catalistAddress,
        registryAddress,
      }),
    ];

    const moduleRef = await testModules({ imports });

    const catalistContract: Catalist = moduleRef.get(CATALIST_CONTRACT_TOKEN);
    expect(catalistContract.address).toBe(catalistAddress);

    const registryContract: Registry = moduleRef.get(REGISTRY_CONTRACT_TOKEN);
    expect(registryContract.address).toBe(registryAddress);
  });
});
