import api,{route} from '@forge/api';
import {buildRequestDetailModel} from './self-service-runtime.js';
import {normalizeCustomerActions} from './self-service-contract.js';
import {actionTargetStatusIds,buildAuditComment,chooseCustomerTransition,customerDisplayName,normalizeIssueKey,normalizeSlaPage,prepareCustomerFieldUpdates} from './request-detail-security.js';

const safeArray=(value)=>Array.isArray(value)?value:[];
const safeString=(value)=>value==null?'':String(value);
const appJira=(path,options)=>api.asApp().requestJira(path,options);

async function jsonOrText(response){
  const text=await response.text();
  if(!text)return{};
  try{return JSON.parse(text);}catch(_){return{text};}
}

function requireVisible(request){
  if(!request||!safeString(request.issueKey||request.key))throw new Error('This request is not available in your Portal+ customer view.');
  return normalizeIssueKey(request.issueKey||request.key);
}

export async function loadRequestSlas(issueKey,enabled=true,jira=appJira){
  if(!enabled)return{values:[],available:false,reason:'disabled'};
  const key=normalizeIssueKey(issueKey);
  try{
    const response=await jira(route`/rest/servicedeskapi/request/${key}/sla?limit=50`,{headers:{Accept:'application/json'}});
    if(!response.ok)return{values:[],available:false,reason:`jira-${response.status}`};
    const payload=await response.json();
    return{values:normalizeSlaPage(payload),available:true,reason:''};
  }catch(_){return{values:[],available:false,reason:'unavailable'};}
}

export async function loadTransitions(issueKey,jira=appJira){
  const key=normalizeIssueKey(issueKey);
  const response=await jira(route`/rest/api/3/issue/${key}/transitions?expand=transitions.fields`,{headers:{Accept:'application/json'}});
  if(!response.ok){const payload=await jsonOrText(response);throw new Error(`Unable to load request actions (${response.status}): ${safeString(payload?.errorMessages?.[0]||payload?.text||'')}`.trim());}
  const payload=await response.json();
  return safeArray(payload?.transitions);
}

// Audit notes are best-effort: a failure to write one must not undo or block
// the customer's change, which has already been applied.
async function writeAuditComment(key,request,accountId,summary,actions,jira){
  if(actions.auditComments===false)return false;
  try{
    const comment=buildAuditComment({actor:customerDisplayName(request,accountId),accountId,summary});
    const response=await jira(route`/rest/api/3/issue/${key}/comment`,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(comment)});
    return Boolean(response?.ok);
  }catch(_){return false;}
}

export async function buildLiveRequestDetail({request,experience={},jira=appJira}={}){
  const key=requireVisible(request),config=experience?.selfService||{},slaEnabled=config?.sla?.enabled===true;
  const slaResult=await loadRequestSlas(key,slaEnabled,jira);
  const primary=slaResult.values.find((metric)=>metric.state==='running')||slaResult.values[0]||null;
  const model=buildRequestDetailModel({...request,sla:primary?{state:primary.state,label:primary.name,target:primary.target,remaining:primary.remaining}:null},config);
  const actions=normalizeCustomerActions(config.customerActions);
  let transitions=[];
  if(actions.closeRequest||actions.escalate){try{transitions=await loadTransitions(key,jira);}catch(_){transitions=[];}}
  return{
    ...model,
    slas:slaResult.values,
    slaAvailable:slaResult.available,
    slaReason:slaResult.reason,
    actions:{
      closeRequest:Boolean(chooseCustomerTransition(transitions,actionTargetStatusIds(actions,'close'))),
      escalate:Boolean(chooseCustomerTransition(transitions,actionTargetStatusIds(actions,'escalate')))
    }
  };
}

export async function updateVisibleRequestFields({request,experience={},updates={},accountId='',jira=appJira}={}){
  const key=requireVisible(request),config=experience?.selfService||{};
  const {fields,names}=prepareCustomerFieldUpdates(updates,config);
  if(!Object.keys(fields).length)throw new Error('No permitted editable fields were supplied.');
  const response=await jira(route`/rest/api/3/issue/${key}`,{method:'PUT',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({fields})});
  if(!response.ok){const payload=await jsonOrText(response);throw new Error(`Unable to update request (${response.status}): ${safeString(payload?.errorMessages?.[0]||payload?.errors&&Object.values(payload.errors)[0]||payload?.text||'')}`.trim());}
  const audited=await writeAuditComment(key,request,accountId,`updated ${names.join(', ')}`,normalizeCustomerActions(config.customerActions),jira);
  return{ok:true,key,updatedFieldIds:Object.keys(fields),audited};
}

export async function performVisibleRequestAction({request,experience={},action='',accountId='',jira=appJira}={}){
  const key=requireVisible(request),actions=normalizeCustomerActions(experience?.selfService?.customerActions),type=safeString(action).toLowerCase();
  if(!['close','escalate'].includes(type))throw new Error('Unsupported customer action.');
  const targets=actionTargetStatusIds(actions,type);
  if(!targets.length)throw new Error(type==='close'?'Close Request is not enabled for this portal experience.':'Escalate is not enabled for this portal experience.');
  const transitions=await loadTransitions(key,jira),transition=chooseCustomerTransition(transitions,targets);
  if(!transition?.id)throw new Error(type==='close'?'This request cannot be closed from the portal right now.':'This request cannot be escalated from the portal right now.');
  const response=await jira(route`/rest/api/3/issue/${key}/transitions`,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({transition:{id:String(transition.id)}})});
  if(!response.ok){const payload=await jsonOrText(response);throw new Error(`Unable to ${type} request (${response.status}): ${safeString(payload?.errorMessages?.[0]||payload?.text||'')}`.trim());}
  const audited=await writeAuditComment(key,request,accountId,type==='close'?`closed this request (moved to ${safeString(transition?.to?.name)||'a closed status'})`:`escalated this request (moved to ${safeString(transition?.to?.name)||'an escalated status'})`,actions,jira);
  return{ok:true,key,action:type,transition:{id:String(transition.id),name:safeString(transition.name)},audited};
}
