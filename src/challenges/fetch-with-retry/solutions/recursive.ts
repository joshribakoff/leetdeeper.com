export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> {
  try {
    // Try the call
    return await fn();
  } catch (e) {
    // No retries left — rethrow
    if (retries <= 1) throw e;
    // Recurse with one fewer retry
    return fetchWithRetry(fn, retries - 1);
  }
}
