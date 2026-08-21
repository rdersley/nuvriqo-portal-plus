import { invoke, view } from '@forge/bridge';

const $ = (id) => document.getElementById(id);

function selectedValues(select) { return [...select.selectedOptions].map((option) => option.value); }
function setSelected(select, values = []) { const wanted = new Set(values.map(String)); [...select.options].forEach((option) => { option.selected = wanted.has(String(option.value)); }); }
function fillMultiSelect(select, items, emptyLabel) { select.innerHTML = ''; if (!items.length) { const option = document.createElement('option'); option.disabled = true; option.textContent = emptyLabel; select.appendChild(option); select.disabled = true; return; } for (const item of items) { const option = document.createElement('option'); option.value = String(item.id); option.textContent = item.name; select.appendChild(option); } select.disabled = false; }
function applyConfig(config) { if (!config) return; $('displayName').value = config.displayName || 'Service dashboard'; $('dashOpen').checked = config.dashboard?.open !== false; $('dashCustomer').checked = config.dashboard?.awaitingCustomer !== false; $('dashSupport').checked = config.dashboard?.awaitingSupport !== false; $('dashRecent').checked = config.dashboard?.recent !== false; setSelected($('organizations'), config.audienceOrganizationIds || []); setSelected($('awaitingCustomer'), config.statusMapping?.awaitingCustomer || []); setSelected($('awaitingSupport'), config.statusMapping?.awaitingSupport || []); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char])); }
function renderRequestTypes(items) { if (!items.length) { $('requestTypes').textContent = 'No customer request types were discovered.'; return; } $('requestTypes').innerHTML = items.map((item) => `<div><strong>${escapeHtml(item.name)}</strong>${item.description ? ` — ${escapeHtml(item.description)}` : ''}</div>`).join(''); }
function errorText(error) { if (!error) return 'Unknown error'; if (typeof error === 'string') return error; return error.message || error.error?.message || JSON.stringify(error); }

async function discover() {
  $('save').disabled = true;
  $('status').className = 'status loading';
  $('status').textContent = 'Checking Forge bridge…';
  try {
    const health = await Promise.race([invoke('health'), new Promise((_, reject) => setTimeout(() => reject(new Error('Forge resolver did not respond within 12 seconds.')), 12000))]);
    if (!health?.ok) throw new Error('Admin resolver health check did not return OK.');
    $('status').textContent = 'Resolver connected. Discovering this Jira Service Management space…';
    const data = await Promise.race([invoke('getDiscovery'), new Promise((_, reject) => setTimeout(() => reject(new Error('JSM discovery did not complete within 20 seconds.')), 20000))]);
    const deskName = data.serviceDesk?.projectName || data.serviceDesk?.projectKey || `Service desk ${data.serviceDesk?.id}`;
    $('serviceDesk').value = deskName;
    const summary = $('discoverySummary').children;
    summary[0].querySelector('strong').textContent = data.requestTypes?.length ?? 0;
    summary[1].querySelector('strong').textContent = data.organizations?.length ?? 0;
    summary[2].querySelector('strong').textContent = data.statuses?.length ?? 0;
    summary[3].querySelector('strong').textContent = data.project?.key || data.project?.id || '—';
    fillMultiSelect($('organizations'), data.organizations || [], 'No organizations were returned for this service desk');
    fillMultiSelect($('awaitingCustomer'), data.statuses || [], 'No customer statuses were discovered');
    fillMultiSelect($('awaitingSupport'), data.statuses || [], 'No customer statuses were discovered');
    renderRequestTypes(data.requestTypes || []);
    applyConfig(data.config);
    $('status').className = 'status ok';
    $('status').textContent = `Discovery complete — connected to ${deskName}.`;
    $('save').disabled = false;
  } catch (error) {
    $('status').className = 'status error';
    $('status').textContent = `Portal+ discovery failed: ${errorText(error)}`;
    $('requestTypes').textContent = 'Discovery did not complete. Use Refresh discovery after the issue above is corrected.';
  } finally { try { await view.resize(); } catch (_) {} }
}

async function save() {
  $('save').disabled = true; $('status').className = 'status loading'; $('status').textContent = 'Saving Portal+ configuration…';
  try { await invoke('saveConfig', { displayName: $('displayName').value, dashboard: { open: $('dashOpen').checked, awaitingCustomer: $('dashCustomer').checked, awaitingSupport: $('dashSupport').checked, recent: $('dashRecent').checked }, audienceOrganizationIds: selectedValues($('organizations')), statusMapping: { awaitingCustomer: selectedValues($('awaitingCustomer')), awaitingSupport: selectedValues($('awaitingSupport')) } }); $('status').className = 'status ok'; $('status').textContent = 'Portal+ configuration saved.'; }
  catch (error) { $('status').className = 'status error'; $('status').textContent = `Could not save configuration: ${errorText(error)}`; }
  finally { $('save').disabled = false; try { await view.resize(); } catch (_) {} }
}

$('reload').addEventListener('click', discover);
$('save').addEventListener('click', save);
window.addEventListener('DOMContentLoaded', discover);
