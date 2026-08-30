# Nuvriqo Portal+ — Marketplace Listing Draft

## App name

**Nuvriqo Portal+ for Jira Service Management**

## Tagline

**One JSM project. Multiple branded customer service experiences.**

## Short description

Portal+ turns Jira Service Management into a branded customer Service Hub with organization-specific experiences, Action Centre, service tiles, announcements, enhanced request management and a mobile-ready experience model — without replacing Jira workflows, permissions or request forms.

## Long description

Nuvriqo Portal+ helps Jira Service Management teams deliver a more complete customer-service experience without creating duplicate JSM projects or moving service operations into another platform.

Use one JSM project to provide different customer experiences for different JSM organizations. Each Portal+ Experience can have its own customer-facing identity, dashboard content, service catalogue, workflow mappings, announcements, resources and request-list configuration while Jira Service Management remains the system of record.

### Build branded customer experiences

Each Portal+ Experience can define:

- customer-facing experience and brand name;
- brand accent colour and egress-free web brand mark;
- dashboard heading and introduction;
- hero message;
- support identity/link;
- organization audience;
- dashboard modules;
- Awaiting customer / Awaiting support workflow mappings;
- customer-visible request columns;
- service categories and request-type Quick Actions;
- category-specific organization audiences;
- announcements;
- useful resources;
- mobile / white-label display identity.

Portal+ automatically chooses the appropriate Experience from the signed-in customer's JSM organization membership. Jira permissions still determine which requests that customer can access.

### Customer Service Hub

Eligible portal customers can receive a Service Hub containing:

- Open, Awaiting you and Awaiting support counters;
- **Things needing your attention** Action Centre;
- service tiles and request-form Quick Actions;
- audience-specific announcements;
- documentation, status pages and useful links;
- enhanced request search and navigation;
- status, request-type and date filters;
- sorting and pagination;
- administrator-selected customer-visible fields;
- click-through to the native JSM request;
- CSV export of visible requests.

### One project, multiple experiences

A service provider can continue operating one JSM project while presenting different Portal+ experiences to different JSM organizations. This reduces the pressure to clone projects, workflows and automation merely to create customer-specific portal navigation and presentation.

An organization-specific Experience can override a fallback Experience, and individual service categories can also be restricted to selected organizations.

### Mobile-ready by design

Portal+ stores branding, services, announcements, resources and customer-action configuration in a versioned Experience contract shared by the web client and future Portal+ mobile/white-label clients.

This creates a path from:

**Portal+ Web → Portal+ Mobile → dedicated white-label service app**

without building a second configuration system or hard-coding customer-specific Jira IDs into each client.

### Fast administration

Portal+ automatically discovers the current service desk's request types, JSM customer organizations, workflow statuses and customer-visible request fields. Administrators configure human-readable options instead of copying Jira numeric IDs.

The Experience Builder includes a branded preview so administrators can review the customer-facing layout before publishing changes.

### Designed for Jira, not around it

Portal+ does not replace JSM authentication, permissions, workflows, request forms or request storage. Customer request reads use Jira/JSM customer context, so Jira remains authoritative for request visibility.

### Privacy-first Forge architecture

The Marketplace web app is built on Atlassian Forge with Atlassian-hosted compute and configuration storage. The current web architecture does not require a Nuvriqo remote backend or third-party analytics service. Portal+ deliberately uses an egress-free generated web brand mark rather than requiring arbitrary externally hosted logos inside the Forge iframe.

## Suggested Marketplace highlights

1. **One JSM project, multiple branded service hubs** — tailor navigation, branding and content to customer organizations without duplicating Jira projects.
2. **Show customers what needs attention** — combine request counters with an Action Centre that links directly to requests awaiting the customer.
3. **Web today, mobile-ready tomorrow** — configure branding and service experiences once using a shared Experience contract designed for Portal+ Mobile and white-label clients.

## Suggested keywords

Jira Service Management, JSM portal, customer portal, branded portal, white label, mobile service desk, customer experience, service hub, organization portal, multi portal, request dashboard, Action Centre, request export, CSV export, portal customization, request categories, request search

## Current release boundaries

The Marketplace web release does not include arbitrary customer field editing, a full drag-and-drop page designer, custom authentication/domains, external CRM integrations, AI functionality or multi-Jira-site aggregation. Native Portal+ Mobile and dedicated app-store white-label clients use the shared Experience architecture but remain separate delivery/security gates from the Forge Marketplace web app.
