import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Heading, Inline, Label, Lozenge, Select, Spinner, Stack, Text, TextArea, Textfield, useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const AgentPanel = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key;
  const [approvals, setApprovals] = useState([]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [approvalMode, setApprovalMode] = useState({ label: 'All selected approvers must approve', value: 'all' });
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
      if (found.length === 1) setSelected([{ label: found[0].displayName, value: found[0].accountId }]);
    } catch (e) { setError(e.message || String(e)); }
  };

  const requestApproval = async () => {
    const selectedIds = new Set((selected || []).map((s) => s.value));
    const approvers = users.filter((u) => selectedIds.has(u.accountId));
    if (!approvers.length) return setError('Select at least one approver first.');
    setBusy(true); setError('');
    try {
      await invoke('createApproval', { issueKey, approvers, approvalMode: approvalMode?.value || 'all', message });
      setQuery(''); setUsers([]); setSelected([]); setMessage('');
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

  const groupProgress = (approval) => {
    if (!approval.groupId || !approval.groupSize || approval.groupSize <= 1) return null;
    const group = approvals.filter((a) => a.groupId === approval.groupId);
    const approved = group.filter((a) => a.status === 'approved').length;
    const declined = group.filter((a) => a.status === 'declined').length;
    const pending = group.filter((a) => a.status === 'pending').length;
    return `${approved} approved · ${declined} declined · ${pending} waiting · ${approval.approvalMode === 'any' ? 'any one can approve' : 'all must approve'}`;
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
        label="Approvers"
        isMulti
        options={users.map((u) => ({ label: u.displayName, value: u.accountId }))}
        value={selected}
        onChange={(value) => setSelected(value || [])}
      /> : null}
      {(selected || []).length > 1 ? <Select
        label="Approval rule"
        options={[
          { label: 'All selected approvers must approve', value: 'all' },
          { label: 'Any one selected approver can approve', value: 'any' },
        ]}
        value={approvalMode}
        onChange={setApprovalMode}
      /> : null}
      <Label labelFor="approval-message">Message to approver (optional)</Label>
      <TextArea id="approval-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do they need to decide?" />
      <Button appearance="primary" onClick={requestApproval} isDisabled={(selected || []).length === 0 || busy}>Request approval</Button>
    </Stack>

    <Heading size="small">Approval history</Heading>
    {loading ? <Spinner /> : approvals.length === 0 ? <Text>No approvals have been requested for this ticket.</Text> : approvals.map((a) =>
      <Stack key={a.id} space="space.050">
        <Inline space="space.100" alignBlock="center">
          <Text><Text weight="bold">{a.approver.displayName}</Text></Text>
          <Lozenge appearance={a.status === 'approved' ? 'success' : a.status === 'declined' ? 'removed' : a.status === 'pending' ? 'inprogress' : 'default'}>{a.status}</Lozenge>
        </Inline>
        <Text>Requested {new Date(a.createdAt).toLocaleString()} · Reminders: {a.reminderCount || 0}</Text>
        {groupProgress(a) ? <Text>{groupProgress(a)}</Text> : null}
        {a.ruleName ? <Text>Automatic rule: {a.ruleName}</Text> : a.source === 'manual' ? <Text>Requested manually by an agent</Text> : null}
        {a.message ? <Text>{a.message}</Text> : null}
        {a.decisionReason ? <Text>Decision comment: {a.decisionReason}</Text> : null}
        {a.transitionError ? <Text>Workflow transition failed: {a.transitionError}</Text> : null}
        {a.status === 'pending' ? <Inline space="space.100">
          <Button onClick={() => act('sendReminder', a.id)} isDisabled={busy}>Send reminder</Button>
          <Button appearance="subtle" onClick={() => act('cancelApproval', a.id)} isDisabled={busy}>Cancel</Button>
        </Inline> : null}
      </Stack>
    )}
  </Stack>;
};

ForgeReconciler.render(<AgentPanel />);
