import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();
const CONFIG_VERSION = 5;
const configKey = (projectId) => `portalplus:config:${projectId}`;

function projectIdFromContext(context) { return context?.extension?.project?.id || context?.extension?.serviceDesk?.projectId || null; }
function licenseState(context) { const environment = String(context?.environmentType || '').toLowerCase(); if (environment !== 'production') return { active: true, testEnvironment: true }; return { active: context?.license?.active === true, testEnvironment: false }; }
function defaultConfig() { return { version: CONFIG_VERSION, serviceDeskId: '', displayName: 'Service dashboard', subtitle: 'A clearer view of your support requests.', dashboard: { open: true, awaitingCustomer: false, awaitingSupport: false, recent: true }, audienceOrganizationIds: [], statusMapping: { awaitingCustomer: [], awaitingSupport: [] }, categories: [], requestColumns: [], updatedAt: null }; }
function normalizeConfig(config) {
  if (!config) return defaultConfig();
  return {
    version: CONFIG_VERSION,
    serviceDeskId: String(config.serviceDeskId || ''),
    displayName: String(config.displayName || 'Service dashboard').slice(0, 80),
    subtitle: String(config.subtitle || 'A clearer view of your support requests.').slice(0, 140),
    dashboard: { open: config.dashboard?.open !== false, awaitingCustomer: config.dashboard?.awaitingCustomer === true, awaitingSupport: config.dashboard?.awaitingSupport === true, recent: config.dashboard?.recent !== false },
    audienceOrganizationIds: Array.isArray(config.audienceOrganizationIds) ? config.audienceOrganizationIds.map(String) : [],
    statusMapping: { awaitingCustomer: Array.isArray(config.statusMapping?.awaitingCustomer) ? config.statusMapping.awaitingCustomer.map(String) : [], awaitingSupport: Array.isArray(config.statusMapping?.awaitingSupport) ? config.statusMapping.awaitingSupport.map(String) : [] },
    categories: Array.isArray(config.categories) ? config.categories.slice(0, 12).map((category) => ({
      id: String(category.id || ''),
      name: String(category.name || 'Category'),
      description: String(category.description || ''),
      audienceOrganizationIds: Array.isArray(category.audienceOrganizationIds) ? category.audienceOrganizationIds.map(String) : [],
      requestTypes: Array.isArray(category.requestTypes) ? category.requestTypes.map((rt) => ({ id: String(rt.id || ''), name: String(rt.name || 'Request') })) : []
    })) : [],
    requestColumns: Array.isArray(config.requestColumns) ? config.requestColumns.slice(0, 3).map((field) => ({ id: String(field.id || ''), name: String(field.name || field.id || '') })).filter((field) => field.id) : [],
    updatedAt: config.updatedAt || null
  };
}
async function requestPage(start = 0, limit = 100) { const response = await api.asUser().requestJira(route`/rest/servicedeskapi/request?start=${start}&limit=${limit}`, { headers: { Accept: 'application/json' } }); if (!response.ok) { const body = await response.text(); throw new Error(`Unable to load customer requests (${response.status}): ${body}`); } return response.json(); }
async function currentCustomerOrganizations() { try { const response = await api.asUser().requestJira(route`/rest/servicedeskapi/organization?limit=100`, { headers: { Accept: 'application/json' } }); if (!response.ok) return []; const data = await response.json(); return Array.isArray(data?.values) ? data.values.map((item) => String(item.id)) : []; } catch (_) { return []; } }
function hasAudience(config) { return (config.audienceOrganizationIds || []).length > 0 || (config.categories || []).some((category) => (category.audienceOrganizationIds || []).length > 0); }
function matchesAudience(required, memberships) { return !required?.length || required.some((id) => memberships.has(String(id))); }
function filterConfigForCustomer(config, memberships) { return { ...config, categories: (config.categories || []).filter((category) => matchesAudience(category.audienceOrganizationIds || [], memberships)) }; }
resolver.define('health', async ({ context }) => ({ ok: true, app: 'nuvriqo-portal-plus', phase: 'marketplace-rc', configVersion: CONFIG_VERSION, licensing: licenseState(context) }));
resolver.define('getDashboard', async ({ context }) => {
  const projectId = projectIdFromContext(context);
  const stored = projectId ? await kvs.get(configKey(projectId)) : null;
  const config = normalizeConfig(stored);
  const memberships = new Set(hasAudience(config) ? await currentCustomerOrganizations() : []);
  if (!matchesAudience(config.audienceOrganizationIds, memberships)) return { requests: { values: [], size: 0, isLastPage: true }, config: defaultConfig(), licensing: licenseState(context), audienceAllowed: false };
  const requests = await requestPage(0, 100);
  return { requests, config: filterConfigForCustomer(config, memberships), licensing: licenseState(context), audienceAllowed: true, requestListTruncated: requests?.isLastPage !== true };
});
resolver.define('getMyRequests', async () => requestPage(0, 100));
resolver.define('getExportRequests', async ({ context }) => {
  if (!licenseState(context).active) throw new Error('An active Nuvriqo Portal+ subscription is required to export requests.');
  const projectId = projectIdFromContext(context);
  const config = normalizeConfig(projectId ? await kvs.get(configKey(projectId)) : null);
  const memberships = new Set(hasAudience(config) ? await currentCustomerOrganizations() : []);
  if (!matchesAudience(config.audienceOrganizationIds, memberships)) throw new Error('Portal+ is not enabled for this customer audience.');
  const all = []; let start = 0; const limit = 100;
  for (let page = 0; page < 10; page += 1) { const data = await requestPage(start, limit); const values = Array.isArray(data?.values) ? data.values : []; all.push(...values); if (data?.isLastPage === true || values.length < limit || all.length >= 1000) break; start += values.length; }
  return { values: all.slice(0, 1000), truncated: all.length >= 1000 };
});
export const handler = resolver.getDefinitions();
