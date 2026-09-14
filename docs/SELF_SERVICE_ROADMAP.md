# Nuvriqo Portal+ — Customer Self-Service Roadmap

## Product position

**Nuvriqo Portal+ – The missing customer self-service layer for Jira Service Management**

Portal+ is a commercial self-service product, not a cosmetic portal theme. Jira Service Management remains authoritative for authentication, permissions, request creation, workflow, comments and notifications. Portal+ adds the customer-facing visibility, reporting, search, actions and companion-app experience that customers repeatedly request.

## Pre-Marketplace priorities

### P0 — release-defining

1. Customer-visible custom fields.
2. Read-only agent-maintained fields in request detail.
3. Improved My Requests with configurable columns (up to 8 columns in the first expanded model).
4. Advanced search/filtering across key, summary, status, request type, date and configured customer-visible fields.
5. SLA visibility: customer-safe state, target/due context and met/breached state where available.
6. CSV export consolidated into Portal+.
7. Organisation/customer-targeted request types and portal groups using the existing multi-experience routing model.
8. Smart Approval and Asset Manager companion modules integrated into the Portal+ shell.
9. Bounded loader/error behaviour, mobile/responsive acceptance and customer permission regression testing.

### P1 — commercial differentiators targeted before submission if stable

1. Customer dashboards/reporting.
2. Created vs Resolved.
3. Tickets by Request Type.
4. Tickets by Status.
5. SLA Met/Breached.
6. Average Resolution Time.
7. Customer actions: Close Request and Escalate, controlled by admin settings and workflow capability.
8. Customer-editable fields after submission for explicitly supported/allowed field types.
9. Excel export if it can be delivered without destabilising the Portal+ export path.

## Post-release roadmap

1. Related requests and richer request relationships.
2. Deeper organisation dashboards and reporting periods.
3. More flexible editable-field types and validation.
4. Additional customer actions and workflow-safe automation.
5. Saved/shared customer views across devices rather than browser-local only.
6. More extensive multi-help-centre / tailored portal routing and white-label controls.
7. Advanced asset/device actions and asset-linked request history.
8. Native/mobile app direction.
9. Knowledge recommendations and AI-assisted self-service after evidence and security review.

## CSV Export app decision

Portal+ should absorb the customer-facing export capability. Export is naturally part of the improved My Requests/reporting experience and is a long-standing customer portal demand.

The standalone CSV Export app should remain separate only where it serves agent/admin use cases outside Portal+. Shared export logic should be moved toward a reusable Nuvriqo package/contract so security hardening, formula-injection protection and column handling do not diverge between apps.

## UI plan

Portal+ navigation should evolve into a single customer workspace:

- **Home** — counters, Action Centre, announcements and quick actions.
- **My Requests** — configurable columns, advanced filters, saved views and export.
- **Request Detail** — read-only fields, editable fields where permitted, SLA information, related requests and customer actions.
- **Reports** — created/resolved, type, status, SLA and resolution-time views.
- **My Assets** — Asset Manager companion module when available.
- **Approvals** — Smart Approval Manager companion module when available.
- **Services** — organisation/customer-specific request types and groups.

Companion app sections must disappear cleanly when the provider is unavailable.

## Architecture principles

1. Consent-free customer first paint remains mandatory; do not reintroduce `api.asUser().requestJira` into the Portal+ customer resolver path.
2. Jira/JSM permissions remain authoritative.
3. Portal+ never broadens issue visibility to discover companion-app data.
4. Companion-app metadata is evaluated only after a request/asset is already inside the customer's visibility boundary.
5. Editable fields are allow-listed by administrators and field type; unsupported fields remain read-only.
6. Customer actions use explicit admin configuration and available Jira/JSM transitions rather than hard-coded workflow IDs.
7. Reporting is calculated only over requests the signed-in customer is entitled to see.
8. Export uses the same customer-visible dataset and retains formula-injection protection.
9. No Nuvriqo remote backend is required for the first commercial web release.

## Current implementation baseline

- RC package: `1.0.0-rc.4`.
- Stable release candidate: `release/portal-plus-v1-rc`.
- Companion integrations: `feature/portal-integrations-v1`.
- Commercial self-service expansion: `feature/customer-self-service-layer`.
- Smart Approval provider work is isolated in its own repository/feature branch.
- Asset Manager provider work is isolated in its own repository/feature branch.

## Build progress — 14 Sep 2026

Implemented on `feature/customer-self-service-layer`:

- Versioned self-service configuration contract.
- Read-only/editable customer field model.
- Up to 8 My Requests list fields and up to 16 request-detail fields.
- SLA visibility configuration contract.
- Customer reporting aggregation for Created/Resolved, Request Type, Status, SLA Met/Breached and Average Resolution Time.
- CSV/Excel capability contract.
- Close Request / Escalate action contract.
- Self-service runtime that converts configured Jira fields and customer-visible requests into a safe Portal+ dashboard/report payload.
- Request-detail field builder that only exposes administrator-configured fields.
- Runtime capability detection so UI sections can hide when a feature is disabled.
- Automated contract and runtime tests added to the standard Portal+ test command.

Next implementation steps:

1. Wire the self-service runtime into `getDashboard`, `getClientContract` and mobile/bootstrap payloads.
2. Expand the request fetch to include all configured self-service fields while preserving the current consent-free visibility boundary.
3. Add admin controls for read-only/editable field selection, SLA visibility, reporting, export and customer actions.
4. Render the expanded My Requests columns and customer request-detail panel.
5. Add reporting UI and drill-down filters.
6. Validate the supported JSM SLA API/data path before exposing live SLA values.
7. Add controlled field editing and lifecycle actions behind explicit admin allow-lists.
8. Run deployed permission, mobile and cross-app regression QA before merging toward the stable release line.
