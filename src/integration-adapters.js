import { normalizePortalModules } from './integration-contract.js';

export const SMART_APPROVAL_PROPERTY_KEY = 'nuvriqo.smart-approval.portal';

function propertyValue(issue, key) {
  const props = issue?._integrationProperties || issue?.properties || {};
  if (Array.isArray(props)) {
    const found = props.find((entry) => entry?.key === key);
    return found?.value ?? null;
  }
  return props?.[key] ?? null;
}

export function smartApprovalModuleFromRequests(requests = [], accountId = '') {
  if (!accountId) return null;
  const items = [];
  let providerSeen = false;

  for (const request of Array.isArray(requests) ? requests : []) {
    const snapshot = propertyValue(request, SMART_APPROVAL_PROPERTY_KEY);
    if (!snapshot || snapshot.provider !== 'nuvriqo-smart-approval-manager') continue;
    providerSeen = true;
    for (const approval of Array.isArray(snapshot.approvals) ? snapshot.approvals : []) {
      if (String(approval?.approverAccountId || '') !== String(accountId)) continue;
      if (String(approval?.status || '') !== 'pending') continue;
      items.push({
        id: String(approval.id || `${request.issueKey || request.key}-approval`),
        title: String(request.summary || request.requestType?.name || request.issueKey || 'Approval request'),
        subtitle: String(request.issueKey || request.key || ''),
        status: 'pending',
        url: String(request?._links?.web || ''),
        badge: 'Waiting for you',
      });
    }
  }

  if (!providerSeen) return null;
  return normalizePortalModules([{
    id: 'smart-approval',
    provider: 'nuvriqo-smart-approval-manager',
    version: 1,
    title: 'Approvals',
    description: items.length ? 'Requests waiting for your approval.' : 'No approvals currently need your attention.',
    priority: 20,
    counters: [{ id: 'pending', label: 'Waiting for you', value: items.length, tone: items.length ? 'attention' : 'neutral' }],
    actions: items.length ? [{ id: 'review-approvals', label: 'Review approvals', url: items[0].url, badge: String(items.length), tone: 'attention' }] : [],
    items: items.slice(0, 20),
    health: { available: true, status: 'available', message: '' },
    metadata: { source: 'jira-issue-property', propertyKey: SMART_APPROVAL_PROPERTY_KEY, detected: true },
  }])[0] || null;
}

export function modulesFromRequests(requests = [], accountId = '') {
  return normalizePortalModules([
    smartApprovalModuleFromRequests(requests, accountId),
  ].filter(Boolean));
}
