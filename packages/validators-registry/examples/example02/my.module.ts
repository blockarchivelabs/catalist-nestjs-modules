import { Module } from '@nestjs/common';
import {
  StorageModule,
  ValidatorsRegistryModule,
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
    FetchModule.forRoot({
      baseUrls: ['http://consensus-node:4001'],
    }),
    ConsensusModule.forRoot(),
    ValidatorsRegistryModule.forFeature(),
  ],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}
