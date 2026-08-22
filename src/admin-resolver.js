import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();
const CONFIG_VERSION = 3;
const configKey = (projectId) => `portalplus:config:${projectId}`;

function licenseState(context) {
  const environment = String(context?.environmentType || '').toLowerCase();
  if (environment !== 'production') return { active: true, testEnvironment: true };
  return { active: context?.license?.active === true, testEnvironment: false };
}

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

function migrateConfig(config) {
  if (!config) return null;
  return {
    version: CONFIG_VERSION,
    serviceDeskId: String(config.serviceDeskId || ''),
    displayName: String(config.displayName || 'Service dashboard').slice(0, 80),
    dashboard: {
      open: config.dashboard?.open !== false,
      awaitingCustomer: config.dashboard?.awaitingCustomer !== false,
      awaitingSupport: config.dashboard?.awaitingSupport !== false,
      recent: config.dashboard?.recent !== false
    },
    audienceOrganizationIds: Array.isArray(config.audienceOrganizationIds) ? config.audienceOrganizationIds.map(String) : [],
    statusMapping: {
      awaitingCustomer: Array.isArray(config.statusMapping?.awaitingCustomer) ? config.statusMapping.awaitingCustomer.map(String) : [],
      awaitingSupport: Array.isArray(config.statusMapping?.awaitingSupport) ? config.statusMapping.awaitingSupport.map(String) : []
    },
    categories: Array.isArray(config.categories) ? config.categories.slice(0, 12).map((category, index) => ({
      id: String(category.id || `category-${index + 1}`).slice(0, 80),
      name: String(category.name || `Category ${index + 1}`).slice(0, 80),
      description: String(category.description || '').slice(0, 180),
      requestTypes: Array.isArray(category.requestTypes) ? category.requestTypes.slice(0, 50).map((rt) => ({ id: String(rt.id), name: String(rt.name || 'Request').slice(0, 100) })) : []
    })) : [],
    updatedAt: config.updatedAt || null
  };
}

function validateServerSide(config) {
  if (!config.displayName.trim()) throw new Error('Display name cannot be empty.');
  const names = config.categories.filter((category) => category.requestTypes.length).map((category) => category.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) throw new Error('Visible category names must be unique.');
  const customer = new Set(config.statusMapping.awaitingCustomer);
  if (config.statusMapping.awaitingSupport.some((id) => customer.has(id))) throw new Error('A status cannot be mapped to both Awaiting customer and Awaiting support.');
}

resolver.define('health', async ({ context }) => ({ ok: true, app: 'nuvriqo-portal-plus', surface: 'admin', phase: 'marketplace-rc', configVersion: CONFIG_VERSION, licensing: licenseState(context) }));

resolver.define('getDiscovery', async ({ context }) => {
  const projectId = context?.extension?.project?.id;
  const projectKey = context?.extension?.project?.key;
  if (!projectId) throw new Error('Portal+ could not determine the current JSM project from the app context.');
  const serviceDesk = await getServiceDeskForProject(projectId);
  if (!serviceDesk) throw new Error('No Jira Service Management service desk was found for this project.');
  const requestTypes = await getRequestTypes(serviceDesk.id);
  const [organizations, statuses, stored] = await Promise.all([getOrganizations(serviceDesk.id), getStatuses(projectId), kvs.get(configKey(projectId))]);
  const config = migrateConfig(stored);
  if (stored && stored.version !== CONFIG_VERSION) await kvs.set(configKey(projectId), config);
  return {
    project: { id: projectId, key: projectKey || serviceDesk.projectKey || '' },
    serviceDesk: { id: serviceDesk.id, projectId: serviceDesk.projectId, projectName: serviceDesk.projectName, projectKey: serviceDesk.projectKey },
    requestTypes: requestTypes.map((item) => ({ id: String(item.id), name: item.name, description: item.description || '', groupIds: item.groupIds || [] })),
    organizations: organizations.map((item) => ({ id: String(item.id), name: item.name })),
    statuses,
    config,
    licensing: licenseState(context)
  };
});

resolver.define('saveConfig', async ({ context, payload }) => {
  const projectId = context?.extension?.project?.id;
  if (!projectId) throw new Error('Missing project context.');
  if (!licenseState(context).active) throw new Error('An active Nuvriqo Portal+ subscription is required to change configuration.');
  const allowed = payload || {};
  const config = migrateConfig({
    version: CONFIG_VERSION,
    serviceDeskId: allowed.serviceDeskId,
    displayName: allowed.displayName,
    dashboard: allowed.dashboard,
    audienceOrganizationIds: allowed.audienceOrganizationIds,
    statusMapping: allowed.statusMapping,
    categories: allowed.categories,
    updatedAt: new Date().toISOString()
  });
  validateServerSide(config);
  await kvs.set(configKey(projectId), config);
  return config;
});

export const handler = resolver.getDefinitions();
