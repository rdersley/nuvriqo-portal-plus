import { invoke, view, router } from '@forge/bridge';

const box = document.getElementById('requests');
const safe = (value) => value == null ? '' : String(value);
const esc = (value) => safe(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const summary = (request) => safe(request.requestFieldValues?.find?.((field) => field.fieldId === 'summary')?.value || request.summary || request.requestType?.name || 'Service request');
const status = (request) => safe(request.currentStatus?.status || request.status?.name || 'Open');
const statusId = (request) => safe(request.currentStatus?.statusId || request.currentStatus?.id || request.status?.id || '');
const requestTypeName = (request) => safe(request.requestType?.name || '');
const requestKey = (request) => safe(request.issueKey || request.key);
const closed = (request) => ['closed','resolved','done','cancelled','canceled'].some((word) => status(request).toLowerCase().includes(word));
const mapped = (request, ids) => { const wanted = new Set((ids || []).map(String)); return wanted.has(statusId(request)) || wanted.has(status(request)); };
let allRequests = [];
let licensed = true;
let selectedColumns = [];
let currentPage = 0;
const PAGE_SIZE = 10;

async function resize() { try { await view.resize(); } catch (_) {} }
function setCardVisible(id, visible) { const el = document.getElementById(id); if (el?.closest('.card')) el.closest('.card').style.display = visible ? '' : 'none'; }
function csvCell(value) { let s = safe(value).replace(/\r?\n/g, ' '); if (/^\s*[=+\-@]/.test(s) || /^[\t\r]/.test(s)) s = `'${s}`; s = s.replace(/"/g, '""'); return `"${s}"`; }
async function navigate(url) { if (!url) return; try { await router.navigate(url); } catch (_) { try { window.open(url, '_top'); } catch (_) {} } }
function createdTime(request) { const raw = request.createdDate?.iso8601 || request.createdDate; const time = raw ? Date.parse(raw) : NaN; return Number.isFinite(time) ? time : 0; }

function displayValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    for (const key of ['label','displayName','name','value']) {
      if (value[key] != null && typeof value[key] !== 'object') return safe(value[key]);
    }
    try { return JSON.stringify(value); } catch (_) { return ''; }
  }
  return safe(value);
}

function requestFieldValue(request, fieldId) {
  const field = request.requestFieldValues?.find?.((item) => String(item.fieldId) === String(fieldId));
  return displayValue(field?.value);
}

function renderLicenseNotice() {
  let notice = document.getElementById('license-notice');
  if (licensed) { if (notice) notice.remove(); return; }
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'license-notice';
    notice.className = 'message';
    document.querySelector('.top')?.insertAdjacentElement('afterend', notice);
  }
  notice.textContent = 'Nuvriqo Portal+ is currently unlicensed. Request visibility remains available, but premium navigation and export features require an active subscription.';
}

function renderCategories(config) {
  const categories = Array.isArray(config?.categories) ? config.categories.filter((c) => Array.isArray(c.requestTypes) && c.requestTypes.length) : [];
  const section = document.getElementById('quick-actions-section'); const host = document.getElementById('quick-actions');
  if (!licensed || !categories.length || !config?.serviceDeskId) { section.hidden = true; host.innerHTML = ''; return; }
  host.innerHTML = categories.map((category) => `<div class="quick-category"><h4>${esc(category.name)}</h4>${category.description ? `<p>${esc(category.description)}</p>` : ''}<div class="quick-links">${category.requestTypes.map((rt) => `<button class="quick-link quick-button" type="button" data-url="/servicedesk/customer/portal/${encodeURIComponent(config.serviceDeskId)}/create/${encodeURIComponent(rt.id)}">${esc(rt.name)}</button>`).join('')}</div></div>`).join('');
  section.hidden = false; host.querySelectorAll('[data-url]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.url)));
}

function populateFilter(select, values, firstLabel) {
  const current = select.value; select.innerHTML = `<option value="">${firstLabel}</option>`;
  [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b)).forEach((value) => { const option = document.createElement('option'); option.value = value; option.textContent = value; select.appendChild(option); });
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function filteredRequests() {
  const query = document.getElementById('request-search').value.trim().toLowerCase();
  const wantedStatus = document.getElementById('request-status').value;
  const wantedType = document.getElementById('request-type').value;
  const days = Number(document.getElementById('request-date').value || 0);
  const cutoff = days > 0 ? Date.now() - (days * 24 * 60 * 60 * 1000) : 0;
  const sort = document.getElementById('request-sort').value;
  const result = allRequests.filter((request) => {
    const matchesText = !query || requestKey(request).toLowerCase().includes(query) || summary(request).toLowerCase().includes(query);
    const matchesDate = !cutoff || createdTime(request) >= cutoff;
    return matchesText && matchesDate && (!wantedStatus || status(request) === wantedStatus) && (!wantedType || requestTypeName(request) === wantedType);
  });
  result.sort((a,b) => sort === 'oldest' ? createdTime(a) - createdTime(b) : sort === 'key' ? requestKey(a).localeCompare(requestKey(b), undefined, { numeric:true }) : createdTime(b) - createdTime(a));
  return result;
}

function columnClass() { return `cols-${Math.min(3, selectedColumns.length)}`; }

function renderHeader() {
  const header = document.getElementById('request-header');
  if (!allRequests.length) { header.hidden = true; return; }
  header.className = `request-header ${columnClass()}`;
  header.innerHTML = `<span>Key</span><span>Request</span>${selectedColumns.map((field) => `<span>${esc(field.name)}</span>`).join('')}<span>Status</span>`;
  header.hidden = false;
}

function renderPagination(total) {
  const pagination = document.getElementById('pagination');
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage >= pages) currentPage = pages - 1;
  pagination.hidden = total <= PAGE_SIZE;
  document.getElementById('page-info').textContent = `Page ${currentPage + 1} of ${pages}`;
  document.getElementById('page-prev').disabled = currentPage <= 0;
  document.getElementById('page-next').disabled = currentPage >= pages - 1;
}

function renderRequestList() {
  const values = filteredRequests(); const count = document.getElementById('result-count');
  const pages = Math.max(1, Math.ceil(values.length / PAGE_SIZE));
  if (currentPage >= pages) currentPage = pages - 1;
  const start = currentPage * PAGE_SIZE;
  const pageValues = values.slice(start, start + PAGE_SIZE);
  count.textContent = `${values.length} match${values.length === 1 ? '' : 'es'}`;
  renderHeader();
  renderPagination(values.length);
  if (!values.length) { document.getElementById('request-header').hidden = true; box.className = 'message empty'; box.innerHTML = allRequests.length ? '<strong>No matching requests.</strong><span>Try changing the Portal+ search or filters.</span>' : '<strong>No requests yet.</strong><span>Use the standard portal options to contact support.</span>'; resize(); return; }
  box.className = 'requests';
  box.innerHTML = pageValues.map((request) => {
    const url = safe(request._links?.web || '');
    const customCells = selectedColumns.map((field) => `<div class="custom-field" title="${esc(field.name)}">${esc(requestFieldValue(request, field.id) || '—')}</div>`).join('');
    return `<button class="request request-button ${columnClass()}" type="button" data-request-url="${esc(url)}"><div class="key">${esc(requestKey(request))}</div><div class="summary"><strong>${esc(summary(request))}</strong><span>${esc(requestTypeName(request))}</span></div>${customCells}<div class="status">${esc(status(request))}</div></button>`;
  }).join('');
  box.querySelectorAll('[data-request-url]').forEach((button) => { if (button.dataset.requestUrl) button.addEventListener('click', () => navigate(button.dataset.requestUrl)); else button.disabled = true; });
  resize();
}

function exportRows(requests) {
  const headers = ['Key','Summary','Request type','Status','Created','Updated', ...selectedColumns.map((field) => field.name)];
  const rows = requests.map((request) => [requestKey(request), summary(request), requestTypeName(request), status(request), request.createdDate?.iso8601 || request.createdDate?.friendly || '', request.updatedDate?.iso8601 || request.updatedDate?.friendly || '', ...selectedColumns.map((field) => requestFieldValue(request, field.id))]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

async function exportCsv() {
  const button = document.getElementById('exportCsv'); const message = document.getElementById('export-message');
  if (!licensed) { message.hidden = false; message.textContent = 'An active Portal+ subscription is required to export requests.'; return; }
  button.disabled = true; message.hidden = false; message.textContent = 'Preparing CSV…';
  try {
    const data = await invoke('getExportRequests'); const values = Array.isArray(data?.values) ? data.values : [];
    if (!values.length) { message.textContent = 'There are no visible requests to export.'; return; }
    const blob = new Blob(['\ufeff', exportRows(values)], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `portal-plus-requests-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    message.textContent = `${values.length} request${values.length === 1 ? '' : 's'} exported${data?.truncated ? ' (limited to first 1,000)' : ''}.`;
  } catch (error) { message.textContent = `Export failed: ${error?.message || String(error)}`; }
  finally { button.disabled = false; await resize(); }
}

async function load() {
  try {
    const result = await invoke('getDashboard');
    if (result?.audienceAllowed === false) { document.querySelector('.wrap').style.display = 'none'; await resize(); return; }
    const data = result?.requests || {}; const config = result?.config || {}; const values = Array.isArray(data?.values) ? data.values : []; const mapping = config.statusMapping || {}; const options = config.dashboard || {}; allRequests = values; selectedColumns = Array.isArray(config.requestColumns) ? config.requestColumns.slice(0, 3) : []; licensed = result?.licensing?.active !== false; currentPage = 0;
    renderLicenseNotice();
    const exportButton = document.getElementById('exportCsv'); exportButton.disabled = !licensed; exportButton.title = licensed ? '' : 'Active subscription required';
    const title = document.querySelector('.top h2'); if (title && config.displayName) title.textContent = config.displayName;
    document.getElementById('total').textContent = data?.size ?? values.length; document.getElementById('open').textContent = values.filter((request) => !closed(request)).length; document.getElementById('awaiting-you').textContent = values.filter((request) => mapped(request, mapping.awaitingCustomer)).length; document.getElementById('awaiting-support').textContent = values.filter((request) => mapped(request, mapping.awaitingSupport)).length;
    setCardVisible('open', options.open !== false); setCardVisible('awaiting-you', options.awaitingCustomer !== false); setCardVisible('awaiting-support', options.awaitingSupport !== false); renderCategories(config);
    const requestSection = document.querySelector('.recent-section'); if (requestSection) requestSection.style.display = options.recent !== false ? '' : 'none';
    populateFilter(document.getElementById('request-status'), values.map(status), 'All statuses'); populateFilter(document.getElementById('request-type'), values.map(requestTypeName), 'All request types'); document.getElementById('request-tools').hidden = !values.length;
    renderRequestList();
  } catch (error) { box.className = 'message error'; box.textContent = `Could not load Portal+ dashboard: ${error?.message || String(error)}`; }
  finally { await resize(); }
}

['request-search','request-status','request-type','request-date','request-sort'].forEach((id) => document.getElementById(id).addEventListener(id === 'request-search' ? 'input' : 'change', () => { currentPage = 0; renderRequestList(); }));
document.getElementById('page-prev').addEventListener('click', () => { if (currentPage > 0) { currentPage -= 1; renderRequestList(); } });
document.getElementById('page-next').addEventListener('click', () => { currentPage += 1; renderRequestList(); });
document.getElementById('exportCsv').addEventListener('click', exportCsv);
window.addEventListener('load', async () => { await resize(); await load(); });
