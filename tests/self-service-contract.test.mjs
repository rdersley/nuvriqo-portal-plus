import assert from 'node:assert/strict';
import {
  MAX_REQUEST_COLUMNS,
  normalizePortalField,
  normalizeSelfServiceConfig,
  buildCustomerReport,
  featurePriorityPlan
} from '../src/self-service-contract.js';

const readOnly = normalizePortalField({ id: 'customfield_12345', name: 'Device status', showInList: true });
assert.equal(readOnly.mode, 'read-only');
assert.equal(readOnly.editableAfterSubmission, false);

const editable = normalizePortalField({
  id: 'customfield_23456',
  name: 'Contact number',
  mode: 'editable',
  editableAfterSubmission: true,
  requiredWhenEditing: true
});
assert.equal(editable.mode, 'editable');
assert.equal(editable.editableAfterSubmission, true);
assert.equal(editable.requiredWhenEditing, true);

const config = normalizeSelfServiceConfig({
  fields: Array.from({ length: 12 }, (_, index) => ({
    id: `customfield_${10000 + index}`,
    name: `Field ${index}`,
    showInList: true,
    showInDetails: true
  })),
  sla: { enabled: true },
  reporting: { enabled: true },
  export: { csv: true, excel: true },
  customerActions: { closeRequest: true, closeStatusIds: ['6'], escalate: true, escalateStatusIds: ['7'] }
});
assert.equal(config.listFields.length, MAX_REQUEST_COLUMNS);
assert.equal(config.sla.enabled, true);
assert.equal(config.reporting.enabled, true);
assert.equal(config.export.excel, true);
assert.equal(config.customerActions.closeRequest, true);
assert.deepEqual(config.customerActions.closeStatusIds, ['6']);
// Enabling an action without choosing target statuses leaves it switched off.
assert.equal(normalizeSelfServiceConfig({ customerActions: { closeRequest: true, escalate: true } }).customerActions.closeRequest, false);

const report = buildCustomerReport([
  {
    status: 'Resolved',
    requestType: 'Hardware',
    created: '2026-09-01T09:00:00.000Z',
    resolved: '2026-09-01T11:00:00.000Z',
    sla: { state: 'met' }
  },
  {
    status: 'Waiting for support',
    requestType: 'Hardware',
    created: '2026-09-02T09:00:00.000Z',
    sla: { state: 'breached' }
  },
  {
    status: 'Open',
    requestType: 'Access',
    created: '2026-09-03T09:00:00.000Z'
  }
], Date.parse('2026-09-14T10:00:00.000Z'));

assert.equal(report.total, 3);
assert.equal(report.resolved, 1);
assert.equal(report.open, 2);
assert.equal(report.byRequestType.find((x) => x.label === 'Hardware').value, 2);
assert.equal(report.sla.met, 1);
assert.equal(report.sla.breached, 1);
assert.equal(report.averageResolutionMs, 2 * 60 * 60 * 1000);

const priorities = featurePriorityPlan();
assert.equal(priorities[0].feature, 'read-only-fields');
assert.ok(priorities.some((item) => item.feature === 'sla-visibility' && item.priority === 'P0'));
assert.ok(priorities.some((item) => item.feature === 'assets'));

console.log('self-service-contract tests passed');
