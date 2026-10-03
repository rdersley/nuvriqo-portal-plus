const { test, expect } = require('@playwright/test');

test('deployed JSM portal surface loads', async ({ page }) => {
  const base = process.env.JIRA_BASE_URL;
  expect(base).toBeTruthy();
  await page.goto(`${base}/servicedesk/customer/portals`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/servicedesk\/customer/);
  await expect(page.locator('body')).not.toContainText(/Something went wrong|Failed to load|Log in to continue/i);
});
