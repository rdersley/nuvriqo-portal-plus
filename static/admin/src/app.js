import { invoke, view } from '@forge/bridge';

const $ = (id) => document.getElementById(id);
let discoveredRequestTypes = [];
let currentServiceDeskId = '';
let categoryState = [];
let loadedConfig = null;
let suppressDirty = false;

function selectedValues(select) { return [...select.selectedOptions].map((option) => option.value); }
function setSelected(select, values = []) { const wanted = new Set(values.map(String)); [...select.options].forEach((option) => { option.selected = wanted.has(String(option.value)); }); }
function fillMultiSelect(select, items, emptyLabel) { select.innerHTML = ''; if (!items.length) { const option = document.createElement('option'); option.disabled = true; option.textContent = emptyLabel; select.appendChild(option); select.disabled = true; return; } for (const item of items) { const option = document.createElement('option'); option.value = String(item.id); option.textContent = item.name; select.appendChild(option); } select.disabled = false; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char])); }
function errorText(error) { if (!error) return 'Unknown error'; if (typeof error === 'string') return error; return error.message || error.error?.message || JSON.stringify(error); }
function uid() { return `category-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
function defaultCategories() { return [{ id: uid(), name: 'Get help', description: 'Choose the service you need', requestTypeIds: discoveredRequestTypes.map((rt) => String(rt.id)) }]; }

function setDirty(dirty) {
  if (suppressDirty) return;
  const indicator = $('dirtyIndicator');
  indicator.className = `dirty-indicator ${dirty ? 'dirty' : 'clean'}`;
  indicator.textContent = dirty ? 'Unsaved changes' : 'Saved';
}

function renderRequestTypes(items) { if (!items.length) { $('requestTypes').textContent = 'No customer request types were discovered.'; return; } $('requestTypes').innerHTML = items.map((item) => `<div><strong>${escapeHtml(item.name)}</strong>${item.description ? ` — ${escapeHtml(item.description)}` : ''}</div>`).join(''); }

function syncCategoryStateFromDom() {
  if (!document.querySelector('.category')) return;
  categoryState = readCategoriesFromDom().map((c) => ({ id:c.id,name:c.name,description:c.description,requestTypeIds:c.requestTypes.map((rt)=>rt.id) }));
}

function moveCategory(index, delta) {
  syncCategoryStateFromDom();
  const target = index + delta;
  if (target < 0 || target >= categoryState.length) return;
  [categoryState[index], categoryState[target]] = [categoryState[target], categoryState[index]];
  renderCategories(); setDirty(true);
}

function renderCategories() {
  const host = $('categories');
  if (!categoryState.length) { host.innerHTML = '<div class="muted">No categories yet. Add one to create customer quick actions.</div>'; return; }
  host.innerHTML = categoryState.map((category, index) => `<div class="category" data-category-index="${index}"><div class="category-head"><div class="field"><label>Category name</label><input class="category-name" maxlength="80" value="${escapeHtml(category.name)}"></div><div class="field"><label>Description</label><input class="category-description" maxlength="180" value="${escapeHtml(category.description || '')}" placeholder="Optional customer-facing description"></div><div class="category-actions"><button class="secondary icon move-up" type="button" title="Move up" ${index === 0 ? 'disabled' : ''}>↑</button><button class="secondary icon move-down" type="button" title="Move down" ${index === categoryState.length - 1 ? 'disabled' : ''}>↓</button><button class="danger small remove-category" type="button">Remove</button></div></div><div class="category-types">${discoveredRequestTypes.map((rt) => { const checked = (category.requestTypeIds || []).map(String).includes(String(rt.id)) ? 'checked' : ''; return `<label><input type="checkbox" class="category-request-type" value="${escapeHtml(rt.id)}" ${checked}><span><strong>${escapeHtml(rt.name)}</strong>${rt.description ? `<small>${escapeHtml(rt.description)}</small>` : ''}</span></label>`; }).join('') || '<span class="muted">No request types available.</span>'}</div></div>`).join('');
  host.querySelectorAll('.remove-category').forEach((button) => button.addEventListener('click', (event) => { syncCategoryStateFromDom(); const index = Number(event.target.closest('.category').dataset.categoryIndex); categoryState.splice(index, 1); renderCategories(); setDirty(true); }));
  host.querySelectorAll('.move-up').forEach((button) => button.addEventListener('click', (event) => moveCategory(Number(event.target.closest('.category').dataset.categoryIndex), -1)));
  host.querySelectorAll('.move-down').forEach((button) => button.addEventListener('click', (event) => moveCategory(Number(event.target.closest('.category').dataset.categoryIndex), 1)));
  host.querySelectorAll('input').forEach((input) => input.addEventListener('input', () => setDirty(true)));
}

function readCategoriesFromDom() {
  return [...document.querySelectorAll('.category')].map((el, index) => {
    const ids = [...el.querySelectorAll('.category-request-type:checked')].map((input) => input.value);
    return { id: categoryState[index]?.id || uid(), name: el.querySelector('.category-name').value.trim() || `Category ${index + 1}`, description: el.querySelector('.category-description').value.trim(), requestTypes: ids.map((id) => { const rt = discoveredRequestTypes.find((item) => String(item.id) === String(id)); return { id: String(id), name: rt?.name || 'Request' }; }) };
  });
}

function validateConfig(categories, awaitingCustomer, awaitingSupport) {
  if (!$('displayName').value.trim()) throw new Error('Display name cannot be empty.');
  const activeCategories = categories.filter((category) => category.requestTypes.length);
  const names = activeCategories.map((category) => category.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) throw new Error('Each visible service category must have a unique name.');
  const overlap = awaitingCustomer.filter((id) => awaitingSupport.includes(id));
  if (overlap.length) throw new Error('A status cannot be mapped to both Awaiting customer and Awaiting support.');
  if ($('dashCustomer').checked && !awaitingCustomer.length) throw new Error('Choose at least one status for Awaiting customer, or turn that dashboard card off.');
  if ($('dashSupport').checked && !awaitingSupport.length) throw new Error('Choose at least one status for Awaiting support, or turn that dashboard card off.');
}

function applyConfig(config) {
  suppressDirty = true;
  $('displayName').value = config?.displayName || 'Service dashboard';
  $('dashOpen').checked = config?.dashboard?.open !== false;
  $('dashCustomer').checked = config?.dashboard?.awaitingCustomer !== false;
  $('dashSupport').checked = config?.dashboard?.awaitingSupport !== false;
  $('dashRecent').checked = config?.dashboard?.recent !== false;
  setSelected($('organizations'), config?.audienceOrganizationIds || []);
  setSelected($('awaitingCustomer'), config?.statusMapping?.awaitingCustomer || []);
  setSelected($('awaitingSupport'), config?.statusMapping?.awaitingSupport || []);
  categoryState = Array.isArray(config?.categories) && config.categories.length ? config.categories.map((c) => ({ id: c.id || uid(), name: c.name || 'Category', description: c.description || '', requestTypeIds: (c.requestTypes || []).map((rt) => String(rt.id)) })) : defaultCategories();
  renderCategories();
  loadedConfig = config || null;
  $('savedAt').textContent = config?.updatedAt ? `Last saved ${new Date(config.updatedAt).toLocaleString()}` : 'Not saved yet';
  suppressDirty = false; setDirty(false);
}

function restoreDefaults() {
  suppressDirty = true;
  $('displayName').value = 'Service dashboard'; $('dashOpen').checked = true; $('dashCustomer').checked = false; $('dashSupport').checked = false; $('dashRecent').checked = true;
  setSelected($('organizations'), []); setSelected($('awaitingCustomer'), []); setSelected($('awaitingSupport'), []);
  categoryState = defaultCategories(); renderCategories(); suppressDirty = false; setDirty(true);
  $('status').className = 'status loading'; $('status').textContent = 'Defaults restored locally. Review them, then Save configuration.';
}

async function discover() {
  $('save').disabled = true; $('status').className = 'status loading'; $('status').textContent = 'Checking Forge bridge…';
  try {
    const health = await Promise.race([invoke('health'), new Promise((_, reject) => setTimeout(() => reject(new Error('Forge resolver did not respond within 12 seconds.')), 12000))]); if (!health?.ok) throw new Error('Admin resolver health check did not return OK.');
    $('status').textContent = 'Resolver connected. Discovering this Jira Service Management space…';
    const data = await Promise.race([invoke('getDiscovery'), new Promise((_, reject) => setTimeout(() => reject(new Error('JSM discovery did not complete within 20 seconds.')), 20000))]);
    currentServiceDeskId = String(data.serviceDesk?.id || ''); discoveredRequestTypes = data.requestTypes || [];
    const deskName = data.serviceDesk?.projectName || data.serviceDesk?.projectKey || `Service desk ${data.serviceDesk?.id}`; $('serviceDesk').value = deskName;
    const summary = $('discoverySummary').children; summary[0].querySelector('strong').textContent = discoveredRequestTypes.length; summary[1].querySelector('strong').textContent = data.organizations?.length ?? 0; summary[2].querySelector('strong').textContent = data.statuses?.length ?? 0; summary[3].querySelector('strong').textContent = data.project?.key || data.project?.id || '—';
    fillMultiSelect($('organizations'), data.organizations || [], 'No organizations were returned for this service desk'); fillMultiSelect($('awaitingCustomer'), data.statuses || [], 'No customer statuses were discovered'); fillMultiSelect($('awaitingSupport'), data.statuses || [], 'No customer statuses were discovered'); renderRequestTypes(discoveredRequestTypes);
    applyConfig(data.config);
    $('status').className = 'status ok'; $('status').textContent = `Discovery complete — connected to ${deskName}.`; $('save').disabled = false;
  } catch (error) { $('status').className = 'status error'; $('status').textContent = `Portal+ discovery failed: ${errorText(error)}`; $('requestTypes').textContent = 'Discovery did not complete. Use Refresh discovery after the issue above is corrected.'; }
  finally { try { await view.resize(); } catch (_) {} }
}

async function save() {
  $('save').disabled = true; $('status').className = 'status loading'; $('status').textContent = 'Validating Portal+ configuration…';
  try {
    const categories = readCategoriesFromDom(); const awaitingCustomer = selectedValues($('awaitingCustomer')); const awaitingSupport = selectedValues($('awaitingSupport')); validateConfig(categories, awaitingCustomer, awaitingSupport);
    $('status').textContent = 'Saving Portal+ configuration…';
    const saved = await invoke('saveConfig', { serviceDeskId: currentServiceDeskId, displayName: $('displayName').value.trim(), dashboard: { open: $('dashOpen').checked, awaitingCustomer: $('dashCustomer').checked, awaitingSupport: $('dashSupport').checked, recent: $('dashRecent').checked }, audienceOrganizationIds: selectedValues($('organizations')), statusMapping: { awaitingCustomer, awaitingSupport }, categories });
    categoryState = categories.map((c) => ({ id: c.id, name: c.name, description: c.description, requestTypeIds: c.requestTypes.map((rt) => rt.id) })); loadedConfig = saved; $('savedAt').textContent = saved?.updatedAt ? `Last saved ${new Date(saved.updatedAt).toLocaleString()}` : ''; setDirty(false);
    $('status').className = 'status ok'; $('status').textContent = 'Portal+ configuration saved and ready for customers.';
  } catch (error) { $('status').className = 'status error'; $('status').textContent = `Could not save configuration: ${errorText(error)}`; }
  finally { $('save').disabled = false; try { await view.resize(); } catch (_) {} }
}

$('addCategory').addEventListener('click', () => { syncCategoryStateFromDom(); categoryState.push({ id:uid(), name:`Category ${categoryState.length + 1}`, description:'', requestTypeIds:[] }); renderCategories(); setDirty(true); });
$('defaults').addEventListener('click', restoreDefaults); $('reload').addEventListener('click', discover); $('save').addEventListener('click', save);
['displayName','dashOpen','dashCustomer','dashSupport','dashRecent','organizations','awaitingCustomer','awaitingSupport'].forEach((id) => $(id).addEventListener('change', () => setDirty(true)));
window.addEventListener('beforeunload', (event) => { if ($('dirtyIndicator').classList.contains('dirty')) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('DOMContentLoaded', discover);
