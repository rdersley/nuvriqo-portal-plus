import { MAX_DETAIL_FIELDS, MAX_REQUEST_COLUMNS, normalizePortalField, normalizeSelfServiceConfig } from './self-service-contract.js';

const safeArray = (value) => Array.isArray(value) ? value : [];
const safeString = (value) => value == null ? '' : String(value).trim();

// First release deliberately supports a conservative editable subset.
// Complex Jira fields remain visible read-only until their update semantics are proven.
export const EDITABLE_FIELD_TYPES_V1 = Object.freeze(new Set([
  'string',
  'textarea',
  'number',
  'date',
  'datetime',
  'select',
  'radio',
  'checkbox',
  'multicheckboxes'
]));

export function canCustomerEditField(field = {}) {
  const type = safeString(field.type || field?.jiraSchema?.type).toLowerCase();
  const custom = safeString(field.custom || field?.jiraSchema?.custom).toLowerCase();
  if (custom.includes('userpicker') || custom.includes('grouppicker') || custom.includes('asset')) return false;
  if (['user', 'group', 'array', 'issuelink', 'project'].includes(type)) return false;
  return EDITABLE_FIELD_TYPES_V1.has(type) || (type === 'option' && !custom.includes('cascading'));
}

export function buildSelfServiceFieldCatalogue(fields = []) {
  return safeArray(fields)
    .filter((field) => field?.id && field?.name)
    .map((field) => ({
      id: safeString(field.id),
      name: safeString(field.name).slice(0, 100),
      type: safeString(field.type || field?.jiraSchema?.type),
      custom: safeString(field.custom || field?.jiraSchema?.custom),
      editableSupported: canCustomerEditField(field)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function validateSelfServiceFields(fields = []) {
  const normalized = safeArray(fields).map(normalizePortalField);
  if (normalized.length > MAX_DETAIL_FIELDS) throw new Error(`Portal+ supports up to ${MAX_DETAIL_FIELDS} request-detail fields.`);
  if (normalized.filter((field) => field.showInList).length > MAX_REQUEST_COLUMNS) throw new Error(`Portal+ supports up to ${MAX_REQUEST_COLUMNS} My Requests columns.`);
  const ids = normalized.map((field) => field.id);
  if (new Set(ids).size !== ids.length) throw new Error('A customer-visible field can only be configured once.');
  return normalized;
}

// Shape persisted in each experience; derived values (listFields,
// contractVersion) are rebuilt by normalizeSelfServiceConfig when read.
export function normalizeStoredSelfService(raw = {}) {
  const { contractVersion, listFields, ...stored } = normalizeSelfServiceConfig(raw && typeof raw === 'object' ? raw : {});
  return stored;
}

// Publish-time policy: only fields customers can already see on this service
// desk may be exposed, schema types come from Jira rather than the browser,
// unsupported types are forced read-only, and customer actions may only target
// statuses that exist in the project.
export function applySelfServicePolicy(raw = {}, { catalogue = [], statuses = [] } = {}) {
  const known = new Map(safeArray(catalogue).map((field) => [safeString(field.id), field]));
  const fields = validateSelfServiceFields(safeArray(raw?.fields))
    .filter((field) => known.has(field.id))
    .map((field) => ({ ...field, type: safeString(known.get(field.id).type), custom: safeString(known.get(field.id).custom) }));
  const statusIds = new Set(safeArray(statuses).map((status) => safeString(status?.id)));
  const actions = raw?.customerActions || {};
  const keepStatuses = (ids) => safeArray(ids).map(safeString).filter((id) => statusIds.has(id));
  return normalizeStoredSelfService({
    ...raw,
    fields: enforceEditableFieldPolicy(fields, catalogue),
    customerActions: {
      ...actions,
      closeStatusIds: keepStatuses(actions.closeStatusIds),
      escalateStatusIds: keepStatuses(actions.escalateStatusIds)
    }
  });
}

export function enforceEditableFieldPolicy(configuredFields = [], catalogue = []) {
  const support = new Map(safeArray(catalogue).map((field) => [String(field.id), field.editableSupported === true]));
  return validateSelfServiceFields(configuredFields).map((field) => {
    if (field.mode !== 'editable') return field;
    if (!support.get(field.id)) {
      return {
        ...field,
        mode: 'read-only',
        editableAfterSubmission: false,
        requiredWhenEditing: false
      };
    }
    return field;
  });
}
