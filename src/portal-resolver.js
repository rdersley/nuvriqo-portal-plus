import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();
const CONFIG_VERSION = 3;
const configKey = (projectId) => `portalplus:config:${projectId}`;

function projectIdFromContext(context) {
  return context?.extension?.project?.id || context?.extension?.serviceDesk?.projectId || null;
}

function defaultConfig() {
  return {
    version: CONFIG_VERSION,
    serviceDeskId: '',
    displayName: 'Service dashboard',
    dashboard: { open: true, awaitingCustomer: false, awaitingSupport: false, recent: true },
    audienceOrganizationIds: [],
    statusMapping: { awaitingCustomer: [], awaitingSupport: [] },
    categories: [],
    updatedAt: null
  };
}

function normalizeConfig(config) {
  if (!config) return defaultConfig();
  return {
    version: CONFIG_VERSION,
    serviceDeskId: String(config.serviceDeskId || ''),
    displayName: String(config.displayName || 'Service dashboard').slice(0, 80),
    dashboard: {
      open: config.dashboard?.open !== false,
      awaitingCustomer: config.dashboard?.awaitingCustomer === true,
      awaitingSupport: config.dashboard?.awaitingSupport === true,
      recent: config.dashboard?.recent !== false
    },
    audienceOrganizationIds: Array.isArray(config.audienceOrganizationIds) ? config.audienceOrganizationIds.map(String) : [],
    statusMapping: {
      awaitingCustomer: Array.isArray(config.statusMapping?.awaitingCustomer) ? config.statusMapping.awaitingCustomer.map(String) : [],
      awaitingSupport: Array.isArray(config.statusMapping?.awaitingSupport) ? config.statusMapping.awaitingSupport.map(String) : []
    },
    categories: Array.isArray(config.categories) ? config.categories : [],
    updatedAt: config.updatedAt || null
  };
}

async function requestPage(start = 0, limit = 100) {
  const response = await api.asUser().requestJira(route`/rest/servicedeskapi/request?start=${start}&limit=${limit}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to load customer requests (${response.status}): ${body}`);
  }
  return response.json();
}

resolver.define('health', async () => ({ ok: true, app: 'nuvriqo-portal-plus', phase: 'v1-release-hardening', configVersion: CONFIG_VERSION }));

resolver.define('getDashboard', async ({ context }) => {
  const projectId = projectIdFromContext(context);
  const requests = await requestPage(0, 100);
  const stored = projectId ? await kvs.get(configKey(projectId)) : null;
  return { requests, config: normalizeConfig(stored) };
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
