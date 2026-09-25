import { router } from '@forge/bridge';
import { renderCompanionModule, renderReportCards, renderReportCharts } from './module-renderers.js';

const q = (id) => document.getElementById(id);

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

function renderReports(selfService) {
  const section = q('reports-section');
  const cards = q('report-cards');
  const charts = q('report-charts');
  const report = selfService?.report;
  if (!section || !cards || !charts || !selfService?.reporting?.enabled || !report) {
    if (section) section.hidden = true;
    return;
  }
  cards.innerHTML = renderReportCards(report);
  charts.innerHTML = renderReportCharts(report);
  section.hidden = false;
}

function renderSlaCapability(selfService) {
  if (!selfService?.sla?.enabled) return;
  document.querySelectorAll('.request').forEach((row) => {
    if (row.querySelector('.sla-pill')) return;
    const pill = document.createElement('span');
    pill.className = 'sla-pill';
    pill.textContent = 'SLA';
    row.appendChild(pill);
  });
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
    renderSlaCapability(result.selfService);
    window.dispatchEvent(new CustomEvent('portalplus:enhancements-ready', { detail: { selfService: result.selfService, integrations: modules } }));
  } catch (_) {
    // Optional enhancement failure must never block the core customer dashboard.
  }
}

window.addEventListener('portalplus:dashboard', (event) => enhance(event.detail));
