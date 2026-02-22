/**
 * Module resolution for the test worker.
 *
 * Handles the CJS plumbing so the worker stays high-level.
 * TypeScript transpiles to CommonJS which emits `exports.X = ...`
 * and `require("./solution")`. This module stubs those globals
 * and wires up the solution → test code binding.
 */

type Exports = Record<string, any>;

/** Run transpiled CJS code, return its exports. */
export function executeModule(code: string, globals: Record<string, any> = {}): Exports {
  const exports: Exports = {};
  const params = ['exports', 'require', ...Object.keys(globals)];
  const args = [exports, () => ({}), ...Object.values(globals)];
  new Function(...params, code)(...args);
  return exports;
}

/** Rewrite require("./solution") → __solution__ in transpiled test code. */
export function patchSolutionImport(code: string): string {
  return code.replace(/require\(["']\.\/solution["']\)/g, '__solution__');
}
