import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('health', async () => ({
  ok: true,
  app: 'nuvriqo-portal-plus',
  phase: 'technical-prototype'
}));

resolver.define('getMyRequests', async () => {
  const response = await api.asUser().requestJira(
    route`/rest/servicedeskapi/request`,
    { headers: { Accept: 'application/json' } }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Unable to load customer requests (${response.status}): ${body}`);
  }

  return response.json();
});

export const handler = resolver.getDefinitions();
