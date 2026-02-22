import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const challengesDir = path.join(__dirname, '..', 'src', 'challenges');

// Discover all challenges with solutions.json
const challengeSlugs = fs.readdirSync(challengesDir).filter((slug) => {
  return fs.existsSync(path.join(challengesDir, slug, 'solutions.json'));
});

for (const slug of challengeSlugs) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(challengesDir, slug, 'solutions.json'), 'utf-8'),
  );

  for (const entry of manifest) {
    const code = fs.readFileSync(
      path.join(challengesDir, slug, 'solutions', `${entry.key}.ts`),
      'utf-8',
    );

    test(`${slug} — ${entry.label} passes all tests`, async ({ page }) => {
      await page.goto(`/challenge/${slug}/`);
      await page.waitForFunction(() => (window as any).__leetdeeperEditor);

      // Set solution code
      await page.evaluate((c) => (window as any).__leetdeeperEditor.setValue(c), code);

      // Click "Run Tests" and wait for completion
      await page.click('button:has-text("Run Tests")');
      await expect(page.locator('button:has-text("Running")')).toBeVisible();
      await expect(page.locator('button:has-text("Run Tests")')).toBeVisible();

      // Assert all tests pass
      await expect(page.getByText('All tests passed!')).toBeVisible();
    });
  }
}
