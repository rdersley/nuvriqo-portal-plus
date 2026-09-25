// Help-center-aware routing. Several JSM help centers can link to one service
// project; the help center in the page address decides which experience
// (branding and layout) applies, while the customer's organisations still
// decide whether they may use it. The URL never grants access on its own.

const MAX_HELP_CENTERS = 10;

// Slug from a portal address such as https://site/helpcenter/Ryanair/portal/35.
export function helpCenterSlug(location = '') {
  try {
    const path = new URL(String(location || ''), 'https://placeholder.invalid').pathname;
    const match = /\/helpcenter\/([^/?#]+)/i.exec(path);
    return match ? decodeURIComponent(match[1]).trim().toLowerCase() : '';
  } catch (_) {
    return '';
  }
}

// Accepts "Ryanair", "/helpcenter/Ryanair", full URLs or comma-separated lists.
export function normalizeHelpCenters(value) {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  const slugs = items
    .map((item) => String(item || '').trim())
    .map((item) => helpCenterSlug(item) || item.replace(/^\/+|\/+$/g, '').toLowerCase())
    .filter((item) => /^[a-z0-9][a-z0-9_-]{0,63}$/.test(item));
  return [...new Set(slugs)].slice(0, MAX_HELP_CENTERS);
}

const inAudience = (experience, members) => {
  const audience = (experience?.audienceOrganizationIds || []).map(String);
  return !audience.length || audience.some((id) => members.has(id));
};

// Returns { experience } when a help-center experience applies, { blocked: true }
// when the help center belongs to other organisations, or null when no
// experience targets this help center (fall back to organisation routing).
export function routeByHelpCenter(experiences = [], memberships = [], slug = '') {
  if (!slug) return null;
  const members = new Set((memberships || []).map(String));
  const matches = (experiences || []).filter((experience) => normalizeHelpCenters(experience?.helpCenters).includes(slug));
  if (!matches.length) return null;
  const allowed = matches.find((experience) => inAudience(experience, members));
  return allowed ? { experience: allowed, reason: 'help-center' } : { blocked: true, reason: 'help-center-audience' };
}

// Optional per-experience narrowing by a dropdown custom field. Narrowing only:
// it is ANDed onto the customer visibility boundary and never widens it.
export function normalizeRequestScope(scope = {}) {
  const fieldId = String(scope?.fieldId || '').trim();
  if (!/^customfield_\d+$/.test(fieldId)) return null;
  const values = [...new Set((Array.isArray(scope?.values) ? scope.values : String(scope?.values || '').split(','))
    .map((value) => String(value || '').trim()).filter(Boolean))].slice(0, 20);
  return values.length ? { fieldId, fieldName: String(scope?.fieldName || '').slice(0, 100), values } : null;
}
