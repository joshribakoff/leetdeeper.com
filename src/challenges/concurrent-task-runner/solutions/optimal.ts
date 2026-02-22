export async function runTasks<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0; // Shared index — each worker grabs the next available task

  async function worker() {
    while (next < tasks.length) {
      const idx = next++; // Claim this task index
      const task = tasks[idx]; // Extract to avoid implicit this binding to array
      results[idx] = await task();
    }
  }

  // Spawn N workers — each pulls tasks until none remain
  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
}
