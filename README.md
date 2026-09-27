# Nuvriqo Portal+ for Jira Service Management

Turn Jira Service Management customer portals into clearer, customer-friendly service dashboards.

## Status

**V1 Marketplace release-candidate preparation.**

Portal+ is a Forge/Cloud-first Jira Service Management app. JSM remains the system of record for customer identity, permissions, requests, comments, request forms, workflows and notifications.

The architecture and portal-only customer access have been validated live on Jira Service Management Cloud. The current branch is being hardened for a single final release-candidate acceptance test before production deployment and Atlassian Marketplace submission.

## V1 capabilities

- Embedded customer dashboard inside the existing JSM portal.
- Existing Atlassian/JSM customer login and permissions remain authoritative.
- Open, Awaiting customer and Awaiting support dashboard counters.
- Configurable workflow-status mapping.
- Recent/enhanced request list with search, status filter, request-type filter and date filter.
- Sorting and client-side pagination.
- Up to three configurable customer-visible request fields/columns.
- Configurable customer-friendly service categories and request-type quick actions.
- Organization-based Portal+ audience rules.
- CSV export of customer-visible requests, capped at 1,000 requests per export.
- Automatic discovery of service desk, request types, organizations, statuses and customer-visible fields.
- Forge KVS configuration storage with versioned migration.
- Paid Marketplace licensing support.
- No custom remote backend or third-party analytics/data egress in V1.
- No hard-coded customer, project, organization, request type, field or status IDs.

## Security model

Customer request data is retrieved with Forge `asUser()` calls so Jira Service Management continues to enforce customer request visibility. Administrative discovery uses controlled app-context APIs for configuration metadata. Organization audience rules control whether the Portal+ experience is shown; they never grant Jira request access.

Portal+ V1 stores configuration in Forge hosted storage and does not intentionally persist customer request descriptions, comments, attachments, passwords or personal API tokens in its configuration store.

See `docs/SECURITY-AND-PRIVACY.md` for the Marketplace security/privacy source notes.

## Release checks

```bash
npm install
npm test
npm audit --omit=dev --audit-level=high
forge lint
```

`npm test` builds both Custom UI bundles and runs the repository release checks in `scripts/release-check.mjs`.

## Important manifest note

`manifest.yml` is the registered manifest that Forge deploys, and `scripts/release-check.mjs` validates it. `manifest.template.yml` is the same file with `REPLACE_WITH_FORGE_APP_ID` for new registrations; the release check fails if the two differ in anything but the app ID, so change both together.

For the paid Marketplace release, the registered manifest must include:

```yaml
app:
  licensing:
    enabled: true
```

## Documentation

- `docs/V1-SPEC.md` — locked V1 product scope.
- `docs/ARCHITECTURE.md` — architecture decisions.
- `docs/SPIKE-RESULTS.md` — live technical-spike evidence.
- `docs/MARKETPLACE-READINESS.md` — release/submission gate.
- `docs/MARKETPLACE-LISTING.md` — listing copy draft.
- `docs/SECURITY-AND-PRIVACY.md` — security/privacy technical facts.
- `docs/FINAL-ACCEPTANCE-TEST.md` — the single final RC acceptance test.

## Release policy

Do not add new V1 features after the release candidate enters final acceptance testing. Any defect fixes made during that test must be re-run through the release checks and the affected acceptance scenarios before production deployment.
