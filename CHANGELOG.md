# Changelog

## 1.0.0 — Marketplace release

First Marketplace release for Jira Service Management Cloud.

### Customer workspace

- Request detail panel with type-aware editing (text, multi-line, number, date, date-time, dropdown), JSM SLA, progress timeline from customer status history, and admin-enabled Close and Escalate.
- Real SLA status on My Requests rows and in customer reports; reports gain a working period selector (30/90 days, 6/12 months, all time).
- Excel (.xlsx) export alongside CSV; both export the columns shown in My Requests.
- Up to 8 My Requests columns, including standard fields such as Description.
- Guides & documents library per experience, linking to knowledge base articles (Confluence page links converted automatically).
- Uploaded brand logo, brand name in the top bar, configurable search panel wording, optional white-label top bar.
- Larger, more readable type; phone-friendly form fields.

### Multi-customer

- Help-center-aware experiences for several JSM help centers on one shared project; organisation membership still decides access.
- Optional request narrowing by a dropdown custom field.

### Security and reliability

- Customer visibility enforced on the server for every read and write; request detail and actions verify the exact request.
- Close/Escalate run only transitions into admin-chosen statuses; field values validated per type; internal audit comment after customer changes.
- Admin settings validated against live project fields, statuses and dropdown fields.
- Portal+ resolves the project from the portal and help center, fixing the dashboard that never loaded in the portal header.
- Dashboard data loaded once per page instead of twice.
- Behaviour test suite running the real resolvers against an in-memory Jira.

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
