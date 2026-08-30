const { test, expect } = require('@playwright/test');

const fatalError = /Something went wrong|Failed to load|Log in to continue|Internal server error/i;

function baseUrl() {
  const base = process.env.JIRA_BASE_URL;
  expect(base).toBeTruthy();
  return base.replace(/\/$/, '');
}

async function expectHealthyPage(page) {
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(fatalError);
}

test('portal directory loads for authenticated customer session', async ({ page }) => {
  await page.goto(`${baseUrl()}/servicedesk/customer/portals`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/servicedesk\/customer\/portals/);
  await expectHealthyPage(page);
});

test('portal directory exposes at least one customer portal journey', async ({ page }) => {
  await page.goto(`${baseUrl()}/servicedesk/customer/portals`, { waitUntil: 'domcontentloaded' });
  await expectHealthyPage(page);
  const portalLinks = page.locator('a[href*="/servicedesk/customer/portal/"]');
  await expect(portalLinks.first()).toBeVisible({ timeout: 20000 });
  expect(await portalLinks.count()).toBeGreaterThan(0);
});

test('customer can enter a portal without losing authentication', async ({ page }) => {
  await page.goto(`${baseUrl()}/servicedesk/customer/portals`, { waitUntil: 'domcontentloaded' });
  await expectHealthyPage(page);
  const portalLink = page.locator('a[href*="/servicedesk/customer/portal/"]').first();
  await expect(portalLink).toBeVisible({ timeout: 20000 });
  await portalLink.click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/servicedesk\/customer\/portal\//);
  await expectHealthyPage(page);
});

test('customer request list is reachable without losing authentication', async ({ page }) => {
  await page.goto(`${baseUrl()}/servicedesk/customer/requests`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/servicedesk\/customer\/requests/);
  await expectHealthyPage(page);
});

test('request list exposes usable interactive controls', async ({ page }) => {
  await page.goto(`${baseUrl()}/servicedesk/customer/requests`, { waitUntil: 'domcontentloaded' });
  await expectHealthyPage(page);
  const controls = page.locator('input, select, button, [role="combobox"]');
  expect(await controls.count()).toBeGreaterThan(0);
});

test('portal surface remains healthy at mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl()}/servicedesk/customer/portals`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/servicedesk\/customer/);
  await expectHealthyPage(page);
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 2);
});

test('portal pages do not expose obvious application error banners', async ({ page }) => {
  for (const path of ['/servicedesk/customer/portals', '/servicedesk/customer/requests']) {
    await page.goto(`${baseUrl()}${path}`, { waitUntil: 'domcontentloaded' });
    await expectHealthyPage(page);
  }
});
