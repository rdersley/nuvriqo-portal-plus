export const PORTAL_INTEGRATION_CONTRACT_VERSION = 1;

const safeString = (value, fallback = '') => value == null ? fallback : String(value);
const safeArray = (value) => Array.isArray(value) ? value : [];

export function normalizePortalModule(module = {}) {
  const id = safeString(module.id).trim();
  if (!id) throw new Error('Portal+ integration module requires an id.');

  const version = Number(module.version || 1);
  const title = safeString(module.title, id).trim();
  const provider = safeString(module.provider, id).trim();
  const enabled = module.enabled !== false;

  return {
    contractVersion: PORTAL_INTEGRATION_CONTRACT_VERSION,
    id,
    version: Number.isFinite(version) && version > 0 ? version : 1,
    provider,
    title,
    description: safeString(module.description),
    icon: safeString(module.icon),
    enabled,
    priority: Number.isFinite(Number(module.priority)) ? Number(module.priority) : 100,
    counters: safeArray(module.counters).slice(0, 4).map((counter) => ({
      id: safeString(counter?.id),
      label: safeString(counter?.label),
      value: Number.isFinite(Number(counter?.value)) ? Number(counter.value) : 0,
      tone: safeString(counter?.tone, 'neutral')
    })),
    actions: safeArray(module.actions).slice(0, 8).map((action) => ({
      id: safeString(action?.id),
      label: safeString(action?.label),
      description: safeString(action?.description),
      url: safeString(action?.url),
      badge: safeString(action?.badge),
      tone: safeString(action?.tone, 'neutral')
    })),
    items: safeArray(module.items).slice(0, 20).map((item) => ({
      id: safeString(item?.id),
      title: safeString(item?.title),
      subtitle: safeString(item?.subtitle),
      status: safeString(item?.status),
      url: safeString(item?.url),
      badge: safeString(item?.badge)
    })),
    health: {
      available: module?.health?.available !== false,
      status: safeString(module?.health?.status, 'available'),
      message: safeString(module?.health?.message)
    },
    metadata: module?.metadata && typeof module.metadata === 'object' ? module.metadata : {}
  };
}

export function normalizePortalModules(modules = []) {
  return safeArray(modules)
    .map((module) => normalizePortalModule(module))
    .filter((module) => module.enabled && module.health.available)
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
}

export const portalIntegrationExamples = {
  smartApproval: {
    id: 'smart-approval',
    provider: 'nuvriqo-smart-approval-manager',
    title: 'Approvals',
    description: 'Requests that need your approval.',
    priority: 20,
    counters: [{ id: 'pending', label: 'Waiting for you', value: 0, tone: 'attention' }],
    actions: [{ id: 'view-approvals', label: 'Review approvals', url: '' }]
  },
  assets: {
    id: 'assets',
    provider: 'nuvriqo-assets-manager',
    title: 'My Assets',
    description: 'Assets assigned to you or your organisation.',
    priority: 30,
    counters: [{ id: 'assigned', label: 'Assigned assets', value: 0 }],
    actions: [{ id: 'view-assets', label: 'View my assets', url: '' }]
  }
};
