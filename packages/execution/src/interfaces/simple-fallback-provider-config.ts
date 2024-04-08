import { RequestPolicy } from '../provider/extended-json-rpc-batch-provider';
import { ConnectionInfo } from '@ethersproject/web';
import { Networkish } from './networkish';
import { NonEmptyArray } from './non-empty-array';
import { MiddlewareCallback } from '@catalist-nestjs/middleware';

export interface SimpleFallbackProviderConfig {
  urls: NonEmptyArray<ConnectionInfo | string>;

  network: Networkish;

  // common request police for all fallback providers
  requestPolicy?: RequestPolicy;

  // max retries and backoff max timeout before triggering the next provider
  maxRetries?: number;
  minBackoffMs?: number;
  maxBackoffMs?: number;

  // log retry attempts if needed
  logRetries?: boolean;

  // time to reset active provider index to 0 and provider unreachable flags
  resetIntervalMs?: number;

  fetchMiddlewares?: MiddlewareCallback<Promise<any>>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  maxTimeWithoutNewBlocksMs?: number; // should be greater than polling interval, usually 2x polling interval
}
