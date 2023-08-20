import { Provider, Scope } from '@nestjs/common';
import * as process from 'process';
import { createLogger, format, Logger, transports } from 'winston';
import 'winston-daily-rotate-file';
import { envHelper } from './utils';

const createRotatedFile = () =>
  new transports.DailyRotateFile({
    filename: '%DATE%.log',
    dirname: './logs',
    datePattern: 'YYYY-MM-DD-HH',
    maxSize: '10m',
    maxFiles: '7d',
  });

const createLoggerInstance = (logLevel: string, isDev: boolean): Logger =>
  createLogger({
    level: logLevel,
    transports: isDev
      ? [new transports.Console(), createRotatedFile()]
      : [createRotatedFile()],
    format: format.combine(
      format.errors({ stack: true }),
      format.colorize(),
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message, service, stack }) =>
          `[${timestamp}] ${level} ${service}: ${message}${
            stack ? `\nstack:\n\t${stack}` : ''
          }`,
      ),
    ),
    defaultMeta: {
      service: 'Service',
    },
  });

export const LoggerProvider: Provider = {
  provide: Logger,
  useFactory: () =>
    createLoggerInstance(envHelper.getLoggerLogLevel(), envHelper.isDevMode()),
  scope: Scope.TRANSIENT,
};
