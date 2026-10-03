import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync(new URL('../static/portal/src/app.js',import.meta.url),'utf8');
const resolver=fs.readFileSync(new URL('../src/portal-resolver.js',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../src/request-detail-service.js',import.meta.url),'utf8');
const manifest=fs.readFileSync(new URL('../manifest.yml',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../static/portal/dist/index.html',import.meta.url),'utf8');

assert.match(app,/invoke\('getRequestDetail'/,'request rows should open Portal+ Request Detail');
assert.match(app,/invoke\('updateRequestFields'/,'editable-after-submission fields should use the guarded resolver');
assert.match(app,/invoke\('performRequestAction'/,'customer actions should use the guarded resolver');
assert.match(app,/data-detail-field/,'Request Detail should render configured editable fields');
assert.match(app,/Service levels/,'Request Detail should render SLA content');
assert.match(html,/request-detail\.css/,'request detail styles should ship with the portal resource');

assert.match(resolver,/visibleRequestContext/,'request detail writes should rebuild current customer visibility');
assert.match(resolver,/getRequestDetail/);
assert.match(resolver,/updateRequestFields/);
assert.match(resolver,/performRequestAction/);
assert.doesNotMatch(resolver,/asUser\s*\(/,'customer resolver must remain consent-free and never use asUser');

assert.match(service,/requireVisible/,'request actions must fail closed without a server-verified visible request');
assert.match(service,/prepareCustomerFieldUpdates/,'field writes must use the admin allow-list');
assert.match(service,/chooseCustomerTransition/,'customer transitions must be discovered, never hard-coded');
assert.doesNotMatch(service,/transition:\s*\{\s*id:\s*['"]\d+['"]/,'transition IDs must not be hard-coded');
assert.doesNotMatch(service,/asUser\s*\(/,'request detail service must remain asApp');
assert.match(manifest,/write:jira-work/,'customer-approved edits and transitions require Jira write scope');

console.log('Portal+ request detail UI/security wiring tests passed.');
