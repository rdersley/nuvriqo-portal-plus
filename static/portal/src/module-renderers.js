const safe = (value) => value == null ? '' : String(value);
const esc = (value) => safe(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const list = (value) => Array.isArray(value) ? value : [];

export function formatDuration(ms) {
  if (ms == null || ms === '') return '—';
  const value = Number(ms);
  if (!Number.isFinite(value) || value < 0) return '—';
  const days = value / 86400000;
  if (days >= 1) return `${days < 10 ? days.toFixed(1) : Math.round(days)} days`;
  const hours = value / 3600000;
  if (hours >= 1) return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} hours`;
  return `${Math.max(1, Math.round(value / 60000))} min`;
}

export function renderReportCards(report = {}) {
  const measured = Number(report?.sla?.measured || 0);
  const met = Number(report?.sla?.met || 0);
  const slaPercent = measured ? Math.round((met / measured) * 100) : null;
  const cards = [
    ['Requests created', Number(report.total || report.created || 0), 'blue', '▣'],
    ['Requests resolved', Number(report.resolved || 0), 'green', '✓'],
    ['SLA met', slaPercent == null ? '—' : `${slaPercent}%`, 'mint', '◉'],
    ['Average resolution', formatDuration(report.averageResolutionMs), 'amber', '⌁']
  ];
  return cards.map(([label, value, tone, icon]) => `<article class="report-card"><span class="report-icon ${tone}">${icon}</span><div><strong>${esc(value)}</strong><span>${esc(label)}</span></div></article>`).join('');
}

function barRows(items = [], maxItems = 6) {
  const rows = list(items).slice(0, maxItems);
  const max = Math.max(1, ...rows.map((item) => Number(item?.value || 0)));
  return rows.map((item) => {
    const value = Number(item?.value || 0);
    const width = Math.max(4, Math.round((value / max) * 100));
    return `<div class="mini-bar-row"><span>${esc(item?.label || 'Unknown')}</span><div><i style="width:${width}%"></i></div><strong>${value}</strong></div>`;
  }).join('') || '<div class="empty-mini">No data yet</div>';
}

export function renderReportCharts(report = {}) {
  const measured = Number(report?.sla?.measured || 0);
  const met = Number(report?.sla?.met || 0);
  const breached = Number(report?.sla?.breached || 0);
  const percent = measured ? Math.round((met / measured) * 100) : 0;
  return [
    `<article class="report-panel"><div class="report-panel-head"><strong>Requests by type</strong><span>${Number(report.total || 0)} total</span></div>${barRows(report.byRequestType)}</article>`,
    `<article class="report-panel"><div class="report-panel-head"><strong>Tickets by status</strong><span>Current view</span></div>${barRows(report.byStatus)}</article>`,
    `<article class="report-panel"><div class="report-panel-head"><strong>SLA performance</strong><span>${measured} measured</span></div><div class="donut-wrap"><div class="donut" style="--percent:${percent}"><strong>${measured ? `${percent}%` : '—'}</strong><span>met</span></div><div class="donut-legend"><span><i class="dot met"></i>Met <b>${met}</b></span><span><i class="dot breached"></i>Breached <b>${breached}</b></span></div></div></article>`,
    `<article class="report-panel"><div class="report-panel-head"><strong>Created vs resolved</strong><span>Visible requests</span></div><div class="created-resolved"><div><span>Created</span><strong>${Number(report.created || report.total || 0)}</strong></div><div><span>Resolved</span><strong>${Number(report.resolved || 0)}</strong></div><div><span>Open</span><strong>${Number(report.open || 0)}</strong></div></div></article>`
  ].join('');
}

export function renderCompanionModule(module = {}) {
  const counters = list(module.counters).slice(0, 4);
  const items = list(module.items).slice(0, 8);
  const actions = list(module.actions).slice(0, 3);
  return `<div class="companion-card"><div class="companion-summary">${counters.map((counter) => `<div class="companion-counter"><strong>${Number(counter?.value || 0)}</strong><span>${esc(counter?.label || '')}</span></div>`).join('')}</div>${items.length ? `<div class="companion-items">${items.map((item) => `<button type="button" class="companion-item" data-url="${esc(item?.url || '')}"><span><strong>${esc(item?.title || 'Item')}</strong><small>${esc(item?.subtitle || '')}</small></span><span class="companion-badge">${esc(item?.badge || item?.status || '')}</span></button>`).join('')}</div>` : `<div class="companion-empty"><strong>You're all up to date!</strong><span>${esc(module.description || 'Nothing needs your attention right now.')}</span></div>`}${actions.length ? `<div class="companion-actions">${actions.map((action) => `<button type="button" class="secondary-action" data-url="${esc(action?.url || '')}">${esc(action?.label || 'Open')}</button>`).join('')}</div>` : ''}</div>`;
}

export function renderRequestDetailModel(request = {}, details = [], selfService = {}) {
  const sla = request.sla || {};
  const fields = list(details);
  const actions = selfService.customerActions || {};
  return {
    title: safe(request.summary || request.requestType || request.key || 'Service request'),
    key: safe(request.key || request.issueKey),
    status: safe(request.status || request.currentStatus?.status || 'Open'),
    fields,
    sla: {
      visible: selfService?.sla?.enabled === true,
      state: safe(sla.state || ''),
      target: safe(sla.target || sla.due || ''),
      elapsed: safe(sla.elapsed || '')
    },
    actions: {
      closeRequest: actions.closeRequest === true,
      escalate: actions.escalate === true
    }
  };
}
