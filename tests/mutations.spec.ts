import { test, expect } from '@playwright/test';

/**
 * Mutation tests — inject known-bad code and verify the challenge test
 * suites CATCH it. If a mutation passes all tests, the suite has a gap.
 */

const mutations: { slug: string; name: string; code: string }[] = [
  // delay — short-circuits delay(0) synchronously (Zalgo)
  {
    slug: 'delay',
    name: 'sync resolve releases Zalgo for ms=0',
    code: `export function delay(ms: number): Promise<void> {
  if (ms === 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}`,
  },
  // two-sum — returns values instead of indices
  {
    slug: 'two-sum',
    name: 'returns values instead of indices',
    code: `export function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [nums[i], nums[j]];
    }
  }
  return [];
}`,
  },
  // fetch-with-retry — off-by-one: retries one too many times
  {
    slug: 'fetch-with-retry',
    name: 'off-by-one: retries+1 attempts instead of retries',
    code: `export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) { lastError = e; }
  }
  throw lastError;
}`,
  },
  // concurrent-task-runner — ignores concurrency limit (runs all at once)
  {
    slug: 'concurrent-task-runner',
    name: 'ignores concurrency limit',
    code: `export async function runTasks<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  return Promise.all(tasks.map((t) => t()));
}`,
  },
  // async-iterators — eager fetching (not lazy)
  {
    slug: 'async-iterators',
    name: 'eagerly fetches all pages upfront',
    code: `export type Page<T> = { items: T[]; nextCursor?: string };
export async function paginate<T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
): Promise<T[]> & AsyncIterable<T> {
  const allItems: T[] = [];
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    allItems.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  const iter = {
    [Symbol.asyncIterator]() {
      let i = 0;
      return { async next() { return i < allItems.length ? { done: false, value: allItems[i++] } : { done: true, value: undefined as any }; } };
    }
  };
  return Object.assign(Promise.resolve(allItems), iter) as any;
}
export async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iter) result.push(item);
  return result;
}
export async function* asyncMap<T, U>(
  iter: AsyncIterable<T>,
  fn: (item: T) => Promise<U>,
): AsyncGenerator<U> {
  for await (const item of iter) yield await fn(item);
}`,
  },
  // fetch-with-retry — rebinds this via .call({})
  {
    slug: 'fetch-with-retry',
    name: 'rebinds callback this via .call({})',
    code: `export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try { return await fn.call({}); }
    catch (e) { lastError = e; }
  }
  throw lastError;
}`,
  },
  // concurrent-task-runner — rebinds task this via .call({})
  {
    slug: 'concurrent-task-runner',
    name: 'rebinds task this via .call({})',
    code: `export async function runTasks<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const idx = next++;
      results[idx] = await tasks[idx].call({});
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}`,
  },
  // async-iterators — rebinds fetchPage this via .call({})
  {
    slug: 'async-iterators',
    name: 'rebinds fetchPage this via .call({})',
    code: `export type Page<T> = { items: T[]; nextCursor?: string };
export async function* paginate<T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
): AsyncGenerator<T> {
  let cursor: string | undefined;
  do {
    const page = await fetchPage.call({}, cursor);
    for (const item of page.items) yield item;
    cursor = page.nextCursor;
  } while (cursor);
}
export async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iter) result.push(item);
  return result;
}
export async function* asyncMap<T, U>(
  iter: AsyncIterable<T>,
  fn: (item: T) => Promise<U>,
): AsyncGenerator<U> {
  for await (const item of iter) yield await fn.call({}, item);
}`,
  },
];

for (const mutation of mutations) {
  test(`MUTATION: ${mutation.slug} — ${mutation.name} should FAIL`, async ({ page }) => {
    await page.goto(`/challenge/${mutation.slug}/`);
    await page.waitForFunction(() => (window as any).__leetdeeperEditor);

    // Inject mutated code
    await page.evaluate((c) => (window as any).__leetdeeperEditor.setValue(c), mutation.code);

    // Click "Run Tests" and wait for run to complete
    await page.click('button:has-text("Run Tests")');
    await expect(page.locator('button:has-text("Running")')).toBeVisible();
    await expect(page.locator('button:has-text("Run Tests")')).toBeVisible();

    // Mutated code must NOT pass all tests
    await expect(page.getByText('All tests passed!')).not.toBeVisible();
  });
}
