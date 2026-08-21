import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();
const configKey = (projectId) => `portalplus:config:${projectId}`;

function projectIdFromContext(context) {
  return context?.extension?.project?.id || context?.extension?.serviceDesk?.projectId || null;
}

resolver.define('health', async () => ({ ok: true, app: 'nuvriqo-portal-plus', phase: 'v1-dashboard-config' }));

resolver.define('getDashboard', async ({ context }) => {
  const projectId = projectIdFromContext(context);
  const response = await api.asUser().requestJira(route`/rest/servicedeskapi/request`, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to load customer requests (${response.status}): ${body}`);
  }
  const requests = await response.json();
  const config = projectId ? await kvs.get(configKey(projectId)) : null;
  return {
    requests,
    config: config || {
      version: 1,
      displayName: 'Service dashboard',
      dashboard: { open: true, awaitingCustomer: true, awaitingSupport: true, recent: true },
      audienceOrganizationIds: [],
      statusMapping: { awaitingCustomer: [], awaitingSupport: [] }
    }
  };
});

resolver.define('getMyRequests', async () => {
  const response = await api.asUser().requestJira(route`/rest/servicedeskapi/request`, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to load customer requests (${response.status}): ${body}`);
  }
  return response.json();
});

export const handler = resolver.getDefinitions();
