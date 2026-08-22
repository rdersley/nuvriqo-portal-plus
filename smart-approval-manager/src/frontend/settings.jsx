import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Checkbox, Heading, Label, Spinner, Stack, Text, Textfield, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const Settings = () => {
  const context = useProductContext();
  const projectId = context?.extension?.project?.id;
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (projectId) invoke('getSettings', { projectId }).then(setSettings);
  }, [projectId]);

  if (!settings) return <Spinner />;
  const update = (key, value) => setSettings({ ...settings, [key]: value });
  const save = async () => {
    setBusy(true); setMessage('');
    try { setSettings(await invoke('saveSettings', { projectId, settings })); setMessage('Settings saved.'); }
    catch (e) { setMessage(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return <Stack space="space.200">
    <Heading size="large">Smart Approval Manager</Heading>
    <Text>Configure approvals for this service project. Transition IDs are optional; leave them blank if you only want decisions recorded without moving the Jira ticket.</Text>

    <Label labelFor="reminder-hours">Automatic reminder interval (hours)</Label>
    <Textfield id="reminder-hours" type="number" value={String(settings.reminderHours)} onChange={(e) => update('reminderHours', e.target.value)} />

    <Checkbox isChecked={settings.autoAddParticipant} onChange={(e) => update('autoAddParticipant', e.target.checked)} label="Automatically add the approver as a request participant" />
    <Checkbox isChecked={settings.requireDeclineReason} onChange={(e) => update('requireDeclineReason', e.target.checked)} label="Require a reason when declining" />

    <Label labelFor="approve-transition">Approved transition ID (optional)</Label>
    <Textfield id="approve-transition" value={settings.approveTransitionId} onChange={(e) => update('approveTransitionId', e.target.value)} placeholder="e.g. 31" />

    <Label labelFor="decline-transition">Declined transition ID (optional)</Label>
    <Textfield id="decline-transition" value={settings.declineTransitionId} onChange={(e) => update('declineTransitionId', e.target.value)} placeholder="e.g. 41" />

    <Button appearance="primary" onClick={save} isDisabled={busy}>Save settings</Button>
    {message ? <Text>{message}</Text> : null}
  </Stack>;
};

ForgeReconciler.render(<Settings />);
