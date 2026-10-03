import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMenuEntries, normalizeMenuEntry, safeSitePath, MAX_MENU_ENTRIES } from '../src/companion-menu.js';

const key = (id) => `nuvriqo.portalplus.menu.${id}`;

test('a Smart Approval entry maps to the built-in Approvals section', () => {
  const entry = normalizeMenuEntry(key('smart-approval'), { version: 1, provider: 'nuvriqo-smart-approval-manager', label: 'Approvals', description: 'Approvals waiting for you.', section: 'smart-approval', order: 20 });
  assert.deepEqual(entry, { id: 'smart-approval', provider: 'nuvriqo-smart-approval-manager', label: 'Approvals', description: 'Approvals waiting for you.', section: 'smart-approval', links: [], order: 20 });
});

test('unknown sections become a card, and text is trimmed to its limits', () => {
  const entry = normalizeMenuEntry(key('excel-reports'), { label: 'Excel reports with a very long tab label', description: 'x'.repeat(500), section: 'something-else' });
  assert.equal(entry.section, 'card');
  assert.equal(entry.label.length, 24);
  assert.equal(entry.description.length, 200);
  assert.equal(entry.order, 100);
});

test('links must be same-site paths', () => {
  assert.equal(safeSitePath('/servicedesk/customer/portal/2'), '/servicedesk/customer/portal/2');
  for (const bad of ['https://evil.example', '//evil.example/x', 'javascript:alert(1)', '/\\evil', '/a b', '', null]) assert.equal(safeSitePath(bad), '', String(bad));
  const entry = normalizeMenuEntry(key('x'), { label: 'X', links: [{ label: 'Good', url: '/ok' }, { label: 'Bad', url: 'https://evil.example' }, { label: '', url: '/no-label' }] });
  assert.deepEqual(entry.links, [{ label: 'Good', url: '/ok' }]);
});

test('ignores disabled, unlabelled, wrong-version, wrongly keyed and malformed entries', () => {
  assert.equal(normalizeMenuEntry(key('a'), { label: 'A', enabled: false }), null);
  assert.equal(normalizeMenuEntry(key('a'), { label: '  ' }), null);
  assert.equal(normalizeMenuEntry(key('a'), { label: 'A', version: 2 }), null);
  assert.equal(normalizeMenuEntry('other.property', { label: 'A' }), null);
  assert.equal(normalizeMenuEntry(key('Bad Id!'), { label: 'A' }), null);
  assert.equal(normalizeMenuEntry(key('a'), 'not an object'), null);
  assert.equal(normalizeMenuEntry(key('a'), ['array']), null);
});

test('entries are de-duplicated, ordered and capped', () => {
  const props = Array.from({ length: 10 }, (_, i) => ({ key: key(`app-${i}`), value: { label: `App ${i}`, order: 10 - i } }));
  props.push({ key: key('app-0'), value: { label: 'Duplicate', order: 0 } });
  const entries = normalizeMenuEntries(props);
  assert.equal(entries.length, MAX_MENU_ENTRIES);
  assert.equal(entries[0].label, 'App 9');
  assert.equal(new Set(entries.map((e) => e.id)).size, entries.length);
});

import { customMenuEntries, normalizeCustomTabs, safeTabUrl } from '../src/companion-menu.js';

test('admin tabs allow https and same-site links, nothing else', () => {
  assert.equal(safeTabUrl('https://example.com/reports'), 'https://example.com/reports');
  assert.equal(safeTabUrl('/servicedesk/customer/portal/2'), '/servicedesk/customer/portal/2');
  for (const bad of ['http://example.com', 'javascript:alert(1)', '//evil.example', 'https://', 'https://a b']) assert.equal(safeTabUrl(bad), '', bad);
});

test('admin tabs become cards after the announced tabs, capped at four', () => {
  const tabs = Array.from({ length: 6 }, (_, i) => ({ label: `Tab ${i}`, description: 'd', links: [{ label: 'Open', url: 'https://example.com' }] }));
  tabs.push({ label: '', description: 'no label is dropped' });
  const entries = customMenuEntries(tabs);
  assert.equal(entries.length, 4);
  assert.deepEqual(entries[0], { id: 'custom-1', provider: 'portal-plus-admin', section: 'card', order: 200, label: 'Tab 0', description: 'd', links: [{ label: 'Open', url: 'https://example.com' }] });
  assert.equal(normalizeCustomTabs([{ label: 'X', links: [{ label: 'Bad', url: 'ftp://x' }] }])[0].links.length, 0);
});
