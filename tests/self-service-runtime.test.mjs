import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCustomerRequestDetails, buildRequestDetailModel, buildSelfServiceDashboard, fieldsRequiredForSelfService } from '../src/self-service-runtime.js';

const experience = {
  selfService: {
    fields: [
      { id: 'customfield_123', name: 'Device', mode: 'read-only', showInList: true },
      { id: 'customfield_456', name: 'Contact number', mode: 'editable', editableAfterSubmission: true, showInDetails: true }
    ],
    sla: { enabled: true, showStatus: true, showTarget: true },
    reporting: { enabled: true },
    export: { csv: true, excel: true },
    relatedRequests: true,
    customerActions: { closeRequest: true, escalate: true }
  }
};

const requests = [
  {
    issueKey: 'TEST-1',
    summary: 'Device will not start',
    currentStatus: { status: 'Resolved' },
    requestType: { name: 'Hardware' },
    createdDate: { iso8601: '2026-09-01T08:00:00.000Z' },
    updatedDate: { iso8601: '2026-09-01T10:00:00.000Z' },
    requestFieldValues: [
      { fieldId: 'customfield_123', value: 'POS-101' },
      { fieldId: 'customfield_456', value: '0870000000' }
    ],
    sla: { state: 'met', label: 'Time to resolution', target: '8h', remaining: '6h' },
    _links: { web: '/servicedesk/customer/portal/request/TEST-1' }
  },
  {
    issueKey: 'TEST-2',
    currentStatus: { status: 'Open' },
    requestType: { name: 'Account' },
    createdDate: { iso8601: '2026-09-02T08:00:00.000Z' },
    requestFieldValues: [{ fieldId: 'customfield_123', value: 'POS-102' }],
    sla: { state: 'breached' }
  }
];

test('builds customer self-service dashboard capabilities and reporting', () => {
  const result = buildSelfServiceDashboard({ experience, requests });
  assert.equal(result.capabilities.readOnlyFields, true);
  assert.equal(result.capabilities.editableFields, true);
  assert.equal(result.capabilities.slaVisibility, true);
  assert.equal(result.capabilities.reporting, true);
  assert.equal(result.capabilities.excelExport, true);
  assert.equal(result.capabilities.closeRequest, true);
  assert.equal(result.report.total, 2);
  assert.equal(result.report.resolved, 1);
  assert.equal(result.report.sla.met, 1);
  assert.equal(result.report.sla.breached, 1);
});

test('builds request detail fields without exposing unconfigured custom fields', () => {
  const details = buildCustomerRequestDetails(requests[0], experience.selfService);
  assert.deepEqual(details.map((row) => row.id), ['customfield_123', 'customfield_456']);
  assert.equal(details[0].value, 'POS-101');
  assert.equal(details[1].editableAfterSubmission, true);
});

test('builds polished request detail model with configured actions and SLA only', () => {
  const detail = buildRequestDetailModel(requests[0], experience.selfService);
  assert.equal(detail.key, 'TEST-1');
  assert.equal(detail.summary, 'Device will not start');
  assert.equal(detail.status, 'Resolved');
  assert.equal(detail.sla.state, 'met');
  assert.equal(detail.sla.target, '8h');
  assert.equal(detail.actions.closeRequest, true);
  assert.equal(detail.actions.escalate, true);
  assert.equal(detail.capabilities.hasEditableFields, true);
  assert.equal(detail.fields.some((field) => field.id === 'customfield_456'), true);
});

test('hides SLA detail when SLA visibility is disabled', () => {
  const detail = buildRequestDetailModel(requests[0], { ...experience.selfService, sla: { enabled: false } });
  assert.equal(detail.sla, null);
  assert.equal(detail.capabilities.slaVisible, false);
});

test('returns all configured Jira fields needed by the self-service layer', () => {
  assert.deepEqual(fieldsRequiredForSelfService(experience), ['customfield_123', 'customfield_456']);
});
