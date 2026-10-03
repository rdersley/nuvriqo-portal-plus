// Licence state for resolvers.
//
// Outside production (development/staging) Portal+ is always active for testing.
// In production a Marketplace licence decides. Installations made from the
// Developer Console sharing link carry no licence object at all; those are
// treated as an evaluation only when the site's cloud ID is listed in the
// PORTALPLUS_EVALUATION_CLOUD_IDS Forge environment variable (comma separated,
// set with `forge variables set -e production`). A present-but-inactive
// Marketplace licence is never overridden.

export function evaluationCloudIds(value = process.env.PORTALPLUS_EVALUATION_CLOUD_IDS) {
  return new Set(String(value || '').split(',').map((id) => id.trim().toLowerCase()).filter(Boolean));
}

export function licenseState(context, allowList = evaluationCloudIds()) {
  const environment = String(context?.environmentType || '').toLowerCase();
  if (environment !== 'production') return { active: true, testEnvironment: true };
  if (context?.license && typeof context.license === 'object') return { active: context.license.active === true, testEnvironment: false };
  const cloudId = String(context?.cloudId || '').toLowerCase();
  if (cloudId && allowList.has(cloudId)) return { active: true, testEnvironment: false, evaluation: true };
  return { active: false, testEnvironment: false };
}
