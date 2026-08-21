import { invoke, view } from '@forge/bridge';

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

async function load() {
  try {
    const result = await invoke('getDashboard');
    const data = result?.requests || {};
    const config = result?.config || {};
    const values = Array.isArray(data?.values) ? data.values : [];
    const mapping = config.statusMapping || {};
    const options = config.dashboard || {};

    const title = document.querySelector('.top h2');
    if (title && config.displayName) title.textContent = config.displayName;

    document.getElementById('total').textContent = data?.size ?? values.length;
    document.getElementById('open').textContent = values.filter((request) => !closed(request)).length;
    document.getElementById('awaiting-you').textContent = values.filter((request) => mapped(request, mapping.awaitingCustomer)).length;
    document.getElementById('awaiting-support').textContent = values.filter((request) => mapped(request, mapping.awaitingSupport)).length;

    setCardVisible('open', options.open !== false);
    setCardVisible('awaiting-you', options.awaitingCustomer !== false);
    setCardVisible('awaiting-support', options.awaitingSupport !== false);

    const recentSection = box.closest('.section');
    if (recentSection) recentSection.style.display = options.recent !== false ? '' : 'none';

    if (!values.length) {
      box.className = 'message';
      box.textContent = 'No requests are currently visible to this account.';
      return;
    }

    box.className = 'requests';
    box.innerHTML = values.slice(0, 4).map((request) => `
      <div class="request">
        <div class="key">${esc(request.issueKey || request.key)}</div>
        <div class="summary">${esc(summary(request))}</div>
        <div class="status">${esc(status(request))}</div>
      </div>`).join('');
  } catch (error) {
    box.className = 'message error';
    box.textContent = `Could not load Portal+ dashboard: ${error?.message || String(error)}`;
  } finally { await resize(); }
}

window.addEventListener('load', async () => { await resize(); await load(); });
