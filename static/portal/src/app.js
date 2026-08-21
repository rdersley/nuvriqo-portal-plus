import { invoke, view, router } from '@forge/bridge';

const box = document.getElementById('requests');
const safe = (value) => value == null ? '' : String(value);
const esc = (value) => safe(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const summary = (request) => safe(request.requestFieldValues?.find?.((field) => field.fieldId === 'summary')?.value || request.summary || request.requestType?.name || 'Service request');
const status = (request) => safe(request.currentStatus?.status || request.status?.name || 'Open');
const statusId = (request) => safe(request.currentStatus?.statusId || request.currentStatus?.id || request.status?.id || '');
const closed = (request) => ['closed','resolved','done','cancelled','canceled'].some((word) => status(request).toLowerCase().includes(word));
const mapped = (request, ids) => { const wanted = new Set((ids || []).map(String)); return wanted.has(statusId(request)) || wanted.has(status(request)); };

async function resize() { try { await view.resize(); } catch (_) {} }
function setCardVisible(id, visible) { const el = document.getElementById(id); if (el?.closest('.card')) el.closest('.card').style.display = visible ? '' : 'none'; }
function csvCell(value) { const s = safe(value).replace(/"/g, '""'); return `"${s}"`; }
async function navigate(url) { if (!url) return; try { await router.navigate(url); } catch (_) { try { window.open(url, '_top'); } catch (_) {} } }

function renderCategories(config) {
  const categories = Array.isArray(config?.categories) ? config.categories.filter((c) => Array.isArray(c.requestTypes) && c.requestTypes.length) : [];
  const section = document.getElementById('quick-actions-section');
  const host = document.getElementById('quick-actions');
  if (!categories.length || !config?.serviceDeskId) { section.hidden = true; host.innerHTML = ''; return; }
  host.innerHTML = categories.map((category) => `<div class="quick-category"><h4>${esc(category.name)}</h4>${category.description ? `<p>${esc(category.description)}</p>` : ''}<div class="quick-links">${category.requestTypes.map((rt) => `<button class="quick-link quick-button" type="button" data-url="/servicedesk/customer/portal/${encodeURIComponent(config.serviceDeskId)}/create/${encodeURIComponent(rt.id)}">${esc(rt.name)}</button>`).join('')}</div></div>`).join('');
  section.hidden = false;
  host.querySelectorAll('[data-url]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.url)));
}

function exportRows(requests) {
  const headers = ['Key','Summary','Request type','Status','Created','Updated'];
  const rows = requests.map((request) => [request.issueKey || request.key, summary(request), request.requestType?.name || '', status(request), request.createdDate?.iso8601 || request.createdDate?.friendly || '', request.updatedDate?.iso8601 || request.updatedDate?.friendly || '']);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

async function exportCsv() {
  const button = document.getElementById('exportCsv'); const message = document.getElementById('export-message');
  button.disabled = true; message.hidden = false; message.textContent = 'Preparing CSV…';
  try {
    const data = await invoke('getExportRequests'); const values = Array.isArray(data?.values) ? data.values : [];
    if (!values.length) { message.textContent = 'There are no visible requests to export.'; return; }
    const blob = new Blob(['\ufeff', exportRows(values)], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `portal-plus-requests-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    message.textContent = `${values.length} request${values.length === 1 ? '' : 's'} exported${data?.truncated ? ' (limited to first 1,000)' : ''}.`;
  } catch (error) { message.textContent = `Export failed: ${error?.message || String(error)}`; }
  finally { button.disabled = false; await resize(); }
}

async function load() {
  try {
    const result = await invoke('getDashboard'); const data = result?.requests || {}; const config = result?.config || {}; const values = Array.isArray(data?.values) ? data.values : []; const mapping = config.statusMapping || {}; const options = config.dashboard || {};
    const title = document.querySelector('.top h2'); if (title && config.displayName) title.textContent = config.displayName;
    document.getElementById('total').textContent = data?.size ?? values.length; document.getElementById('open').textContent = values.filter((request) => !closed(request)).length; document.getElementById('awaiting-you').textContent = values.filter((request) => mapped(request, mapping.awaitingCustomer)).length; document.getElementById('awaiting-support').textContent = values.filter((request) => mapped(request, mapping.awaitingSupport)).length;
    setCardVisible('open', options.open !== false); setCardVisible('awaiting-you', options.awaitingCustomer !== false); setCardVisible('awaiting-support', options.awaitingSupport !== false); renderCategories(config);
    const recentSection = document.querySelector('.recent-section'); if (recentSection) recentSection.style.display = options.recent !== false ? '' : 'none';
    if (!values.length) { box.className = 'message empty'; box.innerHTML = '<strong>No requests yet.</strong><span>Choose a quick action below or use the standard portal options to contact support.</span>'; return; }
    box.className = 'requests';
    box.innerHTML = values.slice(0, 5).map((request) => { const url = safe(request._links?.web || ''); return `<button class="request request-button" type="button" data-request-url="${esc(url)}"><div class="key">${esc(request.issueKey || request.key)}</div><div class="summary">${esc(summary(request))}</div><div class="status">${esc(status(request))}</div></button>`; }).join('');
    box.querySelectorAll('[data-request-url]').forEach((button) => { if (button.dataset.requestUrl) button.addEventListener('click', () => navigate(button.dataset.requestUrl)); else button.disabled = true; });
  } catch (error) { box.className = 'message error'; box.textContent = `Could not load Portal+ dashboard: ${error?.message || String(error)}`; }
  finally { await resize(); }
}

document.getElementById('exportCsv').addEventListener('click', exportCsv);
window.addEventListener('load', async () => { await resize(); await load(); });
