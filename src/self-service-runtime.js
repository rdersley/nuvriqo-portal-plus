import { buildCustomerReport, normalizeSelfServiceConfig } from './self-service-contract.js';

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeString = (value) => value == null ? '' : String(value);

function requestFieldValue(request, fieldId) {
  const row = safeArray(request?.requestFieldValues).find((field) => String(field?.fieldId) === String(fieldId));
  return row?.value ?? null;
}

// Plain text from an Atlassian Document Format value (multi-line text fields).
export function adfToText(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return safeString(node.text);
  if (node.type === 'hardBreak') return '\n';
  const inner = safeArray(node.content).map(adfToText).join('');
  return ['paragraph', 'heading', 'listItem', 'codeBlock', 'blockquote'].includes(node.type) ? `${inner}\n\n` : inner;
}

function displayValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(', ');
  if (typeof value === 'object' && value.type === 'doc') return adfToText(value).replace(/\n{3,}/g, '\n\n').trim();
  if (typeof value === 'object') {
    for (const key of ['label', 'displayName', 'name', 'value']) {
      if (value[key] != null && typeof value[key] !== 'object') return safeString(value[key]);
    }
    return '';
  }
  return safeString(value);
}

export function buildCustomerRequestDetails(request, selfServiceConfig = {}) {
  const config = normalizeSelfServiceConfig(selfServiceConfig);
  return config.fields
    .filter((field) => field.showInDetails)
    .map((field) => {
      const raw = requestFieldValue(request, field.id);
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        custom: field.custom,
        mode: field.mode,
        editableAfterSubmission: field.editableAfterSubmission,
        requiredWhenEditing: field.requiredWhenEditing,
        helpText: field.helpText,
        value: displayValue(raw),
        optionId: raw && typeof raw === 'object' && !Array.isArray(raw) && raw.id != null ? safeString(raw.id) : ''
      };
    });
}

export function buildRequestDetailModel(request, selfServiceConfig = {}) {
  const config = normalizeSelfServiceConfig(selfServiceConfig);
  const status = safeString(request?.currentStatus?.status || request?.status?.name || 'Open');
  const key = safeString(request?.issueKey || request?.key);
  const summary = safeString(request?.summary || request?.requestType?.name || 'Service request');
  const sla = request?.sla && typeof request.sla === 'object' ? {
    state: safeString(request.sla.state),
    label: safeString(request.sla.label || request.sla.name || 'SLA'),
    target: safeString(request.sla.target),
    remaining: safeString(request.sla.remaining)
  } : null;
  return {
    key,
    summary,
    requestType: safeString(request?.requestType?.name),
    status,
    created: safeString(request?.createdDate?.iso8601),
    updated: safeString(request?.updatedDate?.iso8601),
    url: safeString(request?._links?.web),
    fields: buildCustomerRequestDetails(request, config),
    sla: config.sla.enabled ? sla : null,
    actions: {
      closeRequest: Boolean(config.customerActions.closeRequest),
      escalate: Boolean(config.customerActions.escalate)
    },
    capabilities: {
      hasEditableFields: config.fields.some((field) => field.editableAfterSubmission),
      hasVisibleFields: config.fields.some((field) => field.showInDetails),
      slaVisible: Boolean(config.sla.enabled && sla),
      relatedRequests: Boolean(config.relatedRequests)
    }
  };
}

export function buildSelfServiceDashboard({ experience = {}, requests = [] } = {}) {
  const config = normalizeSelfServiceConfig(experience.selfService || {});
  const values = safeArray(requests);
  const report = config.reporting.enabled ? buildCustomerReport(values) : null;

  return {
    contractVersion: config.contractVersion,
    fields: config.fields,
    listFields: config.listFields,
    sla: config.sla,
    reporting: config.reporting,
    report,
    export: config.export,
    relatedRequests: config.relatedRequests,
    customerActions: config.customerActions,
    capabilities: {
      readOnlyFields: config.fields.some((field) => field.mode === 'read-only'),
      editableFields: config.fields.some((field) => field.editableAfterSubmission),
      slaVisibility: config.sla.enabled,
      configurableColumns: config.listFields.length > 0,
      reporting: config.reporting.enabled,
      csvExport: config.export.csv,
      excelExport: config.export.excel,
      relatedRequests: config.relatedRequests,
      closeRequest: config.customerActions.closeRequest,
      escalate: config.customerActions.escalate
    }
  };
}

export function fieldsRequiredForSelfService(experience = {}) {
  const config = normalizeSelfServiceConfig(experience.selfService || {});
  return [...new Set(config.fields.map((field) => field.id).filter(Boolean))];
}
