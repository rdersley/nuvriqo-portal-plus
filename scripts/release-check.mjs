import fs from 'node:fs';

const requiredFiles = [
  'manifest.template.yml',
  'src/admin-resolver.js',
  'src/portal-resolver.js',
  'static/admin/src/app.js',
  'static/admin/dist/index.html',
  'static/admin/dist/app.js',
  'static/admin/dist/preview.js',
  'static/admin/dist/preview-mode.js',
  'static/admin/dist/routing-inspector.js',
  'static/admin/dist/v9.css',
  'static/admin/dist/styles.css',
  'static/portal/src/app.js',
  'static/portal/dist/index.html',
  'static/portal/dist/app.js',
  'static/portal/dist/styles.css',
  'docs/MARKETPLACE-READINESS.md',
  'docs/MARKETPLACE-LISTING.md',
  'docs/SECURITY-AND-PRIVACY.md',
  'docs/FINAL-ACCEPTANCE-TEST.md',
  'docs/SUPPORT.md',
  'docs/PRIVACY-POLICY-DRAFT.md',
  'docs/TERMS-AND-DPA-CHECKLIST.md',
  'docs/MOBILE-CLIENT-CONTRACT.md'
];

const errors = [];
for (const file of requiredFiles) if (!fs.existsSync(file)) errors.push(`Missing required release file: ${file}`);

const manifest = fs.readFileSync('manifest.template.yml', 'utf8');
for (const required of ['licensing:', 'enabled: true', 'nodejs22.x', 'read:servicedesk-request', 'read:jira-work', 'manage:servicedesk-customer', 'storage:app', 'unlicensedAccess:']) {
  if (!manifest.includes(required)) errors.push(`Manifest template missing: ${required}`);
}
if (/external:|remote:|permissions:\s*[\s\S]*external:/m.test(manifest)) errors.push('Unexpected external/remote configuration found; re-review data egress before release.');

const portalResolver = fs.readFileSync('src/portal-resolver.js', 'utf8');
for (const required of ['api.asUser().requestJira', 'licenseState', 'audienceAllowed', 'requestColumns', 'CONFIG_VERSION=8', 'getClientContract', 'CLIENT_CONTRACT_VERSION=2', 'branding', 'most-specific-then-order']) {
  if (!portalResolver.includes(required)) errors.push(`Portal resolver missing brand-platform feature: ${required}`);
}

const adminResolver = fs.readFileSync('src/admin-resolver.js', 'utf8');
for (const required of ['licenseState', 'getCustomerVisibleFields', 'requestColumns', 'CONFIG_VERSION=8', 'normalizeBranding', 'experiences', 'announcements', 'mobileAppName', 'routingDiagnostics', 'most-specific-then-order']) {
  if (!adminResolver.includes(required)) errors.push(`Admin resolver missing brand-platform feature: ${required}`);
}

const portalUi = fs.readFileSync('static/portal/src/app.js', 'utf8');
for (const required of ['request-date', 'audienceAllowed', 'csvCell', "^\\s*[=+\\-@]", 'applyBranding', 'brand-logo', 'supportButton', 'hero-message']) {
  if (!portalUi.includes(required)) errors.push(`Portal UI missing release hardening/branding: ${required}`);
}
const portalHtml = fs.readFileSync('static/portal/dist/index.html', 'utf8');
for (const required of ['request-search', 'request-status', 'request-type', 'request-date', 'request-sort', 'pagination', 'brand-logo', 'hero-message', 'poweredBy']) {
  if (!portalHtml.includes(required)) errors.push(`Portal HTML missing control: ${required}`);
}
const adminHtml = fs.readFileSync('static/admin/dist/index.html', 'utf8');
for (const required of ['previewModal', 'preview.js', 'preview-mode.js', 'routingInspector', 'routing-inspector.js', 'V9 Brand Platform', 'Save & publish']) {
  if (!adminHtml.includes(required)) errors.push(`Admin HTML missing V9 Experience Builder feature: ${required}`);
}
const routingInspector = fs.readFileSync('static/admin/dist/routing-inspector.js', 'utf8');
for (const required of ['Most-specific matching audience wins', 'Fallback', 'Publishing will be blocked']) {
  if (!routingInspector.includes(required)) errors.push(`Routing inspector missing V9 diagnostic: ${required}`);
}
const previewMode = fs.readFileSync('static/admin/dist/preview-mode.js', 'utf8');
for (const required of ['preview-mobile', 'preview-desktop', 'data-preview-mode']) {
  if (!previewMode.includes(required)) errors.push(`Preview mode missing V9 capability: ${required}`);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (!version || version === 'latest' || /^[~^*]/.test(version)) errors.push(`Dependency ${name} must be pinned to an explicit RC version (found ${version}).`);
}
if (!String(pkg.version || '').startsWith('1.0.0-rc.')) errors.push('Package version must be a 1.0.0 release candidate before final acceptance.');

for (const file of ['src/admin-resolver.js', 'src/portal-resolver.js', 'static/admin/src/app.js', 'static/portal/src/app.js']) {
  const text = fs.readFileSync(file, 'utf8');
  if (/RYR|Ryanair|Retail inMotion|customfield_\d+/i.test(text)) errors.push(`Customer-specific/hard-coded production reference found in ${file}`);
  if (/console\.log\s*\(/.test(text)) errors.push(`Debug console.log found in release source: ${file}`);
}

if (errors.length) {
  console.error('\nPortal+ release checks FAILED:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Portal+ V9 brand-platform release checks passed.');
