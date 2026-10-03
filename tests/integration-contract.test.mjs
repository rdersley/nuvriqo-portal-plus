import assert from 'node:assert/strict';
import { normalizePortalModule, normalizePortalModules, portalIntegrationExamples } from '../src/integration-contract.js';

const approval = normalizePortalModule({
  ...portalIntegrationExamples.smartApproval,
  counters: [{ id: 'pending', label: 'Waiting for you', value: '3', tone: 'attention' }],
  items: Array.from({ length: 25 }, (_, i) => ({ id: i + 1, title: `Approval ${i + 1}` }))
});

assert.equal(approval.id, 'smart-approval');
assert.equal(approval.counters[0].value, 3);
assert.equal(approval.items.length, 20);
assert.equal(approval.health.available, true);

const modules = normalizePortalModules([
  { ...portalIntegrationExamples.assets, priority: 30 },
  { ...portalIntegrationExamples.smartApproval, priority: 20 },
  { id: 'disabled', title: 'Disabled', enabled: false },
  { id: 'offline', title: 'Offline', health: { available: false } }
]);

assert.deepEqual(modules.map((m) => m.id), ['smart-approval', 'assets']);
assert.throws(() => normalizePortalModule({ title: 'Missing id' }), /requires an id/);

console.log('Portal+ integration contract tests passed');
