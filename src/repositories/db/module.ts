import { Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { LoggerProvider } from '../../logger';
import { ScDbRepository } from './sc-db.repository';
import { TaskDbRepository } from './task-db.repository';
import { TrelloDbRepository } from './trello-db.repository';
import { TrelloTeamSettingsDbRepository } from './trello-team-settings-db.repository';

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
      scope: Scope.TRANSIENT,
    },
    TaskDbRepository,
    ScDbRepository,
    TrelloDbRepository,
    TrelloTeamSettingsDbRepository,
  ],
  exports: [
    TaskDbRepository,
    ScDbRepository,
    TrelloDbRepository,
    TrelloTeamSettingsDbRepository,
  ],
})
export class DbRepositoriesModule {}
