import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { response } from 'express';
import {
  catchError,
  delay,
  firstValueFrom,
  lastValueFrom,
  Observable,
  of,
  retry,
  switchMap,
  tap,
  timeout,
} from 'rxjs';
import { Logger } from 'winston';

export const HTTP_ASYNC_OPTIONS_TOKEN = Symbol('HTTP_ASYNC_OPTIONS_TOKEN');

export interface HttpAsyncOptions {
  maxAttempts: number;
  requestTimeoutMs: number;
}

@Injectable()
export class HttpAsyncService {
  constructor(
    @Inject(HTTP_ASYNC_OPTIONS_TOKEN)
    private readonly options: HttpAsyncOptions,
    private readonly http: HttpService,
    private readonly logger: Logger,
  ) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  async getAsync<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.doRequest(url, () => this.http.get(url, config));
  }

  private async doRequest<T = any>(
    url: string,
    requestFunc: () => Observable<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T>> {
    const { maxAttempts, requestTimeoutMs } = this.options;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const request$ = of(null).pipe(
        delay(attempt === 0 ? 0 : requestTimeoutMs),
        switchMap(() => requestFunc()),
      );

      const response = await firstValueFrom(request$).catch((error) => {
        this.logger.log(
          'warn',
          `[Attempt: ${attempt}]: Request to ${url} failed:`,
          error,
        );

        return null;
      });

      if (response) {
        return response;
      }
    }

    throw Error(
      `Request to ${url} failed after ${this.options.maxAttempts} attempts.`,
    );
  }
}
