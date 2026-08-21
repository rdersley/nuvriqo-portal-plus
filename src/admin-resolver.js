import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();
const configKey = (projectId) => `portalplus:config:${projectId}`;

async function jsonOrError(response, label) {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function getServiceDeskForProject(projectId) {
  const response = await api.asApp().requestJira(route`/rest/servicedeskapi/servicedesk?projectId=${projectId}&limit=50`, { headers: { Accept: 'application/json' } });
  const data = await jsonOrError(response, 'Service desk discovery');
  const values = Array.isArray(data?.values) ? data.values : [];
  return values.find((item) => String(item.projectId) === String(projectId)) || values[0] || null;
}

async function getRequestTypes(serviceDeskId) {
  const response = await api.asApp().requestJira(route`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype?limit=100`, { headers: { Accept: 'application/json' } });
  const data = await jsonOrError(response, 'Request type discovery');
  return Array.isArray(data?.values) ? data.values : [];
}

async function getOrganizations(serviceDeskId) {
  try {
    const response = await api.asApp().requestJira(route`/rest/servicedeskapi/organization?serviceDeskId=${serviceDeskId}&limit=100`, { headers: { Accept: 'application/json' } });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.values) ? data.values : [];
  } catch (_) { return []; }
}

async function getStatuses(projectId) {
  const response = await api.asApp().requestJira(route`/rest/api/3/project/${projectId}/statuses`, { headers: { Accept: 'application/json' } });
  const data = await jsonOrError(response, 'Project status discovery');
  const statusMap = new Map();
  for (const issueType of Array.isArray(data) ? data : []) {
    for (const status of issueType.statuses || []) {
      const key = String(status.id ?? status.name);
      if (!statusMap.has(key)) statusMap.set(key, { id: status.id ?? key, name: status.name ?? key, category: status.statusCategory?.key || '' });
    }
  }
  return [...statusMap.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

resolver.define('health', async () => ({ ok: true, app: 'nuvriqo-portal-plus', surface: 'admin', phase: 'v1-categories' }));

resolver.define('getDiscovery', async ({ context }) => {
  const projectId = context?.extension?.project?.id;
  const projectKey = context?.extension?.project?.key;
  if (!projectId) throw new Error('Portal+ could not determine the current JSM project from the app context.');
  const serviceDesk = await getServiceDeskForProject(projectId);
  if (!serviceDesk) throw new Error('No Jira Service Management service desk was found for this project.');
  const requestTypes = await getRequestTypes(serviceDesk.id);
  const [organizations, statuses, config] = await Promise.all([getOrganizations(serviceDesk.id), getStatuses(projectId), kvs.get(configKey(projectId))]);
  return {
    project: { id: projectId, key: projectKey || serviceDesk.projectKey || '' },
    serviceDesk: { id: serviceDesk.id, projectId: serviceDesk.projectId, projectName: serviceDesk.projectName, projectKey: serviceDesk.projectKey },
    requestTypes: requestTypes.map((item) => ({ id: String(item.id), name: item.name, description: item.description || '', groupIds: item.groupIds || [] })),
    organizations: organizations.map((item) => ({ id: String(item.id), name: item.name })), statuses, config: config || null
  };
});

resolver.define('saveConfig', async ({ context, payload }) => {
  const projectId = context?.extension?.project?.id;
  if (!projectId) throw new Error('Missing project context.');
  const allowed = payload || {};
  const categories = Array.isArray(allowed.categories) ? allowed.categories.slice(0, 12).map((category, index) => ({
    id: String(category.id || `category-${index + 1}`).slice(0, 80),
    name: String(category.name || `Category ${index + 1}`).slice(0, 80),
    description: String(category.description || '').slice(0, 180),
    requestTypes: Array.isArray(category.requestTypes) ? category.requestTypes.slice(0, 50).map((rt) => ({ id: String(rt.id), name: String(rt.name || 'Request').slice(0, 100) })) : []
  })) : [];
  const config = {
    version: 2,
    serviceDeskId: String(allowed.serviceDeskId || ''),
    displayName: String(allowed.displayName || 'Service dashboard').slice(0, 80),
    dashboard: { open: allowed.dashboard?.open !== false, awaitingCustomer: allowed.dashboard?.awaitingCustomer !== false, awaitingSupport: allowed.dashboard?.awaitingSupport !== false, recent: allowed.dashboard?.recent !== false },
    audienceOrganizationIds: Array.isArray(allowed.audienceOrganizationIds) ? allowed.audienceOrganizationIds.map(String) : [],
    statusMapping: {
      awaitingCustomer: Array.isArray(allowed.statusMapping?.awaitingCustomer) ? allowed.statusMapping.awaitingCustomer.map(String) : [],
      awaitingSupport: Array.isArray(allowed.statusMapping?.awaitingSupport) ? allowed.statusMapping.awaitingSupport.map(String) : []
    },
    categories,
    updatedAt: new Date().toISOString()
  };
  await kvs.set(configKey(projectId), config);
  return config;
});

export const handler = resolver.getDefinitions();
