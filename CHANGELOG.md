# Changelog

## Unreleased

### Look and feel

- Adopted the shared Nuvriqo UI kit (`@nuvriqo/ui`): admin and portal colours now come from Atlassian design tokens, so both follow Jira light/dark mode.
- Admin page uses the standard Nuvriqo header (N mark, product name, version pill) and footer, and Atlassian-style buttons.
- Customer-facing white-label colours (top bar, customer accent) are unchanged.
- `npm test` now fails on hardcoded colours (`check:ui`) and on an admin version pill that doesn't match `package.json`.

## 1.0.0-rc.1 — Marketplace release candidate

Initial commercial release candidate for Jira Service Management Cloud.

### Customer experience

- Embedded Portal+ dashboard for JSM portal-only customers.
- Configurable dashboard heading and customer intro text.
- Open, Awaiting customer and Awaiting support counters.
- Configurable service categories and request-type quick actions.
- Organization-based Portal+ audience rules.
- Enhanced request list with key/summary search.
- Status, request-type and date filters.
- Newest, oldest and key sorting.
- Ten-row pagination.
- Up to three administrator-selected customer-visible request fields.
- Click-through to the native JSM customer request.
- CSV export of up to 1,000 customer-visible requests.
- Spreadsheet formula-injection protection in CSV values.
- Responsive desktop/mobile behavior and empty/error states.

### Administration

- Automatic service desk discovery.
- Request type discovery.
- Service-desk organization discovery.
- Jira workflow status discovery.
- Customer-visible request field discovery.
- Configurable status mappings.
- Category add/remove/reordering.
- Unsaved-change indication and restore-defaults workflow.
- Client- and server-side configuration validation.
- Versioned Forge KVS configuration migration.

### Marketplace / security

- Forge Node.js 22 runtime.
- Paid Marketplace licensing support.
- Customer request reads use `api.asUser()` so Jira/JSM request permissions remain authoritative.
- Forge-hosted configuration storage.
- No custom remote backend or external analytics/data egress in V1.
- Automated build, release checks and dependency audit in GitHub Actions.
- Marketplace listing, security/privacy, support and acceptance-test documentation prepared.
