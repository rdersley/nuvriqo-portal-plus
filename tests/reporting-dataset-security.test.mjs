import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/portal-resolver.js',import.meta.url),'utf8');

test('paginated reporting keeps the same customer visibility JQL on every page',()=>{
  assert.match(source,/function customerJql\(accountId,projectId,orgs=\[\]\)/);
  assert.match(source,/reporter = \\\"\$\{escapeJql\(accountId\)\}\\\"/);
  assert.match(source,/organizations in/);
  assert.match(source,/body=\{jql:customerJql\(accountId,projectId,orgs\)/);
});

test('customer search remains app-scoped and never uses asUser',()=>{
  const searchStart=source.indexOf('async function searchPage');
  const searchEnd=source.indexOf('async function requestPage');
  const searchSource=source.slice(searchStart,searchEnd);
  assert.match(searchSource,/api\.asApp\(\)\.requestJira/);
  assert.doesNotMatch(searchSource,/asUser\s*\(/);
});

test('reporting pagination is bounded and token-driven',()=>{
  assert.match(source,/MAX_CUSTOMER_DATASET=1000/);
  assert.match(source,/while\(values\.length<cap&&!isLastPage\)/);
  assert.match(source,/if\(nextPageToken\)body\.nextPageToken=nextPageToken/);
  assert.match(source,/truncated:!isLastPage/);
});

test('dashboard only expands the dataset when reporting is enabled',()=>{
  assert.match(source,/selfService\?\.reporting\?\.enabled===true\?await requestDataset/);
  assert.match(source,/reportDataset:\{count:reporting\.size,truncated:Boolean\(reporting\.truncated\),cap:MAX_CUSTOMER_DATASET\}/);
});
