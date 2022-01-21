import { Test } from '@nestjs/testing';
import { FetchModule, FetchService } from '../src';

describe('Module initializing', () => {
  describe('For root', () => {
    let fetchService: FetchService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [FetchModule.forRoot()],
      }).compile();

      fetchService = moduleRef.get(FetchService);
    });

    test('Methods should be defined', async () => {
      expect(fetchService.fetchJson).toBeDefined();
      expect(fetchService.fetchText).toBeDefined();
    });
  });

  describe('For feature', () => {
    let fetchService: FetchService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [FetchModule.forFeature()],
      }).compile();

      fetchService = moduleRef.get(FetchService);
    });

    test('Methods should be defined', async () => {
      expect(fetchService.fetchJson).toBeDefined();
      expect(fetchService.fetchText).toBeDefined();
    });
  });
});
