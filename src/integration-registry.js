import { kvs, WhereConditions } from '@forge/kvs';
import { normalizePortalModules } from './integration-contract.js';

const REGISTRY_VERSION = 1;
const clean = (value, max = 200) => String(value ?? '').trim().slice(0, max);
const moduleKey = (projectId, accountId, moduleId) => `portalplus:integration:${clean(projectId)}:${clean(accountId)}:${clean(moduleId)}`;
const modulePrefix = (projectId, accountId) => `portalplus:integration:${clean(projectId)}:${clean(accountId)}:`;

export async function saveIntegrationModule({ projectId, accountId, module }) {
  if (!projectId || !accountId) throw new Error('Integration module requires projectId and accountId.');
  const normalized = normalizePortalModules([module])[0];
  if (!normalized) return null;
  const record = {
    registryVersion: REGISTRY_VERSION,
    updatedAt: new Date().toISOString(),
    module: normalized,
  };
  await kvs.set(moduleKey(projectId, accountId, normalized.id), record);
  return record;
}

export async function removeIntegrationModule({ projectId, accountId, moduleId }) {
  if (!projectId || !accountId || !moduleId) return;
  await kvs.delete(moduleKey(projectId, accountId, moduleId));
}

export async function getIntegrationModules({ projectId, accountId, max = 12 }) {
  if (!projectId || !accountId) return [];
  let cursor;
  const rows = [];
  do {
    let query = kvs.query().where('key', WhereConditions.beginsWith(modulePrefix(projectId, accountId))).limit(20);
    if (cursor) query = query.cursor(cursor);
    const page = await query.getMany();
    rows.push(...(page?.results || []));
    cursor = page?.nextCursor;
  } while (cursor && rows.length < max);

  const now = Date.now();
  const live = rows
    .map((row) => row?.value)
    .filter(Boolean)
    .filter((record) => {
      const ttl = Number(record?.module?.metadata?.ttlSeconds || 0);
      if (!ttl) return true;
      const updated = Date.parse(record.updatedAt || '');
      return Number.isFinite(updated) && now - updated <= ttl * 1000;
    })
    .map((record) => record.module);
  return normalizePortalModules(live).slice(0, max);
}

export const integrationRegistryVersion = REGISTRY_VERSION;
