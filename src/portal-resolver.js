import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();
const configKey = (projectId) => `portalplus:config:${projectId}`;

function projectIdFromContext(context) {
  return context?.extension?.project?.id || context?.extension?.serviceDesk?.projectId || null;
}

async function requestPage(start = 0, limit = 100) {
  const response = await api.asUser().requestJira(route`/rest/servicedeskapi/request?start=${start}&limit=${limit}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to load customer requests (${response.status}): ${body}`);
  }
  return response.json();
}

resolver.define('health', async () => ({ ok: true, app: 'nuvriqo-portal-plus', phase: 'v1-dashboard-categories-export' }));

resolver.define('getDashboard', async ({ context }) => {
  const projectId = projectIdFromContext(context);
  const requests = await requestPage(0, 100);
  const config = projectId ? await kvs.get(configKey(projectId)) : null;
  return {
    requests,
    config: config || {
      version: 1,
      serviceDeskId: '',
      displayName: 'Service dashboard',
      dashboard: { open: true, awaitingCustomer: true, awaitingSupport: true, recent: true },
      audienceOrganizationIds: [],
      statusMapping: { awaitingCustomer: [], awaitingSupport: [] },
      categories: []
    }
  };
});

resolver.define('getMyRequests', async () => requestPage(0, 100));

resolver.define('getExportRequests', async () => {
  const all = [];
  let start = 0;
  const limit = 100;
  for (let page = 0; page < 10; page += 1) {
    const data = await requestPage(start, limit);
    const values = Array.isArray(data?.values) ? data.values : [];
    all.push(...values);
    if (data?.isLastPage === true || values.length < limit || all.length >= 1000) break;
    start += values.length;
  }
  return { values: all.slice(0, 1000), truncated: all.length >= 1000 };
});

export const handler = resolver.getDefinitions();
