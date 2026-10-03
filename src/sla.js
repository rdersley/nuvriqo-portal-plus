// Reads JSM SLA custom fields (schema custom com.atlassian.servicedesk:sd-sla-field)
// as returned by issue search, and summarises the request's primary SLA.

export const SLA_FIELD_SCHEMA = 'com.atlassian.servicedesk:sd-sla-field';

const safeString = (value) => (value == null ? '' : String(value));

export function isSlaValue(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && ('ongoingCycle' in value || Array.isArray(value.completedCycles)));
}

export function slaState(value) {
  if (!isSlaValue(value)) return null;
  const ongoing = value.ongoingCycle;
  if (ongoing && typeof ongoing === 'object') {
    return {
      name: safeString(value.name) || 'SLA',
      state: ongoing.breached === true ? 'breached' : ongoing.paused === true ? 'paused' : 'running',
      remaining: safeString(ongoing.remainingTime?.friendly),
      target: safeString(ongoing.goalDuration?.friendly)
    };
  }
  const cycles = Array.isArray(value.completedCycles) ? value.completedCycles : [];
  if (!cycles.length) return null;
  const last = cycles[cycles.length - 1];
  return {
    name: safeString(value.name) || 'SLA',
    state: last?.breached === true ? 'breached' : 'met',
    remaining: '',
    target: safeString(last?.goalDuration?.friendly)
  };
}

// Prefers "Time to resolution", then any SLA with data.
export function primarySla(fields = {}) {
  const slas = Object.values(fields && typeof fields === 'object' ? fields : {}).map(slaState).filter(Boolean);
  return slas.find((sla) => /resolution/i.test(sla.name)) || slas[0] || null;
}
