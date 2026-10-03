import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluationCloudIds, licenseState } from '../src/licensing.js';

const allow = evaluationCloudIds(' DF226A9A-6172-4d25-aa76-b507064701b1 , b4d1e0f4-0e2a-4448-9818-37cde14b9285 ');
const prod = (extra) => ({ environmentType: 'PRODUCTION', ...extra });

test('non-production environments are always active for testing', () => {
  assert.deepEqual(licenseState({ environmentType: 'STAGING' }, new Set()), { active: true, testEnvironment: true });
  assert.deepEqual(licenseState({ environmentType: 'DEVELOPMENT' }, new Set()), { active: true, testEnvironment: true });
});

test('a Marketplace licence decides in production, and is never overridden', () => {
  assert.equal(licenseState(prod({ license: { active: true } }), new Set()).active, true);
  assert.equal(licenseState(prod({ license: { active: false }, cloudId: 'df226a9a-6172-4d25-aa76-b507064701b1' }), allow).active, false);
});

test('sites without a licence object are only active when allow-listed', () => {
  assert.deepEqual(licenseState(prod({ cloudId: 'df226a9a-6172-4d25-aa76-b507064701b1' }), allow), { active: true, testEnvironment: false, evaluation: true });
  assert.equal(licenseState(prod({ cloudId: '00000000-0000-0000-0000-000000000000' }), allow).active, false);
  assert.equal(licenseState(prod({}), allow).active, false);
  assert.equal(licenseState(prod({ cloudId: 'df226a9a-6172-4d25-aa76-b507064701b1' }), new Set()).active, false);
});

test('allow-list parsing trims, lower-cases and ignores blanks', () => {
  assert.deepEqual([...evaluationCloudIds(' A , ,b ')], ['a', 'b']);
  assert.equal(evaluationCloudIds(undefined).size, 0);
});
