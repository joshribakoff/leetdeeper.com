import { fetchWithRetry } from './solution';

describe('Basic', () => {
  test('returns on first success', async () => {
    const result = await fetchWithRetry(() => Promise.resolve('ok'), 3);
    expect(result).toBe('ok');
  });

  test('retries on failure then succeeds', async () => {
    let attempts = 0;
    const result = await fetchWithRetry(() => {
      if (++attempts < 3) throw new Error('fail');
      return Promise.resolve('recovered');
    }, 3);
    expect(result).toBe('recovered');
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

describe('Extended', () => {
  test('calls fn exactly once on immediate success', async () => {
    let calls = 0;
    await fetchWithRetry(() => { calls++; return Promise.resolve('ok'); }, 3);
    expect(calls).toBe(1);
  });

  test('calls fn exactly retries times on persistent failure', async () => {
    let calls = 0;
    try {
      await fetchWithRetry(() => { calls++; return Promise.reject(new Error('no')); }, 4);
    } catch {}
    expect(calls).toBe(4);
  });

  test('throws the last error, not the first', async () => {
    let attempt = 0;
    let error: Error | null = null;
    try {
      await fetchWithRetry(() => {
        attempt++;
        return Promise.reject(new Error(`fail-${attempt}`));
      }, 3);
    } catch (e) {
      error = e as Error;
    }
    expect(error!.message).toBe('fail-3');
  });

  test('retries=1 means one attempt, no retries', async () => {
    let calls = 0;
    try {
      await fetchWithRetry(() => { calls++; return Promise.reject(new Error('nope')); }, 1);
    } catch {}
    expect(calls).toBe(1);
  });

  test('preserves this when given a bound class method', async () => {
    class Api {
      base = 'https://api.example.com';
      fetch() { return Promise.resolve(this.base); }
    }
    const api = new Api();
    const result = await fetchWithRetry(api.fetch.bind(api), 3);
    expect(result).toBe('https://api.example.com');
  });

  test('does not rebind callback this', async () => {
    let receivedThis: any;
    const result = await fetchWithRetry(function(this: any) {
      receivedThis = this;
      return Promise.resolve('ok');
    }, 3);
    expect(result).toBe('ok');
    // fn() should use default binding (this=undefined in strict mode)
    // A buggy impl using fn.call({}) would set this to a non-undefined value
    expect(receivedThis).toBe(undefined);
  });

  test('handles async rejection (not just throw)', async () => {
    let attempts = 0;
    const result = await fetchWithRetry(async () => {
      attempts++;
      if (attempts < 2) {
        await Promise.resolve(); // async gap
        throw new Error('async fail');
      }
      return 'done';
    }, 3);
    expect(result).toBe('done');
    expect(attempts).toBe(2);
  });

});
