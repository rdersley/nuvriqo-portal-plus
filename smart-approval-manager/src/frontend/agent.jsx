import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Heading, Inline, Label, Lozenge, Select, Spinner, Stack, Text, TextArea, Textfield, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const AgentPanel = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key;
  const [approvals, setApprovals] = useState([]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!issueKey) return;
    setLoading(true);
    try { setApprovals(await invoke('getIssueApprovals', { issueKey })); }
    catch (e) { setError(e.message || String(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [issueKey]);

  const search = async () => {
    setError('');
    try {
      const found = await invoke('searchApprovers', { query });
      setUsers(found);
      if (found.length === 1) setSelected({ label: found[0].displayName, value: found[0].accountId });
    } catch (e) { setError(e.message || String(e)); }
  };

  const requestApproval = async () => {
    const user = users.find((u) => u.accountId === selected?.value);
    if (!user) return setError('Select an approver first.');
    setBusy(true); setError('');
    try {
      await invoke('createApproval', { issueKey, approver: user, message });
      setQuery(''); setUsers([]); setSelected(null); setMessage('');
      await refresh();
    } catch (e) { setError(e.message || String(e)); }
    finally { setBusy(false); }
  };

  const act = async (name, id) => {
    setBusy(true); setError('');
    try { await invoke(name, { approvalId: id }); await refresh(); }
    catch (e) { setError(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return <Stack space="space.200">
    <Heading size="medium">Smart Approval</Heading>
    {error ? <Text>{error}</Text> : null}
    <Stack space="space.100">
      <Label labelFor="approver-search">Find approver</Label>
      <Inline space="space.100" alignBlock="center">
        <Textfield id="approver-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" />
        <Button onClick={search} isDisabled={query.trim().length < 2 || busy}>Search</Button>
      </Inline>
      {users.length ? <Select
        label="Approver"
        options={users.map((u) => ({ label: u.displayName, value: u.accountId }))}
        value={selected}
        onChange={setSelected}
      /> : null}
      <Label labelFor="approval-message">Message to approver (optional)</Label>
      <TextArea id="approval-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do they need to decide?" />
      <Button appearance="primary" onClick={requestApproval} isDisabled={!selected || busy}>Request approval</Button>
    </Stack>

    <Heading size="small">Approval history</Heading>
    {loading ? <Spinner /> : approvals.length === 0 ? <Text>No approvals have been requested for this ticket.</Text> : approvals.map((a) =>
      <Stack key={a.id} space="space.050">
        <Inline space="space.100" alignBlock="center">
          <Text><Text weight="bold">{a.approver.displayName}</Text></Text>
          <Lozenge appearance={a.status === 'approved' ? 'success' : a.status === 'declined' ? 'removed' : a.status === 'pending' ? 'inprogress' : 'default'}>{a.status}</Lozenge>
        </Inline>
        <Text>Requested {new Date(a.createdAt).toLocaleString()} · Reminders: {a.reminderCount || 0}</Text>
        {a.message ? <Text>{a.message}</Text> : null}
        {a.decisionReason ? <Text>Reason: {a.decisionReason}</Text> : null}
        {a.status === 'pending' ? <Inline space="space.100">
          <Button onClick={() => act('sendReminder', a.id)} isDisabled={busy}>Send reminder</Button>
          <Button appearance="subtle" onClick={() => act('cancelApproval', a.id)} isDisabled={busy}>Cancel</Button>
        </Inline> : null}
      </Stack>
    )}
  </Stack>;
};

ForgeReconciler.render(<AgentPanel />);
