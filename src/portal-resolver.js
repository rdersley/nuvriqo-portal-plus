import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('health', async () => ({
  ok: true,
  app: 'nuvriqo-portal-plus',
  phase: 'technical-prototype'
}));

resolver.define('getMyRequests', async ({ payload = {} }) => {
  const params = new URLSearchParams();

  if (payload.searchTerm) params.set('searchTerm', payload.searchTerm);
  if (payload.serviceDeskId) params.set('serviceDeskId', String(payload.serviceDeskId));
  if (payload.requestTypeId) params.set('requestTypeId', String(payload.requestTypeId));
  if (payload.organizationId) params.set('organizationId', String(payload.organizationId));
  if (payload.start !== undefined) params.set('start', String(payload.start));
  if (payload.limit !== undefined) params.set('limit', String(payload.limit));

  const query = params.toString();
  const path = query
    ? `/rest/servicedeskapi/request?${query}`
    : '/rest/servicedeskapi/request';

  const response = await api.asUser().requestJira(route`${path}`, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to load customer requests (${response.status}): ${body}`);
  }

  return response.json();
});

export const handler = resolver.getDefinitions();
