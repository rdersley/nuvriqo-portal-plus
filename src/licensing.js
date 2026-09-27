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

// Every resolver that reads or writes Jira/JSM data or Portal+ configuration
// is wrapped with requireLicence, so an unlicensed production site gets no
// data and no changes. Instead of throwing, the resolver answers with a
// stable "unavailable" payload the UI turns into a friendly notice.
export const UNLICENSED_MESSAGES = {
  customer: 'Portal+ is not available on this site right now. You can still raise and follow your requests in the standard help center.',
  admin: 'An active Nuvriqo Portal+ subscription is required to view or change Portal+ configuration. A Jira admin can manage the subscription in Manage apps.'
};

export function unlicensedResponse(licensing, audience = 'customer') {
  return {
    unlicensed: true,
    audienceAllowed: false,
    licensing,
    message: UNLICENSED_MESSAGES[audience] || UNLICENSED_MESSAGES.customer
  };
}

export function requireLicence(handler, { audience = 'customer', allowList } = {}) {
  return async (request) => {
    const licensing = allowList ? licenseState(request?.context, allowList) : licenseState(request?.context);
    if (!licensing.active) return unlicensedResponse(licensing, audience);
    return handler(request);
  };
}
