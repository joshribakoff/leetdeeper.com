import { promiseAll } from './solution';

describe('Basic', () => {
  test('resolves with all values in order', async () => {
    const result = await promiseAll([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ]);
    expect(result).toEqual([1, 2, 3]);
  });

  test('rejects if any promise rejects', async () => {
    let threw = false;
    try {
      await promiseAll([
        Promise.resolve(1),
        Promise.reject(new Error('fail')),
        Promise.resolve(3),
      ]);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test('handles empty array', async () => {
    const result = await promiseAll([]);
    expect(result).toEqual([]);
  });
});

describe('Extended', () => {
  test('preserves order when promises resolve out of order', async () => {
    const result = await promiseAll([
      new Promise((r) => setTimeout(() => r('slow'), 30)),
      Promise.resolve('fast'),
      new Promise((r) => setTimeout(() => r('medium'), 10)),
    ]);
    expect(result).toEqual(['slow', 'fast', 'medium']);
  });

  test('rejects with the first rejection reason', async () => {
    let error: Error | null = null;
    try {
      await promiseAll([
        new Promise((_, rej) => setTimeout(() => rej(new Error('second')), 20)),
        Promise.reject(new Error('first')),
      ]);
    } catch (e) {
      error = e as Error;
    }
    expect(error!.message).toBe('first');
  });

  test('handles single promise', async () => {
    const result = await promiseAll([Promise.resolve(42)]);
    expect(result).toEqual([42]);
  });

  test('handles mixed types', async () => {
    const result = await promiseAll([
      Promise.resolve(1),
      Promise.resolve('two'),
      Promise.resolve(true),
    ]);
    expect(result).toEqual([1, 'two', true]);
  });

  test('all promises actually execute', async () => {
    let count = 0;
    const promises = [1, 2, 3].map((n) =>
      new Promise<number>((r) => { count++; r(n); }),
    );
    const result = await promiseAll(promises);
    expect(count).toBe(3);
    expect(result).toEqual([1, 2, 3]);
  });

  test('does not release Zalgo — always resolves asynchronously', async () => {
    let resolved = false;
    const p = promiseAll([Promise.resolve(1)]).then(() => { resolved = true; });
    // Must not resolve synchronously even with pre-resolved input
    expect(resolved).toBe(false);
    await p;
    expect(resolved).toBe(true);
  });
});
