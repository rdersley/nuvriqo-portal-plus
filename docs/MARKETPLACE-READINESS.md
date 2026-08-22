# Nuvriqo Portal+ — Marketplace Readiness

Status: **Release-candidate preparation**

This checklist tracks the requirements that must be complete before the first production Marketplace submission.

## Product

- [x] Portal-only customer rendering validated on Jira Service Management Cloud.
- [x] Customer requests retrieved with `asUser()` and Jira/JSM permission enforcement.
- [x] Dashboard counters and recent requests.
- [x] Admin discovery of service desk, request types, organizations and statuses.
- [x] Configurable status mappings.
- [x] Configurable service categories and quick actions.
- [x] Request search, filters and sorting.
- [x] CSV export limited to customer-visible requests.
- [x] Configuration migration/versioning.
- [x] Server-side configuration validation.
- [x] Paid-license handling added for production.
- [ ] Final end-to-end release-candidate test on a clean/fresh configuration.
- [ ] Final licensed / inactive-license test in development or staging.

## Forge / release

- [x] Node.js 22 runtime.
- [x] No remote backends or external data egress.
- [x] Forge hosted storage only.
- [x] Marketplace licensing enabled in the manifest template.
- [x] Portal customer unlicensed access declared where required by Forge module.
- [x] Minimum functional OAuth scopes documented.
- [ ] Apply `licensing.enabled: true` to the registered local `manifest.yml` while preserving the real Forge app ID.
- [ ] Run `npm install`, `npm run build`, `forge lint`, dependency audit and release checks.
- [ ] Deploy final RC to staging and perform the complete acceptance test there.
- [ ] Deploy approved build to production only after final acceptance.
- [ ] Enable Marketplace distribution/sharing in the Atlassian Developer Console as required for submission.
- [ ] Verify Runs on Atlassian eligibility using the current Forge CLI/Developer Console checks.

## Marketplace listing material

- [x] Listing copy draft prepared.
- [x] Scope/permission justification prepared.
- [x] Security overview prepared.
- [x] Privacy policy draft prepared.
- [x] Support policy draft prepared.
- [x] End-user terms checklist prepared.
- [ ] Publish customer-facing documentation/privacy/support/terms to permanent public URLs.
- [ ] Add final logo, screenshots and Marketplace media.
- [ ] Enter pricing and billing model in Marketplace.
- [ ] Complete Privacy & Security tab accurately.
- [ ] Confirm vendor security contact in Atlassian Marketplace Security.
- [ ] Complete partner verification / Marketplace onboarding requirements.

## Submission gate

Portal+ is considered **Marketplace-ready RC** when every product and Forge/release checkbox above is complete except the actual Marketplace form submission. The final human acceptance test is deliberately the last product gate before production deployment and submission.
