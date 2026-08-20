import { view } from '@forge/bridge';

window.addEventListener('load', async () => {
  try { await view.resize(); } catch (_) {}
});
