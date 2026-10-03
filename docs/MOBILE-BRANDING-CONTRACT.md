# Portal+ Mobile & Branding Contract

Portal+ experiences are the shared configuration source for web, shared mobile, and future dedicated white-label mobile builds.

## Per-experience identity

- `brandName` — customer-facing organization/product identity
- `logoUrl` — HTTPS logo used by web and shared mobile
- `accentColor` — primary interaction/accent colour
- `heroTitle` / `heroText` — branded service-hub welcome content
- `supportLabel` / `supportUrl` — optional branded support destination
- `showPoweredBy` — controls Portal+ attribution where commercial tier permits
- `mobileAppName` — short display identity for mobile presentation
- `mobileIconUrl` — source artwork reference for mobile identity

## Product tiers

### Portal+ Web
Uses the experience branding inside Jira Service Management while Jira remains the authentication and request system of record.

### Portal+ Mobile
A shared Nuvriqo mobile client resolves the signed-in customer's Portal+ experience and dynamically applies its identity, services, announcements, Action Centre, useful links, and request experience.

### Portal+ White Label
A premium packaging tier can use the same experience contract to generate a dedicated customer-branded application package, subject to App Store / Play Store account, review, signing, privacy, and release requirements.

## Architecture rule

Branding is configuration, not authorization. Jira/JSM permissions remain authoritative for requests. Organization membership selects an experience; it must never grant request visibility.

## Mobile feature contract

The mobile client should consume the same concepts as web:

1. Experience identity and branding
2. Service categories and request-type actions
3. Announcements
4. Action Centre
5. My Requests/search/filtering
6. Useful resources
7. Customer-safe attachments/photos when implemented
8. Push-notification preferences when implemented

This contract should remain backward compatible through versioned Portal+ configuration migrations.