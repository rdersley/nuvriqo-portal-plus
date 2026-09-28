// Live checks that two clients sharing one JSM project stay separated in
// Portal+. Customer A and customer B are real test customer sessions saved
// with `npx playwright codegen --save-storage=...` (see live-tests/README.md).
const fs = require('fs');
const { test, expect } = require('@playwright/test');

const env = (name, fallback = '') => String(process.env[name] || fallback).trim();
const SITE = env('PORTALPLUS_LIVE_SITE', 'https://nuvriqo.atlassian.net').replace(/\/$/, '');
const PORTAL_ID = env('PORTALPLUS_LIVE_PORTAL_ID');
const customer = (key) => ({
  label: `customer ${key}`,
  state: env(`PORTALPLUS_LIVE_${key}_STATE`),
  helpCenter: env(`PORTALPLUS_LIVE_${key}_HELPCENTER`),
  brand: env(`PORTALPLUS_LIVE_${key}_BRAND`)
});
const A = customer('A');
const B = customer('B');
// Without a help center per customer (sites without JSM Premium), both
// customers use the default portal and separation comes from organisations.
const SINGLE = !A.helpCenter || !B.helpCenter;
const configured = [A, B].every((c) => c.state && fs.existsSync(c.state) && c.brand) && (!SINGLE || Boolean(PORTAL_ID)) && A.brand.toLowerCase() !== B.brand.toLowerCase();

test.describe.configure({ mode: 'serial' });
test.skip(!configured, 'Set PORTALPLUS_LIVE_A_/B_ STATE and BRAND (different for each), plus HELPCENTER per customer or PORTALPLUS_LIVE_PORTAL_ID (see live-tests/README.md).');

const helpCenterUrl = (c, withPortal) => (SINGLE
  ? `${SITE}/servicedesk/customer/portal/${PORTAL_ID}`
  : `${SITE}/helpcenter/${encodeURIComponent(c.helpCenter)}${withPortal && PORTAL_ID ? `/portal/${PORTAL_ID}` : ''}`);

// Portal+ renders inside a Forge iframe; find the frame that holds its shell.
async function portalPlusFrame(page, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (await frame.locator('.portal-shell').count().catch(() => 0)) return frame;
    }
    await page.waitForTimeout(500);
  }
  return null;
}

// What a customer can see of Portal+ on a page: whether the shell is shown,
// its brand, the request keys listed and the guide titles.
async function readPortalPlus(page) {
  const frame = await portalPlusFrame(page);
  if (!frame) return { present: false, visible: false, text: '', brand: '', keys: [], guides: [] };
  // Give the dashboard time to load or to hide itself for another client.
  await frame.waitForFunction(() => {
    const shell = document.querySelector('.portal-shell');
    return shell && (getComputedStyle(shell).display === 'none' || document.querySelector('.request, .message.empty'));
  }, null, { timeout: 30000 }).catch(() => {});
  return frame.evaluate(() => {
    const shell = document.querySelector('.portal-shell');
    const visible = Boolean(shell) && getComputedStyle(shell).display !== 'none';
    const text = visible ? document.body.innerText : '';
    return {
      present: true,
      visible,
      text,
      brand: visible ? (document.getElementById('topbar-name')?.textContent || '').trim() : '',
      keys: visible ? [...document.querySelectorAll('.request .key')].map((el) => el.textContent.trim()) : [],
      guides: visible ? [...document.querySelectorAll('#documents .resource-link strong')].map((el) => el.textContent.trim()) : []
    };
  });
}

async function openAs(browser, c, url) {
  const context = await browser.newContext({ storageState: c.state });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toContainText(/Log in to continue|Something went wrong/i, { timeout: 20000 });
  return { context, page, view: await readPortalPlus(page) };
}

const seen = { A: null, B: null };

test('1. customer A on their own help center sees their brand and requests', async ({ browser }, info) => {
  const { context, page, view } = await openAs(browser, A, helpCenterUrl(A, true));
  await page.screenshot({ path: info.outputPath('A-own-help-center.png'), fullPage: true });
  expect(view.present, 'Portal+ is on the page').toBe(true);
  expect(view.visible, 'Portal+ is shown to its own customer').toBe(true);
  expect(view.brand.toLowerCase()).toContain(A.brand.toLowerCase());
  seen.A = view;
  await context.close();
});

test('2. customer B on customer A\'s page sees nothing of A', async ({ browser }, info) => {
  const { context, page, view } = await openAs(browser, B, helpCenterUrl(A, true));
  await page.screenshot({ path: info.outputPath('B-on-A-page.png'), fullPage: true });
  if (SINGLE) {
    // Shared default portal: B gets B's own experience.
    expect(view.visible, 'Portal+ shows B their own experience').toBe(true);
    expect(view.brand.toLowerCase()).toContain(B.brand.toLowerCase());
  } else {
    expect(view.visible, 'Portal+ must stay hidden for another client').toBe(false);
  }
  expect(view.text).not.toContain(A.brand);
  for (const key of seen.A?.keys || []) expect(view.text, `A's request ${key} must not appear`).not.toContain(key);
  for (const title of seen.A?.guides || []) expect(view.text, `A's guide "${title}" must not appear`).not.toContain(title);
  await context.close();
});

test('3. customer B on their own help center sees only their own content', async ({ browser }, info) => {
  const { context, page, view } = await openAs(browser, B, helpCenterUrl(B, true));
  await page.screenshot({ path: info.outputPath('B-own-help-center.png'), fullPage: true });
  expect(view.visible).toBe(true);
  expect(view.brand.toLowerCase()).toContain(B.brand.toLowerCase());
  const overlap = view.keys.filter((key) => (seen.A?.keys || []).includes(key));
  expect(overlap, 'no request appears for both clients').toEqual([]);
  const sharedGuides = view.guides.filter((title) => (seen.A?.guides || []).includes(title));
  expect(sharedGuides, 'no guide appears for both clients').toEqual([]);
  seen.B = view;
  await context.close();
});

test('4. customer A on the default help center keeps their experience', async ({ browser }, info) => {
  test.skip(!PORTAL_ID, 'Set PORTALPLUS_LIVE_PORTAL_ID to check the default help center portal page.');
  test.skip(SINGLE, 'Same page as test 1 when customers share the default help center.');
  const { context, page, view } = await openAs(browser, A, `${SITE}/servicedesk/customer/portal/${PORTAL_ID}`);
  await page.screenshot({ path: info.outputPath('A-default-help-center.png'), fullPage: true });
  expect(view.visible).toBe(true);
  expect(view.brand.toLowerCase()).toContain(A.brand.toLowerCase());
  expect([...view.keys].sort()).toEqual([...(seen.A?.keys || [])].sort());
  await context.close();
});

test('5. customer A on their help center home page (no portal chosen) gets their dashboard', async ({ browser }, info) => {
  test.skip(SINGLE, 'Needs a help center per customer (JSM Premium); covered by the automated help center tests.');
  const { context, page, view } = await openAs(browser, A, helpCenterUrl(A, false));
  await page.screenshot({ path: info.outputPath('A-help-center-home.png'), fullPage: true });
  expect(view.visible).toBe(true);
  expect(view.brand.toLowerCase()).toContain(A.brand.toLowerCase());
  expect(view.keys.filter((key) => (seen.B?.keys || []).includes(key)), 'no client B requests').toEqual([]);
  await context.close();
});

test('6. customer A\'s CSV export holds only their own requests', async ({ browser }, info) => {
  const { context, page } = await openAs(browser, A, helpCenterUrl(A, true));
  const frame = await portalPlusFrame(page);
  expect(frame).not.toBeNull();
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), frame.locator('#exportCsv').click()]);
  const file = info.outputPath('A-export.csv');
  await download.saveAs(file);
  const keys = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).slice(1).map((line) => (line.match(/^"([^"]*)"/) || [])[1]).filter(Boolean);
  expect(keys.length, 'export has rows').toBeGreaterThan(0);
  expect(keys.filter((key) => (seen.B?.keys || []).includes(key)), 'no client B requests in the export').toEqual([]);
  await context.close();
});
