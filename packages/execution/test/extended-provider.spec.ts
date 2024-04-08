import { Test } from '@nestjs/testing';
import { ExtendedJsonRpcBatchProvider, BatchProviderModule } from '../src';
import { ConnectionInfo } from '@ethersproject/web';
import {
  fakeFetchImpl,
  fixtures,
  makeFetchImplWithSpecificFeeHistory,
} from './fixtures/fake-json-rpc';
import { range } from './utils';
import { nullTransport, LoggerModule } from '@catalist-nestjs/logger';
import { JsonRpcRequest, JsonRpcResponse, FetchError } from '../src';
import { MiddlewareCallback } from '@catalist-nestjs/middleware';

type MockedExtendedJsonRpcBatchProvider = ExtendedJsonRpcBatchProvider & {
  fetchJson: (
    connection: string | ConnectionInfo,
    json?: string,
  ) => Promise<unknown>;
};

describe('Execution module. ', () => {
  describe('ExtendedJsonRpcBatchProvider', () => {
    let mockedProvider: MockedExtendedJsonRpcBatchProvider;
    let mockedProviderFetch: jest.SpyInstance;
    let mockedDetectNetwork: jest.SpyInstance;

    const createMocks = async (
      jsonRpcMaxBatchSize: number,
      maxConcurrentRequests: number,
      fetchMiddlewares?: MiddlewareCallback<Promise<any>>[], // eslint-disable-line @typescript-eslint/no-explicit-any
    ) => {
      const module = {
        imports: [
          BatchProviderModule.forFeature({
            imports: [LoggerModule.forRoot({ transports: [nullTransport()] })],
            url: 'http://localhost',
            requestPolicy: {
              jsonRpcMaxBatchSize,
              batchAggregationWaitMs: 10,
              maxConcurrentRequests,
            },
            fetchMiddlewares,
          }),
        ],
      };
      const moduleRef = await Test.createTestingModule(module).compile();
      mockedProvider = moduleRef.get(ExtendedJsonRpcBatchProvider);

      mockedProviderFetch = jest
        .spyOn(mockedProvider, 'fetchJson')
        .mockImplementation(fakeFetchImpl());

      mockedDetectNetwork = jest.spyOn(mockedProvider, 'detectNetwork');
    };

    // beforeEach(async () => {});

    afterEach(async () => mockedProviderFetch.mockReset());

    test('should do basic functionality and return correct data', async () => {
      await createMocks(1, 1);

      expect(mockedProviderFetch).toBeCalledTimes(0);
      expect(mockedDetectNetwork).toBeCalledTimes(0);

      const block = await mockedProvider.getBlock(1);
      expect(mockedProviderFetch).toBeCalledTimes(2);
      expect(mockedDetectNetwork).toBeCalledTimes(2);
      expect(block.hash).toBe(fixtures.eth_getBlockByNumber.default.hash);

      const balance = await mockedProvider.getBalance(fixtures.address);
      expect(mockedProviderFetch).toBeCalledTimes(3);
      expect(mockedDetectNetwork).toBeCalledTimes(3);
      expect(balance.toHexString()).toBe(fixtures.eth_getBalance.latest);
    });

    test('should do sync network detection fetch only once (network should be cached)', async () => {
      await createMocks(1, 1);

      expect(mockedProviderFetch).toBeCalledTimes(0);
      expect(mockedDetectNetwork).toBeCalledTimes(0);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);
      expect(mockedDetectNetwork).toBeCalledTimes(2);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);
      expect(mockedDetectNetwork).toBeCalledTimes(3);

      await mockedProvider.getBlock(10000);
      expect(mockedProviderFetch).toBeCalledTimes(2);
      expect(mockedDetectNetwork).toBeCalledTimes(4);

      await mockedProvider.getBalance(fixtures.address);
      expect(mockedProviderFetch).toBeCalledTimes(3);
      expect(mockedDetectNetwork).toBeCalledTimes(5);

      mockedProvider.polling;
    });

    test('should do no batching when batch size = 1, total = 1', async () => {
      await createMocks(1, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all([mockedProvider.getBlock(10000)]);

      expect(mockedProviderFetch).toBeCalledTimes(2);
    });

    test('should do no batching when batch size = 1, total = 6', async () => {
      await createMocks(1, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all(range(0, 6).map(() => mockedProvider.getBlock(10000)));

      expect(mockedProviderFetch).toBeCalledTimes(7);
    });

    test('should do proper batching when batch size = 3, total = 6', async () => {
      await createMocks(3, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all(range(0, 6).map(() => mockedProvider.getBlock(10000)));

      expect(mockedProviderFetch).toBeCalledTimes(3);
    });

    test('should do no batching when batch size = 10, total = 6', async () => {
      await createMocks(10, 10);

      await mockedProvider.getNetwork();
      expect(mockedProviderFetch).toBeCalledTimes(1);

      await Promise.all(range(0, 6).map(() => mockedProvider.getBlock(10000)));

      expect(mockedProviderFetch).toBeCalledTimes(2);
    });

    test('should throw exception on JsonRpc error', async () => {
      await createMocks(10, 10);

      const fakeFetchImplWithRPCError = async (
        connection: string | ConnectionInfo,
        json?: string,
      ): Promise<JsonRpcResponse> => {
        const requests = json ? JSON.parse(json) : {};

        return requests.map((request: JsonRpcRequest) => {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: 1,
              message: 'json-rpc-error',
              data: { foo: 'foo' },
            },
          };
        });
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(
        async () => await mockedProvider.getBlock(1000),
      ).rejects.toThrow();
      expect(mockedProviderFetch).toBeCalledTimes(4);
    });

    test('should support multiple static (via constructor) middleware for fetching', async () => {
      const mockCallback = jest.fn();

      const middlewares: MiddlewareCallback<Promise<unknown>>[] = [
        (next) => {
          mockCallback('foo');
          return next();
        },
        (next) => {
          mockCallback('bar');
          return next();
        },
      ];

      await createMocks(1, 1, middlewares);

      expect(mockCallback).toBeCalledTimes(0);

      await mockedProvider.getBlock(10000);
      expect(mockCallback).toBeCalledTimes(4);

      // 'getNetwork' fetch call
      expect(mockCallback.mock.calls[0][0]).toBe('foo');
      expect(mockCallback.mock.calls[1][0]).toBe('bar');

      // 'getBlock' fetch call
      expect(mockCallback.mock.calls[2][0]).toBe('foo');
      expect(mockCallback.mock.calls[3][0]).toBe('bar');
    });

    test('should support multiple dynamic middleware for fetching', async () => {
      await createMocks(1, 1);

      const mockCallback = jest.fn();

      mockedProvider.use((next) => {
        mockCallback('first');
        return next();
      });

      mockedProvider.use((next) => {
        mockCallback('second');
        return next();
      });

      await mockedProvider.getBlock(10000);

      expect(mockCallback).toBeCalledTimes(4);
      expect(mockCallback.mock.calls[0][0]).toBe('first');
      expect(mockCallback.mock.calls[1][0]).toBe('second');
      expect(mockCallback.mock.calls[2][0]).toBe('first');
      expect(mockCallback.mock.calls[3][0]).toBe('second');
    });

    test('should provide the correct context to middleware', async () => {
      await createMocks(1, 1);

      const mockCallback = jest.fn();

      mockedProvider.use((next, ctx) => {
        mockCallback(ctx.provider.connection.url);
        return next();
      });

      await mockedProvider.getBlock(10000);

      expect(mockCallback).toBeCalledWith('http://localhost');
    });

    test('should support EIP-1898', async () => {
      await createMocks(2, 2);

      const balanceByBlockNumber = await mockedProvider.getBalance(
        fixtures.address,
        fixtures.block.number,
      );
      expect(balanceByBlockNumber.toHexString()).toBe(
        fixtures.eth_getBalance.default_blockHash,
      );

      const balanceByHexedBlockNumber = await mockedProvider.getBalance(
        fixtures.address,
        fixtures.block.numberHex,
      );
      expect(balanceByHexedBlockNumber.toHexString()).toBe(
        fixtures.eth_getBalance.default_blockNumberHex,
      );

      const balanceByBlockHash = await mockedProvider.getBalance(
        fixtures.address,
        fixtures.block.hash,
      );
      expect(balanceByBlockHash.toHexString()).toBe(
        fixtures.eth_getBalance.default_blockNumber,
      );

      // EIP-1898
      const balanceWhenEip1898ByBlockNumber = await mockedProvider.getBalance(
        fixtures.address,
        {
          blockNumber: fixtures.block.numberHex,
        },
      );
      expect(balanceWhenEip1898ByBlockNumber.toHexString()).toBe(
        fixtures.eth_getBalance.eip1898_blockNumber,
      );

      // EIP-1898
      const balanceWhenEip1898ByBlockHash = await mockedProvider.getBalance(
        fixtures.address,
        {
          blockHash: fixtures.block.hash,
          requireCanonical: true,
        },
      );
      expect(balanceWhenEip1898ByBlockHash.toHexString()).toBe(
        fixtures.eth_getBalance.eip1898_blockHash,
      );
    });

    test('should return trace calls by block hash', async () => {
      await createMocks(2, 2);

      const traceCalls = await mockedProvider.getDebugTraceBlockByHash(
        '0xbe61c939c5c04c94779678275d8ce96ae0e4d996fd322319a0e0c17771d5848f',
        {
          tracer: 'callTracer',
          disableStorage: true,
          disableStack: true,
          enableMemory: false,
          enableReturnData: false,
        },
      );

      expect(traceCalls.length).toEqual(2);
      expect(traceCalls[0]).toHaveProperty('result');
      expect(traceCalls[1]).toHaveProperty('result');
    });

    test('should return fee history with empty reward property', async () => {
      await createMocks(2, 2);

      const feeHistory = await mockedProvider.getFeeHistory(
        3,
        'latest',
        [1, 5, 10],
      );
      expect(feeHistory).toHaveProperty('baseFeePerGas');
      expect(feeHistory).toHaveProperty('oldestBlock');
      expect(feeHistory).toHaveProperty('reward');
    });

    test('should return undefined fee history if not exists', async () => {
      await createMocks(2, 2);

      mockedProviderFetch.mockImplementation(
        makeFetchImplWithSpecificFeeHistory({
          baseFeePerGas: ['0x602828e60', '0x5d014f665'],
          gasUsedRatio: [0.36889105544897927, 0.21068196330316574],
          oldestBlock: '0xdfb206',
        }),
      );

      const feeHistory = await mockedProvider.getFeeHistory(2);
      expect(feeHistory).toHaveProperty('baseFeePerGas');
      expect(feeHistory).toHaveProperty('oldestBlock');
      expect(feeHistory).toHaveProperty('reward');
      expect(feeHistory.reward.length).toBe(0);
    });

    test('should throw exception on JsonRpc error when node reached rpc batching limit', async () => {
      await createMocks(10, 10);

      // this will trigger network detection and provider initialization
      await mockedProvider.getBlock(1000);

      const fakeFetchImplWithRPCError = async (): Promise<JsonRpcResponse> => {
        return {
          jsonrpc: '2.0',
          id: <number>(<unknown>null), // real scenario from Erigon node
          error: {
            code: -32000,
            message: 'rpc batch limit reached',
          },
        };
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(
        async () => await mockedProvider.getBlock(42),
      ).rejects.toThrowError(
        new FetchError(
          'Unexpected batch result. Possible reason: "rpc batch limit reached".',
        ),
      );
      expect(mockedProviderFetch).toBeCalledTimes(3);
    });

    test('should throw exception on JsonRpc error when node reached rpc batching limit without any error message', async () => {
      await createMocks(10, 10);

      // this will trigger network detection and provider initialization
      await mockedProvider.getBlock(1000);

      const fakeFetchImplWithRPCError = async (): Promise<JsonRpcResponse> => {
        return {
          jsonrpc: '2.0',
          id: 1,
        };
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(
        async () => await mockedProvider.getBlock(42),
      ).rejects.toThrowError(new FetchError('Unexpected batch result.'));
      expect(mockedProviderFetch).toBeCalledTimes(3);
    });

    test('should throw exception on JsonRpc error when partial rpc response received from node', async () => {
      await createMocks(10, 10);

      // this will trigger network detection and provider initialization
      await mockedProvider.getBlock(1000);

      const fakeFetchImplWithRPCError = async (): Promise<
        JsonRpcResponse[]
      > => {
        return [];
      };

      mockedProviderFetch.mockImplementation(fakeFetchImplWithRPCError);

      await expect(async () => {
        // these requests will be batched
        await mockedProvider.getBlock(42);
        await mockedProvider.getBlock(32);
      }).rejects.toThrowError(
        new FetchError('Partial payload batch result. Response 44 not found'),
      );
      expect(mockedProviderFetch).toBeCalledTimes(3);
    });
  });
});
