import { delay } from './solution';

describe('Basic', () => {
  test('resolves after specified ms', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed >= 40).toBe(true);
  });

  test('resolves with undefined', async () => {
    const result = await delay(10);
    expect(result).toBe(undefined);
  });
});

describe('Extended', () => {
  test('returns a real promise', () => {
    const result = delay(10);
    expect(result instanceof Promise).toBe(true);
  });

  test('delay(0) uses macrotask not microtask', async () => {
    let resolved = false;
    delay(0).then(() => { resolved = true; });
    // Must not resolve synchronously
    expect(resolved).toBe(false);
    // Must still be pending after microtask flush (setTimeout is a macrotask)
    await Promise.resolve();
    expect(resolved).toBe(false);
  });

  test('multiple delays resolve independently', async () => {
    const order: number[] = [];
    const p1 = delay(30).then(() => order.push(1));
    const p2 = delay(10).then(() => order.push(2));
    await Promise.all([p1, p2]);
    expect(order).toEqual([2, 1]);
  });
});
