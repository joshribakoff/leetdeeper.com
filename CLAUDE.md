# leetdeeper.com

Interactive coding challenge site. Astro + React + Monaco.

## Testing Contexts (IMPORTANT)

There are three distinct "test" contexts in this project. Don't confuse them:

### 1. System tests (Playwright) — `tests/`

**What:** E2E tests that verify our site works correctly (pages load, editor mounts, navigation works).
**Where:** `tests/challenges.spec.ts`
**Run:** `npm test` (starts preview server, runs Playwright)
**Framework:** Playwright (`@playwright/test`)
**Owns:** Site behavior, not challenge correctness.

### 2. User-space test harness — `src/lib/test-harness.ts`

**What:** A minimal test framework (~80 lines) that ships to the browser. It provides `describe()`, `test()`, `expect()` with matchers. This is what runs inside the web worker to evaluate user solutions.
**Where:** `src/lib/test-harness.ts` (harness), `src/lib/test-worker.ts` (worker that orchestrates execution)
**Framework:** Custom (not Vitest, not Jest — those can't run in a worker)
**Owns:** Running challenge test code against user-submitted solutions.

### 3. Challenge test code — `src/challenges/<slug>/tests.ts`

**What:** The test cases for each coding challenge. Written in the same `describe/test/expect` API as the user-space harness. These import from `./solution` which gets rewritten by the worker to point at the user's code.
**Where:** `src/challenges/two-sum/tests.ts`, etc.
**Framework:** User-space harness (context 2 above)
**Owns:** Defining what "correct" means for each challenge.

### Quick reference

| Context | Directory | Runs in | Framework | Purpose |
|---------|-----------|---------|-----------|---------|
| System | `tests/` | Node (Playwright) | `@playwright/test` | Verify site works |
| Harness | `src/lib/` | Browser worker | Custom | Execute user code |
| Challenge | `src/challenges/` | Browser worker (via harness) | Custom | Define test cases |

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build static site
npm run preview      # Preview built site
npm test             # Run Playwright E2E tests
```

## Architecture

See `ARCHITECTURE.md` for detailed decisions and rationale.

## Content

- Courses: `src/content/courses/` — ordered challenge lists
- Challenges: `src/content/challenges/` — MDX descriptions
- Code: `src/challenges/<slug>/` — `starter.ts` + `tests.ts` (real TS, imported as `?raw`)

## Sailkit Integration

- **Lantern** (theme): `initScript` in `<head>` prevents flash, `ThemeToggle.astro` in header
- **Compass** (nav): `getNeighbors()` at build time for prev/next links

## Known Issues

- Test worker has an exports/CJS plumbing issue — user code execution doesn't work yet. Needs simplification.
