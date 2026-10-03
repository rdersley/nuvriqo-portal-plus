# Nuvriqo Portal+ — Security & Privacy Notes

Technical source for the Marketplace Privacy & Security questionnaire and customer trust documentation. It describes the 1.0.0 code; legal statements should be reviewed by the vendor before publication.

## Hosting and architecture

Portal+ is a Forge app on Atlassian-hosted compute and Forge hosted storage (KVS). It has no Nuvriqo backend, external database, analytics service or third-party integration, and declares no external hosts. Forge reports the production build as eligible for the Runs on Atlassian programme; confirm eligibility in the developer console at submission.

## Data egress

None. Jira and JSM data is read and written only through Forge product APIs. Brand logos are uploaded by admins and stored in Forge KVS, so nothing is loaded from external URLs.

## How customer visibility is enforced

Portal+ calls Jira with **app** permissions (`api.asApp()`), because Forge `asUser()` calls force every portal customer through an "Allow access" consent screen. Visibility is therefore enforced by Portal+ on the server, on every call:

- The customer's identity comes from the Forge runtime (`context.accountId`), never from the browser.
- Every request query is restricted to the current project and to requests the customer **reported** or that are **shared with an organisation they belong to** (JQL built in `src/customer-visibility.js`, user values escaped).
- An experience may add a **narrowing** filter on a dropdown custom field (`cf[id] in (...)`, ANDed on). It never widens visibility.
- Request detail, field edits and customer actions re-run that query for the exact request before acting; requests outside the boundary are refused.
- On a JSM help center, the help center in the page address chooses branding only; the customer must still belong to that experience's organisations or Portal+ shows nothing.
- Behaviour tests (`tests/customer-safety.test.mjs`, `tests/help-centers.test.mjs`) run the real resolvers against an in-memory Jira and fail on any cross-customer exposure or injected query.

## What Portal+ writes to Jira

Only when an admin enables it for an experience:

- **Field edits after submission**, limited to fields the admin marked editable, which must already be customer-visible on the portal and of a supported type (text, number, date, date-time, dropdown). Values are validated per type before writing.
- **Close / Escalate**, which run only a workflow transition into a status the admin selected, and only when Jira offers it without extra screen fields.
- **An internal (agent-only) comment** naming the customer after each edit or action, because Jira attributes app changes to the app. Admins can switch this off.

## Stored data (Forge KVS)

| Key | Contents |
| --- | --- |
| `portalplus:config:<project>` / `portalplus:draft:<project>` | Experiences: headings, branding text and colours, audience organisation IDs, help center URL endings, request scope field ID and values, status mappings, service categories and request types, announcements, links, document titles and links, self-service settings |
| `portalplus:logo:<project>:<experience>` | Uploaded logo image (PNG, JPG, WebP or SVG, max 150 KB) |
| `portalplus:projects` | Published project IDs and timestamps |
| `portalplus:portal:<id>`, `portalplus:helpcenter:<slug>` | Cached service desk / help center → project ID |
| `portalplus:sla-fields` | Cached SLA custom field IDs |

Portal+ does not store request content, comments, attachments, customer names, email addresses, account IDs, passwords or tokens. Because no user personal data is stored, Forge personal-data reporting does not apply to the current model; re-review if that changes.

## Credentials and secrets

No passwords or personal API tokens are requested or stored. The only configuration secret-like value is the optional production environment variable `PORTALPLUS_EVALUATION_CLOUD_IDS`: site cloud IDs allowed to run without a Marketplace licence object (vendor evaluation installs). A present Marketplace licence always decides; see `src/licensing.js`.

## OAuth scope justification

| Scope | Used for |
| --- | --- |
| `read:servicedesk-request` | Service desk, request type, request-type field and organisation discovery; SLA and customer status history for request detail |
| `read:jira-work` | Customer request search, project statuses, field list (SLA and dropdown fields), edit metadata, available transitions |
| `write:jira-work` | Admin-enabled customer field edits, Close/Escalate transitions and the internal audit comment |
| `manage:servicedesk-customer` | Reading which JSM organisations the current customer belongs to, and listing organisations for admin configuration. Portal+ never adds, removes or changes customers or organisations |
| `storage:app` | Forge KVS storage listed above |

## Data retention and deletion

Configuration and logos live in Forge KVS for the installation and follow Forge's uninstall retention behaviour; cite Atlassian's current platform documentation in customer-facing material.

## Security operations checklist

- Keep the Node.js runtime on a Forge-supported version (`nodejs22.x`).
- Run `npm audit` before each release; fix high/critical issues first.
- Keep a Marketplace security contact with access to Atlassian security tickets, and follow the Security Bug Fix Policy timelines.
- Run `npm test` (build, release checks, style check, behaviour tests) and `forge lint` on the release commit.
