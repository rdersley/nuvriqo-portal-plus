# Nuvriqo Portal+ — Marketplace Readiness

Status: **V11/V12 release candidate — feature freeze approaching; final automated and human acceptance pending**

This is the submission gate for the first production Marketplace release. Portal+ Web is the Marketplace product; native iOS/Android delivery is a separately reviewed future client and is not required for the first web release.

## Product complete
- [x] Portal-only customer rendering on Jira Service Management Cloud.
- [x] Customer requests read with `api.asApp()`, limited to the customer's own requests and their organizations' requests by the `customerJql()` boundary (`src/customer-visibility.js`). Detail, edits and actions re-check it per issue. See SECURITY-AND-PRIVACY.md, "Customer authorization".
- [x] Multiple branded Experiences from one JSM project.
- [x] Deterministic organization-based audience routing with one fallback and ambiguity validation.
- [x] Experience branding, hero/support identity and mobile identity metadata.
- [x] Admin discovery of service desks, request types, organizations, statuses and customer-visible fields.
- [x] Dashboard counts, Action Centre and recent requests.
- [x] Configurable status mappings and up to three customer-visible request columns.
- [x] Configurable/reorderable service categories and quick actions.
- [x] Announcements and useful resources.
- [x] Request search, status/type/date filters, sorting and pagination.
- [x] CSV export limited to customer-visible requests, capped at 1,000 rows with formula-injection protection.
- [x] Desktop/mobile admin preview and routing inspector.
- [x] Mobile-first responsive customer presentation.
- [x] Client Contract V3 and `getMobileBootstrap` mobile-ready Forge interface.
- [x] Configuration migration/versioning and client/server validation.
- [x] Production licence enforced on every data resolver (`requireLicence` in `src/licensing.js`). Unlicensed sites see a "Portal+ is unavailable" notice (portal) or a subscription message (admin). Evaluation cloud IDs (`PORTALPLUS_EVALUATION_CLOUD_IDS`) are unchanged.

## V12 / release freeze gate
- [ ] Complete final draft/preview/publish lifecycle decision and implementation or explicitly defer it from 1.0.
- [ ] Complete white-label configuration review; ensure no feature implies a native app is already shipped.
- [x] Scope audit (2026-09-27). All five scopes are used:
  - `read:servicedesk-request`: service desk, request type, SLA and status-history reads.
  - `read:jira-work`: search, transitions, edit metadata, statuses, fields, project properties.
  - `write:jira-work`: field edits (`PUT /issue/{key}`), Close and Escalate (`POST …/transitions`) and audit notes (`POST …/comment`) in `src/request-detail-service.js`.
  - `manage:servicedesk-customer`: `GET /servicedesk/{id}/organization` (admin) and `GET /organization?accountId=` (the customer's organizations); read only.
  - `storage:app`: Forge KVS.

  The only narrower option is the granular `read:organization:jira-service-management` in place of `manage:servicedesk-customer`. That scope change forces a major version, so decide it with the pre-Marketplace major bundle.
- [ ] Freeze product features for 1.0 after the above decisions.

## Automated quality
- [x] Node.js 22 release workflow.
- [x] Custom UI build and static release checks in CI.
- [x] Production dependency audit blocks high/critical findings.
- [x] Dependencies pinned to explicit RC versions.
- [x] Previous Portal+ CI and Remote Forge QA green before V11 mobile changes.
- [ ] Latest V11/V12 RC head passes Portal+ CI.
- [ ] Latest V11/V12 RC head passes Remote Forge QA.
- [ ] Registered-manifest `forge lint` passes after final Marketplace manifest preparation.

## Final acceptance
- [ ] Clean/fresh configuration test.
- [ ] Migration from earlier Portal+ configuration.
- [ ] Multiple Experience and organization-routing test, including multi-organization customer.
- [ ] Fallback and no-audience behaviour.
- [ ] Branding, desktop preview and phone-width preview.
- [ ] Action Centre, services, announcements and resources.
- [ ] Create request and open existing request journeys.
- [ ] Search/filter/sort/pagination and CSV export.
- [ ] Permission isolation using customer accounts with different Jira-visible requests.
- [ ] Active/inactive licence behaviour.
- [ ] Phone-width customer experience on a real device.
- [ ] Controlled real-world JSM pilot after Nuvriqo acceptance passes.

## Forge / security
- [x] Node.js 22 runtime.
- [x] No remote backend or external data egress in the first web release architecture.
- [x] Forge hosted storage only.
- [x] Marketplace licensing enabled in `manifest.yml`. `npm run release:check` validates `manifest.yml` itself and fails if `manifest.template.yml` drifts from it.
- [x] Customer unlicensed access declared where required by Forge module.
- [x] No customer/project-specific production IDs required in source.
- [x] Portal+ enforces request visibility with the JQL boundary (reporter or customer organization). Routing and request scope can only narrow it. Covered by `tests/customer-safety.test.mjs` and `tests/help-centers.test.mjs`.
- [ ] Apply final licensing/scopes to registered local `manifest.yml` while preserving the real Forge app ID.
- [ ] Run `npm install`, `npm test`, production dependency audit and `forge lint` against registered manifest.
- [ ] Deploy exact final RC commit and complete acceptance.
- [ ] Verify current Runs on Atlassian eligibility before making any badge claim.

## Documentation / Marketplace material
- [x] Marketplace listing draft.
- [x] Marketplace readiness checklist.
- [x] Security/privacy architecture.
- [x] Privacy policy draft.
- [x] Support policy draft.
- [x] Terms/DPA checklist.
- [x] Final acceptance plan.
- [x] V11/V12 product track.
- [x] Mobile Client Contract updated to V3.
- [ ] Reconcile Marketplace listing copy with final V12 feature freeze.
- [ ] Publish final customer-facing privacy, support, terms and documentation to permanent public HTTPS URLs.
- [ ] Produce final logo, Marketplace screenshots/highlights and mobile-responsive product imagery.
- [ ] Set pricing/billing model.
- [ ] Complete Marketplace Privacy & Security answers and vendor security contact.
- [ ] Complete outstanding Atlassian partner/vendor verification steps.

## Submission gate
Portal+ is **Marketplace-ready RC** only when the final feature scope is frozen, the latest automated gates are green, the registered Forge manifest passes lint/deployment preparation and the complete Nuvriqo acceptance test passes. A controlled real-world JSM pilot is the preferred final confidence check before submission.
