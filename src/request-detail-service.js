import api,{route} from '@forge/api';
import {buildRequestDetailModel} from './self-service-runtime.js';
import {assertVisibleRequest,chooseCustomerTransition,normalizeIssueKey,normalizeSlaPage,sanitizeCustomerFieldUpdates} from './request-detail-security.js';

const safeArray=(value)=>Array.isArray(value)?value:[];
const safeString=(value)=>value==null?'':String(value);

async function jsonOrText(response){
  const text=await response.text();
  if(!text)return{};
  try{return JSON.parse(text);}catch(_){return{text};}
}

export async function loadRequestSlas(issueKey,enabled=true){
  if(!enabled)return{values:[],available:false,reason:'disabled'};
  const key=normalizeIssueKey(issueKey);
  try{
    const response=await api.asApp().requestJira(route`/rest/servicedeskapi/request/${key}/sla?limit=50`,{headers:{Accept:'application/json'}});
    if(!response.ok)return{values:[],available:false,reason:`jira-${response.status}`};
    const payload=await response.json();
    return{values:normalizeSlaPage(payload),available:true,reason:''};
  }catch(_){return{values:[],available:false,reason:'unavailable'};}
}

export async function loadTransitions(issueKey){
  const key=normalizeIssueKey(issueKey);
  const response=await api.asApp().requestJira(route`/rest/api/3/issue/${key}/transitions`,{headers:{Accept:'application/json'}});
  if(!response.ok){const payload=await jsonOrText(response);throw new Error(`Unable to load request actions (${response.status}): ${safeString(payload?.errorMessages?.[0]||payload?.text||'')}`.trim());}
  const payload=await response.json();
  return safeArray(payload?.transitions);
}

export async function buildLiveRequestDetail({issueKey,visibleRequests=[],experience={}}={}){
  const visible=assertVisibleRequest(visibleRequests,issueKey),config=experience?.selfService||{},slaEnabled=config?.sla?.enabled===true;
  const slaResult=await loadRequestSlas(issueKey,slaEnabled);
  const primary=slaResult.values.find((metric)=>metric.state==='running')||slaResult.values[0]||null;
  const model=buildRequestDetailModel({...visible,sla:primary?{state:primary.state,label:primary.name,target:primary.target,remaining:primary.remaining}:null},config);
  let transitions=[];
  if(model.actions.closeRequest||model.actions.escalate){try{transitions=await loadTransitions(issueKey);}catch(_){transitions=[];}}
  return{
    ...model,
    slas:slaResult.values,
    slaAvailable:slaResult.available,
    slaReason:slaResult.reason,
    actions:{
      closeRequest:Boolean(model.actions.closeRequest&&chooseCustomerTransition(transitions,'close')),
      escalate:Boolean(model.actions.escalate&&chooseCustomerTransition(transitions,'escalate'))
    }
  };
}

export async function updateVisibleRequestFields({issueKey,visibleRequests=[],experience={},updates={}}={}){
  assertVisibleRequest(visibleRequests,issueKey);
  const key=normalizeIssueKey(issueKey),fields=sanitizeCustomerFieldUpdates(updates,experience?.selfService||{});
  if(!Object.keys(fields).length)throw new Error('No permitted editable fields were supplied.');
  const response=await api.asApp().requestJira(route`/rest/api/3/issue/${key}`,{method:'PUT',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({fields})});
  if(!response.ok){const payload=await jsonOrText(response);throw new Error(`Unable to update request (${response.status}): ${safeString(payload?.errorMessages?.[0]||payload?.errors&&Object.values(payload.errors)[0]||payload?.text||'')}`.trim());}
  return{ok:true,key,updatedFieldIds:Object.keys(fields)};
}

export async function performVisibleRequestAction({issueKey,visibleRequests=[],experience={},action=''}={}){
  assertVisibleRequest(visibleRequests,issueKey);
  const key=normalizeIssueKey(issueKey),config=experience?.selfService?.customerActions||{},type=safeString(action).toLowerCase();
  if(type==='close'&&config.closeRequest!==true)throw new Error('Close Request is not enabled for this portal experience.');
  if(type==='escalate'&&config.escalate!==true)throw new Error('Escalate is not enabled for this portal experience.');
  if(!['close','escalate'].includes(type))throw new Error('Unsupported customer action.');
  const transitions=await loadTransitions(key),transition=chooseCustomerTransition(transitions,type);
  if(!transition?.id)throw new Error(type==='close'?'No customer-safe close transition is currently available.':'No customer-safe escalation transition is currently available.');
  const response=await api.asApp().requestJira(route`/rest/api/3/issue/${key}/transitions`,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({transition:{id:String(transition.id)}})});
  if(!response.ok){const payload=await jsonOrText(response);throw new Error(`Unable to ${type} request (${response.status}): ${safeString(payload?.errorMessages?.[0]||payload?.text||'')}`.trim());}
  return{ok:true,key,action:type,transition:{id:String(transition.id),name:safeString(transition.name)}};
}
