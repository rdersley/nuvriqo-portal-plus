import fs from 'node:fs';

const requiredFiles = [
  'manifest.template.yml',
  'src/admin-resolver.js',
  'src/portal-resolver.js',
  'static/admin/src/app.js',
  'static/admin/dist/index.html',
  'static/admin/dist/app.js',
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
  'docs/TERMS-AND-DPA-CHECKLIST.md'
];

const errors = [];
for (const file of requiredFiles) if (!fs.existsSync(file)) errors.push(`Missing required release file: ${file}`);

const manifest = fs.readFileSync('manifest.template.yml', 'utf8');
for (const required of ['licensing:', 'enabled: true', 'nodejs22.x', 'read:servicedesk-request', 'read:jira-work', 'manage:servicedesk-customer', 'storage:app', 'unlicensedAccess:']) {
  if (!manifest.includes(required)) errors.push(`Manifest template missing: ${required}`);
}
if (/external:|remote:|permissions:\s*[\s\S]*external:/m.test(manifest)) errors.push('Unexpected external/remote configuration found; re-review data egress before release.');

const portalResolver = fs.readFileSync('src/portal-resolver.js', 'utf8');
for (const required of ['api.asUser().requestJira', 'licenseState', 'audienceAllowed', 'requestColumns', 'CONFIG_VERSION = 4']) {
  if (!portalResolver.includes(required)) errors.push(`Portal resolver missing release feature: ${required}`);
}

const adminResolver = fs.readFileSync('src/admin-resolver.js', 'utf8');
for (const required of ['validateServerSide', 'licenseState', 'getCustomerVisibleFields', 'requestColumns', 'subtitle', 'CONFIG_VERSION = 4']) {
  if (!adminResolver.includes(required)) errors.push(`Admin resolver missing release feature: ${required}`);
}

const portalUi = fs.readFileSync('static/portal/src/app.js', 'utf8');
for (const required of ['request-date', 'renderPagination', 'selectedColumns', 'audienceAllowed', 'csvCell', "^\\s*[=+\\-@]"]) {
  if (!portalUi.includes(required)) errors.push(`Portal UI missing release hardening: ${required}`);
}
const portalHtml = fs.readFileSync('static/portal/dist/index.html', 'utf8');
for (const required of ['request-search', 'request-status', 'request-type', 'request-date', 'request-sort', 'pagination']) {
  if (!portalHtml.includes(required)) errors.push(`Portal HTML missing V1 control: ${required}`);
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

console.log('Portal+ release checks passed.');
