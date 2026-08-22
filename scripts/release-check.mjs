import fs from 'node:fs';

const requiredFiles = [
  'manifest.template.yml',
  'src/admin-resolver.js',
  'src/portal-resolver.js',
  'static/admin/dist/index.html',
  'static/admin/dist/app.js',
  'static/admin/dist/styles.css',
  'static/portal/dist/index.html',
  'static/portal/dist/app.js',
  'static/portal/dist/styles.css',
  'docs/MARKETPLACE-READINESS.md',
  'docs/MARKETPLACE-LISTING.md',
  'docs/SECURITY-AND-PRIVACY.md'
];

const errors = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) errors.push(`Missing required release file: ${file}`);
}

const manifest = fs.readFileSync('manifest.template.yml', 'utf8');
for (const required of ['licensing:', 'enabled: true', 'read:servicedesk-request', 'read:jira-work', 'manage:servicedesk-customer', 'storage:app']) {
  if (!manifest.includes(required)) errors.push(`Manifest template missing: ${required}`);
}
if (/external:|remote:|permissions:\s*[\s\S]*external:/m.test(manifest)) errors.push('Unexpected external/remote configuration found; re-review data egress before release.');

const portalResolver = fs.readFileSync('src/portal-resolver.js', 'utf8');
if (!portalResolver.includes('api.asUser().requestJira')) errors.push('Customer request resolver must use asUser().');
if (!portalResolver.includes('licenseState')) errors.push('Portal resolver is missing license handling.');

const adminResolver = fs.readFileSync('src/admin-resolver.js', 'utf8');
if (!adminResolver.includes('validateServerSide')) errors.push('Admin resolver is missing server-side validation.');
if (!adminResolver.includes('licenseState')) errors.push('Admin resolver is missing license handling.');

for (const file of ['src/admin-resolver.js', 'src/portal-resolver.js', 'static/admin/src/app.js', 'static/portal/src/app.js']) {
  const text = fs.readFileSync(file, 'utf8');
  if (/RYR|Ryanair|Retail inMotion|customfield_\d+/i.test(text)) errors.push(`Customer-specific/hard-coded production reference found in ${file}`);
}

if (errors.length) {
  console.error('\nPortal+ release checks FAILED:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Portal+ release checks passed.');
