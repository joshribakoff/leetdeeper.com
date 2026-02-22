/**
 * Minimal test harness that runs in the browser/web worker.
 * Provides describe(), test(), expect() with common matchers.
 *
 * This is the USER-SPACE test runner — it executes challenge test code
 * written against the user's solution. It is NOT the project's own
 * Playwright test suite (see CLAUDE.md for the distinction).
 */

export type TestResult = { name: string; pass: boolean; error?: string };

let results: TestResult[] = [];
let currentDescribe = '';

export function describe(name: string, fn: () => void) {
  currentDescribe = name;
  fn();
  currentDescribe = '';
}

export function test(name: string, fn: () => void | Promise<void>) {
  const fullName = currentDescribe ? `${currentDescribe} > ${name}` : name;
  const p = Promise.resolve().then(() => fn());
  (test as any).__pending.push(
    p.then(
      () => results.push({ name: fullName, pass: true }),
      (err: any) => results.push({ name: fullName, pass: false, error: String(err?.message ?? err) }),
    ),
  );
}
(test as any).__pending = [] as Promise<void>[];

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function createExpect(actual: any, negated = false) {
  const assert = (pass: boolean, msg: string) => {
    if (negated ? pass : !pass) throw new Error(msg);
  };

  const matchers = {
    toBe(expected: any) {
      assert(actual === expected, `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    },
    toEqual(expected: any) {
      assert(deepEqual(actual, expected), `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    },
    toHaveLength(expected: number) {
      assert(actual?.length === expected, `Expected length ${expected} but got ${actual?.length}`);
    },
    toThrow() {
      let threw = false;
      try { actual(); } catch { threw = true; }
      assert(threw, 'Expected function to throw');
    },
    get not() {
      return createExpect(actual, !negated);
    },
  };
  return matchers;
}

export function expect(actual: any) {
  return createExpect(actual);
}

export async function runTests(): Promise<TestResult[]> {
  results = [];
  (test as any).__pending = [];
  return results;
}

export async function collectResults(): Promise<TestResult[]> {
  await Promise.all((test as any).__pending);
  const r = [...results];
  results = [];
  (test as any).__pending = [];
  return r;
}
