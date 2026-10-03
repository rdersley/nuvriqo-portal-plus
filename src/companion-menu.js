// Companion app menu entries.
//
// Other Nuvriqo apps announce themselves to Portal+ by writing a Jira project
// property on the service project, one key per app:
//
//   nuvriqo.portalplus.menu.<app>   e.g. nuvriqo.portalplus.menu.smart-approval
//
// Value (contract version 1):
//   {
//     "version": 1,
//     "provider": "nuvriqo-smart-approval-manager",
//     "label": "Approvals",                 // tab label, up to 24 characters
//     "description": "Approvals waiting for your decision.",
//     "section": "smart-approval",          // optional: a built-in Portal+ section
//                                           // ("smart-approval" or "assets"); otherwise
//                                           // Portal+ shows a card for the app
//     "links": [{ "label": "Open", "url": "/servicedesk/customer/..." }],  // up to 3
//     "order": 20,
//     "enabled": true
//   }
//
// Values come from other apps and project admins, so everything is treated as
// untrusted: text is length-limited (and escaped when rendered) and links must
// be same-site paths.
export const MENU_PROPERTY_PREFIX = 'nuvriqo.portalplus.menu.';
export const MAX_MENU_ENTRIES = 6;
export const BUILT_IN_SECTIONS = ['smart-approval', 'assets'];

const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function safeSitePath(url) {
  const value = String(url ?? '').trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '';
  if (/[\u0000-\u001f\s]/.test(value)) return '';
  return value.slice(0, 500);
}

export function normalizeMenuEntry(key, value) {
  const id = text(String(key || '').startsWith(MENU_PROPERTY_PREFIX) ? String(key).slice(MENU_PROPERTY_PREFIX.length) : '', 60).toLowerCase();
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.enabled === false) return null;
  if (Number(value.version || 1) !== 1) return null;
  const label = text(value.label, 24);
  if (!label) return null;
  const section = BUILT_IN_SECTIONS.includes(String(value.section)) ? String(value.section) : 'card';
  const links = (Array.isArray(value.links) ? value.links : [])
    .map((link) => ({ label: text(link?.label, 40), url: safeSitePath(link?.url) }))
    .filter((link) => link.label && link.url)
    .slice(0, 3);
  const order = Number(value.order);
  return {
    id,
    provider: text(value.provider, 80),
    label,
    description: text(value.description, 200),
    section,
    links,
    order: Number.isFinite(order) ? order : 100,
  };
}

export function normalizeMenuEntries(properties = []) {
  const seen = new Set();
  return (Array.isArray(properties) ? properties : [])
    .map((p) => normalizeMenuEntry(p?.key, p?.value))
    .filter((entry) => entry && !seen.has(entry.id) && seen.add(entry.id))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .slice(0, MAX_MENU_ENTRIES);
}

// Tabs an admin adds by hand in Portal+ settings (per experience), for apps that
// can't announce themselves. Admin-entered, so https links are allowed as well as
// same-site paths. Shown as cards after the announced tabs.
export const MAX_CUSTOM_TABS = 4;

// Built-in companion tabs an admin can switch on without the companion app
// announcing itself (announcing needs the manage:jira-project scope).
const ALWAYS_TABS = [
  { flag: 'showApprovalsTab', id: 'smart-approval', section: 'smart-approval', provider: 'nuvriqo-smart-approval-manager', label: 'Approvals', description: 'No approvals currently need your attention.', order: 20 },
  { flag: 'showAssetsTab', id: 'assets', section: 'assets', provider: 'nuvriqo-asset-manager', label: 'My Assets', description: 'No assets are linked to you yet.', order: 30 },
];

export function alwaysOnEntries(dashboard = {}, existing = []) {
  const taken = new Set((Array.isArray(existing) ? existing : []).map((entry) => entry.section));
  return ALWAYS_TABS
    .filter((tab) => dashboard?.[tab.flag] === true && !taken.has(tab.section))
    .map(({ flag, ...entry }) => ({ ...entry, links: [] }));
}

export function safeTabUrl(url) {
  const value = String(url ?? '').trim();
  if (/^https:\/\/[^\s/\\]+(\/\S*)?$/i.test(value)) return value.slice(0, 500);
  return safeSitePath(value);
}

export function normalizeCustomTabs(tabs = []) {
  return (Array.isArray(tabs) ? tabs : [])
    .map((tab) => ({
      label: text(tab?.label, 24),
      description: text(tab?.description, 200),
      links: (Array.isArray(tab?.links) ? tab.links : [])
        .map((link) => ({ label: text(link?.label, 40), url: safeTabUrl(link?.url) }))
        .filter((link) => link.label && link.url)
        .slice(0, 3),
    }))
    .filter((tab) => tab.label)
    .slice(0, MAX_CUSTOM_TABS);
}

export function customMenuEntries(tabs = []) {
  return normalizeCustomTabs(tabs).map((tab, i) => ({ id: `custom-${i + 1}`, provider: 'portal-plus-admin', section: 'card', order: 200 + i, ...tab }));
}
