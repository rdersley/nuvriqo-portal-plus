// Per-experience document library: folders of guides that live in the
// project's knowledge base. Portal+ curates which guides each customer sees;
// the knowledge base itself remains readable by every customer of the project,
// so this is for client-specific guides, not confidential material.

const MAX_FOLDERS = 12;
const MAX_ITEMS = 40;
const clip = (value, max) => String(value ?? '').trim().slice(0, max);
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Confluence page links (/wiki/spaces/KEY/pages/123/Title) are converted to the
// customer knowledge base article link, which portal customers can open.
// Returns '' for anything unsafe or unrecognised.
export function documentLink(url, { serviceDeskId = '' } = {}) {
  const raw = clip(url, 1000);
  if (!raw) return '';
  const page = /\/wiki\/spaces\/[^/]+\/pages\/(\d+)/.exec(raw) || /[?&]pageId=(\d+)/.exec(raw);
  if (page && /^\d+$/.test(String(serviceDeskId))) return `/servicedesk/customer/portal/${serviceDeskId}/article/${page[1]}`;
  if (/^\/servicedesk\/customer\/[\w/-]+$/.test(raw)) return raw;
  if (/^https:\/\/[^\s"'<>]+$/i.test(raw)) return raw;
  return '';
}

export function normalizeDocuments(folders, options = {}) {
  return (Array.isArray(folders) ? folders : []).slice(0, MAX_FOLDERS).map((folder, index) => ({
    id: clip(folder?.id, 80) || uid('folder'),
    name: clip(folder?.name, 80) || `Folder ${index + 1}`,
    items: (Array.isArray(folder?.items) ? folder.items : []).slice(0, MAX_ITEMS).map((item) => ({
      id: clip(item?.id, 80) || uid('doc'),
      title: clip(item?.title, 120),
      url: documentLink(item?.url, options),
      description: clip(item?.description, 200)
    })).filter((item) => item.title && item.url)
  })).filter((folder) => folder.items.length);
}
