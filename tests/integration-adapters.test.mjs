import assert from 'node:assert/strict';
import { modulesFromRequests, SMART_APPROVAL_PROPERTY_KEY } from '../src/integration-adapters.js';

const request = {
  issueKey: 'TEST-12',
  summary: 'New laptop request',
  _links: { web: '/servicedesk/customer/portal/request/TEST-12' },
  _integrationProperties: {
    [SMART_APPROVAL_PROPERTY_KEY]: {
      provider: 'nuvriqo-smart-approval-manager',
      approvals: [
        { id: 'a1', approverAccountId: 'me', status: 'pending' },
        { id: 'a2', approverAccountId: 'other', status: 'pending' },
        { id: 'a3', approverAccountId: 'me', status: 'approved' },
      ],
    },
  },
};

const modules = modulesFromRequests([request], 'me');
assert.equal(modules.length, 1);
assert.equal(modules[0].id, 'smart-approval');
assert.equal(modules[0].counters[0].value, 1);
assert.equal(modules[0].items.length, 1);
assert.equal(modules[0].items[0].title, 'New laptop request');
assert.equal(modulesFromRequests([request], 'nobody').length, 1, 'provider remains detected even when customer has zero pending approvals');
assert.equal(modulesFromRequests([], 'me').length, 0);
console.log('Portal+ integration adapter tests passed');
