# System Tests (Playwright E2E)

**What:** Tests that verify the site itself works — pages load, editor mounts, navigation, localStorage persistence.

**Where:** `tests/challenges.spec.ts`, `tests/no-adhoc-timeouts.spec.ts`

**Run:**
```bash
npx playwright test
```

**Run a specific test:**
```bash
npx playwright test --grep "test name"
```

**Config:** `playwright.config.ts` — uses dev server (`npm run dev`), `reuseExistingServer: true` so it picks up an already-running dev server instantly.

**Rules:**
- No ad hoc `{ timeout: N }` overrides — set timeouts in `playwright.config.ts`
- Use text-based selectors (`getByText`, `getByRole`) not CSS selectors
- Use `data-testid` only where text-based selectors are ambiguous (e.g., Monaco editor)
- The lint test `no-adhoc-timeouts.spec.ts` enforces the timeout rule

**Framework:** `@playwright/test` (runs in Node.js)
