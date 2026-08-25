import api, { route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';

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

async function transitionIssue(issueKey, transitionId) {
  if (!transitionId) return;
  await json(await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ transition: { id: String(transitionId) } }),
  }));
}

async function addParticipant(issueKey, accountId) {
  try {
    await json(await api.asApp().requestJira(route`/rest/servicedeskapi/request/${issueKey}/participant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ accountIds: [accountId] }),
    }));
  } catch (error) {
    console.warn('Automatic approval: unable to add participant', error?.message || error);
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
    console.warn('Automatic approval: unable to add comment', error?.message || error);
  }
}

function values(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(values);
  if (typeof value === 'object') {
    return [value.value, value.name, value.id, value.key, value.displayName].filter((v) => v != null).map(String);
  }
  return [String(value)];
}

function conditionMatches(issue, condition) {
  const fieldId = clean(condition?.fieldId, 200);
  if (!fieldId) return false;
  const actual = values(issue.fields?.[fieldId]).map((v) => v.toLowerCase());
  const expected = clean(condition?.value, 1000).toLowerCase();
  const operator = condition?.operator || 'equals';
  if (operator === 'isEmpty') return actual.length === 0 || actual.every((v) => !v);
  if (operator === 'notEmpty') return actual.some(Boolean);
  if (operator === 'notEquals') return !actual.includes(expected);
  if (operator === 'contains') return actual.some((v) => v.includes(expected));
  return actual.includes(expected);
}

function ruleMatches(issue, rule) {
  const conditions = Array.isArray(rule?.conditions) ? rule.conditions : [];
  return rule?.enabled !== false && conditions.length > 0 && conditions.every((c) => conditionMatches(issue, c));
}

export async function run(event) {
  const issueKey = event?.issue?.key;
  const projectId = String(event?.issue?.fields?.project?.id || '');
  if (!issueKey || !projectId) return;

  const settings = (await kvs.get(configKey(projectId))) || {};
  const rules = Array.isArray(settings.autoRules) ? settings.autoRules : [];
  if (!rules.length) return;

  const issue = await json(await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=*all`));
  const existingRows = await queryPrefix(`issue#${issueKey}#`, 200);
  const existingPending = existingRows.map((r) => r.value).filter((r) => r?.status === 'pending');

  for (const rule of rules) {
    if (!ruleMatches(issue, rule)) continue;
    const approvers = Array.isArray(rule.approvers) ? rule.approvers : [];
    let createdAny = false;

    for (const approver of approvers) {
      const accountId = clean(approver?.accountId, 200);
      if (!accountId) continue;
      if (existingPending.some((r) => r.approver?.accountId === accountId)) continue;

      const canonical = await json(await api.asApp().requestJira(route`/rest/api/3/user?accountId=${accountId}`));
      if (!canonical?.accountId || canonical.active === false) continue;

      const createdAt = nowIso();
      const reminderHours = Math.min(720, Math.max(1, Number(rule.reminderHours || settings.reminderHours || 24)));
      const record = {
        id: uid(),
        issueKey,
        issueId: issue.id,
        projectId,
        projectKey: issue.fields.project?.key,
        summary: clean(issue.fields.summary, 500),
        issueStatus: clean(issue.fields.status?.name, 200),
        approver: { accountId: canonical.accountId, displayName: clean(canonical.displayName, 200) },
        requestedBy: { accountId: 'automation' },
        message: clean(rule.message || 'Please review and approve this request.', 2000),
        status: 'pending',
        createdAt,
        updatedAt: createdAt,
        reminderHours,
        reminderCount: 0,
        nextReminderAt: new Date(Date.now() + reminderHours * 3600000).toISOString(),
        ruleId: clean(rule.id || rule.name, 200),
        ruleName: clean(rule.name, 200),
        ruleTransitionIds: {
          approved: clean(rule.approveTransitionId, 100),
          declined: clean(rule.declineTransitionId, 100),
        },
        events: [{ type: 'requested-automatically', at: createdAt, by: 'automation', rule: clean(rule.name, 200) }],
      };

      if (settings.autoAddParticipant !== false) await addParticipant(issueKey, canonical.accountId);
      await saveApproval(record);
      existingPending.push(record);
      createdAny = true;
    }

    if (createdAny) {
      await addPublicComment(issueKey, `Approval requested automatically${rule.name ? ` by rule “${clean(rule.name, 200)}”` : ''}. Approvers can review it in My Approvals.`);
      const pendingTransitionId = clean(rule.pendingTransitionId || settings.pendingTransitionId, 100);
      if (pendingTransitionId) {
        try { await transitionIssue(issueKey, pendingTransitionId); }
        catch (error) { console.warn('Automatic approval pending transition failed', error?.message || error); }
      }
    }
  }
}
