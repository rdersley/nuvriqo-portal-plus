# Nuvriqo Portal+ — Marketplace Readiness (1.0.0)

Branch: `release/portal-plus-1.0`. Status: **code complete; live acceptance and vendor submission steps remain.**

## Build (done)

- [x] Version 1.0.0; changelog, README and security notes match the code.
- [x] `manifest.yml`: licensing enabled, Node.js 22 runtime, five scopes justified in `SECURITY-AND-PRIVACY.md`, no external hosts.
- [x] Customer visibility enforced server-side; behaviour tests for cross-customer isolation, injection, writes and help centers (71 tests).
- [x] Logos uploaded to Forge storage (no external images permission, no egress).
- [x] `npm test` green: build, release checks, UI style check, behaviour tests.
- [x] Forge reports production builds eligible for Runs on Atlassian.

## Before deploying the release to production (vendor)

- [ ] Uninstall production test installs made without a licence (Nuvriqo) if they should not carry over.
- [ ] Deploy the release commit: `forge deploy --environment production` (licensing change is a major version; approve when prompted).
- [ ] Keep or clear `PORTALPLUS_EVALUATION_CLOUD_IDS` (vendor evaluation sites only).
- [ ] `npm audit --omit=dev --audit-level=high` clean.

## Live acceptance (vendor + live tests)

- [ ] Create `Ryanair` and `Jet2` (or equivalent) help centers on the test site linked to the test project.
- [ ] Save two signed-in customer sessions and run `npm run test:live` (six checks, screenshots as evidence).
- [ ] Manual pass on a phone: dashboard, request detail, export.
- [ ] Automation rule setting the Customer field (see the Portal+ automation runbook).

## Marketplace submission (vendor, in the partner portal)

- [ ] App logo (144×144) and banner; three highlight screenshots (1840×900) from the live test site.
- [ ] Listing copy from `MARKETPLACE-LISTING.md`.
- [ ] Public HTTPS pages: documentation, privacy policy, support, EULA/terms.
- [ ] Privacy & Security questionnaire from `SECURITY-AND-PRIVACY.md`; security contact.
- [ ] Pricing (Atlassian-billed, per user) and trial.
- [ ] Submit for Atlassian review.
