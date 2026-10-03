import { normalizePortalModule } from './integration-contract.js';

const safe = (value, fallback = '') => value == null ? fallback : String(value);
const safeArray = (value) => Array.isArray(value) ? value : [];

export const ASSET_MANAGER_PROVIDER = 'nuvriqo-asset-manager';
export const ASSET_MANAGER_SNAPSHOT_VERSION = 1;

export function buildAssetModuleFromSnapshot(snapshot = {}, organisationIds = []) {
  if (snapshot?.provider !== ASSET_MANAGER_PROVIDER) return null;
  if (Number(snapshot?.contractVersion || 0) !== ASSET_MANAGER_SNAPSHOT_VERSION) return null;

  const allowed = new Set(safeArray(organisationIds).map(String));
  const assets = new Map();
  for (const group of safeArray(snapshot.organisations)) {
    if (!allowed.has(String(group?.id || ''))) continue;
    for (const asset of safeArray(group?.assets)) {
      const id = safe(asset?.id).trim();
      if (!id || assets.has(id)) continue;
      assets.set(id, {
        id,
        title: safe(asset?.name || asset?.deviceId || 'Asset'),
        subtitle: [safe(asset?.type), safe(asset?.manufacturer), safe(asset?.model)].filter(Boolean).join(' · '),
        status: safe(asset?.status),
        badge: safe(asset?.deviceId),
        url: safe(asset?.url),
        metadata: {
          deviceId: safe(asset?.deviceId),
          type: safe(asset?.type),
          manufacturer: safe(asset?.manufacturer),
          model: safe(asset?.model),
          holder: safe(asset?.holder),
          location: safe(asset?.location)
        }
      });
    }
  }

  const rows = [...assets.values()].slice(0, 50);
  const attention = rows.filter((row) => /repair|fault|damaged|lost|missing|retired/i.test(row.status)).length;
  const inService = rows.filter((row) => /active|assigned|in use|in service|deployed/i.test(row.status)).length;
  if (!rows.length) return null;

  return normalizePortalModule({
    id: 'assets',
    provider: ASSET_MANAGER_PROVIDER,
    version: 1,
    title: 'My Assets',
    description: 'Assets assigned to you or your organisation.',
    priority: 30,
    counters: [
      { id: 'assigned', label: 'Visible assets', value: rows.length, tone: 'neutral' },
      { id: 'in-service', label: 'In service', value: inService, tone: 'positive' },
      { id: 'attention', label: 'Needs attention', value: attention, tone: attention ? 'attention' : 'neutral' }
    ],
    actions: [{ id: 'view-assets', label: 'View my assets', description: 'See your devices and equipment.', url: safe(snapshot?.portalUrl) }],
    items: rows.slice(0, 20),
    health: { available: true, status: 'available', message: '' },
    metadata: {
      total: rows.length,
      snapshotUpdatedAt: safe(snapshot?.updatedAt),
      privacyModel: 'customer-organisation-scoped'
    }
  });
}
