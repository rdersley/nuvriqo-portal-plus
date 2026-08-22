import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';

const resolver = new Resolver();
const nowIso = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const approvalKey = (id) => `approval#${id}`;
const issueIndexKey = (issueKey, createdAt, id) => `issue#${issueKey}#${createdAt}#${id}`;
const approverIndexKey = (accountId, createdAt, id) => `approver#${accountId}#${createdAt}#${id}`;
const configKey = (projectId) => `config#${projectId}`;
const clean = (value, max = 1000) => String(value || '').trim().slice(0, max);

async function json(response) {
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Atlassian API error ${response.status}`);
  return body ? JSON.parse(body) : null;
}

async function queryPrefix(prefix, max = 100) {
  let cursor;
  const out = [];
  do {
    let q = kvs.query().where('key', WhereConditions.beginsWith(prefix)).limit(20);
    if (cursor) q = q.cursor(cursor);
    const page = await q.getMany();
    out.push(...(page?.results || []));
    cursor = page?.nextCursor;
  } while (cursor && out.length < max);
  return out.slice(0, max);
}

async function saveApproval(record) {
  await Promise.all([
    kvs.set(approvalKey(record.id), record),
    kvs.set(issueIndexKey(record.issueKey, record.createdAt, record.id), record),
    kvs.set(approverIndexKey(record.approver.accountId, record.createdAt, record.id), record),
  ]);
}

async function getIssueAsUser(issueKey) {
  return json(await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}?fields=summary,project,status,reporter`));
}

async function getCanonicalUser(accountId) {
  return json(await api.asApp().requestJira(route`/rest/api/3/user?accountId=${accountId}`));
}

async function assertProjectAdmin(projectId) {
  const permissions = await json(await api.asUser().requestJira(
    route`/rest/api/3/mypermissions?projectId=${projectId}&permissions=ADMINISTER_PROJECTS`
  ));
  if (!permissions?.permissions?.ADMINISTER_PROJECTS?.havePermission) {
    throw new Error('Project administrator permission is required.');
  }
}

async function addPublicComment(issueKey, text) {
  try {
    await json(await api.asApp().requestJira(route`/rest/servicedeskapi/request/${issueKey}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ body: text, public: true }),
    }));
  } catch (error) {
    console.warn('Unable to add JSM public comment', error?.message || error);
  }
}

async function addParticipant(issueKey, accountId) {
  try {
    await json(await api.asApp().requestJira(route`/rest/servicedeskapi/request/${issueKey}/participant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accountIds: [accountId] }),
    }));
    return true;
  } catch (error) {
    console.warn('Unable to add approver as request participant', error?.message || error);
    return false;
  }
}

async function transitionIssue(issueKey, transitionId) {
  if (!transitionId) return;
  await json(await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ transition: { id: String(transitionId) } }),
  }));
}

resolver.define('searchApprovers', async ({ payload }) => {
  const query = clean(payload?.query, 100);
  if (query.length < 2) return [];
  const result = await json(await api.asUser().requestJira(route`/rest/api/3/user/picker?query=${query}&maxResults=20&showAvatar=true`));
  return (result?.users || [])
    .filter((u) => u.accountId && u.active !== false)
    .map((u) => ({ accountId: u.accountId, displayName: u.displayName, avatarUrl: u.avatarUrl }));
});

resolver.define('getIssueApprovals', async ({ payload }) => {
  const issueKey = clean(payload?.issueKey, 100);
  if (!issueKey) return [];
  await getIssueAsUser(issueKey);
  const rows = await queryPrefix(`issue#${issueKey}#`, 100);
  return rows.map((r) => r.value).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

resolver.define('createApproval', async ({ payload, context }) => {
  const issueKey = clean(payload?.issueKey, 100);
  const approverAccountId = clean(payload?.approver?.accountId, 200);
  if (!issueKey || !approverAccountId) throw new Error('Issue and approver are required.');

  const issue = await getIssueAsUser(issueKey);
  const canonicalApprover = await getCanonicalUser(approverAccountId);
  if (!canonicalApprover?.accountId || canonicalApprover.active === false) throw new Error('The selected approver is not active.');

  const existing = await queryPrefix(`issue#${issueKey}#`, 100);
  if (existing.some((r) => r.value?.status === 'pending' && r.value?.approver?.accountId === approverAccountId)) {
    throw new Error(`${canonicalApprover.displayName} already has a pending approval on this request.`);
  }

  const settings = (await kvs.get(configKey(String(issue.fields.project.id)))) || {};
  const createdAt = nowIso();
  const id = uid();
  const reminderHours = Math.min(720, Math.max(1, Number(payload?.reminderHours || settings.reminderHours || 24)));
  const record = {
    id,
    issueKey,
    issueId: issue.id,
    projectId: String(issue.fields.project.id),
    projectKey: issue.fields.project.key,
    summary: clean(issue.fields.summary, 500),
    issueStatus: clean(issue.fields.status?.name, 200),
    approver: { accountId: canonicalApprover.accountId, displayName: clean(canonicalApprover.displayName, 200) },
    requestedBy: { accountId: context.accountId || 'unknown' },
    message: clean(payload?.message, 2000),
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
    reminderHours,
    reminderCount: 0,
    nextReminderAt: new Date(Date.now() + reminderHours * 3600000).toISOString(),
    events: [{ type: 'requested', at: createdAt, by: context.accountId || 'unknown' }],
  };

  if (settings.autoAddParticipant !== false) record.participantAdded = await addParticipant(issueKey, canonicalApprover.accountId);
  await saveApproval(record);
  await addPublicComment(issueKey, `Approval requested from ${record.approver.displayName}. Please open My Approvals in the customer portal to review this request.`);
  return record;
});

resolver.define('getMyApprovals', async ({ payload, context }) => {
  if (!context.accountId) throw new Error('You must be signed in to view approvals.');
  const rows = await queryPrefix(`approver#${context.accountId}#`, 200);
  const all = rows.map((r) => r.value).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filter = clean(payload?.status, 30);
  return filter ? all.filter((r) => r.status === filter) : all;
});

resolver.define('decideApproval', async ({ payload, context }) => {
  const id = clean(payload?.approvalId, 200);
  const decision = payload?.decision === 'approved' ? 'approved' : payload?.decision === 'declined' ? 'declined' : null;
  if (!id || !decision) throw new Error('Invalid approval decision.');

  const record = await kvs.get(approvalKey(id));
  if (!record) throw new Error('Approval not found.');
  if (!context.accountId || record.approver.accountId !== context.accountId) throw new Error('This approval is not assigned to you.');
  if (record.status !== 'pending') throw new Error('This approval has already been decided.');

  const settings = (await kvs.get(configKey(record.projectId))) || {};
  const reason = clean(payload?.reason, 2000);
  if (decision === 'declined' && settings.requireDeclineReason && !reason) throw new Error('A decline reason is required.');

  const at = nowIso();
  record.status = decision;
  record.decisionReason = reason;
  record.decidedAt = at;
  record.updatedAt = at;
  record.events = [...(record.events || []), { type: decision, at, by: context.accountId, reason }];
  await saveApproval(record);

  await addPublicComment(record.issueKey, `${record.approver.displayName} ${decision === 'approved' ? 'approved' : 'declined'} this request${reason ? `: ${reason}` : '.'}`);

  const transitionId = decision === 'approved' ? settings.approveTransitionId : settings.declineTransitionId;
  if (transitionId) {
    try {
      await transitionIssue(record.issueKey, transitionId);
      record.transitionApplied = true;
      record.events = [...record.events, { type: 'transition-applied', at: nowIso(), by: 'system', transitionId: String(transitionId) }];
    } catch (error) {
      record.transitionApplied = false;
      record.transitionError = clean(error?.message || error, 500);
      record.events = [...record.events, { type: 'transition-failed', at: nowIso(), by: 'system', error: record.transitionError }];
    }
    record.updatedAt = nowIso();
    await saveApproval(record);
  }
  return record;
});

resolver.define('sendReminder', async ({ payload, context }) => {
  const record = await kvs.get(approvalKey(clean(payload?.approvalId, 200)));
  if (!record || record.status !== 'pending') throw new Error('Pending approval not found.');
  await getIssueAsUser(record.issueKey);

  const at = nowIso();
  record.reminderCount = Number(record.reminderCount || 0) + 1;
  record.updatedAt = at;
  record.nextReminderAt = new Date(Date.now() + Number(record.reminderHours || 24) * 3600000).toISOString();
  record.events = [...(record.events || []), { type: 'reminder', at, by: context.accountId || 'agent' }];
  await saveApproval(record);
  await addPublicComment(record.issueKey, `Reminder: approval is still waiting for ${record.approver.displayName}. Please open My Approvals in the customer portal.`);
  return record;
});

resolver.define('cancelApproval', async ({ payload, context }) => {
  const record = await kvs.get(approvalKey(clean(payload?.approvalId, 200)));
  if (!record || record.status !== 'pending') throw new Error('Pending approval not found.');
  await getIssueAsUser(record.issueKey);

  const at = nowIso();
  record.status = 'cancelled';
  record.updatedAt = at;
  record.cancelledAt = at;
  record.events = [...(record.events || []), { type: 'cancelled', at, by: context.accountId || 'agent' }];
  await saveApproval(record);
  await addPublicComment(record.issueKey, `Approval request for ${record.approver.displayName} was cancelled.`);
  return record;
});

resolver.define('getSettings', async ({ payload }) => {
  const projectId = clean(payload?.projectId, 100);
  if (!projectId) throw new Error('Project context is required.');
  await assertProjectAdmin(projectId);
  return (await kvs.get(configKey(projectId))) || {
    reminderHours: 24,
    autoAddParticipant: true,
    requireDeclineReason: true,
    approveTransitionId: '',
    declineTransitionId: '',
  };
});

resolver.define('saveSettings', async ({ payload }) => {
  const projectId = clean(payload?.projectId, 100);
  if (!projectId) throw new Error('Project context is required.');
  await assertProjectAdmin(projectId);

  const settings = {
    reminderHours: Math.min(720, Math.max(1, Number(payload.settings?.reminderHours || 24))),
    autoAddParticipant: payload.settings?.autoAddParticipant !== false,
    requireDeclineReason: payload.settings?.requireDeclineReason !== false,
    approveTransitionId: clean(payload.settings?.approveTransitionId, 100),
    declineTransitionId: clean(payload.settings?.declineTransitionId, 100),
  };
  await kvs.set(configKey(projectId), settings);
  return settings;
});

export const handler = resolver.getDefinitions();
export { saveApproval, queryPrefix, addPublicComment };
