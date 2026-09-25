// Behaviour tests for saving and publishing Portal+ configuration through the
// real admin resolver, and for what customers then get from the portal.
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
mock.module('@forge/api', {
  defaultExport: { asApp: () => ({ requestJira: (path, options) => jira.requestJira(path, options) }) },
  namedExports: { route }
});
mock.module('@forge/kvs', {
  namedExports: { kvs: { get: async (key) => store.get(key) ?? null, set: async (key, value) => { store.set(key, structuredClone(value)); }, delete: async (key) => { store.delete(key); } } }
});

const { handler: admin } = await import('../src/admin-resolver.js');
const { handler: portal } = await import('../src/portal-resolver.js');

const context = { extension: { project: { id: PROJECT, key: 'SD' } }, environmentType: 'DEVELOPMENT' };
const callAdmin = (functionKey, payload = {}) => admin({ call: { functionKey, payload }, context }, { principal: { accountId: 'admin' } });
const portalContext = (extension) => ({ extension, environmentType: 'DEVELOPMENT' });
const callPortalOn = (extension, functionKey, accountId, payload = {}) => portal({ call: { functionKey, payload }, context: portalContext(extension) }, { principal: { accountId } });
// As in Jira: the portal header gets portal.id (service desk 35 -> PROJECT), not a project.
const callPortal = (functionKey, accountId, payload = {}) => callPortalOn({ page: 'portal', portal: { id: 35 } }, functionKey, accountId, payload);

const schema = (type, custom = '') => ({ type, ...(custom ? { custom } : {}) });

beforeEach(() => {
  store.clear();
  jira = createFakeJira({
    issues: [{ key: 'SD-1', projectId: PROJECT, reporter: 'alice', orgIds: [], created: '2026-09-01T10:00:00.000+0000', statusId: '1', statusName: 'Open', summary: 'Laptop' }],
    discovery: {
      serviceDesk: { id: '1', projectId: PROJECT, projectKey: 'SD', projectName: 'Service Desk' },
      requestTypes: [{ id: '10', name: 'Get help' }],
      fieldsByRequestType: { 10: [
        { fieldId: 'customfield_ref', name: 'Reference', visible: true, jiraSchema: schema('string') },
        { fieldId: 'customfield_owner', name: 'Owner', visible: true, jiraSchema: schema('user', 'com.atlassian.jira.plugin.system.customfieldtypes:userpicker') },
        { fieldId: 'customfield_notes', name: 'Notes', visible: true, jiraSchema: schema('string', 'com.atlassian.jira.plugin.system.customfieldtypes:textarea') }
      ] },
      statuses: [{ id: '1', name: 'Open' }, { id: '6', name: 'Closed' }, { id: '7', name: 'Escalated' }]
    },
    fieldDefinitions: [
      { id: 'customfield_300', name: 'Customer', custom: true, schema: { type: 'option' } },
      { id: 'customfield_301', name: 'Regions', custom: true, schema: { type: 'array', items: 'option' } },
      { id: 'customfield_302', name: 'Free text', custom: true, schema: { type: 'string' } },
      { id: 'summary', name: 'Summary', custom: false, schema: { type: 'string' } }
    ]
  });
});

function experience(selfService) {
  return { id: 'default', name: 'Default', displayName: 'Support', audienceOrganizationIds: [], selfService };
}

const columns = (n) => Array.from({ length: n }, (_, i) => ({ id: `customfield_${i}`, name: `Column ${i}` }));

test('self-service settings survive publishing and reach customers', async () => {
  await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [experience({
    fields: [{ id: 'customfield_ref', name: 'Reference', mode: 'editable', editableAfterSubmission: true, showInList: true }],
    sla: { enabled: true },
    reporting: { enabled: true },
    customerActions: { closeRequest: true, closeStatusIds: ['6'], escalate: true, escalateStatusIds: ['7'] }
  })] });
  const dashboard = await callPortal('getDashboard', 'alice');
  assert.equal(dashboard.selfService.sla.enabled, true);
  assert.equal(dashboard.selfService.reporting.enabled, true);
  assert.equal(dashboard.selfService.customerActions.closeRequest, true);
  assert.deepEqual(dashboard.selfService.fields.map((f) => [f.id, f.mode, f.type]), [['customfield_ref', 'editable', 'string']]);
});

test('after publishing, the Help Center page shows the published experience', async () => {
  await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [experience({})] });
  const dashboard = await callPortalOn({ page: 'help_center' }, 'getDashboard', 'alice');
  assert.equal(dashboard.audienceAllowed, true);
  assert.equal(dashboard.experience.displayName, 'Support');
});

test('search panel wording survives publishing and reaches customers', async () => {
  await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [{ ...experience({}), branding: { brandName: 'Nuvriqo Support', searchTitle: 'Find anything', searchText: 'Search requests or pick a service.' } }] });
  const { branding } = (await callPortal('getDashboard', 'alice')).experience;
  assert.equal(branding.brandName, 'Nuvriqo Support');
  assert.equal(branding.searchTitle, 'Find anything');
  assert.equal(branding.searchText, 'Search requests or pick a service.');
});

test('customer profiles keep help centers and a dropdown request scope', async () => {
  const saved = await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [{ ...experience({}), helpCenters: ['Ryanair', '/helpcenter/Ryanair-Ops'], requestScope: { fieldId: 'customfield_300', values: 'Ryanair, Ryanair Ops' } }] });
  const [e] = saved.experiences;
  assert.deepEqual(e.helpCenters, ['ryanair', 'ryanair-ops']);
  assert.deepEqual(e.requestScope, { fieldId: 'customfield_300', fieldName: 'Customer', values: ['Ryanair', 'Ryanair Ops'] });
  assert.equal(store.get('portalplus:helpcenter:ryanair').projectId, PROJECT, 'publishing pre-warms the help center lookup');
});

test('request scope can only use a dropdown field that exists', async () => {
  const saved = await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [
    { ...experience({}), name: 'A', requestScope: { fieldId: 'customfield_302', values: ['x'] } },
    { ...experience({}), name: 'B', audienceOrganizationIds: ['100'], requestScope: { fieldId: 'customfield_999', values: ['x'] } }
  ] });
  assert.deepEqual(saved.experiences.map((e) => e.requestScope), [null, null]);
});

test('a help center cannot belong to two experiences', async () => {
  await assert.rejects(callAdmin('publishConfig', { serviceDeskId: '1', experiences: [
    { ...experience({}), name: 'A', helpCenters: ['ryanair'] },
    { ...experience({}), name: 'B', audienceOrganizationIds: ['100'], helpCenters: ['Ryanair'] }
  ] }), /used by both A and B/);
});

test('discovery lists dropdown fields that can narrow requests', async () => {
  const discovery = await callAdmin('getDiscovery');
  assert.deepEqual(discovery.scopeFields, [{ id: 'customfield_300', name: 'Customer' }, { id: 'customfield_301', name: 'Regions' }]);
});

test('drafts keep self-service settings too', async () => {
  await callAdmin('saveDraft', { serviceDeskId: '1', experiences: [experience({ sla: { enabled: true } })] });
  const discovery = await callAdmin('getDiscovery');
  assert.equal(discovery.hasDraft, true);
  assert.equal(discovery.config.experiences[0].selfService.sla.enabled, true);
});

test('fields that customers cannot already see on the portal are dropped on publish', async () => {
  const saved = await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [experience({
    fields: [{ id: 'customfield_ref', name: 'Reference' }, { id: 'customfield_internal_cost', name: 'Internal cost' }]
  })] });
  assert.deepEqual(saved.experiences[0].selfService.fields.map((f) => f.id), ['customfield_ref']);
});

test('unsupported field types are forced read-only and types come from Jira, not the browser', async () => {
  const saved = await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [experience({
    fields: [
      { id: 'customfield_owner', name: 'Owner', mode: 'editable', editableAfterSubmission: true },
      { id: 'customfield_ref', name: 'Reference', type: 'number', mode: 'editable', editableAfterSubmission: true }
    ]
  })] });
  const [owner, ref] = saved.experiences[0].selfService.fields;
  assert.equal(owner.mode, 'read-only');
  assert.equal(owner.editableAfterSubmission, false);
  assert.equal(ref.type, 'string');
});

test('customer actions can only target statuses that exist in the project', async () => {
  const saved = await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [experience({
    customerActions: { closeRequest: true, closeStatusIds: ['6', '999'], escalate: true, escalateStatusIds: ['404'] }
  })] });
  const actions = saved.experiences[0].selfService.customerActions;
  assert.deepEqual(actions.closeStatusIds, ['6']);
  assert.equal(actions.closeRequest, true);
  assert.deepEqual(actions.escalateStatusIds, []);
  assert.equal(actions.escalate, false);
});

test('up to eight My Requests columns are kept', async () => {
  const saved = await callAdmin('publishConfig', { serviceDeskId: '1', experiences: [{ ...experience({}), requestColumns: columns(10) }] });
  assert.equal(saved.experiences[0].requestColumns.length, 8);
  const discovery = await callAdmin('getDiscovery');
  assert.equal(discovery.maxCustomColumns, 8);
});

test('discovery tells the admin UI which fields customers may edit', async () => {
  const discovery = await callAdmin('getDiscovery');
  const byId = Object.fromEntries(discovery.selfServiceFieldCatalogue.map((f) => [f.id, f.editableSupported]));
  assert.deepEqual(byId, { customfield_notes: true, customfield_owner: false, customfield_ref: true });
});
