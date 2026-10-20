import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBackup, parseBackup, logoIdsFor, BACKUP_FORMAT } from '../src/backup.js';

const png = 'data:image/png;base64,iVBORw0KGgo=';
const config = { serviceDeskId: '5', experiences: [{ id: 'exp-a', branding: { hasLogo: true } }, { id: 'exp-b', branding: {} }] };

test('a backup carries settings, draft and logos for its project', () => {
  assert.deepEqual(logoIdsFor(config, null), ['exp-a']);
  const b = buildBackup({ projectId: 10, projectKey: 'SD', published: config, draft: null, logos: { 'exp-a': png, 'exp-b': '' }, exportedAt: '2026-10-20T10:00:00Z' });
  assert.equal(b.format, BACKUP_FORMAT);
  assert.equal(b.projectId, '10');
  assert.deepEqual(Object.keys(b.logos), ['exp-a']);
  const parsed = parseBackup(JSON.stringify(b), '10');
  assert.equal(parsed.published.experiences.length, 2);
  assert.equal(parsed.logos['exp-a'], png);
});

test('restores only into the project the backup came from', () => {
  const b = buildBackup({ projectId: '10', projectKey: 'SD', published: config });
  assert.throws(() => parseBackup(b, '11'), /another project \(SD\)/);
});

test('rejects files that are not Portal+ backups or are damaged', () => {
  assert.throws(() => parseBackup('not json', '10'), /not valid JSON/);
  assert.throws(() => parseBackup({ format: 'other' }, '10'), /not a Portal\+ backup/);
  assert.throws(() => parseBackup({ format: BACKUP_FORMAT, version: 2, projectId: '10' }, '10'), /version 2/);
  assert.throws(() => parseBackup({ format: BACKUP_FORMAT, version: 1, projectId: '10' }, '10'), /no Portal\+ settings/);
  assert.throws(() => parseBackup({ format: BACKUP_FORMAT, version: 1, projectId: '10', published: { experiences: 'x' } }, '10'), /no experiences list/);
  assert.throws(() => parseBackup({ format: BACKUP_FORMAT, version: 1, projectId: '10', published: config, logos: { 'exp-a': 'data:text/html;base64,PGI+' } }, '10'), /PNG, JPG/);
  assert.throws(() => parseBackup({ format: BACKUP_FORMAT, version: 1, projectId: '10', published: config, logos: { '../x': png } }, '10'), /invalid logo/);
});
