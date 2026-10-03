// Behaviour tests for what customers can see and do through the Portal+
// resolver. Runs the real resolver handler against an in-memory Jira.
// Requires: node --experimental-test-module-mocks
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mock, test, beforeEach } from 'node:test';
import { createFakeJira, parseCustomerJql, route } from './helpers/fake-jira.mjs';

const PROJECT = '10000';
const STATUS = { open: '1', waiting: '2', resolved: '5', closed: '6', escalated: '7', reopened: '8' };

let jira;
const store = new Map();
// Forge's bundler unwraps the CommonJS default export; plain Node does not.
const { default: Resolver } = createRequire(import.meta.url)('@forge/resolver');
mock.module('@forge/resolver', { defaultExport: Resolver });
mock.module('@forge/api', {
  defaultExport: { asApp: () => ({ requestJira: (path, options) => jira.requestJira(path, options) }) },
  namedExports: { route }
});
mock.module('@forge/kvs', {
  namedExports: { kvs: { get: async (key) => store.get(key) ?? null, set: async (key, value) => { store.set(key, value); }, delete: async (key) => { store.delete(key); } } }
});

const { handler } = await import('../src/portal-resolver.js');
const { customerJql, escapeJql } = await import('../src/customer-visibility.js');

// The JSM portal header only receives portal.id (the service desk ID), never a
// project ID; service desk 35 belongs to PROJECT in the fake Jira.
const PORTAL_PAGE = { type: 'jiraServiceManagement:portalHeader', page: 'portal', portal: { id: 35 } };
const HELP_CENTER = { type: 'jiraServiceManagement:portalHeader', page: 'help_center' };
const callOn = (extension, functionKey, accountId, payload = {}) =>
  handler({ call: { functionKey, payload }, context: { extension, environmentType: 'DEVELOPMENT' } }, { principal: { accountId } });
const call = (functionKey, accountId, payload = {}) => callOn(PORTAL_PAGE, functionKey, accountId, payload);

const issue = (key, reporter, { orgIds = [], created = '2026-09-01T10:00:00.000+0000', statusId = STATUS.open, fields = {} } = {}) =>
  ({ key, projectId: PROJECT, reporter, reporterName: `${reporter} name`, orgIds, created, statusId, statusName: 'Open', summary: `${key} summary`, fields });

const transition = (id, name, toId, toName, fields) => ({ id, name, to: { id: toId, name: toName }, ...(fields ? { fields } : {}) });

function experience(selfService = {}) {
  return {
    version: 12,
    serviceDeskId: '1',
    experiences: [{
      id: 'default', name: 'Default', displayName: 'Support', audienceOrganizationIds: [],
      dashboard: { open: true }, statusMapping: { awaitingCustomer: [STATUS.waiting], awaitingSupport: [] },
      categories: [], requestColumns: [], announcements: [], links: [],
      selfService: {
        fields: [
          { id: 'customfield_text', name: 'Reference', type: 'string', mode: 'editable', editableAfterSubmission: true },
          { id: 'customfield_notes', name: 'Notes', type: 'string', custom: 'com.atlassian.jira.plugin.system.customfieldtypes:textarea', mode: 'editable', editableAfterSubmission: true },
          { id: 'customfield_due', name: 'Needed by', type: 'date', mode: 'editable', editableAfterSubmission: true },
          { id: 'customfield_locked', name: 'Internal cost', type: 'number', mode: 'read-only' }
        ],
        customerActions: { closeRequest: true, closeStatusIds: [STATUS.closed], escalate: true, escalateStatusIds: [STATUS.escalated] },
        ...selfService
      }
    }]
  };
}

function seed({ issues, transitions = {}, selfService, editMeta = {}, statusHistory = {}, fieldDefinitions = [] } = {}) {
  store.clear();
  store.set(`portalplus:config:${PROJECT}`, experience(selfService));
  jira = createFakeJira({
    organizations: [{ id: '100', name: 'Acme' }, { id: '200', name: 'Beta "Quoted" Ltd' }],
    memberships: { alice: ['100'], bob: ['200'] },
    issues: issues ?? [
      issue('SD-1', 'alice'),
      issue('SD-2', 'bob'),
      issue('SD-3', 'bob', { orgIds: ['100'] }),
      issue('SD-4', 'carol'),
      issue('SD-5', 'dave', { orgIds: ['200'] })
    ],
    transitions,
    editMeta,
    statusHistory,
    fieldDefinitions
  });
}

const keys = (result) => result.requests.values.map((r) => r.issueKey).sort();

beforeEach(() => seed());

test('customer sees own requests plus requests shared with their organisation only', async () => {
  assert.deepEqual(keys(await call('getDashboard', 'alice')), ['SD-1', 'SD-3']);
  assert.deepEqual(keys(await call('getDashboard', 'bob')), ['SD-2', 'SD-3', 'SD-5']);
});

test('customer without organisations sees only requests they reported', async () => {
  assert.deepEqual(keys(await call('getDashboard', 'carol')), ['SD-4']);
});

test('request detail is refused for a request outside the customer boundary', async () => {
  await assert.rejects(call('getRequestDetail', 'alice', { issueKey: 'SD-2' }), /not available/);
  await assert.rejects(call('getRequestDetail', 'carol', { issueKey: 'SD-3' }), /not available/);
  const detail = await call('getRequestDetail', 'alice', { issueKey: 'SD-3' });
  assert.equal(detail.key, 'SD-3');
});

test('request detail works for an older request beyond the first page of 100', async () => {
  const many = Array.from({ length: 150 }, (_, i) => issue(`SD-${i + 1}`, 'alice', { created: new Date(Date.UTC(2026, 0, 1) + i * 3600000).toISOString() }));
  seed({ issues: many });
  const detail = await call('getRequestDetail', 'alice', { issueKey: 'SD-1' });
  assert.equal(detail.key, 'SD-1');
});

test('malformed or injected request keys are rejected before reaching Jira', async () => {
  await assert.rejects(call('getRequestDetail', 'alice', { issueKey: 'SD-1" OR reporter = "bob' }), /Invalid request key/);
  await assert.rejects(call('performRequestAction', 'alice', { issueKey: '../SD-1', action: 'close' }), /Invalid request key/);
});

test('organisation names with quotes are escaped and cannot widen the search', () => {
  const jql = customerJql('alice', PROJECT, [{ name: 'Acme") OR project = 1 OR ("' }]);
  assert.deepEqual(parseCustomerJql(jql).orgs, ['Acme") OR project = 1 OR ("']);
  assert.equal(escapeJql('a\\"b'), 'a\\\\\\"b');
  assert.throws(() => customerJql('', PROJECT), /signed in/);
});

test('close runs only the transition into the admin-chosen status, never a name match', async () => {
  seed({ transitions: { 'SD-1': [
    transition('11', 'Reopen closed request', STATUS.reopened, 'Reopened'),
    transition('21', 'Resolve', STATUS.resolved, 'Resolved'),
    transition('31', 'Customer close', STATUS.closed, 'Closed')
  ] } });
  const result = await call('performRequestAction', 'alice', { issueKey: 'SD-1', action: 'close' });
  assert.equal(result.transition.id, '31');
  const posted = jira.writes().find((w) => w.path === '/rest/api/3/issue/SD-1/transitions');
  assert.deepEqual(posted.body, { transition: { id: '31' } });
});

test('escalate is refused when only look-alike transitions exist', async () => {
  seed({ transitions: { 'SD-1': [transition('41', 'De-escalate', STATUS.open, 'Open')] } });
  await assert.rejects(call('performRequestAction', 'alice', { issueKey: 'SD-1', action: 'escalate' }), /cannot be escalated/);
  assert.equal(jira.writes().length, 0);
});

test('actions are inert when the admin has not chosen target statuses', async () => {
  seed({ selfService: { customerActions: { closeRequest: true, escalate: true } }, transitions: { 'SD-1': [transition('31', 'Close', STATUS.closed, 'Closed')] } });
  await assert.rejects(call('performRequestAction', 'alice', { issueKey: 'SD-1', action: 'close' }), /not enabled/);
  assert.equal(jira.writes().length, 0);
});

test('transitions that need a screen field without a default are not offered', async () => {
  seed({ transitions: { 'SD-1': [transition('31', 'Close', STATUS.closed, 'Closed', { resolution: { required: true, hasDefaultValue: false } })] } });
  await assert.rejects(call('performRequestAction', 'alice', { issueKey: 'SD-1', action: 'close' }), /cannot be closed/);
  const detail = await call('getRequestDetail', 'alice', { issueKey: 'SD-1' });
  assert.equal(detail.actions.closeRequest, false);
});

test('customer cannot act on another customer\'s request', async () => {
  seed({ transitions: { 'SD-2': [transition('31', 'Close', STATUS.closed, 'Closed')] } });
  await assert.rejects(call('performRequestAction', 'alice', { issueKey: 'SD-2', action: 'close' }), /not available/);
  assert.equal(jira.writes().length, 0);
});

test('successful action leaves an internal audit note naming the customer', async () => {
  seed({ transitions: { 'SD-1': [transition('31', 'Close', STATUS.closed, 'Closed')] } });
  await call('performRequestAction', 'alice', { issueKey: 'SD-1', action: 'close' });
  const comment = jira.writes().find((w) => w.path === '/rest/api/3/issue/SD-1/comment');
  assert.ok(comment, 'audit comment written');
  assert.deepEqual(comment.body.properties, [{ key: 'sd.public.comment', value: { internal: true } }]);
  assert.match(JSON.stringify(comment.body.body), /alice name \(account alice\) closed this request/);
});

test('audit notes can be switched off by the admin', async () => {
  seed({ selfService: { customerActions: { closeRequest: true, closeStatusIds: [STATUS.closed], auditComments: false } }, transitions: { 'SD-1': [transition('31', 'Close', STATUS.closed, 'Closed')] } });
  await call('performRequestAction', 'alice', { issueKey: 'SD-1', action: 'close' });
  assert.equal(jira.writes().some((w) => w.path.endsWith('/comment')), false);
});

test('field edits sent by the portal UI reach Jira with values shaped per field type', async () => {
  const result = await call('updateRequestFields', 'alice', { issueKey: 'SD-1', fields: {
    customfield_text: 'PO-1234', customfield_notes: 'Line one\nLine two', customfield_due: '2026-10-01',
    customfield_locked: 999, summary: 'hijacked'
  } });
  assert.deepEqual(result.updatedFieldIds.sort(), ['customfield_due', 'customfield_notes', 'customfield_text']);
  const put = jira.writes().find((w) => w.method === 'PUT');
  assert.equal(put.body.fields.customfield_text, 'PO-1234');
  assert.equal(put.body.fields.customfield_due, '2026-10-01');
  assert.equal(put.body.fields.customfield_notes.type, 'doc');
  assert.equal('customfield_locked' in put.body.fields, false);
  assert.equal('summary' in put.body.fields, false);
});

test('invalid field values are rejected before anything is written', async () => {
  await assert.rejects(call('updateRequestFields', 'alice', { issueKey: 'SD-1', fields: { customfield_due: '2026-02-30' } }), /valid date/);
  await assert.rejects(call('updateRequestFields', 'alice', { issueKey: 'SD-1', fields: { customfield_text: 'x'.repeat(300) } }), /255 characters/);
  await assert.rejects(call('updateRequestFields', 'alice', { issueKey: 'SD-1', fields: { summary: 'only disallowed' } }), /No permitted editable fields/);
  assert.equal(jira.writes().length, 0);
});

test('customer cannot edit another customer\'s request', async () => {
  await assert.rejects(call('updateRequestFields', 'alice', { issueKey: 'SD-2', fields: { customfield_text: 'x' } }), /not available/);
  assert.equal(jira.writes().length, 0);
});

test('CSV export returns only the customer\'s visible requests', async () => {
  const exported = await call('getExportRequests', 'alice');
  assert.deepEqual(exported.values.map((r) => r.issueKey).sort(), ['SD-1', 'SD-3']);
});

test('request detail offers editing only where Jira allows it, with real dropdown options', async () => {
  seed({
    issues: [issue('SD-1', 'alice', { fields: {
      customfield_notes: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Existing note' }] }] },
      customfield_size: { id: '20', value: 'Large' }
    } })],
    selfService: { fields: [
      { id: 'customfield_notes', name: 'Notes', type: 'string', custom: 'com.atlassian.jira.plugin.system.customfieldtypes:textarea', mode: 'editable', editableAfterSubmission: true },
      { id: 'customfield_size', name: 'Size', type: 'option', mode: 'editable', editableAfterSubmission: true },
      { id: 'customfield_text', name: 'Reference', type: 'string', mode: 'editable', editableAfterSubmission: true }
    ] },
    editMeta: { 'SD-1': {
      customfield_notes: {},
      customfield_size: { allowedValues: [{ id: '10', value: 'Small' }, { id: '20', value: 'Large' }] }
    } }
  });
  const detail = await call('getRequestDetail', 'alice', { issueKey: 'SD-1' });
  const byId = Object.fromEntries(detail.fields.map((f) => [f.id, f]));
  assert.equal(byId.customfield_notes.value, 'Existing note', 'multi-line text is shown, not blank');
  assert.equal(byId.customfield_notes.editableAfterSubmission, true);
  assert.deepEqual(byId.customfield_size.allowedValues, [{ id: '10', value: 'Small' }, { id: '20', value: 'Large' }]);
  assert.equal(byId.customfield_size.optionId, '20');
  assert.equal(byId.customfield_text.editableAfterSubmission, false, 'not on the edit screen, so read-only');
});

test('dropdown edits are sent to Jira as option ids', async () => {
  seed({ selfService: { fields: [{ id: 'customfield_size', name: 'Size', type: 'option', mode: 'editable', editableAfterSubmission: true }] } });
  await call('updateRequestFields', 'alice', { issueKey: 'SD-1', fields: { customfield_size: { id: '10' } } });
  assert.deepEqual(jira.writes().find((w) => w.method === 'PUT').body.fields, { customfield_size: { id: '10' } });
});

test('request detail shows a progress timeline from JSM status history, oldest first', async () => {
  seed({ statusHistory: { 'SD-1': [
    { status: 'Waiting for customer', statusCategory: 'INDETERMINATE', statusDate: { iso8601: '2026-09-03T09:00:00+0000' } },
    { status: 'In progress', statusCategory: 'INDETERMINATE', statusDate: { iso8601: '2026-09-02T09:00:00+0000' } }
  ] } });
  const detail = await call('getRequestDetail', 'alice', { issueKey: 'SD-1' });
  assert.deepEqual(detail.timeline.map((e) => e.status), ['Request raised', 'In progress', 'Waiting for customer']);
});

test('timeline falls back to the raised date when status history is unavailable', async () => {
  seed({ statusHistory: { 'SD-1': 'error' } });
  const detail = await call('getRequestDetail', 'alice', { issueKey: 'SD-1' });
  assert.deepEqual(detail.timeline.map((e) => e.status), ['Request raised']);
});

test('reports cover every visible request across pages and nothing outside the boundary', async () => {
  const mine = Array.from({ length: 250 }, (_, i) => issue(`SD-${i + 1}`, 'alice', { created: new Date(Date.UTC(2026, 5, 1) + i * 3600000).toISOString() }));
  const others = Array.from({ length: 40 }, (_, i) => issue(`SD-${i + 1000}`, 'bob'));
  seed({ issues: [...mine, ...others], selfService: { reporting: { enabled: true } } });
  const dashboard = await call('getDashboard', 'alice');
  assert.equal(dashboard.selfService.report.total, 250);
  assert.deepEqual(dashboard.selfService.reportDataset, { count: 250, truncated: false, cap: 1000 });
});

test('SLA fields are discovered, requested and reported per request', async () => {
  const sla = (state) => state === 'running'
    ? { name: 'Time to resolution', ongoingCycle: { breached: false, remainingTime: { friendly: '3h' } } }
    : { name: 'Time to resolution', completedCycles: [{ breached: state === 'breached' }] };
  seed({
    fieldDefinitions: [
      { id: 'customfield_20001', name: 'Time to resolution', schema: { custom: 'com.atlassian.servicedesk:sd-sla-field' } },
      { id: 'customfield_20002', name: 'Region', schema: { custom: 'com.atlassian.jira.plugin.system.customfieldtypes:select' } }
    ],
    issues: [
      issue('SD-1', 'alice', { fields: { customfield_20001: sla('met') } }),
      issue('SD-2', 'alice', { fields: { customfield_20001: sla('breached') } }),
      issue('SD-3', 'alice', { fields: { customfield_20001: sla('running') } })
    ],
    selfService: { sla: { enabled: true }, reporting: { enabled: true } }
  });
  const dashboard = await call('getDashboard', 'alice');
  const byKey = Object.fromEntries(dashboard.requests.values.map((r) => [r.issueKey, r.sla?.state]));
  assert.deepEqual(byKey, { 'SD-1': 'met', 'SD-2': 'breached', 'SD-3': 'running' });
  assert.deepEqual(dashboard.selfService.report.sla, { met: 1, breached: 1, measured: 2 });
  assert.equal(dashboard.selfService.reportRows.length, 3);
  assert.deepEqual(dashboard.selfService.reportRows.map((r) => r.sla?.state).sort(), ['breached', 'met', 'running']);
});

test('SLA fields are not requested when SLA and reporting are off', async () => {
  seed({ fieldDefinitions: [{ id: 'customfield_20001', name: 'Time to resolution', schema: { custom: 'com.atlassian.servicedesk:sd-sla-field' } }] });
  await call('getDashboard', 'alice');
  assert.equal(jira.calls.some((c) => c.path === '/rest/api/3/field'), false);
  const search = jira.calls.find((c) => c.path === '/rest/api/3/search/jql');
  assert.equal(search.body.fields.includes('customfield_20001'), false);
});

test('standard fields such as Description reach the portal as columns', async () => {
  const description = { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Docked screen flickers' }] }] };
  seed({ issues: [issue('SD-1', 'alice', { fields: { description } })] });
  store.get(`portalplus:config:${PROJECT}`).experiences[0].requestColumns = [{ id: 'description', name: 'Description' }];
  const [request] = (await call('getDashboard', 'alice')).requests.values;
  assert.deepEqual(request.requestFieldValues.find((f) => f.fieldId === 'description')?.value, description);
});

test('reports disclose truncation at the 1,000-request safety cap', async () => {
  seed({ issues: Array.from({ length: 1005 }, (_, i) => issue(`SD-${i + 1}`, 'alice')), selfService: { reporting: { enabled: true } } });
  const dashboard = await call('getDashboard', 'alice');
  assert.equal(dashboard.selfService.reportDataset.count, 1000);
  assert.equal(dashboard.selfService.reportDataset.truncated, true);
});

test('portal pages resolve the project from the service desk, then use the cache', async () => {
  assert.deepEqual(keys(await call('getDashboard', 'alice')), ['SD-1', 'SD-3']);
  const lookups = () => jira.calls.filter((c) => c.path === '/rest/servicedeskapi/servicedesk/35').length;
  assert.equal(lookups(), 1);
  await call('getDashboard', 'alice');
  assert.equal(lookups(), 1, 'second load uses the cached project');
});

test('Help Center falls back to the most recently published project', async () => {
  assert.equal((await callOn(HELP_CENTER, 'getDashboard', 'alice')).audienceAllowed, false, 'nothing published yet');
  store.set('portalplus:projects', { 99999: '2026-01-01T00:00:00.000Z', [PROJECT]: '2026-09-25T10:00:00.000Z' });
  assert.deepEqual(keys(await callOn(HELP_CENTER, 'getDashboard', 'alice')), ['SD-1', 'SD-3']);
});

test('an unknown service desk shows nothing rather than another project', async () => {
  const result = await callOn({ page: 'portal', portal: { id: 77 } }, 'getDashboard', 'alice');
  assert.equal(result.audienceAllowed, false);
});

test('unauthenticated calls are refused', async () => {
  await assert.rejects(call('getDashboard', undefined), /signed in/);
  await assert.rejects(call('getRequestDetail', undefined, { issueKey: 'SD-1' }), /signed in/);
});
