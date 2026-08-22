import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';

const resolver = new Resolver();
const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const priorityKey = (accountId, issueKey) => `priority#${accountId}#${issueKey}`;
const configKey = (projectId) => `portal-config#${projectId || 'global'}`;

async function json(response) {
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Atlassian API error ${response.status}`);
  return text ? JSON.parse(text) : null;
}

function projectIdFrom(context, payload) {
  return clean(
    payload?.projectId ||
    context?.extension?.project?.id ||
    context?.extension?.projectId ||
    context?.extension?.portal?.projectId ||
    'global',
    100
  );
}

async function assertProjectAdmin(projectId) {
  if (!projectId || projectId === 'global') return;
  const data = await json(await api.asUser().requestJira(
    route`/rest/api/3/mypermissions?projectId=${projectId}&permissions=ADMINISTER_PROJECTS`
  ));
  if (!data?.permissions?.ADMINISTER_PROJECTS?.havePermission) {
    throw new Error('Project administrator permission is required.');
  }
}

async function listMyRequests(limit = 100) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 100));
  const data = await json(await api.asUser().requestJira(
    route`/rest/servicedeskapi/request?requestOwnership=OWNED_REQUESTS&limit=${safeLimit}`
  ));
  return data?.values || [];
}

function fieldValue(request, names) {
  const wanted = names.map((n) => n.toLowerCase());
  const match = (request?.requestFieldValues || []).find((f) => wanted.includes(clean(f?.label, 200).toLowerCase()));
  return match?.value ?? match?.renderedValue ?? '';
}

function normalizeRequest(request) {
  const status = request?.currentStatus?.status || 'Unknown';
  const summary = clean(fieldValue(request, ['Summary']) || request?.requestType?.name || 'Service request', 500);
  const created = request?.createdDate?.iso8601 || request?.createdDate?.jira || null;
  return {
    issueKey: clean(request?.issueKey, 100),
    summary,
    requestType: clean(request?.requestType?.name, 200),
    status: clean(status, 200),
    created,
    serviceDeskId: clean(request?.serviceDeskId, 100),
    requestTypeId: clean(request?.requestType?.id, 100),
  };
}

function progressFor(status, config) {
  const key = clean(status, 200).toLowerCase();
  const mappings = Array.isArray(config?.progressMappings) ? config.progressMappings : [];
  const explicit = mappings.find((m) => clean(m.status, 200).toLowerCase() === key);
  if (explicit) return { label: clean(explicit.label, 100), percent: Math.min(100, Math.max(0, Number(explicit.percent) || 0)) };
  if (/done|closed|resolved|complete/.test(key)) return { label: 'Complete', percent: 100 };
  if (/waiting|pending|awaiting/.test(key)) return { label: 'Waiting', percent: 65 };
  if (/progress|investigat|working/.test(key)) return { label: 'In progress', percent: 45 };
  return { label: 'Received', percent: 20 };
}

async function prioritiesFor(accountId) {
  let cursor;
  const out = {};
  do {
    let q = kvs.query().where('key', WhereConditions.beginsWith(`priority#${accountId}#`)).limit(20);
    if (cursor) q = q.cursor(cursor);
    const page = await q.getMany();
    for (const row of page?.results || []) {
      if (row?.value?.issueKey) out[row.value.issueKey] = row.value;
    }
    cursor = page?.nextCursor;
  } while (cursor);
  return out;
}

resolver.define('getPortalDashboard', async ({ payload, context }) => {
  if (!context.accountId) throw new Error('Sign in to view Portal+.');
  const projectId = projectIdFrom(context, payload);
  const config = (await kvs.get(configKey(projectId))) || (await kvs.get(configKey('global'))) || {};
  const [raw, priorities] = await Promise.all([listMyRequests(100), prioritiesFor(context.accountId)]);
  const requests = raw.map(normalizeRequest).map((r) => ({
    ...r,
    customerPriority: priorities[r.issueKey]?.priority || 'normal',
    priorityNote: priorities[r.issueKey]?.note || '',
    progress: progressFor(r.status, config),
  }));
  const open = requests.filter((r) => !/done|closed|resolved|complete/i.test(r.status));
  const waiting = open.filter((r) => /waiting|pending|awaiting/i.test(r.status));
  const important = open.filter((r) => r.customerPriority === 'important' || r.customerPriority === 'critical');
  return {
    projectId,
    config: {
      portalTitle: config.portalTitle || 'Portal+',
      welcomeText: config.welcomeText || 'Everything you need to manage your service requests.',
      modules: config.modules || { export: true, priority: true, progress: true, approvals: true, followUp: true },
    },
    stats: { total: requests.length, open: open.length, waiting: waiting.length, important: important.length },
    requests,
  };
});

resolver.define('setCustomerPriority', async ({ payload, context }) => {
  if (!context.accountId) throw new Error('Sign in to manage priorities.');
  const issueKey = clean(payload?.issueKey, 100);
  const priority = ['normal', 'important', 'critical'].includes(payload?.priority) ? payload.priority : 'normal';
  const note = clean(payload?.note, 500);
  if (!issueKey) throw new Error('Issue key is required.');

  // Confirms that this customer can see the request before storing metadata for it.
  await json(await api.asUser().requestJira(route`/rest/servicedeskapi/request/${issueKey}`));
  const value = { issueKey, priority, note, updatedAt: new Date().toISOString() };
  await kvs.set(priorityKey(context.accountId, issueKey), value);
  return value;
});

resolver.define('getPortalSettings', async ({ payload, context }) => {
  const projectId = projectIdFrom(context, payload);
  await assertProjectAdmin(projectId);
  return (await kvs.get(configKey(projectId))) || {
    portalTitle: 'Portal+',
    welcomeText: 'Everything you need to manage your service requests.',
    modules: { export: true, priority: true, progress: true, approvals: true, followUp: true },
    progressMappings: [],
  };
});

resolver.define('savePortalSettings', async ({ payload, context }) => {
  const projectId = projectIdFrom(context, payload);
  await assertProjectAdmin(projectId);
  const input = payload?.settings || {};
  const settings = {
    portalTitle: clean(input.portalTitle || 'Portal+', 100),
    welcomeText: clean(input.welcomeText || '', 500),
    modules: {
      export: input.modules?.export !== false,
      priority: input.modules?.priority !== false,
      progress: input.modules?.progress !== false,
      approvals: input.modules?.approvals !== false,
      followUp: input.modules?.followUp !== false,
    },
    progressMappings: Array.isArray(input.progressMappings) ? input.progressMappings.slice(0, 50).map((m) => ({
      status: clean(m.status, 200),
      label: clean(m.label, 100),
      percent: Math.min(100, Math.max(0, Number(m.percent) || 0)),
    })).filter((m) => m.status && m.label) : [],
  };
  await kvs.set(configKey(projectId), settings);
  return settings;
});

export const handler = resolver.getDefinitions();
