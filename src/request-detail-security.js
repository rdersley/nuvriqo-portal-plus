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

export function editableFields(selfServiceConfig={}){
  const fields=Array.isArray(selfServiceConfig?.fields)?selfServiceConfig.fields:[];
  return fields.filter((field)=>field?.mode==='editable'&&field?.editableAfterSubmission===true&&safeString(field?.id||field?.fieldId));
}

export function editableFieldIds(selfServiceConfig={}){
  return new Set(editableFields(selfServiceConfig).map((field)=>safeString(field?.id||field?.fieldId)));
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

const MAX_TEXT=255,MAX_TEXTAREA=10000;
const isBlank=(value)=>value==null||(typeof value==='string'&&!value.trim());

export function plainTextToAdf(text=''){
  const paragraphs=String(text).replace(/\r\n/g,'\n').split(/\n{2,}/);
  return{type:'doc',version:1,content:paragraphs.map((paragraph)=>{
    const lines=paragraph.split('\n'),content=[];
    lines.forEach((line,index)=>{if(index)content.push({type:'hardBreak'});if(line)content.push({type:'text',text:line});});
    return content.length?{type:'paragraph',content}:{type:'paragraph'};
  })};
}

function optionValue(value,label){
  if(value&&typeof value==='object'){
    if(safeString(value.id))return{id:safeString(value.id)};
    if(safeString(value.value))return{value:safeString(value.value)};
  }
  if(typeof value==='string'&&value.trim())return{value:value.trim()};
  throw new Error(`${label} must be one of the available options.`);
}

// Converts a customer-supplied value into the shape the Jira REST API expects
// for the field's schema type, or throws a customer-readable error.
export function coerceFieldValue(field={},value){
  const label=safeString(field.name)||safeString(field.id)||'This field';
  const type=safeString(field.type).toLowerCase(),custom=safeString(field.custom).toLowerCase();
  if(isBlank(value)){
    if(field.requiredWhenEditing)throw new Error(`${label} is required.`);
    return null;
  }
  if(custom.includes('textarea')){
    if(typeof value!=='string')throw new Error(`${label} must be text.`);
    if(value.length>MAX_TEXTAREA)throw new Error(`${label} must be ${MAX_TEXTAREA} characters or fewer.`);
    return plainTextToAdf(value);
  }
  switch(type){
    case 'string':
      if(typeof value!=='string')throw new Error(`${label} must be text.`);
      if(value.length>MAX_TEXT)throw new Error(`${label} must be ${MAX_TEXT} characters or fewer.`);
      return value;
    case 'number':{
      const number=typeof value==='number'?value:typeof value==='string'?Number(value.trim()):NaN;
      if(!Number.isFinite(number))throw new Error(`${label} must be a number.`);
      return number;
    }
    case 'date':{
      const text=safeString(value);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||Number.isNaN(Date.parse(`${text}T00:00:00Z`))||new Date(`${text}T00:00:00Z`).toISOString().slice(0,10)!==text)throw new Error(`${label} must be a valid date (YYYY-MM-DD).`);
      return text;
    }
    case 'datetime':{
      const time=Date.parse(safeString(value));
      if(Number.isNaN(time))throw new Error(`${label} must be a valid date and time.`);
      return new Date(time).toISOString().replace('Z','+0000');
    }
    case 'option':
      return optionValue(value,label);
    default:
      throw new Error(`${label} cannot be edited from the portal.`);
  }
}

// Filters updates to administrator-approved editable fields and converts each
// value for Jira. Returns {fields, names} or throws on the first invalid value.
export function prepareCustomerFieldUpdates(updates={},selfServiceConfig={}){
  const allowed=new Map(editableFields(selfServiceConfig).map((field)=>[safeString(field.id||field.fieldId),field]));
  const source=updates&&typeof updates==='object'&&!Array.isArray(updates)?updates:{};
  const fields={},names=[];
  for(const [id,value] of Object.entries(source)){
    const field=allowed.get(String(id));
    if(!field||value===undefined)continue;
    fields[String(id)]=coerceFieldValue(field,value);
    names.push(safeString(field.name)||String(id));
  }
  return{fields,names};
}

// Returns transition fields Jira requires that have no default, which a
// one-click portal action cannot supply.
function missingRequiredFields(transition){
  const fields=transition?.fields&&typeof transition.fields==='object'?transition.fields:{};
  return Object.entries(fields).filter(([,meta])=>meta?.required===true&&meta?.hasDefaultValue!==true).map(([id])=>id);
}

// Picks a transition whose destination status the administrator explicitly
// configured for this action. Never guesses from transition names.
export function chooseCustomerTransition(transitions=[],targetStatusIds=[]){
  const targets=new Set((Array.isArray(targetStatusIds)?targetStatusIds:[]).map((id)=>safeString(id)).filter(Boolean));
  if(!targets.size)return null;
  const values=Array.isArray(transitions)?transitions:[];
  return values.find((transition)=>targets.has(safeString(transition?.to?.id))&&transition?.isAvailable!==false&&!missingRequiredFields(transition).length)||null;
}

export function actionTargetStatusIds(customerActions={},action=''){
  const type=safeString(action).toLowerCase();
  if(type==='close')return customerActions?.closeRequest===true?customerActions.closeStatusIds||[]:[];
  if(type==='escalate')return customerActions?.escalate===true?customerActions.escalateStatusIds||[]:[];
  return[];
}

export function customerDisplayName(request={},accountId=''){
  const reporter=request?.reporter||{};
  if(accountId&&safeString(reporter.accountId)===safeString(accountId)&&safeString(reporter.displayName))return safeString(reporter.displayName);
  return 'A customer';
}

// Internal (agent-only) note recording what a customer changed through Portal+,
// because Jira attributes app-performed changes to the app, not the customer.
export function buildAuditComment({actor='A customer',accountId='',summary=''}={}){
  const who=accountId?`${actor} (account ${accountId})`:actor;
  return{
    body:{type:'doc',version:1,content:[{type:'paragraph',content:[{type:'text',text:`${who} ${summary} via Nuvriqo Portal+.`}]}]},
    properties:[{key:'sd.public.comment',value:{internal:true}}]
  };
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
