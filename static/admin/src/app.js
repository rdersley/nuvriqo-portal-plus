import { invoke, view } from '@forge/bridge';

const $ = (id) => document.getElementById(id);

function selectedValues(select) {
  return [...select.selectedOptions].map((option) => option.value);
}

function setSelected(select, values = []) {
  const wanted = new Set(values.map(String));
  [...select.options].forEach((option) => {
    option.selected = wanted.has(String(option.value));
  });
}

function fillMultiSelect(select, items, emptyLabel) {
  select.innerHTML = '';
  if (!items.length) {
    const option = document.createElement('option');
    option.disabled = true;
    option.textContent = emptyLabel;
    select.appendChild(option);
    select.disabled = true;
    return;
  }
  for (const item of items) {
    const option = document.createElement('option');
    option.value = String(item.id);
    option.textContent = item.name;
    select.appendChild(option);
  }
  select.disabled = false;
}

function applyConfig(config) {
  if (!config) return;
  $('displayName').value = config.displayName || 'Service dashboard';
  $('dashOpen').checked = config.dashboard?.open !== false;
  $('dashCustomer').checked = config.dashboard?.awaitingCustomer !== false;
  $('dashSupport').checked = config.dashboard?.awaitingSupport !== false;
  $('dashRecent').checked = config.dashboard?.recent !== false;
  setSelected($('organizations'), config.audienceOrganizationIds || []);
  setSelected($('awaitingCustomer'), config.statusMapping?.awaitingCustomer || []);
  setSelected($('awaitingSupport'), config.statusMapping?.awaitingSupport || []);
}

function renderRequestTypes(items) {
  if (!items.length) {
    $('requestTypes').textContent = 'No customer request types were discovered.';
    return;
  }
  $('requestTypes').innerHTML = items
    .map((item) => `<div style="padding:7px 0;border-bottom:1px solid #ebecf0"><strong>${escapeHtml(item.name)}</strong>${item.description ? `<div>${escapeHtml(item.description)}</div>` : ''}</div>`)
    .join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

async function discover() {
  $('save').disabled = true;
  $('status').className = 'status loading';
  $('status').textContent = 'Discovering this Jira Service Management space…';

  try {
    const data = await invoke('getDiscovery');
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
    $('status').textContent = `Portal+ discovery failed: ${error?.message || String(error)}`;
  } finally {
    try { await view.resize(); } catch (_) {}
  }
}

async function save() {
  $('save').disabled = true;
  $('status').className = 'status loading';
  $('status').textContent = 'Saving Portal+ configuration…';

  try {
    await invoke('saveConfig', {
      displayName: $('displayName').value,
      dashboard: {
        open: $('dashOpen').checked,
        awaitingCustomer: $('dashCustomer').checked,
        awaitingSupport: $('dashSupport').checked,
        recent: $('dashRecent').checked
      },
      audienceOrganizationIds: selectedValues($('organizations')),
      statusMapping: {
        awaitingCustomer: selectedValues($('awaitingCustomer')),
        awaitingSupport: selectedValues($('awaitingSupport'))
      }
    });
    $('status').className = 'status ok';
    $('status').textContent = 'Portal+ configuration saved.';
  } catch (error) {
    $('status').className = 'status error';
    $('status').textContent = `Could not save configuration: ${error?.message || String(error)}`;
  } finally {
    $('save').disabled = false;
    try { await view.resize(); } catch (_) {}
  }
}

$('reload').addEventListener('click', discover);
$('save').addEventListener('click', save);
window.addEventListener('load', discover);
