import { router } from '@forge/bridge';
import { renderCompanionModule, renderReportCards, renderReportCharts } from './module-renderers.js';
import { buildCustomerReport } from '../../../src/self-service-contract.js';

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

// Renders from the dashboard the main portal script already loaded (it emits
// portalplus:dashboard after each load), rather than fetching it a second time.
function enhance(result) {
  try {
    if (!result?.audienceAllowed) return;
    renderReports(result.selfService);
    const modules = Array.isArray(result.integrations) ? result.integrations : [];
    renderModule(modules.find((module) => module.id === 'assets'), 'assets-section', 'assets-module');
    renderModule(modules.find((module) => module.id === 'smart-approval'), 'approvals-section', 'approvals-module');
    window.dispatchEvent(new CustomEvent('portalplus:enhancements-ready', { detail: { selfService: result.selfService, integrations: modules } }));
  } catch (_) {
    // Optional enhancement failure must never block the core customer dashboard.
  }
}

window.addEventListener('portalplus:dashboard', (event) => enhance(event.detail));
