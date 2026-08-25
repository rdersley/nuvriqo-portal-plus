import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Checkbox, Heading, Label, Select, Spinner, Stack, Text, TextArea, Textfield, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const sampleRules = [
  {
    id: 'hardware-approval',
    name: 'Hardware approvals',
    enabled: true,
    approvalMode: 'all',
    conditions: [
      { fieldId: 'issuetype', operator: 'equals', value: 'Hardware Replacement' }
    ],
    approvers: [
      { accountId: 'PASTE-ATLASSIAN-ACCOUNT-ID-HERE', displayName: 'Approver one' },
      { accountId: 'PASTE-SECOND-ACCOUNT-ID-HERE', displayName: 'Approver two' }
    ],
    message: 'Please review and approve this request.',
    reminderHours: 24,
    pendingTransitionId: '',
    approveTransitionId: '',
    declineTransitionId: ''
  }
];

const Settings = () => {
  const context = useProductContext();
  const projectId = context?.extension?.project?.id;
  const [settings, setSettings] = useState(null);
  const [rulesText, setRulesText] = useState('[]');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (projectId) invoke('getSettings', { projectId }).then((value) => {
      setSettings(value);
      setRulesText(JSON.stringify(value.autoRules || [], null, 2));
    });
  }, [projectId]);

  if (!settings) return <Spinner />;
  const update = (key, value) => setSettings({ ...settings, [key]: value });

  const save = async () => {
    setBusy(true); setMessage('');
    try {
      let autoRules;
      try { autoRules = JSON.parse(rulesText || '[]'); }
      catch { throw new Error('Automatic approval rules are not valid JSON.'); }
      if (!Array.isArray(autoRules)) throw new Error('Automatic approval rules must be a JSON array.');
      const saved = await invoke('saveSettings', { projectId, settings: { ...settings, autoRules } });
      setSettings(saved);
      setRulesText(JSON.stringify(saved.autoRules || [], null, 2));
      setMessage('Settings saved.');
    } catch (e) { setMessage(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return <Stack space="space.200">
    <Heading size="large">Smart Approval Manager</Heading>
    <Text>Configure how this service project requests approval, selects approvers and changes Jira status.</Text>

    <Heading size="medium">Default approval behaviour</Heading>
    <Label labelFor="default-mode">When more than one approver is selected</Label>
    <Select
      inputId="default-mode"
      options={[
        { label: 'All approvers must approve', value: 'all' },
        { label: 'Any one approver can approve', value: 'any' },
      ]}
      value={settings.defaultApprovalMode === 'any'
        ? { label: 'Any one approver can approve', value: 'any' }
        : { label: 'All approvers must approve', value: 'all' }}
      onChange={(value) => update('defaultApprovalMode', value?.value || 'all')}
    />

    <Label labelFor="reminder-hours">Automatic reminder interval (hours)</Label>
    <Textfield id="reminder-hours" type="number" value={String(settings.reminderHours)} onChange={(e) => update('reminderHours', e.target.value)} />
    <Checkbox isChecked={settings.autoAddParticipant} onChange={(e) => update('autoAddParticipant', e.target.checked)} label="Automatically add approvers as request participants" />
    <Checkbox isChecked={settings.requireDeclineReason} onChange={(e) => update('requireDeclineReason', e.target.checked)} label="Require a reason when declining" />

    <Heading size="medium">Default workflow transitions</Heading>
    <Text>These are used by manual approvals and by automatic rules unless a rule supplies its own transition.</Text>
    <Label labelFor="pending-transition">When approval is requested</Label>
    <Textfield id="pending-transition" value={settings.pendingTransitionId || ''} onChange={(e) => update('pendingTransitionId', e.target.value)} placeholder="Transition ID to Awaiting Approval" />
    <Label labelFor="approve-transition">When approval is complete</Label>
    <Textfield id="approve-transition" value={settings.approveTransitionId || ''} onChange={(e) => update('approveTransitionId', e.target.value)} placeholder="Transition ID to Approved / Ready" />
    <Label labelFor="decline-transition">When approval is declined</Label>
    <Textfield id="decline-transition" value={settings.declineTransitionId || ''} onChange={(e) => update('declineTransitionId', e.target.value)} placeholder="Transition ID to Rejected" />

    <Heading size="medium">Automatic approval rules</Heading>
    <Text>Rules can match request type, priority, client or any Jira/custom field and assign one or more approvers. Set approvalMode to “all” or “any”.</Text>
    <Text>Supported condition operators: equals, notEquals, contains, isEmpty and notEmpty.</Text>
    <TextArea value={rulesText} onChange={(e) => setRulesText(e.target.value)} minimumRows={12} />
    <Button appearance="subtle" onClick={() => setRulesText(JSON.stringify(sampleRules, null, 2))} isDisabled={busy}>Load example rule</Button>

    <Button appearance="primary" onClick={save} isDisabled={busy}>Save settings</Button>
    {message ? <Text>{message}</Text> : null}
  </Stack>;
};

ForgeReconciler.render(<Settings />);
