import { invoke } from '@forge/bridge';

const q = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function renderModule(module, sectionId, hostId) {
  const section = q(sectionId);
  const host = q(hostId);
  if (!section || !host || !module) {
    if (section) section.hidden = true;
    return;
  }

  const counters = (module.counters || []).map((counter) => `
    <div class="companion-stat"><strong>${esc(counter.value)}</strong><span>${esc(counter.label)}</span></div>
  `).join('');
  const rows = (module.items || []).map((item) => `
    <button type="button" class="companion-row" data-url="${esc(item.url || '')}">
      <span><strong>${esc(item.title)}</strong><small>${esc(item.subtitle || '')}</small></span>
      <span class="companion-badge">${esc(item.badge || item.status || '')}</span>
    </button>
  `).join('');

  host.innerHTML = `<div class="companion-stats">${counters}</div><div class="companion-list">${rows || '<div class="companion-empty">Nothing needs your attention right now.</div>'}</div>`;
  section.hidden = false;
  host.querySelectorAll('[data-url]').forEach((button) => {
    button.onclick = () => {
      const url = button.dataset.url;
      if (url) window.top.location.href = url;
    };
  });
}

function bars(items = []) {
  const max = Math.max(1, ...items.map((item) => Number(item.value) || 0));
  return items.slice(0, 8).map((item) => `
    <div class="mini-bar-row"><span>${esc(item.label)}</span><i><b style="width:${Math.max(3, Math.round((Number(item.value || 0) / max) * 100))}%"></b></i><strong>${esc(item.value)}</strong></div>
  `).join('');
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

  const average = report.averageResolutionMs == null ? '—' : `${Math.max(0.1, report.averageResolutionMs / 86400000).toFixed(1)} days`;
  const slaPercent = report.sla?.measured ? Math.round((report.sla.met / report.sla.measured) * 100) : null;
  cards.innerHTML = `
    <div class="report-card"><strong>${report.created}</strong><span>Requests created</span></div>
    <div class="report-card"><strong>${report.resolved}</strong><span>Requests resolved</span></div>
    <div class="report-card"><strong>${slaPercent == null ? '—' : `${slaPercent}%`}</strong><span>SLA met</span></div>
    <div class="report-card"><strong>${esc(average)}</strong><span>Average resolution</span></div>`;
  charts.innerHTML = `
    <article class="report-panel"><h4>Requests by type</h4>${bars(report.byRequestType)}</article>
    <article class="report-panel"><h4>Tickets by status</h4>${bars(report.byStatus)}</article>
    <article class="report-panel"><h4>SLA performance</h4><div class="sla-summary"><strong>${report.sla?.met || 0}</strong><span>Met</span><strong>${report.sla?.breached || 0}</strong><span>Breached</span></div></article>
    <article class="report-panel"><h4>Created vs resolved</h4><div class="created-resolved"><div><span>Created</span><strong>${report.created}</strong></div><div><span>Resolved</span><strong>${report.resolved}</strong></div><div><span>Open</span><strong>${report.open}</strong></div></div></article>`;
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

async function start() {
  try {
    const result = await Promise.race([
      invoke('getDashboard'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Portal+ enhancement timeout')), 10000))
    ]);
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

window.addEventListener('load', () => setTimeout(start, 50));
