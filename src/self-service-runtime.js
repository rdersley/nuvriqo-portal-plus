import { buildCustomerReport, normalizeSelfServiceConfig } from './self-service-contract.js';

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeString = (value) => value == null ? '' : String(value);

function requestFieldValue(request, fieldId) {
  const row = safeArray(request?.requestFieldValues).find((field) => String(field?.fieldId) === String(fieldId));
  return row?.value ?? null;
}

function displayValue(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(', ');
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
    .map((field) => ({
      id: field.id,
      name: field.name,
      mode: field.mode,
      editableAfterSubmission: field.editableAfterSubmission,
      requiredWhenEditing: field.requiredWhenEditing,
      helpText: field.helpText,
      value: displayValue(requestFieldValue(request, field.id))
    }));
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
