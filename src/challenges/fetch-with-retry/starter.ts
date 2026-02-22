export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> {
  // TODO: implement
  return fn();
}
