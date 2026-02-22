import { runTasks } from './solution';

describe('runTasks', () => {
  test('returns all results in order', async () => {
    const tasks = [
      () => Promise.resolve('a'),
      () => Promise.resolve('b'),
      () => Promise.resolve('c'),
    ];
    const results = await runTasks(tasks, 2);
    expect(results).toEqual(['a', 'b', 'c']);
  });

  test('respects concurrency limit', async () => {
    let running = 0;
    let maxRunning = 0;
    const makeTask = (val: string) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 10));
      running--;
      return val;
    };
    const tasks = [makeTask('a'), makeTask('b'), makeTask('c'), makeTask('d')];
    await runTasks(tasks, 2);
    expect(maxRunning <= 2).toBe(true);
  });

  test('handles empty task list', async () => {
    const results = await runTasks([], 3);
    expect(results).toEqual([]);
  });

  test('rejects if any task rejects', async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve(3),
    ];
    let threw = false;
    try {
      await runTasks(tasks, 2);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
