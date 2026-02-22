import { fetchWithRetry } from './solution';

describe('fetchWithRetry', () => {
  test('returns on first success', async () => {
    const result = await fetchWithRetry(() => Promise.resolve('ok'), 3);
    expect(result).toBe('ok');
  });

  test('retries on failure then succeeds', async () => {
    let attempts = 0;
    const result = await fetchWithRetry(() => {
      if (++attempts < 3) throw new Error('fail');
      return Promise.resolve('ok');
    }, 3);
    expect(result).toBe('ok');
  });

  test('throws after exhausting retries', async () => {
    let threw = false;
    try {
      await fetchWithRetry(() => Promise.reject(new Error('fail')), 2);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
