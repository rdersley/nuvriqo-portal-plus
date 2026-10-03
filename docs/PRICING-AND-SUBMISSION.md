# Nuvriqo Portal+ — Pricing & Marketplace Submission Pack

Status: **V1 launch proposal**

## Pricing principle

Portal+ is a paid Jira/JSM Marketplace app. Atlassian bills Jira Marketplace apps using the relevant Jira-site user tier (and, where more than one Jira product exists, the highest applicable Jira user count). Portal+ therefore needs strong progressive discounts so its price remains sensible on sites where the number of licensed Jira users is much larger than the JSM team actively administering Portal+.

## Proposed Cloud monthly price curve (USD)

Use these as the initial Marketplace pricing targets, subject to the exact pricing controls exposed by the Marketplace form:

| Progressive user band | Proposed monthly price per user |
| --- | ---: |
| 1–100 | $0.60 |
| 101–200 | $0.45 |
| 201–300 | $0.35 |
| 301–500 | $0.25 |
| 501–1,000 | $0.15 |
| 1,001–2,000 | $0.09 |
| 2,001–5,000 | $0.05 |
| 5,001–10,000 | $0.025 |
| 10,001+ | $0.0125 |

### Positioning

- Low enough for teams to trial/buy without a large procurement exercise.
- High enough to support partner-backed commercial support and continued development.
- Deliberately below the value proposition of full portal/site builders: Portal+ enhances the existing JSM portal rather than replacing it with a separate website layer.
- Competitive with request-list enhancement products while also offering dashboard counters, service categories and organization-targeted experiences.

Revisit pricing after the first 10–20 paying customers using actual conversion, site-size and support-cost data rather than increasing launch complexity with multiple editions.

## Suggested launch model

- Paid via Atlassian.
- Commercial Cloud app.
- Single Standard edition for V1.
- Use the normal Atlassian Marketplace trial period.
- Do not create a Free edition for V1; keep licensing/feature behavior simple and measurable at launch.

## Marketplace listing fields

### Name

Nuvriqo Portal+ for Jira Service Management

### Tagline

Turn your Jira Service Management portal into a clearer customer service dashboard.

### Category / solution themes

Use the closest current Marketplace categories/tags for:

- Jira Service Management
- Customer portal
- ITSM / service management
- Reporting / request management where available

### Keywords

Jira Service Management, JSM portal, customer portal, service desk, customer dashboard, request export, CSV export, portal customization, request categories, customer experience, request search

## Public URLs

### Documentation

https://nuvriqo.atlassian.net/wiki/spaces/NS/pages/5799937/Nuvriqo+Portal+for+Jira+Service+Management

### Support

https://nuvriqo.atlassian.net/wiki/spaces/NS/pages/5832705

### Security / Privacy overview

https://nuvriqo.atlassian.net/wiki/spaces/NS/pages/5832725

### Privacy policy

https://nuvriqo.atlassian.net/wiki/spaces/NS/pages/1540097

### Terms of Use

https://nuvriqo.atlassian.net/wiki/spaces/NS/pages/1605633

### Legal & Privacy index

https://nuvriqo.atlassian.net/wiki/spaces/NS/pages/1015809

### Contact

support@nuvriqo.com

## Privacy & Security questionnaire source answers

Use `docs/SECURITY-AND-PRIVACY.md` as the source of truth. Key facts for V1:

- Forge-hosted compute: Yes.
- Forge-hosted persistent configuration storage: Yes.
- Custom remote backend: No.
- External analytics/tracking: No.
- External application data egress: No by design in V1.
- Passwords/API tokens requested from customers: No.
- Customer requests read in customer context: Yes.
- Persistent customer request descriptions/comments/attachments stored by Portal+: No by design.
- Jira entity/configuration IDs stored: Yes, where required for Portal+ configuration.
- Paid Marketplace licensing: Yes.

## Permission justification

### read:servicedesk-request

Customer request reads and JSM service/request-type metadata required for Portal+.

### read:jira-work

Jira project/workflow status metadata used by configurable request-state mappings.

### manage:servicedesk-customer

JSM customer organization read/discovery operations used to configure Portal+ organization audiences. V1 does not normally add/remove customers through this permission.

### storage:app

Forge KVS storage for tenant/project Portal+ configuration.

## Media required at final acceptance

Capture from the exact accepted RC build:

1. Portal+ customer dashboard with populated counters.
2. Enhanced Requests view showing search/filter controls and additional customer-visible field columns.
3. Quick Actions / service categories.
4. Portal+ administration discovery screen.
5. Service category configuration and status mapping.
6. Optional mobile/narrow-width customer view.

Do not create final Marketplace screenshots from an earlier build; use the accepted RC so the listing exactly matches the released UI.

## Submission sequence

1. Complete final RC acceptance test.
2. Fix only acceptance defects and re-run affected scenarios plus automated checks.
3. Commit/identify exact accepted SHA.
4. Deploy exact SHA to production.
5. Confirm production licensing/distribution settings in Atlassian Developer Console.
6. Verify Marketplace trust/privacy/security fields and security contact.
7. Capture final screenshots from the accepted UI.
8. Enter listing copy, public URLs and pricing.
9. Submit the Marketplace version.
10. Tag the accepted source release as `v1.0.0` after production/submission details are confirmed.
