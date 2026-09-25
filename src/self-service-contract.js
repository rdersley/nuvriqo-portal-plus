export const SELF_SERVICE_CONTRACT_VERSION = 1;
export const MAX_REQUEST_COLUMNS = 8;
export const MAX_DETAIL_FIELDS = 16;

const safeString = (value, fallback = '') => value == null ? fallback : String(value).trim();
const safeArray = (value) => Array.isArray(value) ? value : [];

export const SELF_SERVICE_FEATURES = Object.freeze({
  readOnlyFields: 'read-only-fields',
  editableFields: 'editable-fields',
  slaVisibility: 'sla-visibility',
  requestColumns: 'request-columns',
  audienceRequestTypes: 'audience-request-types',
  reporting: 'reporting',
  export: 'export',
  advancedSearch: 'advanced-search',
  relatedRequests: 'related-requests',
  assets: 'assets',
  customerActions: 'customer-actions',
  multiExperience: 'multi-experience'
});

export function normalizePortalField(field = {}) {
  const id = safeString(field.id || field.fieldId);
  if (!id) throw new Error('Customer-visible field requires an id.');
  const mode = ['read-only', 'editable'].includes(field.mode) ? field.mode : 'read-only';
  return {
    id,
    name: safeString(field.name, id).slice(0, 100),
    // Jira schema type/custom key, captured from discovery at publish time so
    // customer edits can be validated and shaped for the Jira REST API.
    type: safeString(field.type || field?.jiraSchema?.type).slice(0, 60),
    custom: safeString(field.custom || field?.jiraSchema?.custom).slice(0, 200),
    mode,
    showInList: field.showInList === true,
    showInDetails: field.showInDetails !== false,
    editableAfterSubmission: mode === 'editable' && field.editableAfterSubmission === true,
    requiredWhenEditing: mode === 'editable' && field.requiredWhenEditing === true,
    helpText: safeString(field.helpText).slice(0, 240)
  };
}

export function normalizeSelfServiceConfig(config = {}) {
  const fields = safeArray(config.fields).map(normalizePortalField).slice(0, MAX_DETAIL_FIELDS);
  const listFields = fields.filter((field) => field.showInList).slice(0, MAX_REQUEST_COLUMNS);
  return {
    contractVersion: SELF_SERVICE_CONTRACT_VERSION,
    fields,
    listFields,
    sla: {
      enabled: config?.sla?.enabled === true,
      showStatus: config?.sla?.showStatus !== false,
      showTarget: config?.sla?.showTarget !== false,
      showElapsed: config?.sla?.showElapsed === true
    },
    reporting: {
      enabled: config?.reporting?.enabled === true,
      createdVsResolved: config?.reporting?.createdVsResolved !== false,
      byRequestType: config?.reporting?.byRequestType !== false,
      byStatus: config?.reporting?.byStatus !== false,
      slaPerformance: config?.reporting?.slaPerformance !== false,
      averageResolutionTime: config?.reporting?.averageResolutionTime !== false
    },
    export: {
      csv: config?.export?.csv !== false,
      excel: config?.export?.excel === true
    },
    relatedRequests: config?.relatedRequests === true,
    customerActions: normalizeCustomerActions(config?.customerActions)
  };
}

const MAX_ACTION_STATUSES = 10;
const statusIdList = (value) => [...new Set(safeArray(value).map((id) => safeString(id)).filter(Boolean))].slice(0, MAX_ACTION_STATUSES);

// Customer actions only ever run a Jira transition whose destination status an
// administrator explicitly chose. An action with no target statuses is inert.
export function normalizeCustomerActions(actions = {}) {
  const closeStatusIds = statusIdList(actions?.closeStatusIds);
  const escalateStatusIds = statusIdList(actions?.escalateStatusIds);
  return {
    closeRequest: actions?.closeRequest === true && closeStatusIds.length > 0,
    closeStatusIds,
    escalate: actions?.escalate === true && escalateStatusIds.length > 0,
    escalateStatusIds,
    auditComments: actions?.auditComments !== false
  };
}

const requestStatus = (request) => safeString(request?.status || request?.currentStatus?.status || 'Open');
const requestType = (request) => {
  const value = request?.requestType;
  return safeString((value && typeof value === 'object' ? value.name : value) || 'Unknown');
};
const parseDate = (value) => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : null;
};
const isResolved = (request) => ['closed', 'resolved', 'done', 'cancelled', 'canceled'].some((word) => requestStatus(request).toLowerCase().includes(word));

export function buildCustomerReport(requests = [], now = Date.now()) {
  const values = safeArray(requests);
  const byStatus = new Map();
  const byRequestType = new Map();
  let resolved = 0;
  let resolutionMs = 0;
  let resolutionSamples = 0;
  let slaMet = 0;
  let slaBreached = 0;

  for (const request of values) {
    const status = requestStatus(request);
    const type = requestType(request);
    byStatus.set(status, (byStatus.get(status) || 0) + 1);
    byRequestType.set(type, (byRequestType.get(type) || 0) + 1);

    if (isResolved(request)) {
      resolved += 1;
      const created = parseDate(request.created || request?.createdDate?.iso8601);
      const resolvedAt = parseDate(request.resolved || request.resolutionDate || request?.resolvedDate?.iso8601 || request.updated || request?.updatedDate?.iso8601);
      if (created != null && resolvedAt != null && resolvedAt >= created) {
        resolutionMs += resolvedAt - created;
        resolutionSamples += 1;
      }
    }

    const slaState = safeString(request?.sla?.state).toLowerCase();
    if (slaState === 'met') slaMet += 1;
    if (slaState === 'breached') slaBreached += 1;
  }

  const trendDays = 30;
  const dayMs = 86400000;
  const endDay = new Date(now); endDay.setUTCHours(0,0,0,0);
  const startDay = new Date(endDay.getTime() - ((trendDays - 1) * dayMs));
  const trend = Array.from({ length: trendDays }, (_, index) => {
    const day = new Date(startDay.getTime() + (index * dayMs));
    return { date: day.toISOString().slice(0,10), created: 0, resolved: 0 };
  });
  const trendByDate = new Map(trend.map((row) => [row.date, row]));
  for (const request of values) {
    const created = parseDate(request.created || request?.createdDate?.iso8601);
    if (created != null) {
      const key = new Date(created).toISOString().slice(0,10);
      if (trendByDate.has(key)) trendByDate.get(key).created += 1;
    }
    if (isResolved(request)) {
      const resolvedAt = parseDate(request.resolved || request.resolutionDate || request?.resolvedDate?.iso8601 || request.updated || request?.updatedDate?.iso8601);
      if (resolvedAt != null) {
        const key = new Date(resolvedAt).toISOString().slice(0,10);
        if (trendByDate.has(key)) trendByDate.get(key).resolved += 1;
      }
    }
  }

  return {
    total: values.length,
    created: values.length,
    resolved,
    open: values.length - resolved,
    byStatus: [...byStatus.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    byRequestType: [...byRequestType.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
    trend,
    sla: { met: slaMet, breached: slaBreached, measured: slaMet + slaBreached },
    averageResolutionMs: resolutionSamples ? Math.round(resolutionMs / resolutionSamples) : null,
    generatedAt: new Date(now).toISOString()
  };
}

export function featurePriorityPlan() {
  return [
    { priority: 'P0', feature: SELF_SERVICE_FEATURES.readOnlyFields, reason: 'Largest validated portal demand and foundation for richer request detail.' },
    { priority: 'P0', feature: SELF_SERVICE_FEATURES.slaVisibility, reason: 'High customer demand and major self-service transparency gap.' },
    { priority: 'P0', feature: SELF_SERVICE_FEATURES.requestColumns, reason: 'Directly improves My Requests and builds on existing Portal+ request explorer.' },
    { priority: 'P0', feature: SELF_SERVICE_FEATURES.advancedSearch, reason: 'Required once richer fields and larger request histories are exposed.' },
    { priority: 'P0', feature: SELF_SERVICE_FEATURES.export, reason: 'Existing Nuvriqo capability can be consolidated into Portal+.' },
    { priority: 'P1', feature: SELF_SERVICE_FEATURES.reporting, reason: 'Strong commercial differentiator and validated customer demand.' },
    { priority: 'P1', feature: SELF_SERVICE_FEATURES.audienceRequestTypes, reason: 'Extends existing organisation-specific experience routing.' },
    { priority: 'P1', feature: SELF_SERVICE_FEATURES.assets, reason: 'Companion integration already under active development.' },
    { priority: 'P1', feature: SELF_SERVICE_FEATURES.customerActions, reason: 'Reduces agent contacts for common lifecycle actions.' },
    { priority: 'P1', feature: SELF_SERVICE_FEATURES.editableFields, reason: 'Powerful feature but requires careful permission and field-type controls.' },
    { priority: 'P2', feature: SELF_SERVICE_FEATURES.relatedRequests, reason: 'Useful after request detail and search foundations are stable.' },
    { priority: 'P2', feature: SELF_SERVICE_FEATURES.multiExperience, reason: 'Continue and deepen the original tailored multi-help-centre concept.' }
  ];
}
