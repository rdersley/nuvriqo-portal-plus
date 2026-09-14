import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSelfServiceFieldCatalogue, canCustomerEditField, enforceEditableFieldPolicy } from '../src/self-service-admin.js';

test('allows simple supported field types and blocks complex identity/assets fields', () => {
  assert.equal(canCustomerEditField({ type: 'string' }), true);
  assert.equal(canCustomerEditField({ type: 'number' }), true);
  assert.equal(canCustomerEditField({ type: 'user' }), false);
  assert.equal(canCustomerEditField({ jiraSchema: { type: 'string', custom: 'com.atlassian.jira.plugin.system.customfieldtypes:userpicker' } }), false);
  assert.equal(canCustomerEditField({ jiraSchema: { type: 'array', custom: 'com.atlassian.assets:asset' } }), false);
});

test('catalogue advertises editable support without changing Jira visibility', () => {
  const catalogue = buildSelfServiceFieldCatalogue([
    { id: 'customfield_1', name: 'Device note', type: 'string' },
    { id: 'customfield_2', name: 'Owner', type: 'user' }
  ]);
  assert.deepEqual(catalogue.map((field) => [field.id, field.editableSupported]), [
    ['customfield_1', true],
    ['customfield_2', false]
  ]);
});

test('downgrades unsupported editable fields to read-only', () => {
  const result = enforceEditableFieldPolicy([
    { id: 'customfield_1', name: 'Device note', mode: 'editable', editableAfterSubmission: true },
    { id: 'customfield_2', name: 'Owner', mode: 'editable', editableAfterSubmission: true }
  ], [
    { id: 'customfield_1', editableSupported: true },
    { id: 'customfield_2', editableSupported: false }
  ]);
  assert.equal(result[0].mode, 'editable');
  assert.equal(result[0].editableAfterSubmission, true);
  assert.equal(result[1].mode, 'read-only');
  assert.equal(result[1].editableAfterSubmission, false);
});
