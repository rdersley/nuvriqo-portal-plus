# Nuvriqo Portal+ — V1 Specification

Status: **LOCKED BASELINE**

## Product positioning

Portal+ turns Jira Service Management's customer portal into a service dashboard rather than only a directory of request forms.

Core positioning:

- **One project. Multiple customer experiences.**
- **Give customers a real service dashboard.**
- **Make existing requests as easy to find as new request forms.**

## MUST — V1

1. Embedded Portal+ experience for Jira Service Management Cloud.
2. Existing Atlassian/JSM customer identity and login remain authoritative.
3. Existing JSM request forms remain the system of record.
4. Configurable Portal+ branding.
5. Configurable service categories.
6. Request-type shortcuts within categories.
7. Virtual service experiences over a single underlying JSM project.
8. Organization-based audience rules.
9. Customer dashboard.
10. Open-request counter.
11. Awaiting-customer counter.
12. Awaiting-support counter.
13. Recent requests.
14. Enhanced My Requests experience.
15. Request search.
16. Status filtering.
17. Request-type filtering.
18. Date filtering.
19. Configurable request-list columns.
20. Customer-visible custom fields.
21. Sorting and pagination.
22. CSV export.
23. Jira/JSM permission enforcement.
24. Admin configuration UI.
25. Automatic discovery of relevant Jira/JSM configuration.
26. No-code installation/configuration for normal administrators.
27. Forge/Cloud-first architecture suitable for Atlassian Marketplace distribution.
28. Tenant-safe configuration/storage.

## SHOULD — validate before inclusion

- Customer-facing SLA countdown / SLA-risk indicator.
- Approvals dashboard / approvals requiring the customer.
- Saved request views.

A SHOULD feature may only enter V1 after API, security and UX feasibility are demonstrated without weakening the Marketplace architecture.

## LATER — explicitly excluded from V1

- Customer-editable arbitrary Jira fields.
- Charts/report designer.
- AI features.
- Full drag-and-drop page designer.
- Custom CSS or arbitrary HTML.
- XLSX export.
- Multi-Jira-instance aggregation.
- Salesforce integration.
- Custom domains.
- Custom authentication.

## Audience model

V1 audience rules deliberately remain simple:

- Everyone; or
- One or more JSM customer organizations.

Portal+ must not implement a parallel authorization system. Audience rules control Portal+ presentation; Jira/JSM permissions remain authoritative for data access.

## Admin experience

The expected setup flow is:

1. Select a JSM project/service desk.
2. Portal+ discovers request types, request groups, relevant fields and customer organizations.
3. Admin creates/reorders Portal+ service categories.
4. Admin maps request types into categories.
5. Admin chooses audience organizations for categories/shortcuts.
6. Admin configures dashboard modules.
7. Admin configures My Requests columns and filters.
8. Admin saves/publishes the Portal+ configuration.

Admins must select human-readable options from discovered data. They must not normally enter Jira numeric IDs manually.

## Customer dashboard baseline

The V1 dashboard should support:

- Open Requests
- Awaiting My Response
- Awaiting Support
- Recent Requests
- Quick Actions / request-type shortcuts

SLA Risk and Approvals are conditional SHOULD features.

## Enhanced My Requests baseline

The V1 request view includes:

- Search
- Status filter
- Request-type filter
- Date filter
- Configurable columns
- Customer-visible custom fields
- Sorting
- Pagination
- CSV export

## Security requirements

- Never expose requests a customer cannot access in JSM.
- Prefer customer-context (`asUser`) access for customer data.
- Administrative APIs/configuration must be separated from customer-context operations.
- Organization membership must never grant access beyond Jira/JSM's underlying permissions.
- Tenant configuration must not leak across Atlassian sites.
- Secrets must not be stored in source control.

## Product-generic requirement

No customer-specific names, IDs, project keys, field IDs, request-type IDs, status IDs or organization IDs may be required in source code.

A real service desk may be used for testing, but Portal+ must discover and map the equivalent configuration on every installation.

## Scope lock

Anything not listed as MUST or an approved SHOULD item is outside V1. Scope changes require an explicit product decision before implementation.
