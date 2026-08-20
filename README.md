# Nuvriqo Portal+ for Jira Service Management

Turn Jira Service Management customer portals into clearer, audience-aware service dashboards.

## Status

**V1 specification locked — foundation phase.**

Portal+ is being designed as a Forge/Cloud-first Marketplace app. Jira Service Management remains the system of record for customer identity, permissions, requests, comments, request forms, workflows and notifications.

## V1 product goals

- One JSM project can power multiple Portal+ service/category experiences.
- Organization-aware navigation and audience rules.
- Branded Portal+ customer experience.
- Customer dashboard with request-state summaries and recent requests.
- Configurable service/category cards and request-type shortcuts.
- Enhanced My Requests experience with search, filters, configurable columns, sorting and pagination.
- Customer-visible custom fields.
- CSV export.
- Automatic discovery of Jira/JSM configuration.
- No hard-coded project, organization, request type, field or status IDs.
- Marketplace-ready tenant isolation and permission handling from the start.

## V1 scope policy

The V1 scope is documented in `docs/V1-SPEC.md`. Features outside that specification should not be added to V1 without an explicit scope decision.

## Architecture principles

1. JSM remains the system of record.
2. Customer operations use the customer's Jira/JSM permissions wherever possible.
3. Administrative discovery/configuration uses controlled app permissions.
4. Portal+ configuration is tenant-specific and stored securely.
5. Installations must work without source-code changes.
6. Ryanair/SD may be used as a real-world test scenario, but no customer-specific assumptions belong in product code.

## Repository structure

- `docs/` — product specification, architecture and implementation decisions.
- `src/` — Forge application source (added after the technical spike is approved).
- `static/` — Custom UI resources (added when required).

## Current milestone

Validate the supported Forge JSM portal extension points and customer API access on a real JSM Cloud site before implementing V1 features.
