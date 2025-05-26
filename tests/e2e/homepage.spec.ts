import { test, expect } from '@playwright/test';

test.describe('NeonHub Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check if the page loads
    await expect(page).toHaveTitle(/NeonHub/);

    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();

    // Check for main content
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Test navigation links (adjust selectors based on actual implementation)
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();

    expect(linkCount).toBeGreaterThan(0);

    // Test that links are clickable
    if (linkCount > 0) {
      const firstLink = navLinks.first();
      await expect(firstLink).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that there are no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
