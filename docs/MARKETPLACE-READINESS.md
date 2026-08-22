# Nuvriqo Portal+ — Marketplace Readiness

Status: **Release candidate — automated checks in progress; final human acceptance pending**

This checklist tracks the requirements that must be complete before the first production Marketplace submission.

## Product

- [x] Portal-only customer rendering validated on Jira Service Management Cloud.
- [x] Customer requests retrieved with `asUser()` and Jira/JSM permission enforcement.
- [x] Configurable customer-facing dashboard heading and intro text.
- [x] Dashboard counters and request list.
- [x] Admin discovery of service desk, request types, organizations and statuses.
- [x] Customer-visible request field discovery.
- [x] Up to three configurable customer-visible request columns.
- [x] Configurable status mappings.
- [x] Configurable/reorderable service categories and quick actions.
- [x] Organization-based audience enforcement for portal-only customers.
- [x] Request key/summary search.
- [x] Status filtering.
- [x] Request-type filtering.
- [x] Date filtering.
- [x] Sorting and pagination.
- [x] CSV export limited to customer-visible requests, capped at 1,000 rows.
- [x] CSV formula-injection protection.
- [x] Configuration migration/versioning.
- [x] Client- and server-side configuration validation.
- [x] Fresh-install defaults avoid unmapped Awaiting counters.
- [x] Paid-license handling added for production.
- [ ] Final end-to-end release-candidate acceptance test on a clean/fresh configuration.
- [ ] Final active/inactive-license test in development or staging.

## Automated quality

- [x] Node.js 22 release workflow.
- [x] Custom UI build runs in CI.
- [x] Static release checks run in CI.
- [x] Production dependency audit fails CI on high/critical findings.
- [x] Dependencies pinned to explicit release-candidate versions.
- [x] Existing Portal+ CI and Remote Forge QA passed on the pre-final hardening commit.
- [ ] Latest RC head passes Portal+ CI.
- [ ] Latest RC head passes Remote Forge QA.
- [ ] Registered-manifest `forge lint` passes after enabling Marketplace licensing locally.

## Forge / release

- [x] Node.js 22 runtime.
- [x] No remote backends or external data egress in V1.
- [x] Forge hosted storage only.
- [x] Marketplace licensing enabled in the repository manifest template.
- [x] Portal customer unlicensed access declared where required by Forge module.
- [x] Functional OAuth scopes documented and justified.
- [x] No customer/project-specific IDs required in source code.
- [ ] Apply `licensing.enabled: true` to the registered local `manifest.yml` while preserving the real Forge app ID.
- [ ] Run `npm install`, `npm test`, dependency audit and `forge lint` against that registered manifest.
- [ ] Deploy exact final RC commit to staging/development and perform the complete acceptance test.
- [ ] Deploy approved commit to production only after final acceptance.
- [ ] Enable Marketplace distribution/sharing in the Atlassian Developer Console as required for submission.
- [ ] Verify Runs on Atlassian eligibility using the current Forge CLI/Developer Console tooling before claiming the badge.

## Marketplace listing material

- [x] Listing copy draft prepared.
- [x] Scope/permission justification prepared.
- [x] Security overview prepared.
- [x] Privacy policy draft prepared.
- [x] Support policy draft prepared.
- [x] End-user terms/DPA checklist prepared.
- [x] Final acceptance plan prepared.
- [ ] Vendor/legal review and publish customer-facing privacy/support/terms/documentation to permanent public HTTPS URLs.
- [ ] Add final logo, screenshots and Marketplace media.
- [ ] Enter pricing and billing model in Marketplace.
- [ ] Complete Privacy & Security tab accurately from `SECURITY-AND-PRIVACY.md`.
- [ ] Confirm vendor security contact in Atlassian Marketplace Security.
- [ ] Complete any outstanding Marketplace partner verification/onboarding requirements.

## Submission gate

Portal+ is considered **Marketplace-ready RC** when the latest automated checks pass and the registered Forge manifest has passed lint/deployment preparation. The comprehensive human acceptance test is deliberately the last product gate. Marketplace submission itself still requires the vendor-controlled legal URLs, media, pricing, security contact and Marketplace account/form steps above.
