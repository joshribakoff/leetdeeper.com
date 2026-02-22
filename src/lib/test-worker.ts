/**
 * Web Worker: receives user code + test code, transpiles TS,
 * evaluates in a sandboxed scope, runs the test harness, posts results.
 *
 * This is the USER-SPACE execution environment. The worker runs
 * challenge test code against the user's solution code. It is NOT
 * related to the project's Playwright E2E tests.
 *
 * TODO: Simplify the CJS exports plumbing. Current approach is obtuse —
 * it manually stubs `exports`, `require`, and patches `require("./solution")`
 * in the transpiled output. A cleaner approach would be:
 *   1. Strip import/export at the source level before transpiling
 *   2. Or use a simple regex to extract exported function names and
 *      reconstruct a plain scope (no CJS machinery needed)
 *   3. Or transpile to a format that doesn't need exports/require at all
 *      (e.g. wrap in an IIFE that returns an object of exports)
 * The goal: someone reading this file should immediately understand
 * what's happening without needing to know CJS internals.
 */

import ts from 'typescript';
import { describe, test, expect, collectResults, type TestResult } from './test-harness';

export type WorkerMessage =
  | { type: 'run'; userCode: string; testCode: string }
  | { type: 'results'; results: TestResult[] }
  | { type: 'error'; error: string };

const TIMEOUT_MS = 5000;

// TODO: This transpiles to CommonJS which emits `exports.X = ...` and
// `require("./solution")`. We then have to stub those globals and patch
// the require calls. Consider stripping imports/exports at the string
// level and injecting solution bindings directly instead.
function transpile(code: string): string {
  return ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      esModuleInterop: true,
    },
  }).outputText;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type !== 'run') return;

  const { userCode, testCode } = e.data;

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    self.postMessage({ type: 'error', error: 'Execution timed out (5s)' } satisfies WorkerMessage);
  }, TIMEOUT_MS);

  try {
    const userJs = transpile(userCode);
    const testJs = transpile(testCode);

    // Execute user code, capturing exports via CJS stub
    const solutionExports: Record<string, any> = {};
    const execUser = new Function('exports', 'require', userJs);
    execUser(solutionExports, () => ({}));

    // Patch: replace require("./solution") → use our captured exports directly
    const patchedTestJs = testJs.replace(
      /require\(["']\.\/solution["']\)/g,
      '__solution__',
    );

    // Provide CJS stubs (exports, require) so transpiled boilerplate doesn't crash
    const testExports: Record<string, any> = {};
    const execTests = new Function(
      'exports', 'require', '__solution__', 'describe', 'test', 'expect',
      patchedTestJs,
    );
    execTests(testExports, () => ({}), solutionExports, describe, test, expect);

    const results = await collectResults();
    clearTimeout(timeout);
    if (!timedOut) {
      self.postMessage({ type: 'results', results } satisfies WorkerMessage);
    }
  } catch (err: any) {
    clearTimeout(timeout);
    if (!timedOut) {
      self.postMessage({ type: 'error', error: err?.message ?? String(err) } satisfies WorkerMessage);
    }
  }
};
