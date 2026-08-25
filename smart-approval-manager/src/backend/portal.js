import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';

const resolver = new Resolver();
const approvalKey = (id) => `approval#${id}`;
const approverIndexKey = (accountId, createdAt, id) => `approver#${accountId}#${createdAt}#${id}`;
const issueIndexKey = (issueKey, createdAt, id) => `issue#${issueKey}#${createdAt}#${id}`;
const configKey = (projectId) => `config#${projectId}`;
const clean = (value, max = 1000) => String(value || '').trim().slice(0, max);
const nowIso = () => new Date().toISOString();

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

async function transitionIssue(issueKey, transitionId) {
  if (!transitionId) return;
  await json(await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ transition: { id: String(transitionId) } }),
  }));
}

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
  if (!context.accountId) throw new Error('You must be signed in to decide an approval.');

  const record = await kvs.get(approvalKey(id));
  if (!record) throw new Error('Approval not found.');
  if (record.approver?.accountId !== context.accountId) throw new Error('This approval is not assigned to you.');
  if (record.status !== 'pending') throw new Error('This approval has already been decided.');

  const settings = (await kvs.get(configKey(record.projectId))) || {};
  const reason = clean(payload?.reason, 2000);
  if (decision === 'declined' && settings.requireDeclineReason && !reason) {
    throw new Error('A decline reason is required.');
  }

  const at = nowIso();
  record.status = decision;
  record.decisionReason = reason;
  record.decidedAt = at;
  record.updatedAt = at;
  record.events = [...(record.events || []), { type: decision, at, by: context.accountId, reason }];
  await saveApproval(record);

  await addPublicComment(
    record.issueKey,
    `${record.approver.displayName} ${decision === 'approved' ? 'approved' : 'declined'} this request${reason ? `: ${reason}` : '.'}`
  );

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

export const handler = resolver.getDefinitions();
