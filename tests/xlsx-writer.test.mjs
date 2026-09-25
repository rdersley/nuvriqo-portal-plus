import assert from 'node:assert/strict';
import test from 'node:test';
import { buildXlsx, columnName, excelDate, zipStore } from '../static/portal/src/xlsx-writer.js';

// Reads a STORE-only zip, verifying each entry's CRC-32 against its bytes.
function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const entries = {};
  let at = 0;
  while (view.getUint32(at, true) === 0x04034b50) {
    const crc = view.getUint32(at + 14, true), size = view.getUint32(at + 18, true);
    const nameLength = view.getUint16(at + 26, true), extra = view.getUint16(at + 28, true);
    const name = decoder.decode(bytes.subarray(at + 30, at + 30 + nameLength));
    const data = bytes.subarray(at + 30 + nameLength + extra, at + 30 + nameLength + extra + size);
    entries[name] = { crc, text: decoder.decode(data), data };
    at += 30 + nameLength + extra + size;
  }
  return entries;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let k = 0; k < 8; k += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; }
  return (crc ^ 0xffffffff) >>> 0;
}

test('zip entries carry correct CRC-32 checksums', () => {
  const entries = readZip(zipStore([{ name: 'a.txt', data: 'hello' }, { name: 'b/c.xml', data: '<x/>' }]));
  assert.deepEqual(Object.keys(entries), ['a.txt', 'b/c.xml']);
  for (const entry of Object.values(entries)) assert.equal(entry.crc, crc32(entry.data));
  assert.equal(crc32(new TextEncoder().encode('hello')), 0x3610a686);
});

test('workbook contains the required parts and escaped, non-formula cells', () => {
  const entries = readZip(buildXlsx([
    ['Key', 'Summary', 'Created', 'Cost'],
    ['SD-1', 'Screen <flicker> & "dock"', '2026-09-20', 12.5],
    ['SD-2', '=HYPERLINK("http://evil")', '', '']
  ]));
  for (const part of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) assert.ok(entries[part], part);
  const sheet = entries['xl/worksheets/sheet1.xml'].text;
  assert.match(sheet, /Screen &lt;flicker&gt; &amp; &quot;dock&quot;/);
  assert.doesNotMatch(sheet, /<f>/, 'no cell is ever written as a formula');
  assert.match(sheet, /<t xml:space="preserve">=HYPERLINK\(&quot;http:\/\/evil&quot;\)<\/t>/);
  assert.match(sheet, /<c r="D2"><v>12.5<\/v><\/c>/);
  assert.match(sheet, /<c r="C2" s="2"><v>46285<\/v><\/c>/, 'date-only values become Excel dates');
  assert.match(sheet, /<autoFilter ref="A1:D3"\/>/);
  assert.match(sheet, /state="frozen"/);
});

test('column names and dates', () => {
  assert.deepEqual([0, 25, 26, 27, 701, 702].map(columnName), ['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA']);
  assert.equal(excelDate('2026-09-20'), 46285);
  assert.equal(excelDate('not a date'), null);
  assert.equal(excelDate('SD-42'), null);
  assert.ok(Math.abs(excelDate('2026-09-20T12:00:00Z') - excelDate('2026-09-20T13:00:00+01:00')) < 1e-9, 'offsets are respected');
});
