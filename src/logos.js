// Experience logos are uploaded by admins and stored in Forge storage as data
// URLs, one key per experience (kept out of the config so it stays small).
// Nothing is fetched from outside Atlassian, so no external permissions.

export const LOGO_MAX_BYTES = 150 * 1024;
const DATA_URL = /^data:image\/(png|jpeg|webp|svg\+xml);base64,([A-Za-z0-9+/]+={0,2})$/;

export const logoKey = (projectId, experienceId) => `portalplus:logo:${projectId}:${experienceId}`;

// Returns the data URL when it is an allowed image type within the size cap,
// '' when the admin removed the logo, and throws for anything else.
export function validateLogo(value) {
  if (value == null || value === '') return '';
  const match = DATA_URL.exec(String(value));
  if (!match) throw new Error('Logos must be PNG, JPG, WebP or SVG images.');
  const bytes = Math.floor((match[2].length * 3) / 4);
  if (bytes > LOGO_MAX_BYTES) throw new Error(`Logos must be ${Math.round(LOGO_MAX_BYTES / 1024)} KB or smaller.`);
  return String(value);
}
