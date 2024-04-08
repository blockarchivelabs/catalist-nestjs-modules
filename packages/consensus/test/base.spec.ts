import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '@catalist-nestjs/fetch';
import { ConsensusBaseService } from '../src/service/base.service';
import { CONSENSUS_OPTIONS_TOKEN } from '../src';

describe('Base service', () => {
  let baseService: ConsensusBaseService;
  let fetchService: FetchService;
  let mockFetch: jest.SpyInstance<
    ReturnType<FetchService['fetchJson']>,
    Parameters<FetchService['fetchJson']>
  >;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FetchModule.forRoot()],
      providers: [
        ConsensusBaseService,
        {
          provide: CONSENSUS_OPTIONS_TOKEN,
          useValue: null,
        },
      ],
    }).compile();
    baseService = moduleRef.get(ConsensusBaseService);
    fetchService = moduleRef.get(FetchService);

    mockFetch = jest
      .spyOn(fetchService, 'fetchJson')
      .mockImplementation(async () => null);
  });

  test('Methods are defined', () => {
    expect(baseService.fetch).toBeDefined();
    expect(baseService.getSearchString).toBeDefined();
  });

  test('Fetch', async () => {
    const expected = '/foo';
    await baseService.fetch(expected);

    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toBeCalledWith(expected, undefined);
  });

  describe('Search string', () => {
    test('Simple object', async () => {
      expect(baseService.getSearchString({ foo: 'bar' })).toBe('?foo=bar');
    });

    test('Undefined', async () => {
      expect(baseService.getSearchString({ foo: undefined })).toBe('');
      expect(baseService.getSearchString({ foo: undefined, bar: '1' })).toBe(
        '?bar=1',
      );
    });

    test('Empty object', async () => {
      expect(baseService.getSearchString({})).toBe('');
    });

    test('Array', async () => {
      expect(baseService.getSearchString({ foo: ['1', '2'] })).toBe(
        '?foo=1%2C2',
      );
    });

    test('Snake case', async () => {
      expect(baseService.getSearchString({ fooBar: 'baz' })).toBe(
        '?foo_bar=baz',
      );
    });
  });
});
