import { Test } from '@nestjs/testing';
import { Registry__factory } from '@catalist-nestjs/contracts';
import { getNetwork } from '@ethersproject/networks';
import { Interface } from '@ethersproject/abi';
import { JsonRpcBatchProvider } from '@ethersproject/providers';
import { operator, operatorFields } from '../fixtures/operator.fixture';
import { RegistryFetchModule, RegistryOperatorFetchService } from '../../src';

describe('Operators', () => {
  const provider = new JsonRpcBatchProvider(process.env.EL_RPC_URL);
  let fetchService: RegistryOperatorFetchService;

  const mockCall = jest
    .spyOn(provider, 'call')
    .mockImplementation(async () => '');

  jest
    .spyOn(provider, 'detectNetwork')
    .mockImplementation(async () => getNetwork('mainnet'));

  beforeEach(async () => {
    const imports = [RegistryFetchModule.forFeature({ provider })];
    const moduleRef = await Test.createTestingModule({ imports }).compile();
    fetchService = moduleRef.get(RegistryOperatorFetchService);
  });

  afterEach(async () => {
    mockCall.mockReset();
  });

  test('count', async () => {
    const expected = 2;
    mockCall.mockImplementation(async () => {
      const iface = new Interface(Registry__factory.abi);
      return iface.encodeFunctionResult('getNodeOperatorsCount', [expected]);
    });
    const result = await fetchService.count();

    expect(result).toBe(expected);
    expect(mockCall).toBeCalledTimes(1);
  });

  test('fetchOne', async () => {
    const expected = { index: 1, ...operator };

    mockCall.mockImplementation(async () => {
      const iface = new Interface(Registry__factory.abi);
      return iface.encodeFunctionResult(
        'getNodeOperator',
        operatorFields(operator),
      );
    });
    const result = await fetchService.fetchOne(expected.index);

    expect(result).toEqual(expected);
    expect(mockCall).toBeCalledTimes(1);
  });

  test('fetch', async () => {
    const expectedFirst = { index: 1, ...operator };
    const expectedSecond = { index: 2, ...operator };

    mockCall.mockImplementation(async () => {
      const iface = new Interface(Registry__factory.abi);
      return iface.encodeFunctionResult(
        'getNodeOperator',
        operatorFields(operator),
      );
    });
    const result = await fetchService.fetch(
      expectedFirst.index,
      expectedSecond.index + 1,
    );

    expect(result).toEqual([expectedFirst, expectedSecond]);
    expect(mockCall).toBeCalledTimes(2);
  });

  test('fetch all', async () => {
    const expected = { index: 0, ...operator };

    mockCall
      .mockImplementationOnce(async () => {
        const iface = new Interface(Registry__factory.abi);
        return iface.encodeFunctionResult('getNodeOperatorsCount', [1]);
      })
      .mockImplementationOnce(async () => {
        const iface = new Interface(Registry__factory.abi);
        return iface.encodeFunctionResult(
          'getNodeOperator',
          operatorFields(operator),
        );
      });
    const result = await fetchService.fetch();

    expect(result).toEqual([expected]);
    expect(mockCall).toBeCalledTimes(2);
  });

  test('fetch. fromIndex > toIndex', async () => {
    await expect(() => fetchService.fetch(2, 1)).rejects.toThrow();
  });
});
