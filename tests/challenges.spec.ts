import { test, expect } from '@playwright/test';

test.describe('Index page', () => {
  test('lists all challenges', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();
    await expect(page.getByText('Two Sum')).toBeVisible();
    await expect(page.getByText('Promise Basics')).toBeVisible();
    await expect(page.getByText('Async Iterators')).toBeVisible();
    await expect(page.getByText('Concurrent Task Runner')).toBeVisible();
  });

  test('shows difficulty badges', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('easy')).toBeVisible();
    await expect(page.getByText('medium')).toBeVisible();
    // Two "hard" badges
    await expect(page.getByText('hard')).toHaveCount(2);
  });

  test('navigates to challenge on click', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Two Sum').click();
    await expect(page).toHaveURL(/\/challenge\/two-sum/);
  });
});

test.describe('Challenge page', () => {
  test('renders challenge content', async ({ page }) => {
    await page.goto('/challenge/two-sum/');
    await expect(page.getByRole('heading', { name: 'Two Sum' })).toBeVisible();
    await expect(page.getByText('All Challenges')).toBeVisible();
  });

  test('Monaco editor loads', async ({ page }) => {
    await page.goto('/challenge/two-sum/');
    await expect(page.getByTestId('editor')).toBeVisible();
    await expect(page.getByText('// TODO: implement', { exact: true })).toBeVisible();
  });

  test('Run Tests button visible', async ({ page }) => {
    await page.goto('/challenge/two-sum/');
    await expect(page.getByRole('button', { name: 'Run Tests' })).toBeVisible();
  });

  test('running tests shows results', async ({ page }) => {
    await page.goto('/challenge/two-sum/');
    await page.getByRole('button', { name: 'Run Tests' }).click();
    await expect(page.getByText(/\d+\/\d+ passed|All tests passed/)).toBeVisible();
  });

  test('editor theme syncs with site theme', async ({ page }) => {
    await page.goto('/challenge/two-sum/');
    await expect(page.getByTestId('editor')).toBeVisible();

    // Toggle to light mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await expect(page.locator('.monaco-editor')).toHaveClass(/vs\b/);

    // Toggle to dark mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect(page.locator('.monaco-editor')).toHaveClass(/vs-dark/);
  });

  test('prev/next navigation', async ({ page }) => {
    await page.goto('/challenge/two-sum/');
    await expect(page.getByText('Next')).toBeVisible();

    await page.goto('/challenge/concurrent-task-runner/');
    await expect(page.getByText('Previous')).toBeVisible();
  });
});

test.describe('localStorage persistence', () => {
  test('completion state shows on index', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('leetdeeper:completed', JSON.stringify(['two-sum']));
    });
    await page.reload();
    // The completed challenge gets a checkmark
    await expect(page.locator('a.completed')).toHaveCount(1);
  });
});

test.describe('Build verification', () => {
  test('all challenge pages return 200', async ({ page }) => {
    for (const slug of ['two-sum', 'promise-basics', 'async-iterators', 'concurrent-task-runner']) {
      const response = await page.goto(`/challenge/${slug}/`);
      expect(response?.status()).toBe(200);
    }
  });
});
