import { router } from '@forge/bridge';
import { renderCompanionModule, renderReportCards, renderReportCharts } from './module-renderers.js';
import { buildCustomerReport } from '../../../src/self-service-contract.js';

const q = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BUILT_IN = { 'smart-approval': { section: 'approvals-section', host: 'approvals-module' }, assets: { section: 'assets-section', host: 'assets-module' } };

async function navigate(url) {
  if (!url) return;
  try { await router.navigate(url); } catch (_) { try { window.open(url, '_top'); } catch (_) {} }
}

function renderModule(module, sectionId, hostId) {
  const section = q(sectionId);
  const host = q(hostId);
  if (!section || !host || !module) {
    if (section) section.hidden = true;
    return;
  }
  host.innerHTML = renderCompanionModule(module);
  section.hidden = false;
  host.querySelectorAll('[data-url]').forEach((button) => { button.onclick = () => navigate(button.dataset.url); });
}

// Reports are recalculated in the browser from compact per-request rows, so
// changing the period is instant. Without rows, fall back to the server report.
function reportForPeriod(selfService, period) {
  const rows = Array.isArray(selfService?.reportRows) ? selfService.reportRows : null;
  if (!rows) return selfService?.report || null;
  if (period === 'all') return buildCustomerReport(rows);
  const since = Date.now() - Number(period) * 86400000;
  return buildCustomerReport(rows.filter((row) => Date.parse(row.created || '') >= since));
}

function renderReports(selfService) {
  const section = q('reports-section');
  const cards = q('report-cards');
  const charts = q('report-charts');
  const select = q('report-period');
  if (!section || !cards || !charts || !selfService?.reporting?.enabled || !(selfService.report || selfService.reportRows)) {
    if (section) section.hidden = true;
    return;
  }
  const draw = () => {
    const report = reportForPeriod(selfService, select?.value || 'all');
    if (!report) return;
    cards.innerHTML = renderReportCards(report);
    charts.innerHTML = renderReportCharts(report);
  };
  if (select) {
    select.hidden = !Array.isArray(selfService.reportRows);
    select.onchange = draw;
  }
  draw();
  section.hidden = false;
}

// Tabs announced by other Nuvriqo apps (project properties, see src/companion-menu.js).
// A built-in section (Approvals, My Assets) is shown even before it has data; any
// other app gets its own card section. Each section gets a tab in the blue bar.
function renderCompanionMenu(menu, modules) {
  const host = q('companion-sections');
  const nav = document.querySelector('.topnav');
  if (!host || !nav) return;
  host.innerHTML = '';
  nav.querySelectorAll('[data-companion]').forEach((button) => button.remove());
  const reports = nav.querySelector('[data-scroll="reports-section"]');
  for (const entry of Array.isArray(menu) ? menu : []) {
    const builtIn = BUILT_IN[entry.section];
    const actions = (entry.links || []).map((link, i) => ({ id: `link-${i}`, label: link.label, url: link.url }));
    if (builtIn) {
      if (!modules.some((module) => module.id === entry.section)) {
        renderModule({ id: entry.section, title: entry.label, description: entry.description, counters: [], items: [], actions }, builtIn.section, builtIn.host);
      }
      const tab = nav.querySelector(`[data-scroll="${builtIn.section}"]`);
      if (tab) tab.textContent = entry.label;
      continue;
    }
    const id = `companion-${entry.id}`;
    const section = document.createElement('section');
    section.id = id;
    section.className = 'section companion-section';
    section.innerHTML = `<div class="section-head"><div><span class="eyebrow">Connected app</span><h3>${esc(entry.label)}</h3>${entry.description ? `<p>${esc(entry.description)}</p>` : ''}</div></div>${actions.length ? `<div class="companion-actions">${actions.map((action) => `<button type="button" class="secondary-action" data-url="${esc(action.url)}">${esc(action.label)}</button>`).join('')}</div>` : ''}`;
    host.appendChild(section);
    section.querySelectorAll('[data-url]').forEach((button) => { button.onclick = () => navigate(button.dataset.url); });
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'nav-item';
    tab.dataset.scroll = id;
    tab.dataset.companion = entry.id;
    tab.textContent = entry.label;
    nav.insertBefore(tab, reports || null);
  }
  window.dispatchEvent(new CustomEvent('portalplus:nav-changed'));
}

// Renders from the dashboard the main portal script already loaded (it emits
// portalplus:dashboard after each load), rather than fetching it a second time.
function enhance(result) {
  try {
    if (!result?.audienceAllowed) return;
    renderReports(result.selfService);
    const modules = Array.isArray(result.integrations) ? result.integrations : [];
    renderModule(modules.find((module) => module.id === 'assets'), 'assets-section', 'assets-module');
    renderModule(modules.find((module) => module.id === 'smart-approval'), 'approvals-section', 'approvals-module');
    renderCompanionMenu(result.menu, modules);
    window.dispatchEvent(new CustomEvent('portalplus:enhancements-ready', { detail: { selfService: result.selfService, integrations: modules } }));
  } catch (_) {
    // Optional enhancement failure must never block the core customer dashboard.
  }
}

window.addEventListener('portalplus:dashboard', (event) => enhance(event.detail));
