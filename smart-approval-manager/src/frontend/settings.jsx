import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Checkbox, Heading, Label, Spinner, Stack, Text, TextArea, Textfield, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const sampleRules = [
  {
    id: 'hardware-approval',
    name: 'Hardware approvals',
    enabled: true,
    conditions: [
      { fieldId: 'issuetype', operator: 'equals', value: 'Hardware Replacement' }
    ],
    approvers: [
      { accountId: 'PASTE-ATLASSIAN-ACCOUNT-ID-HERE', displayName: 'Approver name' }
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

  const loadExample = () => setRulesText(JSON.stringify(sampleRules, null, 2));

  return <Stack space="space.200">
    <Heading size="large">Smart Approval Manager</Heading>
    <Text>Configure how this service project requests approval, changes Jira status, and automatically assigns approvers.</Text>

    <Heading size="medium">Default approval behaviour</Heading>
    <Label labelFor="reminder-hours">Automatic reminder interval (hours)</Label>
    <Textfield id="reminder-hours" type="number" value={String(settings.reminderHours)} onChange={(e) => update('reminderHours', e.target.value)} />

    <Checkbox isChecked={settings.autoAddParticipant} onChange={(e) => update('autoAddParticipant', e.target.checked)} label="Automatically add the approver as a request participant" />
    <Checkbox isChecked={settings.requireDeclineReason} onChange={(e) => update('requireDeclineReason', e.target.checked)} label="Require a reason when declining" />

    <Heading size="medium">Default workflow transitions</Heading>
    <Text>These transitions are used by normal/manual approvals. An automatic rule can override them.</Text>

    <Label labelFor="pending-transition">Approval required transition ID (optional)</Label>
    <Textfield id="pending-transition" value={settings.pendingTransitionId || ''} onChange={(e) => update('pendingTransitionId', e.target.value)} placeholder="Move to e.g. Awaiting Approval" />

    <Label labelFor="approve-transition">Approved transition ID (optional)</Label>
    <Textfield id="approve-transition" value={settings.approveTransitionId || ''} onChange={(e) => update('approveTransitionId', e.target.value)} placeholder="Move to e.g. Approved" />

    <Label labelFor="decline-transition">Declined transition ID (optional)</Label>
    <Textfield id="decline-transition" value={settings.declineTransitionId || ''} onChange={(e) => update('declineTransitionId', e.target.value)} placeholder="Move to e.g. Rejected" />

    <Heading size="medium">Automatic approval rules</Heading>
    <Text>Rules can match Jira fields such as request type, priority, client or any custom field, then assign one or more approvers automatically. All conditions in a rule must match.</Text>
    <Text>Supported operators: equals, notEquals, contains, isEmpty and notEmpty. Rules can override the pending, approved and declined transition IDs.</Text>

    <TextArea value={rulesText} onChange={(e) => setRulesText(e.target.value)} minimumRows={12} />
    <Button appearance="subtle" onClick={loadExample} isDisabled={busy}>Load example rule</Button>

    <Button appearance="primary" onClick={save} isDisabled={busy}>Save settings</Button>
    {message ? <Text>{message}</Text> : null}
  </Stack>;
};

ForgeReconciler.render(<Settings />);
