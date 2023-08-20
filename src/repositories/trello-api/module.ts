import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerProvider } from '../../logger';
import { HttpAsyncModule } from '../../shared/http-async';
import { envHelper } from '../../utils';
import { TRELLO_API_OPTIONS_TOKEN } from './trello-api-options';
import { TrelloApiRepository } from './trello-api.repository';
import { TrelloPluginDataConverter } from './trello-plugin-data.converter';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      envFilePath: envHelper.getEnvFile(),
    }),
    HttpAsyncModule,
  ],
  controllers: [],
  providers: [
    LoggerProvider,
    {
      provide: TRELLO_API_OPTIONS_TOKEN,
      useValue: {
        url: envHelper.getTrelloApiLink(),
        key: envHelper.getTrelloApiKey(),
        token: envHelper.getTrelloApiToken(),
      },
    },
    TrelloPluginDataConverter,
    TrelloApiRepository,
  ],
  exports: [TrelloApiRepository],
})
export class TrelloApiRepositoryModule {}
