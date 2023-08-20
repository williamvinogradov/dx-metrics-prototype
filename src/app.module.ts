import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DomainModule } from './domain';
import { TeamApiController } from './controllers';
import { LoggerProvider } from './logger';
import { DbRepositoriesModule } from './repositories/db';

@Module({
  imports: [HttpModule, DomainModule, DbRepositoriesModule],
  controllers: [TeamApiController],
  providers: [LoggerProvider],
})
export class AppModule {}
