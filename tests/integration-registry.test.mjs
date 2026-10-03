import assert from 'node:assert/strict';
import { normalizePortalModules } from '../src/integration-contract.js';

const modules = normalizePortalModules([
  { id: 'assets', title: 'My Assets', priority: 30, health: { available: true } },
  { id: 'smart-approval', title: 'Approvals', priority: 20, counters: [{ id: 'pending', label: 'Waiting for you', value: 3 }] },
  { id: 'disabled', title: 'Disabled', enabled: false },
  { id: 'offline', title: 'Offline', health: { available: false } },
]);

assert.equal(modules.length, 2);
assert.equal(modules[0].id, 'smart-approval');
assert.equal(modules[0].counters[0].value, 3);
assert.equal(modules[1].id, 'assets');
assert.throws(() => normalizePortalModules([{ title: 'Missing id' }]), /requires an id/i);
console.log('Portal+ integration registry contract tests passed');
