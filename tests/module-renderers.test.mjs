import assert from 'node:assert/strict';
import { formatDuration, renderReportCards, renderReportCharts, renderCompanionModule, renderRequestDetailModel } from '../static/portal/src/module-renderers.js';

assert.equal(formatDuration(172800000), '2.0 days');
assert.equal(formatDuration(7200000), '2.0 hours');

const report = {
  total: 42,
  created: 42,
  resolved: 38,
  open: 4,
  averageResolutionMs: 155520000,
  byRequestType: [{ label: 'IT Support', value: 17 }, { label: 'Equipment', value: 10 }],
  byStatus: [{ label: 'Resolved', value: 38 }, { label: 'Open', value: 4 }],
  sla: { met: 35, breached: 5, measured: 40 }
};
const cards = renderReportCards(report);
assert.match(cards, /42/);
assert.match(cards, /88%/);
assert.match(cards, /1\.8 days/);
const charts = renderReportCharts(report);
assert.match(charts, /Requests by type/);
assert.match(charts, /SLA performance/);
assert.match(charts, /Created vs resolved/);

const approvals = renderCompanionModule({
  title: 'Approvals',
  description: 'Requests waiting for approval.',
  counters: [{ label: 'Waiting for you', value: 2 }],
  items: [{ title: 'New laptop', subtitle: 'SD-123', badge: 'Waiting for you', url: '/request/SD-123' }]
});
assert.match(approvals, /New laptop/);
assert.match(approvals, /Waiting for you/);
assert.ok(!approvals.includes('<script'));

const empty = renderCompanionModule({ description: 'Nothing waiting.', counters: [{ label: 'Pending', value: 0 }] });
assert.match(empty, /all up to date/i);

const detail = renderRequestDetailModel({ key: 'SD-1', summary: 'Wi-Fi problem', status: 'In Progress', sla: { state: 'met' } }, [{ id: 'customfield_1', name: 'Device', value: 'Laptop' }], { sla: { enabled: true }, customerActions: { closeRequest: true, escalate: false } });
assert.equal(detail.key, 'SD-1');
assert.equal(detail.sla.visible, true);
assert.equal(detail.actions.closeRequest, true);
assert.equal(detail.actions.escalate, false);

console.log('module renderer tests passed');
