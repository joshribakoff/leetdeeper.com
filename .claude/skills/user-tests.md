# User-Space Tests (Challenge Test Runner)

**What:** The in-browser test framework that evaluates user-submitted solutions. This runs inside a web worker — NOT in Node.js, NOT with Playwright.

**Where:**
- `src/lib/test-harness.ts` — Custom ~80-line test framework (`describe`, `test`, `expect`)
- `src/lib/test-worker.ts` — Web worker that orchestrates: transpile TS → execute user code → run tests → post results
- `src/lib/module-resolver.ts` — CJS module stubbing (exports/require plumbing)
- `src/challenges/<slug>/tests.ts` — Challenge test cases using the harness API
- `src/challenges/<slug>/starter.ts` — Starter code shown in editor

**How it works:**
1. User writes code in Monaco editor
2. Click "Run Tests" creates a web worker
3. Worker transpiles user code + test code via TypeScript compiler
4. `module-resolver.ts` handles CJS exports/require stubbing
5. Test harness `describe/test/expect` are injected as globals into the test scope
6. Results posted back as `{ name, pass, error? }[]`

**Challenge test files import from `./solution`** — the worker rewrites this to point at the user's captured exports.

**This is NOT Vitest/Jest.** Cannot use Node.js test frameworks in a browser worker.

**Adding a new challenge:**
1. Create `src/challenges/<slug>/starter.ts` and `tests.ts`
2. Create `src/content/challenges/<slug>.mdx` with frontmatter
3. Add slug to the course's `challenges` array in `src/content/courses/<course>.md`
