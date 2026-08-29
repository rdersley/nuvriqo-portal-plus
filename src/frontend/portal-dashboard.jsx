import React, { useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Button,
  Heading,
  Inline,
  Label,
  Lozenge,
  ProgressBar,
  Select,
  Spinner,
  Stack,
  Text,
  TextArea,
  Textfield,
  useProductContext,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const toCsv = (rows) => {
  const header = ['Issue', 'Summary', 'Request type', 'Status', 'Created', 'Customer priority', 'Progress'];
  return [header, ...rows.map((r) => [
    r.issueKey,
    r.summary,
    r.requestType,
    r.status,
    r.created || '',
    r.customerPriority,
    `${r.progress?.label || ''} (${r.progress?.percent || 0}%)`,
  ])].map((row) => row.map(quote).join(',')).join('\n');
};

const priorityOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Important', value: 'important' },
  { label: 'Critical', value: 'critical' },
];

const PortalPlus = () => {
  const context = useProductContext();
  const compact = context?.moduleKey === 'nuvriqo-portal-plus-dashboard';
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const projectId = context?.extension?.project?.id || context?.extension?.projectId || context?.extension?.portal?.projectId;

  const load = async () => {
    setError('');
    try { setData(await invoke('getPortalDashboard', { projectId })); }
    catch (e) { setError(e?.message || String(e)); setData({ requests: [], stats: {}, config: {} }); }
  };

  useEffect(() => { load(); }, [projectId]);

  const rows = useMemo(() => {
    if (!data?.requests) return [];
    const q = query.trim().toLowerCase();
    return data.requests.filter((r) => {
      const searchOk = !q || `${r.issueKey} ${r.summary} ${r.requestType} ${r.status}`.toLowerCase().includes(q);
      const statusOk = status === 'all' || r.status === status;
      const priorityOk = priority === 'all' || r.customerPriority === priority;
      return searchOk && statusOk && priorityOk;
    });
  }, [data, query, status, priority]);

  const statuses = useMemo(() => [...new Set((data?.requests || []).map((r) => r.status))].sort(), [data]);

  const setCustomerPriority = async (issueKey, next) => {
    setBusy(issueKey); setError('');
    try {
      await invoke('setCustomerPriority', { issueKey, priority: next });
      await load();
    } catch (e) { setError(e?.message || String(e)); }
    finally { setBusy(''); }
  };

  if (!data) return <Spinner />;

  if (compact) {
    return <Stack space="space.100">
      <Inline space="space.200" alignBlock="center">
        <Text><Text weight="bold">Portal+</Text></Text>
        <Text>{data.stats?.open || 0} open</Text>
        <Text>{data.stats?.waiting || 0} waiting</Text>
        <Text>{data.stats?.important || 0} important</Text>
      </Inline>
      {error ? <Text>{error}</Text> : null}
    </Stack>;
  }

  const modules = data.config?.modules || {};
  return <Stack space="space.300">
    <Stack space="space.050">
      <Heading size="large">{data.config?.portalTitle || 'Portal+'}</Heading>
      <Text>{data.config?.welcomeText || 'Manage your service requests in one place.'}</Text>
    </Stack>

    {error ? <Text>{error}</Text> : null}

    <Inline space="space.300" alignBlock="center">
      <Stack space="space.025"><Heading size="medium">{data.stats?.open || 0}</Heading><Text>Open requests</Text></Stack>
      <Stack space="space.025"><Heading size="medium">{data.stats?.waiting || 0}</Heading><Text>Waiting / pending</Text></Stack>
      <Stack space="space.025"><Heading size="medium">{data.stats?.important || 0}</Heading><Text>Important to me</Text></Stack>
      <Stack space="space.025"><Heading size="medium">{data.stats?.total || 0}</Heading><Text>Loaded requests</Text></Stack>
    </Inline>

    <Heading size="medium">My requests</Heading>
    <Inline space="space.100" alignBlock="end">
      <Stack space="space.050">
        <Label labelFor="portal-search">Search</Label>
        <Textfield id="portal-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Issue, summary, type or status" />
      </Stack>
      <Select
        label="Status"
        value={{ label: status === 'all' ? 'All statuses' : status, value: status }}
        options={[{ label: 'All statuses', value: 'all' }, ...statuses.map((s) => ({ label: s, value: s }))]}
        onChange={(v) => setStatus(v?.value || 'all')}
      />
      {modules.priority !== false ? <Select
        label="Customer priority"
        value={{ label: priority === 'all' ? 'All priorities' : priority, value: priority }}
        options={[{ label: 'All priorities', value: 'all' }, ...priorityOptions]}
        onChange={(v) => setPriority(v?.value || 'all')}
      /> : null}
      {modules.export !== false ? <Button onClick={() => setCsv(toCsv(rows))}>Generate CSV</Button> : null}
    </Inline>

    <Text>Showing {rows.length} request{rows.length === 1 ? '' : 's'}.</Text>

    {rows.length === 0 ? <Text>No requests match your filters.</Text> : rows.map((r) =>
      <Stack key={r.issueKey} space="space.075">
        <Inline space="space.100" alignBlock="center">
          <Text><Text weight="bold">{r.issueKey}</Text> — {r.summary}</Text>
          <Lozenge appearance={/done|closed|resolved|complete/i.test(r.status) ? 'success' : /waiting|pending|awaiting/i.test(r.status) ? 'moved' : 'inprogress'}>{r.status}</Lozenge>
          {r.customerPriority !== 'normal' ? <Lozenge appearance={r.customerPriority === 'critical' ? 'removed' : 'new'}>{r.customerPriority}</Lozenge> : null}
        </Inline>
        <Text>{r.requestType || 'Service request'}{r.created ? ` · Created ${new Date(r.created).toLocaleString()}` : ''}</Text>
        {modules.progress !== false ? <Stack space="space.025">
          <Text>{r.progress?.label || 'In progress'} · {r.progress?.percent || 0}%</Text>
          <ProgressBar value={(r.progress?.percent || 0) / 100} />
        </Stack> : null}
        {modules.priority !== false ? <Inline space="space.100" alignBlock="center">
          <Text>How important is this request to you?</Text>
          {priorityOptions.map((p) => <Button
            key={p.value}
            appearance={r.customerPriority === p.value ? 'primary' : 'subtle'}
            isDisabled={busy === r.issueKey}
            onClick={() => setCustomerPriority(r.issueKey, p.value)}
          >{p.label}</Button>)}
        </Inline> : null}
      </Stack>
    )}

    {csv ? <Stack space="space.100">
      <Heading size="small">CSV export</Heading>
      <Text>Copy this CSV into a .csv file. The standalone Ticket Export app will continue to provide the dedicated downloadable export experience.</Text>
      <TextArea value={csv} onChange={() => {}} />
      <Button appearance="subtle" onClick={() => setCsv('')}>Close export</Button>
    </Stack> : null}

    {(modules.approvals !== false || modules.followUp !== false) ? <Stack space="space.075">
      <Heading size="medium">More Portal+ tools</Heading>
      {modules.approvals !== false ? <Text>Smart Approvals — approval inbox and multi-approver workflow module is being integrated into this suite build.</Text> : null}
      {modules.followUp !== false ? <Text>Follow-Up Manager — customer follow-up and auto-close rules can be enabled alongside Portal+.</Text> : null}
    </Stack> : null}
  </Stack>;
};

ForgeReconciler.render(<PortalPlus />);
