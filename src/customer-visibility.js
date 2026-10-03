import {normalizeIssueKey} from './request-detail-security.js';
import {normalizeRequestScope} from './help-center.js';

// Portal+ reads Jira with app permissions to avoid a customer consent prompt,
// so this JQL is the boundary that keeps each customer to their own requests:
// ones they reported, plus ones shared with an organisation they belong to.
export function escapeJql(value){return String(value??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"');}

export function customerVisibilityClause(accountId,orgs=[]){
  const id=String(accountId||'');
  if(!id)throw new Error('You must be signed in to view Portal+.');
  const visibility=[`reporter = "${escapeJql(id)}"`];
  const names=(Array.isArray(orgs)?orgs:[]).map((org)=>String(org?.name||'')).filter(Boolean);
  if(names.length)visibility.push(`organizations in (${names.map((name)=>`"${escapeJql(name)}"`).join(',')})`);
  return `(${visibility.join(' OR ')})`;
}

// Narrowing clause for a dropdown custom field, e.g. cf[10050] in ("Ryanair").
export function requestScopeClause(scope){
  const normalized=normalizeRequestScope(scope);
  if(!normalized)return'';
  const id=normalized.fieldId.replace('customfield_','');
  return ` AND cf[${id}] in (${normalized.values.map((value)=>`"${escapeJql(value)}"`).join(',')})`;
}

export function customerJql(accountId,projectId,orgs=[],{issueKey='',scope=null}={}){
  if(!projectId)throw new Error('Portal+ could not determine the current service project.');
  const projectClause=/^\d+$/.test(String(projectId))?String(projectId):`"${escapeJql(projectId)}"`;
  const keyClause=issueKey?` AND key = "${escapeJql(normalizeIssueKey(issueKey))}"`:'';
  return `project = ${projectClause} AND ${customerVisibilityClause(accountId,orgs)}${requestScopeClause(scope)}${keyClause} ORDER BY created DESC`;
}
