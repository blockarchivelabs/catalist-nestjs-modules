import { Test } from '@nestjs/testing';
import { FetchModule } from '@catalist-nestjs/fetch';
import {
  IpfsGeneralService,
  IpfsModule,
} from '@catalist-nestjs/ipfs-http-client';
import { IpfsNopKeysService, IpfsNopKeysModule } from '../../src';

import {
  ModuleMetadata,
  Injectable,
  Module,
  DynamicModule,
} from '@nestjs/common';

@Injectable()
class ConfigService {
  public url = '';
  public password = '';
  public username = '';
}

@Module({
  imports: [],
  providers: [ConfigService],
  exports: [ConfigService],
})
class ConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: ConfigModule,
      global: true,
    };
  }
}

describe('Sync module initializing', () => {
  const testModules = async (imports: ModuleMetadata['imports']) => {
    const moduleRef = await Test.createTestingModule({ imports }).compile();

    // just ipfs http client
    const ipfsGeneralService = moduleRef.get(IpfsGeneralService);

    // wrap around ipfsService to store node operators keys in ipfs
    const ipfsNopKeysService = moduleRef.get(IpfsNopKeysService);

    expect(ipfsNopKeysService.addKeySign).toBeDefined();
    expect(ipfsNopKeysService.getKeySign).toBeDefined();

    expect(ipfsGeneralService.add).toBeDefined();
    expect(ipfsGeneralService.get).toBeDefined();

    return moduleRef;
  };

  test('forFeature', async () => {
    let imports = [
      IpfsNopKeysModule.forFeature({
        imports: [
          IpfsModule.forFeature({
            imports: [FetchModule],
            url: '',
            username: '',
            password: '',
          }),
        ],
      }),
    ];

    await testModules(imports);

    // IpfsModule as global dependency

    imports = [
      IpfsModule.forRoot({
        imports: [FetchModule],
        url: '',
        username: '',
        password: '',
      }),
      IpfsNopKeysModule.forFeature({}),
    ];

    await testModules(imports);

    // async IpfsModule

    imports = [
      ConfigModule.forRoot(),
      IpfsNopKeysModule.forFeature({
        imports: [
          IpfsModule.forFeatureAsync({
            imports: [FetchModule],
            async useFactory(config: ConfigService) {
              return {
                url: config.url,
                username: config.username,
                password: config.password,
              };
            },
            inject: [ConfigService],
          }),
        ],
      }),
    ];

    await testModules(imports);

    // async global

    imports = [
      ConfigModule.forRoot(),
      IpfsModule.forRootAsync({
        imports: [FetchModule],
        async useFactory(config: ConfigService) {
          return {
            url: config.url,
            username: config.username,
            password: config.password,
          };
        },
        inject: [ConfigService],
      }),
      IpfsNopKeysModule.forFeature({}),
    ];

    await testModules(imports);
  });

  test('forRoot', async () => {
    let imports = [
      IpfsNopKeysModule.forRoot({
        imports: [
          IpfsModule.forFeature({
            imports: [FetchModule],
            url: '',
            username: '',
            password: '',
          }),
        ],
      }),
    ];

    await testModules(imports);

    // IpfsModule as global dependency

    imports = [
      IpfsModule.forRoot({
        imports: [FetchModule],
        url: '',
        username: '',
        password: '',
      }),
      IpfsNopKeysModule.forRoot({}),
    ];

    await testModules(imports);

    // async IpfsModule

    imports = [
      ConfigModule.forRoot(),
      IpfsNopKeysModule.forRoot({
        imports: [
          IpfsModule.forFeatureAsync({
            imports: [FetchModule],
            async useFactory(config: ConfigService) {
              return {
                url: config.url,
                username: config.username,
                password: config.password,
              };
            },
            inject: [ConfigService],
          }),
        ],
      }),
    ];

    await testModules(imports);

    // async global

    imports = [
      ConfigModule.forRoot(),
      IpfsModule.forRootAsync({
        imports: [FetchModule],
        async useFactory(config: ConfigService) {
          return {
            url: config.url,
            username: config.username,
            password: config.password,
          };
        },
        inject: [ConfigService],
      }),
      IpfsNopKeysModule.forRoot({}),
    ];

    await testModules(imports);
  });
});
