# Running Tests

Playwright uses the dev server (`npm run dev`), not a production build. If the dev server is already running, tests reuse it instantly.

**Run all tests:**
```bash
npx playwright test
```

**Run a specific test:**
```bash
npx playwright test --grep "test name"
```

**Start dev server first (if not running):**
```bash
npm run dev &
npx playwright test
```

The config `reuseExistingServer: true` means Playwright skips starting a server if one is already on port 4321.

**Never** use `npm run build && npm run preview` for test iteration — it adds 30s per run.
