import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetModuleFromSnapshot } from '../src/asset-manager-adapter.js';

test('filters Asset Manager snapshot to customer organisations', () => {
  const module = buildAssetModuleFromSnapshot({
    provider: 'nuvriqo-asset-manager',
    contractVersion: 1,
    updatedAt: '2026-09-07T05:00:00Z',
    organisations: [
      { id: '10', assets: [{ id: 'a1', deviceId: 'DEV-1', name: 'Visible iPad', type: 'Tablet', status: 'Assigned' }] },
      { id: '20', assets: [{ id: 'a2', deviceId: 'DEV-2', name: 'Hidden Laptop', type: 'Laptop', status: 'Assigned' }] }
    ]
  }, ['10']);

  assert.equal(module.id, 'assets');
  assert.equal(module.provider, 'nuvriqo-asset-manager');
  assert.equal(module.counters.find((x) => x.id === 'assigned').value, 1);
  assert.equal(module.items.length, 1);
  assert.equal(module.items[0].title, 'Visible iPad');
  assert.equal(JSON.stringify(module).includes('Hidden Laptop'), false);
});

test('deduplicates assets shared across multiple allowed organisations', () => {
  const shared = { id: 'a1', deviceId: 'DEV-1', name: 'Shared device', status: 'Assigned' };
  const module = buildAssetModuleFromSnapshot({
    provider: 'nuvriqo-asset-manager', contractVersion: 1,
    organisations: [{ id: '10', assets: [shared] }, { id: '11', assets: [shared] }]
  }, ['10', '11']);
  assert.equal(module.items.length, 1);
  assert.equal(module.counters.find((x) => x.id === 'assigned').value, 1);
});

test('rejects unknown provider or contract version', () => {
  assert.equal(buildAssetModuleFromSnapshot({ provider: 'other', contractVersion: 1 }, ['10']), null);
  assert.equal(buildAssetModuleFromSnapshot({ provider: 'nuvriqo-asset-manager', contractVersion: 2 }, ['10']), null);
});

test('counts Asset Manager "In Use" devices as in service', () => {
  const module = buildAssetModuleFromSnapshot({
    provider: 'nuvriqo-asset-manager', contractVersion: 1,
    organisations: [{ id: '10', assets: [
      { id: 'a1', name: 'Handheld', status: 'In Use' },
      { id: 'a2', name: 'Spare', status: 'Available' },
      { id: 'a3', name: 'Broken', status: 'Repair' }
    ] }]
  }, ['10']);
  assert.equal(module.counters.find((x) => x.id === 'in-service').value, 1);
  assert.equal(module.counters.find((x) => x.id === 'attention').value, 1);
});
