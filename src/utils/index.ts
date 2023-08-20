import * as process from 'process';

export const asyncForEach = async <T>(
  array: T[],
  func: (item: T) => Promise<any>,
): Promise<void> => {
  return array.reduce(async (memo, item): Promise<undefined> => {
    await memo;
    await func(item);
    return memo;
  }, Promise.resolve(undefined));
};

export const envHelper = {
  getTrelloApiLink: () => process.env.TRELLO_API_LINK,
  getTrelloApiKey: () => process.env.TRELLO_API_KEY,
  getTrelloApiToken: () => process.env.TRELLO_API_TOKEN,
  getApiMaxRetryAttempts: () => {
    const envValue = process.env.API_MAX_RETRY_ATTEMPTS;
    return Number.isNaN(envValue) ? 3 : Number(envValue);
  },
  getApiRetryTimeoutMs: () => {
    const envValue = process.env.API_RETRY_TIMEOUT_MS;
    return Number.isNaN(envValue) ? 2000 : Number(envValue);
  },
  getLoggerLogLevel: () => process.env.LOGGER_LOG_LEVEL ?? 'info',
  isDevMode: () => process.env.APP_MODE === 'dev',
  getEnvFile: () =>
    process.env.ENVIRONMENT === 'docker' ? '.env.docker' : '.env.local',
};
