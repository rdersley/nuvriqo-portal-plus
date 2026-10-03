# Portal+ shared client contract

Status: **V11 / Contract V3 — mobile-ready Forge contract**

Portal+ uses one customer Experience model as the source of truth for web, mobile and future white-label clients.

## Purpose
The customer experience must not be reconfigured independently in each client. A single Experience controls audience organizations, branding, dashboard modules, status mappings, customer-visible columns, service categories/request types, announcements, resources, support identity and mobile display identity.

## Runtime contract V3
The Forge portal resolver exposes `getClientContract` plus a dedicated `getMobileBootstrap` interface. Contract V3 contains:

- resolved `experienceId`, `experienceName` and `serviceDeskId`;
- configuration revision and deterministic routing metadata;
- brand/mobile identity;
- headings, announcements, resources and service catalogue;
- dashboard module configuration and counts;
- Action Centre items requiring customer attention;
- normalized customer-visible request summaries;
- mobile navigation model for Home, Actions, Requests, Create and Resources;
- onboarding/authentication metadata;
- notification capability/topics contract;
- explicit capability flags and licence state.

Customer request information is obtained with app permissions (`api.asApp()`), restricted by Portal+ on every call to requests the customer reported or that are shared with their organisations (see `SECURITY-AND-PRIVACY.md`). Audience configuration selects presentation and branding; it never widens request access.

## Mobile bootstrap boundary
`getMobileBootstrap` is a Forge-side contract and is **not** represented as a public unauthenticated internet API. A native iOS/Android client still requires a separately reviewed authentication and transport mechanism before Jira-backed data can be consumed outside the Forge surface.

The native-client layer must preserve these rules:

1. Atlassian/JSM remains authoritative for customer identity and request visibility.
2. Portal+ organization routing may never broaden Jira permissions.
3. Secrets/tokens must never be embedded in an app binary.
4. Branding/configuration can be cached safely according to the future transport design; request data remains authenticated customer data.
5. Contract evolution is versioned and compatibility must be reviewed before removing fields.
6. Push registration and delivery must not be claimed until a reviewed native notification backend exists.

## Notification contract
V11 reserves the topics `request-updated`, `customer-action-required` and `announcement`. Push is currently reported as unsupported. This lets the client model be designed now without falsely advertising a working push service.

## White-label model
Portal+ is designed for two future commercial modes:

- **Portal+ Mobile** — a Nuvriqo client adopting the selected Experience branding after authentication.
- **Portal+ White Label** — dedicated app-store identity (name/icon/splash/store listing) backed by the same Experience configuration and Jira integration rules.

Dedicated builds must not fork Jira integration logic or introduce customer-specific hard-coded request type, status or field IDs.
