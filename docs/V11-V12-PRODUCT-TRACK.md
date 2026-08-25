# Nuvriqo Portal+ — V11/V12 Product Track

## Product direction
Portal+ is evolving from an enhanced JSM portal into a branded customer-service platform powered by Jira Service Management across web and mobile.

## V11 — Mobile Experience Foundation

### Goals
- Keep Jira/JSM as the system of record and permission authority.
- Expose one stable customer contract for Portal+ Web and a future native mobile client.
- Make the customer experience action-first and mobile-first.

### Contract V3
The customer resolver exposes `getMobileBootstrap` and client contract V3 with:
- resolved customer experience and branding;
- organization-aware routing metadata;
- dashboard counts and Action Centre items;
- service catalogue and create-request navigation targets;
- announcements and useful resources;
- customer-visible request summaries;
- mobile navigation model;
- onboarding/authentication metadata;
- notification capability contract.

### Security boundary
Request data continues to be loaded with `api.asUser().requestJira`. Portal+ audience routing controls presentation and branding; Jira remains authoritative for request visibility.

### Notifications
V11 defines the notification topics and preference contract but does not pretend push delivery exists. Native push registration/delivery is reserved until the mobile client and its reviewed backend path exist.

## V12 — White Label & Enterprise

### Planned goals
- white-label/mobile identity profiles per Experience;
- stronger publish lifecycle and preview controls;
- draft versus published Experience configuration;
- enterprise routing diagnostics and audience simulation;
- branding asset strategy that does not casually introduce Forge egress;
- permissions/scope minimization audit;
- commercial packaging for Portal+ Web, Portal+ Mobile and white-label tiers;
- Marketplace acceptance and migration tests covering V11/V12 contracts.

## Release principle
V11/V12 features must not weaken Jira permission isolation, introduce customer-specific hard-coded IDs, or claim native capabilities before those capabilities are actually implemented and tested.
