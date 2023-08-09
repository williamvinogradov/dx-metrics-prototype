import { Provider, Scope } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';

const createLoggerInstance = (isDev: boolean, enableTrace = false): Logger =>
  createLogger({
    level: enableTrace ? 'silly' : 'info',
    transports: isDev ? [new transports.Console()] : [new transports.Console()],
    format: format.combine(
      format.errors({ stack: true }),
      format.colorize(),
      format.timestamp(),
      format.printf(
        ({ timestamp, level, message, service, stack }) =>
          `${level} [${timestamp}] ${service}: ${message}${
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
  useFactory: () => createLoggerInstance(true, true),
  scope: Scope.TRANSIENT,
};
