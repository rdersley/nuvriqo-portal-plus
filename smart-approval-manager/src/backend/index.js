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
const clean = (value, max = 1000) => String(value ?? '').trim().slice(0, max);

async function json(response) {
  const body = await response.text();
  if (!response.ok) throw new Error(body || `Atlassian API error ${response.status}`);
  return body ? JSON.parse(body) : null;
}

async function queryPrefix(prefix, max = 200) {
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
  if (!transitionId) return false;
  await json(await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ transition: { id: String(transitionId) } }),
  }));
  return true;
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
  const rows = await queryPrefix(`issue#${issueKey}#`, 200);
  return rows.map((r) => r.value).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

resolver.define('createApproval', async ({ payload, context }) => {
  const issueKey = clean(payload?.issueKey, 100);
  const requestedApprovers = Array.isArray(payload?.approvers)
    ? payload.approvers
    : payload?.approver ? [payload.approver] : [];
  if (!issueKey || requestedApprovers.length === 0) throw new Error('Issue and at least one approver are required.');

  const issue = await getIssueAsUser(issueKey);
  const settings = (await kvs.get(configKey(String(issue.fields.project.id)))) || {};
  const existing = await queryPrefix(`issue#${issueKey}#`, 200);
  const pendingAccountIds = new Set(existing.map((r) => r.value).filter((r) => r?.status === 'pending').map((r) => r.approver?.accountId));

  const canonicalApprovers = [];
  const seen = new Set();
  for (const requested of requestedApprovers.slice(0, 20)) {
    const accountId = clean(requested?.accountId, 200);
    if (!accountId || seen.has(accountId)) continue;
    seen.add(accountId);
    if (pendingAccountIds.has(accountId)) continue;
    const canonical = await getCanonicalUser(accountId);
    if (canonical?.accountId && canonical.active !== false) canonicalApprovers.push(canonical);
  }
  if (!canonicalApprovers.length) throw new Error('No new active approvers were selected.');

  const groupId = uid();
  const approvalMode = payload?.approvalMode === 'any' ? 'any' : (settings.defaultApprovalMode === 'any' ? 'any' : 'all');
  const reminderHours = Math.min(720, Math.max(1, Number(payload?.reminderHours || settings.reminderHours || 24)));
  const records = [];

  for (const canonical of canonicalApprovers) {
    const createdAt = nowIso();
    const record = {
      id: uid(),
      groupId,
      approvalMode,
      groupSize: canonicalApprovers.length,
      issueKey,
      issueId: issue.id,
      projectId: String(issue.fields.project.id),
      projectKey: issue.fields.project.key,
      summary: clean(issue.fields.summary, 500),
      issueStatus: clean(issue.fields.status?.name, 200),
      approver: { accountId: canonical.accountId, displayName: clean(canonical.displayName, 200) },
      requestedBy: { accountId: context.accountId || 'unknown' },
      source: 'manual',
      message: clean(payload?.message, 2000),
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
      reminderHours,
      reminderCount: 0,
      nextReminderAt: new Date(Date.now() + reminderHours * 3600000).toISOString(),
      ruleTransitionIds: {
        approved: clean(settings.approveTransitionId, 100),
        declined: clean(settings.declineTransitionId, 100),
      },
      events: [{ type: 'requested', at: createdAt, by: context.accountId || 'unknown' }],
    };
    if (settings.autoAddParticipant !== false) record.participantAdded = await addParticipant(issueKey, canonical.accountId);
    await saveApproval(record);
    records.push(record);
  }

  const names = records.map((r) => r.approver.displayName).join(', ');
  await addPublicComment(issueKey, `Approval requested from ${names}. ${approvalMode === 'all' && records.length > 1 ? 'All approvers must approve.' : records.length > 1 ? 'Any one approver can approve.' : ''} Please open My Approvals in the customer portal to review this request.`);

  const pendingTransitionId = clean(settings.pendingTransitionId, 100);
  if (pendingTransitionId) {
    try { await transitionIssue(issueKey, pendingTransitionId); }
    catch (error) { console.warn('Manual approval pending transition failed', error?.message || error); }
  }
  return records;
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

export const handler = resolver.getDefinitions();
export { saveApproval, queryPrefix, addPublicComment };
