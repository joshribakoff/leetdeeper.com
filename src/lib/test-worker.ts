/**
 * Web Worker: transpiles user + test code, runs the test harness, posts results.
 *
 * This is the USER-SPACE execution environment — it runs challenge test code
 * against the user's solution. Not related to the project's Playwright tests.
 */

import ts from 'typescript';
import { describe, test, expect, collectResults, type TestResult } from './test-harness';
import { executeModule, patchSolutionImport } from './module-resolver';

export type WorkerMessage =
  | { type: 'run'; userCode: string; testCode: string }
  | { type: 'results'; results: TestResult[] }
  | { type: 'error'; error: string };

const TIMEOUT_MS = 5000;

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

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    self.postMessage({ type: 'error', error: 'Execution timed out (5s)' } satisfies WorkerMessage);
  }, TIMEOUT_MS);

  try {
    const userJs = transpile(e.data.userCode);
    const testJs = patchSolutionImport(transpile(e.data.testCode));

    const solution = executeModule(userJs);
    executeModule(testJs, { __solution__: solution, describe, test, expect });

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
