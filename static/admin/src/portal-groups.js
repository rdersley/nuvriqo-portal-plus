// Turns the service desk's JSM portal groups into Portal+ service categories.
// Groups already present (same name, case-insensitive) are skipped, request types keep
// the order JSM returned them in, and the 12-category / 50-type limits are respected.
export const MAX_CATEGORIES = 12;
export const MAX_TYPES_PER_CATEGORY = 50;

const norm = (v) => String(v || '').trim().toLowerCase();

export function importPortalGroups(categories = [], groups = [], requestTypes = [], makeId = () => `category-${Math.random().toString(36).slice(2, 10)}`) {
  const result = [...categories];
  const existing = new Set(result.map((c) => norm(c.name)));
  let added = 0;
  let full = result.length >= MAX_CATEGORIES;
  for (const group of groups) {
    const name = String(group?.name || '').trim();
    if (!name || existing.has(norm(name))) continue;
    const types = requestTypes
      .filter((rt) => (rt.groupIds || []).map(String).includes(String(group.id)))
      .slice(0, MAX_TYPES_PER_CATEGORY)
      .map((rt) => ({ id: String(rt.id), name: String(rt.name || 'Request') }));
    if (!types.length) continue;
    if (result.length >= MAX_CATEGORIES) { full = true; break; }
    result.push({ id: makeId(), name: name.slice(0, 80), description: '', audienceOrganizationIds: [], requestTypes: types });
    existing.add(norm(name));
    added += 1;
  }
  return { categories: result, added, full };
}
