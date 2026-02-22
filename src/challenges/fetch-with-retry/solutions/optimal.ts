export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      // Attempt the call — return immediately on success
      return await fn();
    } catch (e) {
      // Save the error and try again on next iteration
      lastError = e;
    }
  }

  // All attempts failed — throw the last error
  throw lastError;
}
