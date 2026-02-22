import { delay } from './solution';

describe('delay', () => {
  test('resolves after ms', async () => {
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
