import { invoke, view } from '@forge/bridge';

const box = document.getElementById('requests');
const safe = (value) => value == null ? '' : String(value);
const esc = (value) => safe(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const summary = (request) => safe(request.requestFieldValues?.find?.((field) => field.fieldId === 'summary')?.value || request.summary || request.requestType?.name || 'Service request');
const status = (request) => safe(request.currentStatus?.status || request.status?.name || 'Open');
const closed = (request) => ['closed','resolved','done','cancelled','canceled'].some((word) => status(request).toLowerCase().includes(word));

async function resize() {
  try { await view.resize(); } catch (_) {}
}

async function load() {
  try {
    const data = await invoke('getMyRequests');
    const values = Array.isArray(data?.values) ? data.values : [];
    document.getElementById('total').textContent = data?.size ?? values.length;
    document.getElementById('open').textContent = values.filter((request) => !closed(request)).length;

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
    box.textContent = `Could not load request data: ${error?.message || String(error)}`;
  } finally {
    await resize();
  }
}

window.addEventListener('load', async () => {
  await resize();
  await load();
});
