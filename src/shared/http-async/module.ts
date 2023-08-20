import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerProvider } from '../../logger';
import { envHelper } from '../../utils';
import {
  HTTP_ASYNC_OPTIONS_TOKEN,
  HttpAsyncService,
} from './http-async.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [
    LoggerProvider,
    {
      provide: HTTP_ASYNC_OPTIONS_TOKEN,
      useValue: {
        maxAttempts: envHelper.getApiMaxRetryAttempts(),
        requestTimeoutMs: envHelper.getApiRetryTimeoutMs(),
      },
    },
    HttpAsyncService,
  ],
  exports: [HttpAsyncService],
})
export class HttpAsyncModule {}
