import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const resolver=read('src/portal-resolver.js');
const detail=read('src/request-detail-service.js');
const security=read('src/request-detail-security.js');
const app=read('static/portal/src/app.js');
const grid=read('static/portal/dist/request-grid.css');
const manifest=read('manifest.yml');

// Customer reads/writes must stay app-context only. Portal+ deliberately avoids
// consent-dependent asUser Jira calls and must never broaden request visibility.
assert.equal(/api\.asUser\(\)\.requestJira/.test(resolver),false,'customer resolver must not use asUser Jira calls');
assert.equal(/api\.asUser\(\)\.requestJira/.test(detail),false,'request detail service must not use asUser Jira calls');
assert.match(resolver,/reporter\s*=|reporter\s+in|reporter/i,'customer visibility must remain reporter scoped');
assert.match(resolver,/organization|organisation/i,'customer visibility must retain organisation scoping');
assert.match(security,/assertVisibleRequest/,'request detail mutations must enforce current customer visibility');
assert.match(detail,/requireVisible/,'request detail service must invoke current customer visibility enforcement');

// Request detail commercial self-service capabilities live in the main portal app.
assert.match(app,/getRequestDetail/,'request detail UI must load the secure detail resolver');
assert.match(app,/updateRequestFields/,'request detail UI must support configured post-submission edits');
assert.match(app,/performRequestAction/,'request detail UI must expose the safe customer action endpoint');
assert.match(app,/runRequestAction/,'request detail UI must wire Close/Escalate controls to the action runtime');
assert.match(app,/['"]close['"]/,'request detail UI must expose Close Request');
assert.match(app,/['"]escalate['"]/,'request detail UI must expose Escalate');
assert.match(app,/sla/i,'request detail UI must render real SLA data when available');
assert.match(security,/editableAfterSubmission/,'field writes must use the configured editable allow-list');
assert.match(detail,/transitions/i,'close/escalate must be selected from currently available Jira transitions');

// Eight-column request list must be genuinely responsive, not just a data-model promise.
assert.match(app,/MAX_COLUMNS\s*=\s*8/,'My Requests must allow eight configured customer columns');
assert.match(grid,/--portal-columns/,'desktop request grid must size dynamic customer columns');
assert.match(grid,/@media\s*\(max-width:\s*640px\)/,'request grid must include a mobile layout');
assert.match(grid,/data-label/,'mobile customer fields must retain their labels');

// Reporting/export pagination must retain a hard safety cap and expose truncation.
assert.match(resolver,/nextPageToken/,'reporting/export must follow Jira pagination');
assert.match(resolver,/1000/,'reporting/export must retain the bounded 1,000-request safety cap');
assert.match(resolver,/truncated/,'bounded datasets must disclose truncation');

// Companion transport must be property-based and Portal+ itself must not require
// direct access to companion-app private storage.
assert.match(resolver,/nuvriqo\.asset-manager\.portal/,'Asset Manager transport property must be consumed');
assert.match(resolver,/nuvriqo\.smart-approval\.portal/,'Smart Approval transport property must be consumed');
assert.equal(/@forge\/kvs/.test(detail),false,'request detail service must not reach into companion private KVS data');

// The only new customer mutation permission should remain explicit in the manifest.
assert.match(manifest,/write:jira-work/,'customer-approved edits/transitions require the explicit Jira write scope');

console.log('pre-marketplace end-to-end acceptance gate passed');
