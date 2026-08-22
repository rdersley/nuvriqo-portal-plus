import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Checkbox, Heading, Label, Spinner, Stack, Text, TextArea, Textfield, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const parseMappings = (text) => String(text || '').split('\n').map((line) => {
  const [status, label, percent] = line.split('|').map((x) => String(x || '').trim());
  return { status, label, percent: Number(percent) || 0 };
}).filter((m) => m.status && m.label);

const formatMappings = (items) => (items || []).map((m) => `${m.status}|${m.label}|${m.percent}`).join('\n');

const Settings = () => {
  const context = useProductContext();
  const projectId = context?.extension?.project?.id || context?.extension?.projectId;
  const [settings, setSettings] = useState(null);
  const [mappingText, setMappingText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    invoke('getPortalSettings', { projectId }).then((s) => {
      setSettings(s);
      setMappingText(formatMappings(s.progressMappings));
    }).catch((e) => setMessage(e?.message || String(e)));
  }, [projectId]);

  if (!settings) return <Stack space="space.100"><Spinner />{message ? <Text>{message}</Text> : null}</Stack>;

  const setModule = (key, checked) => setSettings({ ...settings, modules: { ...settings.modules, [key]: checked } });
  const save = async () => {
    setSaving(true); setMessage('');
    try {
      const next = { ...settings, progressMappings: parseMappings(mappingText) };
      const saved = await invoke('savePortalSettings', { projectId, settings: next });
      setSettings(saved);
      setMappingText(formatMappings(saved.progressMappings));
      setMessage('Portal+ settings saved.');
    } catch (e) { setMessage(e?.message || String(e)); }
    finally { setSaving(false); }
  };

  return <Stack space="space.300">
    <Heading size="large">Portal+ settings</Heading>
    <Text>Configure the customer experience for this JSM project without changing source code.</Text>
    {message ? <Text>{message}</Text> : null}

    <Stack space="space.100">
      <Heading size="medium">Branding</Heading>
      <Label labelFor="portal-title">Portal title</Label>
      <Textfield id="portal-title" value={settings.portalTitle || ''} onChange={(e) => setSettings({ ...settings, portalTitle: e.target.value })} />
      <Label labelFor="welcome-text">Welcome text</Label>
      <TextArea id="welcome-text" value={settings.welcomeText || ''} onChange={(e) => setSettings({ ...settings, welcomeText: e.target.value })} />
    </Stack>

    <Stack space="space.075">
      <Heading size="medium">Modules</Heading>
      <Checkbox label="CSV export" isChecked={settings.modules?.export !== false} onChange={(e) => setModule('export', e.target.checked)} />
      <Checkbox label="Customer priority manager" isChecked={settings.modules?.priority !== false} onChange={(e) => setModule('priority', e.target.checked)} />
      <Checkbox label="Progress tracker" isChecked={settings.modules?.progress !== false} onChange={(e) => setModule('progress', e.target.checked)} />
      <Checkbox label="Smart approvals" isChecked={settings.modules?.approvals !== false} onChange={(e) => setModule('approvals', e.target.checked)} />
      <Checkbox label="Customer follow-up" isChecked={settings.modules?.followUp !== false} onChange={(e) => setModule('followUp', e.target.checked)} />
    </Stack>

    <Stack space="space.100">
      <Heading size="medium">Customer progress mapping</Heading>
      <Text>Optional. One line per Jira status using: Jira status | Customer label | Percent.</Text>
      <TextArea
        value={mappingText}
        onChange={(e) => setMappingText(e.target.value)}
        placeholder={'Waiting for support|Under review|35\nIn progress|Being worked on|60\nResolved|Complete|100'}
      />
    </Stack>

    <Button appearance="primary" onClick={save} isDisabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
  </Stack>;
};

ForgeReconciler.render(<Settings />);
