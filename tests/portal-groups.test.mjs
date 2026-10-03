import test from 'node:test';
import assert from 'node:assert/strict';
import { importPortalGroups, MAX_CATEGORIES } from '../static/admin/src/portal-groups.js';

const groups = [
  { id: '10', name: 'Common Requests' },
  { id: '11', name: 'Computers' },
  { id: '12', name: 'Empty group' },
];
const types = [
  { id: '1', name: 'Set up VPN to the office', groupIds: ['10'] },
  { id: '2', name: 'Request new hardware', groupIds: ['11'] },
  { id: '3', name: 'Report broken hardware', groupIds: ['10', '11'] },
  { id: '4', name: 'Ungrouped', groupIds: [] },
];
let n = 0;
const id = () => `category-${++n}`;

test('creates one category per portal group, in JSM order, with its request types', () => {
  const r = importPortalGroups([], groups, types, id);
  assert.equal(r.added, 2);
  assert.deepEqual(r.categories.map((c) => c.name), ['Common Requests', 'Computers']);
  assert.deepEqual(r.categories[0].requestTypes.map((t) => t.id), ['1', '3']);
  assert.deepEqual(r.categories[1].requestTypes.map((t) => t.id), ['2', '3']);
  assert.deepEqual(r.categories[0].audienceOrganizationIds, []);
});

test('skips groups with no request types and groups already in Services', () => {
  const existing = [{ id: 'x', name: 'computers', requestTypes: [{ id: '2', name: 'Request new hardware' }] }];
  const r = importPortalGroups(existing, groups, types, id);
  assert.equal(r.added, 1);
  assert.deepEqual(r.categories.map((c) => c.name), ['computers', 'Common Requests']);
  assert.equal(r.categories[0], existing[0], 'existing categories are kept untouched');
});

test('stops at the category limit and reports it', () => {
  const full = Array.from({ length: MAX_CATEGORIES }, (_, i) => ({ id: `c${i}`, name: `Cat ${i}`, requestTypes: [{ id: '1', name: 'x' }] }));
  const r = importPortalGroups(full, groups, types, id);
  assert.equal(r.added, 0);
  assert.equal(r.full, true);
  assert.equal(r.categories.length, MAX_CATEGORIES);
});

test('running the import twice adds nothing the second time', () => {
  const first = importPortalGroups([], groups, types, id);
  const second = importPortalGroups(first.categories, groups, types, id);
  assert.equal(second.added, 0);
  assert.equal(second.full, false);
  assert.equal(second.categories.length, 2);
});
