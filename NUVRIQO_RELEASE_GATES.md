# Nuvriqo Release Gates

This repository follows the standard Nuvriqo app-factory release process.

## Gates

1. **Build** — repository validation, available tests, Custom UI builds and Forge lint pass.
2. **Functional** — portal configuration, rendering and customer-facing flows verified on the Nuvriqo test site.
3. **QA** — automated smoke/regression tests pass with no release-blocking defects.
4. **Security** — minimum scopes, permission/admin guards, secret hygiene and tenant isolation verified.
5. **Documentation** — setup, admin/user docs, support, privacy/security and release notes complete.
6. **Marketplace** — listing answers, copy, pricing, logos, screenshots/highlights and upload assets complete.
7. **Commercial** — positioning, onboarding, product page/cross-sell plan and launch measurement ready.

A production/Marketplace candidate requires every applicable gate to be GREEN.

## Pipeline

Code change -> repository validation -> tests/builds when present -> Forge lint -> optional development deploy -> installation upgrade -> TEST-project smoke QA -> release gate review -> production candidate.

The existing Remote Forge QA workflow already implements the flexible app-factory validation/deploy foundation and detects Forge/Custom UI components dynamically. Marketplace-submitted releases stay frozen while under Atlassian review.
