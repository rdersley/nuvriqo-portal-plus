// Several JSM help centers linked to ONE service project, separated by
// organisations and a "Customer" dropdown field (narrowing only).
// Requires: node --experimental-test-module-mocks
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mock, test, beforeEach } from 'node:test';
import { createFakeJira, route } from './helpers/fake-jira.mjs';

const PROJECT = '10000';
let jira;
const store = new Map();
const { default: Resolver } = createRequire(import.meta.url)('@forge/resolver');
mock.module('@forge/resolver', { defaultExport: Resolver });
mock.module('@forge/api', { defaultExport: { asApp: () => ({ requestJira: (p, o) => jira.requestJira(p, o) }) }, namedExports: { route } });
mock.module('@forge/kvs', { namedExports: { kvs: { get: async (k) => store.get(k) ?? null, set: async (k, v) => { store.set(k, v); }, delete: async (k) => { store.delete(k); } } } });
const { handler } = await import('../src/portal-resolver.js');
const { helpCenterSlug, normalizeHelpCenters } = await import('../src/help-center.js');

const CUSTOMER = 'customfield_300';
const onHelpCenter = (slug, portalId) => ({ page: portalId ? 'portal' : 'help_center', location: `https://site.atlassian.net/helpcenter/${slug}${portalId ? `/portal/${portalId}` : ''}`, ...(portalId ? { portal: { id: portalId } } : {}) });
const call = (extension, functionKey, accountId, payload = {}) =>
  handler({ call: { functionKey, payload }, context: { extension, environmentType: 'DEVELOPMENT' } }, { principal: { accountId } });
const issue = (key, reporter, orgIds, customer) => ({ key, projectId: PROJECT, reporter, orgIds, created: '2026-09-01T10:00:00.000+0000', statusId: '1', statusName: 'Open', summary: key, fields: { [CUSTOMER]: { value: customer } } });
const keys = (result) => (result.requests?.values || []).map((r) => r.issueKey).sort();

beforeEach(() => {
  store.clear();
  store.set('portalplus:projects', { [PROJECT]: '2026-09-25T10:00:00.000Z' });
  store.set(`portalplus:config:${PROJECT}`, { version: 12, serviceDeskId: '35', experiences: [
    { id: 'ryr', name: 'Ryanair', displayName: 'Ryanair Support', audienceOrganizationIds: ['100'], helpCenters: ['Ryanair'], requestScope: { fieldId: CUSTOMER, values: ['Ryanair'] }, categories: [], statusMapping: {} },
    { id: 'jet', name: 'Jet2', displayName: 'Jet2 Support', audienceOrganizationIds: ['200'], helpCenters: ['jet2'], requestScope: { fieldId: CUSTOMER, values: ['Jet2'] }, categories: [], statusMapping: {} },
    { id: 'default', name: 'Default', displayName: 'Support', audienceOrganizationIds: [], categories: [], statusMapping: {} }
  ] });
  jira = createFakeJira({
    organizations: [{ id: '100', name: 'Ryanair' }, { id: '200', name: 'Jet2' }],
    memberships: { rya: ['100'], jet: ['200'] },
    issues: [
      issue('SD-1', 'rya', ['100'], 'Ryanair'),
      issue('SD-2', 'rya', [], 'Jet2'), // mis-tagged by the reporter's colleague
      issue('SD-3', 'jet', ['200'], 'Jet2'),
      issue('SD-4', 'other', ['100'], 'Ryanair'), // shared with the Ryanair organisation
      issue('SD-5', 'other', [], 'Ryanair') // tagged Ryanair but NOT shared: must stay hidden (narrow only)
    ]
  });
});

test('help center slugs are read from the page address and admin input', () => {
  assert.equal(helpCenterSlug('https://x.atlassian.net/helpcenter/Ryanair/portal/35'), 'ryanair');
  assert.equal(helpCenterSlug('https://x.atlassian.net/servicedesk/customer/portal/35'), '');
  assert.deepEqual(normalizeHelpCenters('Ryanair, /helpcenter/Jet2, https://x.atlassian.net/helpcenter/Bordshop, bad slug!'), ['ryanair', 'jet2', 'bordshop']);
});

test('a Ryanair customer on the Ryanair help center gets Ryanair branding and only Ryanair requests', async () => {
  const result = await call(onHelpCenter('Ryanair', 35), 'getDashboard', 'rya');
  assert.equal(result.experience.displayName, 'Ryanair Support');
  assert.deepEqual(keys(result), ['SD-1', 'SD-4'], 'mis-tagged SD-2 is narrowed out; unshared SD-5 is never widened in');
});

test('a Jet2 customer on the Ryanair help center sees nothing of Ryanair', async () => {
  const result = await call(onHelpCenter('Ryanair', 35), 'getDashboard', 'jet');
  assert.equal(result.audienceAllowed, false);
  assert.equal(result.experience, null);
  assert.deepEqual(keys(result), []);
  await assert.rejects(call(onHelpCenter('Ryanair', 35), 'getRequestDetail', 'jet', { issueKey: 'SD-3' }), /not enabled for this customer audience/);
  await assert.rejects(call(onHelpCenter('Ryanair', 35), 'getExportRequests', 'jet'), /not enabled for this customer audience/);
});

test('a Jet2 customer on the Jet2 help center gets Jet2 content only', async () => {
  const result = await call(onHelpCenter('Jet2', 35), 'getDashboard', 'jet');
  assert.equal(result.experience.displayName, 'Jet2 Support');
  assert.deepEqual(keys(result), ['SD-3']);
});

test('help center home pages (no portal ID) find the shared project', async () => {
  const result = await call(onHelpCenter('ryanair'), 'getDashboard', 'rya');
  assert.equal(result.experience.displayName, 'Ryanair Support');
  assert.deepEqual(keys(result), ['SD-1', 'SD-4']);
});

test('request detail and export respect the custom-field narrowing', async () => {
  await assert.rejects(call(onHelpCenter('Ryanair', 35), 'getRequestDetail', 'rya', { issueKey: 'SD-2' }), /not available/);
  await assert.rejects(call(onHelpCenter('Ryanair', 35), 'getRequestDetail', 'rya', { issueKey: 'SD-5' }), /not available/);
  assert.equal((await call(onHelpCenter('Ryanair', 35), 'getRequestDetail', 'rya', { issueKey: 'SD-4' })).key, 'SD-4');
  const exported = await call(onHelpCenter('Ryanair', 35), 'getExportRequests', 'rya');
  assert.deepEqual(exported.values.map((r) => r.issueKey).sort(), ['SD-1', 'SD-4']);
});

test('the default help center routes by organisation and keeps the narrowing', async () => {
  const result = await call({ page: 'portal', portal: { id: 35 }, location: 'https://site.atlassian.net/servicedesk/customer/portal/35' }, 'getDashboard', 'rya');
  assert.equal(result.experience.displayName, 'Ryanair Support');
  assert.deepEqual(keys(result), ['SD-1', 'SD-4']);
});

test('each client only receives its own guides', async () => {
  const config = store.get(`portalplus:config:${PROJECT}`);
  config.experiences[0].documents = [{ id: 'f1', name: 'Ryanair guides', items: [{ id: 'd1', title: 'Ryanair crew app', url: '/servicedesk/customer/portal/35/article/1' }] }];
  config.experiences[1].documents = [{ id: 'f2', name: 'Jet2 guides', items: [{ id: 'd2', title: 'Jet2 tablet setup', url: '/servicedesk/customer/portal/35/article/2' }] }];
  const titles = (result) => (result.experience?.documents || []).flatMap((f) => f.items.map((i) => i.title));
  assert.deepEqual(titles(await call(onHelpCenter('Ryanair', 35), 'getDashboard', 'rya')), ['Ryanair crew app']);
  assert.deepEqual(titles(await call(onHelpCenter('Jet2', 35), 'getDashboard', 'jet')), ['Jet2 tablet setup']);
  assert.deepEqual(titles(await call(onHelpCenter('Ryanair', 35), 'getDashboard', 'jet')), [], 'Jet2 user on Ryanair help center gets no guides');
});

test('scope values are escaped in the search', async () => {
  const config = store.get(`portalplus:config:${PROJECT}`);
  config.experiences[0].requestScope.values = ['Ryanair") OR project = 1 OR cf[300] in ("x'];
  const result = await call(onHelpCenter('Ryanair', 35), 'getDashboard', 'rya');
  assert.deepEqual(keys(result), [], 'the odd value is matched literally, not executed');
});
