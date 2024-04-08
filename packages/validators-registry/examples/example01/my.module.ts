import { Module } from '@nestjs/common';
import {
  ValidatorsRegistryModule,
  StorageModule,
} from '@catalist-nestjs/validators-registry';
import { ConsensusModule } from '@catalist-nestjs/consensus';
import { FetchModule } from '@catalist-nestjs/fetch';
import { MyService } from './my.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: ':memory:',
      type: 'sqlite',
      entities: [...StorageModule.entities], // optional
      migrations: {
        /* migrations data */
      },
    }),
    ValidatorsRegistryModule.forFeature({
      imports: [
        ConsensusModule.forFeature({
          imports: [
            FetchModule.forFeature({
              baseUrls: ['http://consensus-node:4001'],
            }),
          ],
        }),
      ],
    }),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}
