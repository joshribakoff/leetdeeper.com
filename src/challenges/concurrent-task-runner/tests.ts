import { runTasks } from './solution';

describe('Basic', () => {
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
    let threw = false;
    try {
      await runTasks([
        () => Promise.resolve(1),
        () => Promise.reject(new Error('fail')),
      ], 2);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe('Extended', () => {
  test('actually calls each task function', async () => {
    let callCount = 0;
    const tasks = [
      async () => { callCount++; return 'x'; },
      async () => { callCount++; return 'y'; },
      async () => { callCount++; return 'z'; },
    ];
    const results = await runTasks(tasks, 2);
    expect(callCount).toBe(3);
    expect(results).toEqual(['x', 'y', 'z']);
  });

  test('order preserved when tasks resolve out of order', async () => {
    const tasks = [
      () => new Promise<number>((r) => setTimeout(() => r(10), 30)),
      () => new Promise<number>((r) => setTimeout(() => r(20), 10)),
      () => new Promise<number>((r) => setTimeout(() => r(30), 20)),
    ];
    const results = await runTasks(tasks, 3);
    expect(results).toEqual([10, 20, 30]);
  });

  test('concurrency=1 runs sequentially', async () => {
    let running = 0;
    let maxRunning = 0;
    const makeTask = (val: number) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 10));
      running--;
      return val;
    };
    const results = await runTasks([makeTask(1), makeTask(2), makeTask(3)], 1);
    expect(maxRunning).toBe(1);
    expect(results).toEqual([1, 2, 3]);
  });

  test('starts new tasks as slots free up', async () => {
    const started: number[] = [];
    const makeTask = (id: number, delay: number) => async () => {
      started.push(id);
      await new Promise((r) => setTimeout(r, delay));
      return id;
    };
    // concurrency=2: starts 0,1 → 0 finishes fast → starts 2 before 1 finishes
    const tasks = [
      makeTask(0, 10),
      makeTask(1, 50),
      makeTask(2, 10),
      makeTask(3, 10),
    ];
    const results = await runTasks(tasks, 2);
    expect(results).toEqual([0, 1, 2, 3]);
    // Task 2 must have started before task 3 (slot reuse, not batch)
    expect(started.indexOf(2) < started.indexOf(3)).toBe(true);
  });

  test('microtask interleaving — tasks start on next tick', async () => {
    const log: string[] = [];
    const tasks = [
      async () => { log.push('start-0'); await Promise.resolve(); log.push('end-0'); return 0; },
      async () => { log.push('start-1'); await Promise.resolve(); log.push('end-1'); return 1; },
      async () => { log.push('start-2'); await Promise.resolve(); log.push('end-2'); return 2; },
    ];
    const results = await runTasks(tasks, 2);
    expect(results).toEqual([0, 1, 2]);
    // With concurrency 2, tasks 0 and 1 should both start before either ends
    expect(log.indexOf('start-0') < log.indexOf('end-0')).toBe(true);
    expect(log.indexOf('start-1') < log.indexOf('end-0')).toBe(true);
    // Task 2 should not start until a slot frees (after end-0 or end-1)
    const start2 = log.indexOf('start-2');
    const firstEnd = Math.min(log.indexOf('end-0'), log.indexOf('end-1'));
    expect(start2 > firstEnd).toBe(true);
  });

  test('rejects with the actual error', async () => {
    let error: Error | null = null;
    try {
      await runTasks([
        () => new Promise((r) => setTimeout(() => r(1), 50)),
        () => Promise.reject(new Error('boom')),
      ], 2);
    } catch (e) {
      error = e as Error;
    }
    expect(error!.message).toBe('boom');
  });

  test('concurrency higher than task count works', async () => {
    const results = await runTasks([() => Promise.resolve('only')], 100);
    expect(results).toEqual(['only']);
  });

  test('preserves this binding of task functions', async () => {
    const service = {
      multiplier: 10,
      compute(n: number) { return Promise.resolve(n * this.multiplier); },
    };
    const tasks = [1, 2, 3].map((n) => service.compute.bind(service, n));
    const results = await runTasks(tasks, 2);
    expect(results).toEqual([10, 20, 30]);
  });

  test('does not rebind task this', async () => {
    let receivedThis: any;
    const tasks = [function(this: any) {
      receivedThis = this;
      return Promise.resolve('ok');
    }];
    const results = await runTasks(tasks, 1);
    expect(results).toEqual(['ok']);
    expect(receivedThis).toBe(undefined);
  });
});
