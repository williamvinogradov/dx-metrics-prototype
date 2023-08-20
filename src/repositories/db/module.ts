import { Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { LoggerProvider } from '../../logger';
import { DbRepository } from './db.repository';
import { ScDbRepository } from './sc-db.repository';
import { TaskDbRepository } from './task-db.repository';
import { TrelloDbRepository } from './trello-db.repository';
import { TeamSettingsDbRepository } from './team-settings-db.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
    }),
  ],
  controllers: [],
  providers: [
    LoggerProvider,
    {
      provide: PrismaClient,
      useClass: PrismaClient,
    },
    TaskDbRepository,
    ScDbRepository,
    TrelloDbRepository,
    TeamSettingsDbRepository,
    DbRepository,
  ],
  exports: [DbRepository],
})
export class DbRepositoriesModule {}
