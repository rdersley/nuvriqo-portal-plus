import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Checkbox, Heading, Inline, Label, Lozenge, Select, Spinner, Stack, Text, TextArea, Textfield, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const modeOptions = [
  { label: 'All approvers must approve', value: 'all' },
  { label: 'Any one approver can approve', value: 'any' },
];
const operatorOptions = [
  { label: 'Equals', value: 'equals' },
  { label: 'Does not equal', value: 'notEquals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Is empty', value: 'isEmpty' },
  { label: 'Is not empty', value: 'notEmpty' },
];
const newRule = (number) => ({
  id: `rule-${Date.now()}-${number}`,
  name: `Approval rule ${number}`,
  enabled: true,
  approvalMode: 'all',
  conditions: [{ fieldId: 'issuetype', operator: 'equals', value: '' }],
  approvers: [],
  message: 'Please review and approve this request.',
  reminderHours: 24,
  pendingTransitionId: '', approveTransitionId: '', declineTransitionId: '',
});

const Settings = () => {
  const context = useProductContext();
  const projectId = context?.extension?.project?.id;
  const [settings, setSettings] = useState(null);
  const [fields, setFields] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchText, setSearchText] = useState({});
  const [searchResults, setSearchResults] = useState({});

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      invoke('getSettings', { projectId }),
      invoke('getRuleBuilderMetadata', { projectId }),
    ]).then(([value, meta]) => {
      setSettings(value);
      setFields(meta?.fields || []);
    }).catch((e) => setMessage(e.message || String(e)));
  }, [projectId]);

  if (!settings) return <Spinner />;
  const update = (key, value) => setSettings({ ...settings, [key]: value });
  const updateRules = (rules) => update('autoRules', rules);
  const updateRule = (index, patch) => updateRules(settings.autoRules.map((r, i) => i === index ? { ...r, ...patch } : r));
  const updateCondition = (ruleIndex, conditionIndex, patch) => {
    const rule = settings.autoRules[ruleIndex];
    updateRule(ruleIndex, { conditions: rule.conditions.map((c, i) => i === conditionIndex ? { ...c, ...patch } : c) });
  };

  const findApprovers = async (ruleIndex) => {
    const query = (searchText[ruleIndex] || '').trim();
    if (query.length < 2) return;
    try {
      setSearchResults({ ...searchResults, [ruleIndex]: await invoke('searchRuleApprovers', { projectId, query }) });
    } catch (e) { setMessage(e.message || String(e)); }
  };

  const addApprover = (ruleIndex, accountId) => {
    const found = (searchResults[ruleIndex] || []).find((u) => u.accountId === accountId);
    if (!found) return;
    const rule = settings.autoRules[ruleIndex];
    if (rule.approvers.some((a) => a.accountId === found.accountId)) return;
    updateRule(ruleIndex, { approvers: [...rule.approvers, found] });
  };

  const save = async () => {
    setBusy(true); setMessage('');
    try {
      const saved = await invoke('saveSettings', { projectId, settings });
      setSettings(saved); setMessage('Settings saved successfully.');
    } catch (e) { setMessage(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return <Stack space="space.300">
    <Stack space="space.100">
      <Heading size="large">Smart Approval Manager</Heading>
      <Text>Set up simple customer approvals for this service project. Agents can still request approvals manually; rules below can automate routine cases.</Text>
    </Stack>

    <Heading size="medium">Default behaviour</Heading>
    <Label labelFor="default-mode">Multiple approvers</Label>
    <Select inputId="default-mode" options={modeOptions} value={modeOptions.find((x) => x.value === settings.defaultApprovalMode) || modeOptions[0]} onChange={(v) => update('defaultApprovalMode', v?.value || 'all')} />
    <Label labelFor="reminder-hours">Automatic reminder interval</Label>
    <Textfield id="reminder-hours" type="number" value={String(settings.reminderHours)} onChange={(e) => update('reminderHours', e.target.value)} />
    <Checkbox isChecked={settings.autoAddParticipant} onChange={(e) => update('autoAddParticipant', e.target.checked)} label="Add approvers as request participants automatically" />
    <Checkbox isChecked={settings.requireDeclineReason} onChange={(e) => update('requireDeclineReason', e.target.checked)} label="Require a reason when declining" />

    <Heading size="medium">Workflow actions</Heading>
    <Text>Optional transition IDs let Smart Approval Manager move the Jira ticket when approval is requested, completed or declined.</Text>
    <Label labelFor="pending-transition">When approval is requested</Label>
    <Textfield id="pending-transition" value={settings.pendingTransitionId || ''} onChange={(e) => update('pendingTransitionId', e.target.value)} placeholder="Transition ID to Awaiting Approval" />
    <Label labelFor="approve-transition">When approval succeeds</Label>
    <Textfield id="approve-transition" value={settings.approveTransitionId || ''} onChange={(e) => update('approveTransitionId', e.target.value)} placeholder="Transition ID to Approved / Ready" />
    <Label labelFor="decline-transition">When approval is declined</Label>
    <Textfield id="decline-transition" value={settings.declineTransitionId || ''} onChange={(e) => update('declineTransitionId', e.target.value)} placeholder="Transition ID to Rejected" />

    <Inline spread="space-between" alignBlock="center">
      <Heading size="medium">Automatic approval rules</Heading>
      <Button onClick={() => updateRules([...(settings.autoRules || []), newRule((settings.autoRules || []).length + 1)])}>Add rule</Button>
    </Inline>
    {(settings.autoRules || []).length === 0 ? <Text>No automatic rules yet. Agents can still request approvals manually.</Text> : null}

    {(settings.autoRules || []).map((rule, ruleIndex) => <Stack key={rule.id} space="space.150">
      <Inline spread="space-between" alignBlock="center">
        <Inline space="space.100" alignBlock="center"><Heading size="small">{rule.name}</Heading><Lozenge appearance={rule.enabled ? 'success' : 'default'}>{rule.enabled ? 'Enabled' : 'Disabled'}</Lozenge></Inline>
        <Button appearance="subtle" onClick={() => updateRules(settings.autoRules.filter((_, i) => i !== ruleIndex))}>Remove rule</Button>
      </Inline>
      <Label labelFor={`rule-name-${ruleIndex}`}>Rule name</Label>
      <Textfield id={`rule-name-${ruleIndex}`} value={rule.name} onChange={(e) => updateRule(ruleIndex, { name: e.target.value })} />
      <Checkbox isChecked={rule.enabled !== false} onChange={(e) => updateRule(ruleIndex, { enabled: e.target.checked })} label="Rule enabled" />

      <Heading size="small">When all of these conditions match</Heading>
      {(rule.conditions || []).map((condition, conditionIndex) => <Stack key={`${rule.id}-condition-${conditionIndex}`} space="space.100">
        <Select options={fields.map((f) => ({ label: f.name, value: f.id }))} value={fields.find((f) => f.id === condition.fieldId) ? { label: fields.find((f) => f.id === condition.fieldId).name, value: condition.fieldId } : null} placeholder="Choose Jira field" onChange={(v) => updateCondition(ruleIndex, conditionIndex, { fieldId: v?.value || '' })} />
        <Select options={operatorOptions} value={operatorOptions.find((o) => o.value === condition.operator) || operatorOptions[0]} onChange={(v) => updateCondition(ruleIndex, conditionIndex, { operator: v?.value || 'equals' })} />
        {!['isEmpty','notEmpty'].includes(condition.operator) ? <Textfield value={condition.value || ''} placeholder="Value to match" onChange={(e) => updateCondition(ruleIndex, conditionIndex, { value: e.target.value })} /> : null}
        <Button appearance="subtle" onClick={() => updateRule(ruleIndex, { conditions: rule.conditions.filter((_, i) => i !== conditionIndex) })}>Remove condition</Button>
      </Stack>)}
      <Button appearance="subtle" onClick={() => updateRule(ruleIndex, { conditions: [...(rule.conditions || []), { fieldId: '', operator: 'equals', value: '' }] })}>Add condition</Button>

      <Heading size="small">Approvers</Heading>
      {(rule.approvers || []).length ? <Text>{rule.approvers.map((a) => a.displayName).join(', ')}</Text> : <Text>No approvers selected.</Text>}
      <Inline space="space.100" alignBlock="center">
        <Textfield value={searchText[ruleIndex] || ''} placeholder="Search name or email" onChange={(e) => setSearchText({ ...searchText, [ruleIndex]: e.target.value })} />
        <Button onClick={() => findApprovers(ruleIndex)}>Search</Button>
      </Inline>
      {(searchResults[ruleIndex] || []).length ? <Select placeholder="Add approver" options={searchResults[ruleIndex].map((u) => ({ label: u.displayName, value: u.accountId }))} onChange={(v) => addApprover(ruleIndex, v?.value)} /> : null}
      {(rule.approvers || []).map((a) => <Button key={a.accountId} appearance="subtle" onClick={() => updateRule(ruleIndex, { approvers: rule.approvers.filter((x) => x.accountId !== a.accountId) })}>Remove {a.displayName}</Button>)}

      <Label labelFor={`mode-${ruleIndex}`}>Approval requirement</Label>
      <Select inputId={`mode-${ruleIndex}`} options={modeOptions} value={modeOptions.find((x) => x.value === rule.approvalMode) || modeOptions[0]} onChange={(v) => updateRule(ruleIndex, { approvalMode: v?.value || 'all' })} />
      <Label labelFor={`message-${ruleIndex}`}>Message to approvers</Label>
      <TextArea id={`message-${ruleIndex}`} value={rule.message || ''} onChange={(e) => updateRule(ruleIndex, { message: e.target.value })} />
      <Label labelFor={`reminder-${ruleIndex}`}>Reminder interval (hours)</Label>
      <Textfield id={`reminder-${ruleIndex}`} type="number" value={String(rule.reminderHours || settings.reminderHours || 24)} onChange={(e) => updateRule(ruleIndex, { reminderHours: e.target.value })} />

      <Heading size="small">Optional workflow overrides</Heading>
      <Textfield value={rule.pendingTransitionId || ''} placeholder="Approval required transition ID" onChange={(e) => updateRule(ruleIndex, { pendingTransitionId: e.target.value })} />
      <Textfield value={rule.approveTransitionId || ''} placeholder="Approved transition ID" onChange={(e) => updateRule(ruleIndex, { approveTransitionId: e.target.value })} />
      <Textfield value={rule.declineTransitionId || ''} placeholder="Declined transition ID" onChange={(e) => updateRule(ruleIndex, { declineTransitionId: e.target.value })} />
    </Stack>)}

    <Button appearance="primary" onClick={save} isDisabled={busy}>Save Smart Approval settings</Button>
    {message ? <Text>{message}</Text> : null}
  </Stack>;
};

ForgeReconciler.render(<Settings />);
