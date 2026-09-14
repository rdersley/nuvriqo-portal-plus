const safeString=(value)=>value==null?'':String(value).trim();

export function normalizeIssueKey(value=''){
  const key=safeString(value).toUpperCase();
  if(!/^[A-Z][A-Z0-9_]*-\d+$/.test(key))throw new Error('Invalid request key.');
  return key;
}

export function findVisibleRequest(requests=[],issueKey=''){
  const key=normalizeIssueKey(issueKey);
  return (Array.isArray(requests)?requests:[]).find((request)=>safeString(request?.issueKey||request?.key).toUpperCase()===key)||null;
}

export function assertVisibleRequest(requests=[],issueKey=''){
  const request=findVisibleRequest(requests,issueKey);
  if(!request)throw new Error('This request is not available in your Portal+ customer view.');
  return request;
}

export function editableFieldIds(selfServiceConfig={}){
  const fields=Array.isArray(selfServiceConfig?.fields)?selfServiceConfig.fields:[];
  return new Set(fields.filter((field)=>field?.mode==='editable'&&field?.editableAfterSubmission===true).map((field)=>safeString(field?.id||field?.fieldId)).filter(Boolean));
}

export function sanitizeCustomerFieldUpdates(updates={},selfServiceConfig={}){
  const allowed=editableFieldIds(selfServiceConfig),source=updates&&typeof updates==='object'&&!Array.isArray(updates)?updates:{},fields={};
  for(const [id,value] of Object.entries(source)){
    if(!allowed.has(String(id)))continue;
    if(value===undefined)continue;
    fields[String(id)]=value;
  }
  return fields;
}

const transitionName=(transition)=>safeString(transition?.name).toLowerCase();
const destinationName=(transition)=>safeString(transition?.to?.name).toLowerCase();

export function chooseCustomerTransition(transitions=[],action=''){
  const values=Array.isArray(transitions)?transitions:[];
  const type=safeString(action).toLowerCase();
  const terms=type==='close'?['close','closed','resolve','resolved','cancel','cancelled','canceled']:type==='escalate'?['escalate','escalated']:[];
  if(!terms.length)return null;
  return values.find((transition)=>{
    const text=`${transitionName(transition)} ${destinationName(transition)}`;
    return terms.some((term)=>text.includes(term));
  })||null;
}

export function normalizeSlaPage(payload={}){
  const values=Array.isArray(payload?.values)?payload.values:[];
  return values.map((metric)=>{
    const cycle=metric?.ongoingCycle||((Array.isArray(metric?.completedCycles)&&metric.completedCycles.length)?metric.completedCycles[metric.completedCycles.length-1]:null);
    const breached=cycle?.breached===true;
    const completed=Boolean(!metric?.ongoingCycle&&cycle);
    return{
      id:safeString(metric?.id),
      name:safeString(metric?.name,'SLA'),
      state:breached?'breached':completed?'met':'running',
      breached,
      target:safeString(cycle?.goalDuration?.friendly),
      elapsed:safeString(cycle?.elapsedTime?.friendly),
      remaining:safeString(cycle?.remainingTime?.friendly),
      start:safeString(cycle?.startTime?.iso8601),
      stop:safeString(cycle?.stopTime?.iso8601)
    };
  });
}
