export function delay(ms: number): Promise<void> {
  // TODO: implement
  return Promise.resolve();
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> {
  // TODO: implement
  return fn();
}

export function promiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
  // TODO: implement
  return Promise.resolve([]);
}
