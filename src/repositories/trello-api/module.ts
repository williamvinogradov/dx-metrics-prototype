import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import { LoggerProvider } from '../../logger';
import { HttpAsyncService } from '../../services/http-async.service';
import { API_OPTIONS_TOKEN } from './api-options';
import { TrelloApiRepository } from './trello-api.repository';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      envFilePath: '.env.local',
    }),
  ],
  controllers: [],
  providers: [
    LoggerProvider,
    {
      provide: API_OPTIONS_TOKEN,
      useValue: {
        url: 'https://api.trello.com/1',
        key: process.env.TRELLO_API_KEY,
        token: process.env.TRELLO_API_TOKEN,
      },
    },
    HttpAsyncService,
    TrelloApiRepository,
  ],
  exports: [TrelloApiRepository],
})
export class TrelloApiRepositoryModule {}
