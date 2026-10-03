import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCustomerReport } from '../src/self-service-contract.js';
import { renderReportCards } from '../static/portal/src/module-renderers.js';

// Requests from the portal resolver carry requestType as { name }.
const request = (type, status, created, resolved = '') => ({
  requestType: { name: type }, currentStatus: { status }, createdDate: { iso8601: created }, resolvedDate: { iso8601: resolved }
});

test('requests by type use the request type name, not the object', () => {
  const report = buildCustomerReport([request('Get IT help', 'To Do', '2026-09-20T10:00:00Z'), request('Get IT help', 'To Do', '2026-09-21T10:00:00Z')]);
  assert.deepEqual(report.byRequestType, [{ label: 'Get IT help', value: 2 }]);
});

test('average resolution shows a dash when nothing is resolved', () => {
  const report = buildCustomerReport([request('Get IT help', 'To Do', '2026-09-20T10:00:00Z')]);
  assert.equal(report.averageResolutionMs, null);
  const html = renderReportCards(report);
  assert.match(html, /—/);
  assert.doesNotMatch(html, /\d+\s*min/);
});
