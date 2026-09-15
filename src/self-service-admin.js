import { MAX_DETAIL_FIELDS, MAX_REQUEST_COLUMNS, normalizePortalField } from './self-service-contract.js';

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
