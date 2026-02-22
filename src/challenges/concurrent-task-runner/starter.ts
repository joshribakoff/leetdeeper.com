export async function runTasks<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  // TODO: implement
  return [];
}
