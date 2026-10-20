// Per-project backup of Portal+ settings, used to move a project's settings
// between apps on the same site (for example to a new edition of Portal+).
// A backup holds the published settings, any unsaved draft and the logos.
// Restoring only works into the project the backup came from, and the
// published settings are re-published through the normal checks, so a
// hand-edited file can't skip validation.
import { validateLogo } from './logos.js';

export const BACKUP_FORMAT = 'portal-plus-backup';
export const BACKUP_VERSION = 1;

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function logoIdsFor(...configs) {
  const ids = new Set();
  for (const config of configs) for (const e of config?.experiences || []) if (e?.branding?.hasLogo && e?.id) ids.add(String(e.id));
  return [...ids];
}

export function buildBackup({ projectId, projectKey = '', published = null, draft = null, logos = {}, exportedAt = new Date().toISOString() }) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    projectId: String(projectId),
    projectKey: String(projectKey || ''),
    exportedAt,
    published: isObject(published) ? published : null,
    draft: isObject(draft) ? draft : null,
    logos: Object.fromEntries(Object.entries(logos || {}).filter(([, data]) => typeof data === 'string' && data)),
  };
}

// Checks a backup file and returns what to restore, or throws a message an admin can act on.
export function parseBackup(raw, projectId) {
  let backup = raw;
  if (typeof raw === 'string') {
    try { backup = JSON.parse(raw); } catch (_) { throw new Error('This file is not a Portal+ backup (it is not valid JSON).'); }
  }
  if (!isObject(backup) || backup.format !== BACKUP_FORMAT) throw new Error('This file is not a Portal+ backup.');
  if (Number(backup.version) !== BACKUP_VERSION) throw new Error(`This backup is version ${backup.version}; this Portal+ reads version ${BACKUP_VERSION}.`);
  if (String(backup.projectId) !== String(projectId)) {
    throw new Error(`This backup is for another project${backup.projectKey ? ` (${backup.projectKey})` : ''}. Open Portal+ settings in that project to restore it.`);
  }
  if (!isObject(backup.published) && !isObject(backup.draft)) throw new Error('This backup has no Portal+ settings in it.');
  for (const c of [backup.published, backup.draft]) {
    if (c && !Array.isArray(c.experiences)) throw new Error('This backup is damaged: its settings have no experiences list.');
  }
  const logos = {};
  for (const [id, data] of Object.entries(isObject(backup.logos) ? backup.logos : {})) {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new Error('This backup is damaged: it has an invalid logo entry.');
    logos[id] = validateLogo(data);
  }
  return { published: backup.published || null, draft: backup.draft || null, logos, exportedAt: String(backup.exportedAt || ''), projectKey: String(backup.projectKey || '') };
}
