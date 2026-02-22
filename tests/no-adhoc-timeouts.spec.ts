/**
 * Lint rule: no ad hoc timeout overrides in test assertions.
 *
 * Timeouts should be configured globally in playwright.config.ts,
 * not scattered across individual assertions. Ad hoc timeouts are
 * a code smell — they mask slow behavior instead of fixing it.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('no ad hoc timeout overrides in test files', () => {
  const testsDir = path.join(import.meta.dirname, '.');
  const testFiles = fs.readdirSync(testsDir)
    .filter(f => f.endsWith('.spec.ts') && f !== 'no-adhoc-timeouts.spec.ts');

  const violations: string[] = [];
  for (const file of testFiles) {
    const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (/timeout:\s*\d/.test(line) && !/playwright\.config/.test(file)) {
        violations.push(`${file}:${i + 1}: ${line.trim()}`);
      }
    });
  }

  expect(violations, `Ad hoc timeouts found. Set timeouts in playwright.config.ts instead:\n${violations.join('\n')}`).toHaveLength(0);
});
