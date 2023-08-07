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
