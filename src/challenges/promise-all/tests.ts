import { promiseAll } from './solution';

describe('promiseAll', () => {
  test('resolves with all values in order', async () => {
    const result = await promiseAll([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ]);
    expect(result).toEqual([1, 2, 3]);
  });

  test('rejects with first rejection', async () => {
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
