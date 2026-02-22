# leetdeeper.com

Interactive coding challenges where you re-implement the libraries and patterns you use every day — promises, concurrency limiters, retry logic, event emitters, async iterators — so you understand the failure modes they solve.

The best engineering orgs stopped asking you to invert binary trees. They want you to build a worker queue with concurrency limits, implement `Promise.all` from scratch, and demonstrate you understand runtime behavior. Each challenge drops you into a code editor with a problem description and a test suite. No accounts, no setup — just you and the code.

## Stack

- **Framework:** [Astro 5](https://astro.build/) + [React 19](https://react.dev/)
- **Editor:** [Monaco](https://microsoft.github.io/monaco-editor/) (self-hosted, same editor as VS Code)
- **Styling:** CSS custom properties
- **Testing:** [Playwright](https://playwright.dev/) E2E + custom browser test harness + mutation tests
- **Theme:** [sailkit](https://github.com/joshribakoff/sailkit)/lantern (dark/light toggle)
- **Navigation:** [sailkit](https://github.com/joshribakoff/sailkit)/compass (prev/next challenge links)

## Development

```bash
npm install
npm run dev        # Dev server
npm run build      # Static build
npm run preview    # Preview build
npm test           # Playwright E2E tests
```

## Architecture

Challenges live in `src/challenges/<slug>/` with `starter.ts` and `tests.ts`. User code runs in a web worker using a custom test harness (`src/lib/test-harness.ts`) — not Jest or Vitest, since those can't run in a browser worker. See `ARCHITECTURE.md` for details.

## Content

- **Courses:** `src/content/courses/` — ordered challenge lists
- **Descriptions:** `src/content/challenges/` — MDX problem descriptions
- **Code:** `src/challenges/<slug>/` — `starter.ts` + `tests.ts` (real TypeScript, imported as `?raw`)
- **Solutions:** `src/challenges/<slug>/solutions/` — reference implementations with JSON manifests
