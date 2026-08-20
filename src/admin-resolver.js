import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('health', async () => ({
  ok: true,
  app: 'nuvriqo-portal-plus',
  surface: 'admin',
  phase: 'technical-prototype'
}));

export const handler = resolver.getDefinitions();
