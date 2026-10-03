import assert from 'node:assert/strict';
import test from 'node:test';
import { documentLink, normalizeDocuments } from '../src/documents.js';

test('Confluence page links become customer knowledge base article links', () => {
  assert.equal(documentLink('https://site.atlassian.net/wiki/spaces/KB/pages/123456/Printer+setup', { serviceDeskId: '35' }), '/servicedesk/customer/portal/35/article/123456');
  assert.equal(documentLink('https://site.atlassian.net/wiki/pages/viewpage.action?pageId=987', { serviceDeskId: '35' }), '/servicedesk/customer/portal/35/article/987');
});

test('knowledge base links and other https links are kept; unsafe links are dropped', () => {
  assert.equal(documentLink('/servicedesk/customer/portal/35/article/123'), '/servicedesk/customer/portal/35/article/123');
  assert.equal(documentLink('https://example.com/guide.pdf'), 'https://example.com/guide.pdf');
  assert.equal(documentLink('javascript:alert(1)'), '');
  assert.equal(documentLink('http://insecure.example.com'), '');
  assert.equal(documentLink('https://x.test/"><script>'), '');
  assert.equal(documentLink('/servicedesk/customer/portal/35/article/1?x=<b>'), '');
});

test('without a service desk ID, Confluence links are kept until publish converts them', () => {
  const url = 'https://site.atlassian.net/wiki/spaces/KB/pages/123/Guide';
  assert.equal(documentLink(url), url);
});

test('normalising drops guides without a title or valid link and empty folders', () => {
  const folders = normalizeDocuments([
    { name: 'Setup', items: [{ title: 'Printer', url: '/servicedesk/customer/portal/35/article/1' }, { title: '', url: '/servicedesk/customer/portal/35/article/2' }, { title: 'Bad', url: 'javascript:x' }] },
    { name: 'Empty', items: [] }
  ]);
  assert.equal(folders.length, 1);
  assert.deepEqual(folders[0].items.map((i) => i.title), ['Printer']);
  assert.ok(folders[0].id && folders[0].items[0].id, 'ids are generated');
});
