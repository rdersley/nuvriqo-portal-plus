import assert from'node:assert/strict';
import{assertVisibleRequest,chooseCustomerTransition,normalizeIssueKey,normalizeSlaPage,sanitizeCustomerFieldUpdates}from'../src/request-detail-security.js';

assert.equal(normalizeIssueKey('sd-42'),'SD-42');
assert.throws(()=>normalizeIssueKey('../SD-42'),/Invalid request key/);

const visible=[{issueKey:'SD-42',summary:'Visible'}];
assert.equal(assertVisibleRequest(visible,'SD-42').summary,'Visible');
assert.throws(()=>assertVisibleRequest(visible,'SD-99'),/not available/);

const config={fields:[
  {id:'customfield_1',mode:'editable',editableAfterSubmission:true},
  {id:'customfield_2',mode:'editable',editableAfterSubmission:false},
  {id:'customfield_3',mode:'read-only',editableAfterSubmission:false}
]};
assert.deepEqual(sanitizeCustomerFieldUpdates({customfield_1:'ok',customfield_2:'blocked',customfield_3:'blocked',summary:'blocked'},config),{customfield_1:'ok'});

const transitions=[
  {id:'11',name:'In Progress',to:{name:'In Progress'}},
  {id:'21',name:'Resolve request',to:{name:'Resolved'}},
  {id:'31',name:'Escalate to support lead',to:{name:'Escalated'}}
];
assert.equal(chooseCustomerTransition(transitions,'close')?.id,'21');
assert.equal(chooseCustomerTransition(transitions,'escalate')?.id,'31');
assert.equal(chooseCustomerTransition(transitions,'unknown'),null);

assert.deepEqual(normalizeSlaPage({values:[{
  id:'5',name:'Time to resolution',ongoingCycle:{breached:false,goalDuration:{friendly:'8h'},elapsedTime:{friendly:'2h'},remainingTime:{friendly:'6h'},startTime:{iso8601:'2026-09-14T10:00:00Z'}}
}]}),[{
  id:'5',name:'Time to resolution',state:'running',breached:false,target:'8h',elapsed:'2h',remaining:'6h',start:'2026-09-14T10:00:00Z',stop:''
}]);

console.log('request detail security tests passed');
