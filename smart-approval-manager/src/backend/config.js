import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();
const configKey = (projectId) => `config#${projectId}`;
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);

async function json(response) {
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Atlassian API error ${response.status}`);
  return body ? JSON.parse(body) : null;
}

async function assertProjectAdmin(projectId) {
  const permissions = await json(await api.asUser().requestJira(
    route`/rest/api/3/mypermissions?projectId=${projectId}&permissions=ADMINISTER_PROJECTS`
  ));
  if (!permissions?.permissions?.ADMINISTER_PROJECTS?.havePermission) throw new Error('Project administrator permission is required.');
}

function cleanRules(rules) {
  if (!Array.isArray(rules)) return [];
  return rules.slice(0, 25).map((rule, index) => ({
    id: clean(rule?.id || `rule-${index + 1}`, 100),
    name: clean(rule?.name || `Rule ${index + 1}`, 200),
    enabled: rule?.enabled !== false,
    approvalMode: rule?.approvalMode === 'any' ? 'any' : 'all',
    conditions: (Array.isArray(rule?.conditions) ? rule.conditions : []).slice(0, 10).map((c) => ({
      fieldId: clean(c?.fieldId, 200),
      operator: ['equals', 'notEquals', 'contains', 'isEmpty', 'notEmpty'].includes(c?.operator) ? c.operator : 'equals',
      value: clean(c?.value, 1000),
    })).filter((c) => c.fieldId),
    approvers: (Array.isArray(rule?.approvers) ? rule.approvers : []).slice(0, 20).map((a) => ({
      accountId: clean(a?.accountId, 200),
      displayName: clean(a?.displayName, 200),
    })).filter((a) => a.accountId),
    message: clean(rule?.message, 2000),
    reminderHours: Math.min(720, Math.max(1, Number(rule?.reminderHours || 24))),
    pendingTransitionId: clean(rule?.pendingTransitionId, 100),
    approveTransitionId: clean(rule?.approveTransitionId, 100),
    declineTransitionId: clean(rule?.declineTransitionId, 100),
  }));
}

const defaults = {
  reminderHours: 24,
  autoAddParticipant: true,
  requireDeclineReason: true,
  defaultApprovalMode: 'all',
  pendingTransitionId: '',
  approveTransitionId: '',
  declineTransitionId: '',
  autoRules: [],
};

resolver.define('getSettings', async ({ payload }) => {
  const projectId = clean(payload?.projectId, 100);
  if (!projectId) throw new Error('Project context is required.');
  await assertProjectAdmin(projectId);
  return { ...defaults, ...((await kvs.get(configKey(projectId))) || {}) };
});

resolver.define('getRuleBuilderMetadata', async ({ payload }) => {
  const projectId = clean(payload?.projectId, 100);
  if (!projectId) throw new Error('Project context is required.');
  await assertProjectAdmin(projectId);
  const fields = await json(await api.asUser().requestJira(route`/rest/api/3/field`));
  return {
    fields: (fields || []).filter((f) => f?.id && f?.name).map((f) => ({ id: f.id, name: f.name })).sort((a, b) => a.name.localeCompare(b.name)),
  };
});

resolver.define('searchRuleApprovers', async ({ payload }) => {
  const projectId = clean(payload?.projectId, 100);
  const query = clean(payload?.query, 100);
  if (!projectId) throw new Error('Project context is required.');
  await assertProjectAdmin(projectId);
  if (query.length < 2) return [];
  const result = await json(await api.asUser().requestJira(route`/rest/api/3/user/picker?query=${query}&maxResults=20&showAvatar=true`));
  return (result?.users || []).filter((u) => u.accountId && u.active !== false).map((u) => ({
    accountId: u.accountId,
    displayName: clean(u.displayName, 200),
  }));
});

resolver.define('saveSettings', async ({ payload }) => {
  const projectId = clean(payload?.projectId, 100);
  if (!projectId) throw new Error('Project context is required.');
  await assertProjectAdmin(projectId);
  const incoming = payload?.settings || {};
  const settings = {
    reminderHours: Math.min(720, Math.max(1, Number(incoming.reminderHours || 24))),
    autoAddParticipant: incoming.autoAddParticipant !== false,
    requireDeclineReason: incoming.requireDeclineReason !== false,
    defaultApprovalMode: incoming.defaultApprovalMode === 'any' ? 'any' : 'all',
    pendingTransitionId: clean(incoming.pendingTransitionId, 100),
    approveTransitionId: clean(incoming.approveTransitionId, 100),
    declineTransitionId: clean(incoming.declineTransitionId, 100),
    autoRules: cleanRules(incoming.autoRules),
  };
  await kvs.set(configKey(projectId), settings);
  return settings;
});

export const handler = resolver.getDefinitions();
