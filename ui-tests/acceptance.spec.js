const { test, expect } = require('@playwright/test');

const fatalError = /Something went wrong|Failed to load|Log in to continue|Internal server error/i;

function baseUrl() {
  const base = process.env.JIRA_BASE_URL;
  expect(base).toBeTruthy();
  return base.replace(/\/$/, '');
}

async function expectHealthyPage(page) {
  await expect(page.locator('body')).not.toContainText(fatalError);
  await expect(page.locator('body')).toBeVisible();
}

test('portal directory loads for authenticated customer session', async ({ page }) => {
  await page.goto(`${baseUrl()}/servicedesk/customer/portals`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/servicedesk\/customer\/portals/);
  await expectHealthyPage(page);
});

test('customer request list is reachable without losing authentication', async ({ page }) => {
  await page.goto(`${baseUrl()}/servicedesk/customer/requests`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/servicedesk\/customer\/requests/);
  await expectHealthyPage(page);
});

test('portal surface remains healthy at mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl()}/servicedesk/customer/portals`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/servicedesk\/customer/);
  await expectHealthyPage(page);
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});

test('portal pages do not expose obvious application error banners', async ({ page }) => {
  for (const path of ['/servicedesk/customer/portals', '/servicedesk/customer/requests']) {
    await page.goto(`${baseUrl()}${path}`, { waitUntil: 'domcontentloaded' });
    await expectHealthyPage(page);
    await expect(page.locator('[role="alert"]')).not.toContainText(fatalError);
  }
});
