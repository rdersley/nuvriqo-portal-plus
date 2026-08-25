# Portal+ shared client contract

Status: **V1 brand-platform contract**

Portal+ uses one customer Experience model as the source of truth for web, mobile and future white-label clients.

## Purpose

The customer experience must not be reconfigured independently in each client. A single Experience controls:

- audience organizations;
- brand name and logo;
- accent colour;
- dashboard heading and introduction;
- hero title/message;
- support label/link;
- Portal+ attribution visibility;
- mobile display name and icon reference;
- dashboard modules;
- Awaiting customer/support mappings;
- customer-visible request columns;
- service categories and request types;
- announcements;
- useful resources.

## Runtime contract

The Forge portal resolver exposes `getClientContract` for Portal+ clients running inside the current Forge/JSM trust boundary. Contract version 1 returns:

- `experienceId`, `experienceName`, `serviceDeskId`;
- `branding`;
- `content.heading`, `content.subtitle`, `content.announcements`, `content.resources`, `content.services`;
- `dashboard.modules`;
- `dashboard.counts`;
- `dashboard.actions`;
- normalized request summaries under `requests.items`;
- configured request columns;
- licence state.

All customer request information is still obtained using Jira/JSM customer context (`api.asUser()`); the contract does not introduce a second authorization model.

## Mobile boundary

`getClientContract` is an internal Forge client contract, not yet a public internet API. A native iOS/Android client will require a separately reviewed authentication and transport layer before it can consume Jira-backed data outside the Forge surface.

The native-client layer must preserve these rules:

1. Atlassian/JSM remains authoritative for customer identity and request visibility.
2. No mobile client may broaden access based only on Portal+ organization audience configuration.
3. Secrets/tokens must never be embedded in a white-label app binary.
4. Branding may be cached; customer request data should be fetched under the authenticated customer context.
5. Contract evolution must be versioned and backwards compatible where practical.

## White-label model

Portal+ supports two future commercial modes from the same Experience data:

- **Portal+ Mobile** — one Nuvriqo app that adopts the selected Experience branding after login.
- **Portal+ White Label** — dedicated app-store identity (name/icon/splash/store listing) backed by the same Experience contract.

Dedicated app-store builds must not fork the Jira integration logic or create customer-specific hard-coded request type/status/field IDs.
