# leetdeeper.com

Interactive coding challenges focused on async patterns, concurrency primitives, and the building blocks of real systems. Re-implement the tools you rely on.

## Stack

- **Framework:** Astro 5 + React 19
- **Editor:** Monaco (self-hosted)
- **Styling:** CSS custom properties
- **Testing:** Playwright E2E + custom browser test harness
- **Theme:** sailkit/lantern

## Development

```bash
npm install
npm run dev        # Dev server
npm run build      # Static build
npm run preview    # Preview build
npm test           # Playwright E2E tests
```

## Architecture

Challenges live in `src/challenges/<slug>/` with `starter.ts` and `tests.ts`. User code runs in a web worker using a custom test harness (`src/lib/test-harness.ts`). See `ARCHITECTURE.md` for details.
