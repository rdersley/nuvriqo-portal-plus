# Nuvriqo Portal+ for Jira Service Management

A branded customer workspace inside the Jira Service Management portal: dashboard, requests, reports, guides and self-service, per customer, on top of JSM.

## Status

**1.0.0 — Marketplace release.** Forge app, Atlassian-hosted compute and storage, no external egress. JSM remains the system of record for customers, requests, workflows, SLAs and notifications.

## Capabilities

**Customer workspace**
- Branded dashboard in the JSM portal header: brand name, uploaded logo, accent colour, hero and search wording, optional white-label top bar.
- Counters (open, awaiting customer, awaiting support) that open matching request views; Action Centre for requests waiting on the customer.
- Service tiles and quick actions linked to the customer's request types; announcements and quick links.
- My Requests: search, status, type and date filters, sorting, saved views, up to 8 configurable columns, real SLA status per request.
- Request detail panel: configured read-only and editable fields (type-aware editors), JSM SLA, progress timeline, admin-enabled Close and Escalate.
- Customer reports: created vs resolved, by type, by status, SLA met/breached, average resolution, 30-day trend, period selector.
- CSV and Excel export of the customer's visible requests (up to 1,000).
- Guides & documents library per customer, linking to knowledge base articles.

**Multi-customer**
- Experiences per JSM organisation, each with its own branding, services, guides and settings.
- Help-center-aware routing: several JSM help centers on one shared project, each showing its customer's experience.
- Optional narrowing of requests by a dropdown custom field (for example Customer = Acme).

**Companion apps**
- Approvals from Nuvriqo Smart Approval Manager and My Assets from Nuvriqo Asset Manager, when installed.

## Security model

Portal+ reads Jira with app permissions to avoid a per-customer consent prompt, and enforces the customer boundary itself on every server call: requests the customer reported or that are shared with their organisations, in the current project, optionally narrowed further. Help center addresses choose branding only; organisation membership decides access. Writes happen only for admin-enabled edits and transitions, with an internal audit comment. Full detail, stored data and scope justification: `docs/SECURITY-AND-PRIVACY.md`.

## Development

```bash
npm install
npm test            # build, release checks, UI style check, behaviour tests
npm audit --omit=dev --audit-level=high
forge lint
npm run test:live   # optional live checks, see live-tests/README.md
```

Behaviour tests run the real resolvers against an in-memory Jira (`tests/helpers/fake-jira.mjs`) that applies JSM customer visibility and rejects unexpected queries.

## Licensing

`manifest.yml` must keep `app.licensing.enabled: true` for the paid Marketplace release. Outside production Portal+ is always active for testing. In production a Marketplace licence decides; vendor evaluation installs without a licence object are allowed only for cloud IDs listed in the `PORTALPLUS_EVALUATION_CLOUD_IDS` production variable (`src/licensing.js`).

`manifest.template.yml` is the repository-safe template with `REPLACE_WITH_FORGE_APP_ID`.

## Documentation

- `docs/SECURITY-AND-PRIVACY.md` — security, stored data, scopes.
- `docs/MARKETPLACE-LISTING.md` — listing copy.
- `docs/MARKETPLACE-READINESS.md` — submission checklist.
- `docs/ARCHITECTURE.md` — architecture decisions.
- `live-tests/README.md` — live multi-help-center checks.
