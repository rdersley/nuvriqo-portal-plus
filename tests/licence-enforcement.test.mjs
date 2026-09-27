// Every Portal+ resolver that reads or writes data must refuse to run on an
// unlicensed production site: no Jira calls, no storage writes, and a stable
// "unavailable" payload for the UI. Runs the real admin and portal handlers.
// Requires: node --experimental-test-module-mocks
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { mock, test, beforeEach, afterEach } from 'node:test';
import { createFakeJira, route } from './helpers/fake-jira.mjs';

const PROJECT = '10000';
const EVALUATION_SITE = 'df226a9a-6172-4d25-aa76-b507064701b1';
let jira;
const store = new Map();
let kvsWrites = 0;
const { default: Resolver } = createRequire(import.meta.url)('@forge/resolver');
mock.module('@forge/resolver', { defaultExport: Resolver });
mock.module('@forge/api', {
  defaultExport: { asApp: () => ({ requestJira: (path, options) => jira.requestJira(path, options) }) },
  namedExports: { route }
});
mock.module('@forge/kvs', {
  namedExports: { kvs: {
    get: async (key) => store.get(key) ?? null,
    set: async (key, value) => { kvsWrites++; store.set(key, structuredClone(value)); },
    delete: async (key) => { kvsWrites++; store.delete(key); }
  } }
});

const { handler: admin } = await import('../src/admin-resolver.js');
const { handler: portal } = await import('../src/portal-resolver.js');
const { UNLICENSED_MESSAGES } = await import('../src/licensing.js');

const experience = { id: 'default', name: 'Default', displayName: 'Support', audienceOrganizationIds: [], selfService: { customerActions: { closeRequest: true, closeStatusIds: ['6'] } } };
const config = { version: 12, serviceDeskId: '1', experiences: [experience] };

// Every data resolver and a payload that would succeed when licensed.
const ADMIN_RESOLVERS = {
  getDiscovery: {},
  saveDraft: { serviceDeskId: '1', experiences: [experience] },
  publishConfig: { serviceDeskId: '1', experiences: [experience] },
  saveConfig: { serviceDeskId: '1', experiences: [experience] },
  discardDraft: {},
  simulateAudience: { organizationIds: ['100'] }
};
const PORTAL_RESOLVERS = {
  getDashboard: {},
  getClientContract: {},
  getMobileBootstrap: {},
  getExportRequests: {},
  getRequestDetail: { issueKey: 'SD-1' },
  updateRequestFields: { issueKey: 'SD-1', fields: { customfield_text: 'x' } },
  performRequestAction: { issueKey: 'SD-1', action: 'close' }
};

const UNLICENSED_CONTEXTS = {
  'an inactive Marketplace licence': { environmentType: 'PRODUCTION', cloudId: 'aaaaaaaa-0000-0000-0000-000000000000', license: { active: false } },
  'an inactive licence on an evaluation site (never overridden)': { environmentType: 'PRODUCTION', cloudId: EVALUATION_SITE, license: { active: false } },
  'no licence and a site that is not on the evaluation list': { environmentType: 'PRODUCTION', cloudId: 'bbbbbbbb-0000-0000-0000-000000000000' }
};

// As in Forge, the Marketplace licence arrives in the runtime payload (the
// resolver copies it onto context.license); cloudId and environmentType come
// from the invocation context.
const split = ({ license, ...context }) => ({ context, runtime: license === undefined ? {} : { license } });
const callAdmin = (functionKey, payload, ctx) => {
  const { context, runtime } = split(ctx);
  return admin({ call: { functionKey, payload }, context: { extension: { project: { id: PROJECT, key: 'SD' } }, ...context } }, { principal: { accountId: 'admin' }, ...runtime });
};
const callPortal = (functionKey, payload, ctx) => {
  const { context, runtime } = split(ctx);
  return portal({ call: { functionKey, payload }, context: { extension: { page: 'portal', portal: { id: 35 } }, ...context } }, { principal: { accountId: 'alice' }, ...runtime });
};

let savedEnv;
beforeEach(() => {
  savedEnv = process.env.PORTALPLUS_EVALUATION_CLOUD_IDS;
  process.env.PORTALPLUS_EVALUATION_CLOUD_IDS = EVALUATION_SITE;
  store.clear();
  store.set(`portalplus:config:${PROJECT}`, structuredClone(config));
  store.set(`portalplus:draft:${PROJECT}`, structuredClone(config));
  kvsWrites = 0;
  jira = createFakeJira({
    issues: [{ key: 'SD-1', projectId: PROJECT, reporter: 'alice', orgIds: [], created: '2026-09-01T10:00:00.000+0000', statusId: '1', statusName: 'Open', summary: 'Laptop' }],
    discovery: {
      serviceDesk: { id: '1', projectId: PROJECT, projectKey: 'SD', projectName: 'Service Desk' },
      requestTypes: [{ id: '10', name: 'Get help' }],
      fieldsByRequestType: { 10: [] },
      statuses: [{ id: '1', name: 'Open' }, { id: '6', name: 'Closed' }]
    },
    transitions: { 'SD-1': [{ id: '31', name: 'Close', to: { id: '6', name: 'Closed' } }] }
  });
});
afterEach(() => {
  if (savedEnv === undefined) delete process.env.PORTALPLUS_EVALUATION_CLOUD_IDS;
  else process.env.PORTALPLUS_EVALUATION_CLOUD_IDS = savedEnv;
});

for (const [label, context] of Object.entries(UNLICENSED_CONTEXTS)) {
  for (const [name, payload] of Object.entries(ADMIN_RESOLVERS)) {
    test(`admin ${name} is unavailable with ${label}`, async () => {
      const result = await callAdmin(name, payload, context);
      assert.equal(result.unlicensed, true);
      assert.equal(result.licensing.active, false);
      assert.equal(result.message, UNLICENSED_MESSAGES.admin);
      assert.equal(jira.calls.length, 0, 'no Jira calls');
      assert.equal(kvsWrites, 0, 'no storage writes');
      assert.equal(result.experiences, undefined);
    });
  }
  for (const [name, payload] of Object.entries(PORTAL_RESOLVERS)) {
    test(`portal ${name} is unavailable with ${label}`, async () => {
      const result = await callPortal(name, payload, context);
      assert.deepEqual(Object.keys(result).sort(), ['audienceAllowed', 'licensing', 'message', 'unlicensed']);
      assert.equal(result.unlicensed, true);
      assert.equal(result.audienceAllowed, false);
      assert.equal(result.message, UNLICENSED_MESSAGES.customer);
      assert.equal(jira.calls.length, 0, 'no Jira calls');
      assert.equal(kvsWrites, 0, 'no storage writes');
    });
  }
}

test('health stays available without a licence and reports the licence state', async () => {
  const context = UNLICENSED_CONTEXTS['an inactive Marketplace licence'];
  assert.equal((await callAdmin('health', {}, context)).licensing.active, false);
  assert.equal((await callPortal('health', {}, context)).licensing.active, false);
  assert.equal(jira.calls.length, 0);
});

test('an active Marketplace licence runs the resolvers', async () => {
  const context = { environmentType: 'PRODUCTION', license: { active: true } };
  const dashboard = await callPortal('getDashboard', {}, context);
  assert.equal(dashboard.unlicensed, undefined);
  assert.equal(dashboard.audienceAllowed, true);
  assert.equal(dashboard.requests.values[0].issueKey, 'SD-1');
  const discovery = await callAdmin('getDiscovery', {}, context);
  assert.equal(discovery.unlicensed, undefined);
  assert.equal(discovery.serviceDesk.id, '1');
});

test('an allow-listed evaluation site without a licence object runs the resolvers', async () => {
  const context = { environmentType: 'PRODUCTION', cloudId: EVALUATION_SITE.toUpperCase() };
  const dashboard = await callPortal('getDashboard', {}, context);
  assert.equal(dashboard.audienceAllowed, true);
  assert.equal(dashboard.licensing.evaluation, true);
  const published = await callAdmin('publishConfig', ADMIN_RESOLVERS.publishConfig, context);
  assert.equal(published.unlicensed, undefined);
  assert.equal(published.experiences.length, 1);
});

test('development and staging stay active without a licence', async () => {
  for (const environmentType of ['DEVELOPMENT', 'STAGING']) {
    const dashboard = await callPortal('getDashboard', {}, { environmentType });
    assert.equal(dashboard.audienceAllowed, true);
  }
});

// Guards against a new resolver being added without the licence guard: in
// both resolver files, health is the only function registered directly.
test('every resolver except health is registered through the licence guard', () => {
  const tested = { 'src/admin-resolver.js': ADMIN_RESOLVERS, 'src/portal-resolver.js': PORTAL_RESOLVERS };
  for (const [file, resolvers] of Object.entries(tested)) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const direct = [...source.matchAll(/resolver\.define\('([^']+)'/g)].map((m) => m[1]);
    const guarded = [...source.matchAll(/\blicensed\('([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(direct, ['health'], `${file} registers only health without the guard`);
    assert.deepEqual(guarded.sort(), Object.keys(resolvers).sort(), `${file}: every guarded resolver has an unlicensed test`);
  }
});
