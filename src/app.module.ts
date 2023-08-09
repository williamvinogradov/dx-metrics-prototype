import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DomainModule } from './domain';
import { TrelloDataApiController } from './controllers';
import { DbRepositoriesModule } from './repositories/db';

@Module({
  imports: [HttpModule, DomainModule, DbRepositoriesModule],
  controllers: [TrelloDataApiController],
  providers: [],
})
export class AppModule {}
