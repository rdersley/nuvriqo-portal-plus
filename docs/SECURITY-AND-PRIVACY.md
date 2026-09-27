# Nuvriqo Portal+ — Security & Privacy Notes

This document is the technical source for the Marketplace Privacy & Security questionnaire and customer-facing trust documentation. Legal statements should be reviewed by the vendor before publication.

## Hosting and architecture

Portal+ V1 is a Forge application using Atlassian-hosted compute and Forge hosted storage. It does not use a custom remote backend, external database, third-party analytics service or customer-configured external API integration.

## Data egress

Portal+ V1 is designed with **no external data egress**. Jira/JSM data is read through Forge product APIs and Portal+ configuration is stored in Forge KVS.

## Customer authorization

### What runs as the app

Every Jira and JSM call Portal+ makes uses `api.asApp()`, for customers and admins alike. Portal+ does not use `api.asUser()` anywhere: on the customer portal it would make Forge show each customer an "Allow access" consent prompt. `scripts/release-check.mjs` fails the build if `api.asUser().requestJira` appears in the portal resolver.

Because the app can see more than any one customer, Jira permissions do not limit what the app reads. Portal+ enforces the customer boundary itself, as described below.

App-context calls:

| Where | Calls | Purpose |
| --- | --- | --- |
| Customer portal (`src/portal-resolver.js`) | `POST /rest/api/3/search/jql` | The customer's requests, always with the boundary JQL below |
| | `GET /rest/servicedeskapi/organization?accountId=` | The signed-in customer's JSM organizations |
| | `GET /rest/servicedeskapi/servicedesk/{id}` | Maps the portal to its Jira project (cached) |
| | `GET /rest/api/3/field` | Finds SLA fields (cached for 24 hours) |
| | `GET /rest/api/3/project/{id}/properties/…` | Companion-app (Asset Manager) portal snapshot |
| Request detail and actions (`src/request-detail-service.js`) | SLA, status history, edit metadata and transitions for one issue; `PUT /rest/api/3/issue/{key}`; `POST …/transitions`; `POST …/comment` | Only after the issue has passed the boundary check |
| Admin settings page (`src/admin-resolver.js`) | Service desk, request types, request type fields, organizations, project statuses, `/rest/api/3/field` | Populates admin choices and validates configuration before it is stored |

The admin page is a `jira:projectSettingsPage` module, so Jira only shows it to people who can administer the project.

### How the customer boundary is enforced

1. **Identity comes from Forge, not the browser.** The customer's account ID is `context.accountId`, which the Forge runtime sets from the signed-in principal. Payloads from the page cannot change it. Calls without an account ID are refused.
2. **One JQL builder.** All customer searches go through `customerJql()` in `src/customer-visibility.js`:
   `project = <project> AND (reporter = "<accountId>" OR organizations in ("<customer's organizations>")) [AND cf[<scope field>] in (…)] [AND key = "<key>"] ORDER BY created DESC`.
   A customer sees requests they reported plus requests shared with a JSM organization they belong to. Organization membership is looked up for that account ID, not taken from the page. Every value is escaped, and issue keys are checked against a strict key pattern before they are used.
3. **Portal+ settings can only narrow the boundary.** Experiences, help center routing and the optional dropdown "request scope" add conditions. They never remove the reporter or organization condition.
4. **Detail, edits and actions re-check the boundary.** `getRequestDetail`, `updateRequestFields` and `performRequestAction` first search for exactly that issue key with the customer's boundary JQL. If the search returns nothing, the call is refused before any issue-level read or write. Edits are limited to fields the admin marked editable and Jira's edit metadata allows. Actions only use the transition into the status the admin picked.
5. **Exports and reports use the same boundary**, capped at 1,000 requests.
6. **Licence gate.** On an unlicensed production site, every data resolver returns an "unavailable" response before any Jira call or storage write (`requireLicence` in `src/licensing.js`).

Portal+ is narrower than native JSM in one respect: requests where the customer is only a request participant are not shown.

### Tests that prove it

Each of these runs as part of `npm test`:

- `tests/customer-safety.test.mjs` runs the real portal resolver against an in-memory Jira (`tests/helpers/fake-jira.mjs`). The fake Jira applies JSM visibility rules to the JQL and rejects any JQL outside the expected grammar, so an injected clause fails the test. It covers own and organization requests, customers with no organizations, detail refused outside the boundary, injected keys, escaped organization names, and refused cross-customer edits and actions. It also checks that exports and reports stay inside the boundary.
- `tests/help-centers.test.mjs` covers help center separation (a customer on another client's help center sees nothing), scope narrowing on detail and export, escaped scope values, and unknown service desks.
- `tests/request-detail-security.test.mjs` covers key normalization, editable-field filtering and transition choice.
- `tests/licence-enforcement.test.mjs` checks that every data resolver makes no Jira calls or storage writes without a licence, and that only `health` is registered without the guard.
- `scripts/release-check.mjs` blocks `api.asUser().requestJira` in the portal resolver.

## Stored data

Portal+ stores tenant/project configuration such as:

- dashboard display settings;
- selected workflow status IDs for dashboard state mapping;
- selected organization IDs for Portal+ audience configuration;
- Portal+ category names/descriptions;
- request type IDs/names mapped to Portal+ categories;
- configuration version and last-updated timestamp.

Portal+ V1 does not intentionally persist request descriptions, comments, attachments, customer email addresses, passwords, API tokens or Jira credentials in Forge KVS.

## Credentials and secrets

Portal+ does not request or store Atlassian passwords or personal API tokens. The app uses Forge authentication and declared OAuth scopes.

## OAuth scope justification

### `read:servicedesk-request`

Required for the JSM service desk, request type, request type field, request SLA and request status-history endpoints (`/rest/servicedeskapi/servicedesk…`, `/rest/servicedeskapi/request/{key}/sla`, `/rest/servicedeskapi/request/{key}/status`).

### `read:jira-work`

Required for the customer request search (`/rest/api/3/search/jql`), issue transitions and edit metadata, project statuses, the field list and project properties.

### `write:jira-work`

Required for the customer self-service actions, and only after the request has passed the boundary check. All three are in `src/request-detail-service.js`:

- `PUT /rest/api/3/issue/{key}`: saves fields the admin marked editable after submission (`updateVisibleRequestFields`).
- `POST /rest/api/3/issue/{key}/transitions`: Close request and Escalate, only into the status the admin chose (`performVisibleRequestAction`).
- `POST /rest/api/3/issue/{key}/comment`: the internal audit note naming the customer who made the change (`writeAuditComment`; admins can switch it off).

If the admin enables no editable fields and no customer actions, Portal+ never writes to Jira.

### `manage:servicedesk-customer`

Required by the two JSM organization endpoints Portal+ reads. Atlassian lists this as their classic scope.

- `GET /rest/servicedeskapi/servicedesk/{id}/organization`: admin discovery of organizations for audience routing.
- `GET /rest/servicedeskapi/organization?accountId=`: the signed-in customer's organizations, used for routing and for the organization part of the boundary JQL.

Portal+ only reads with it. It never adds, removes or changes customers or organizations. The only narrower option is the granular `read:organization:jira-service-management` scope. Moving to it would change scopes, which forces a major version, so that is a separate decision.

### `storage:app`

Required for Forge KVS storage of tenant/project Portal+ configuration.

## External hosts

None in V1.

## Data retention and deletion

Portal+ configuration exists only while stored in Forge KVS for the installation. Marketplace/customer documentation should describe the applicable Forge uninstall/storage retention behavior using Atlassian's current platform documentation at publication time.

Because V1 does not intentionally store user profile personal data in KVS, a Forge user-personal-data reporting/erasure implementation is not expected to be required for the configuration model. This must be re-reviewed if later versions begin persisting account IDs, email addresses, names or other user personal data.

## Security operations checklist

- Keep Node.js runtime on a Forge-supported non-EOL version.
- Run dependency vulnerability checks before each release.
- Address high/critical dependency vulnerabilities before release.
- Maintain a Marketplace security contact with access to Atlassian Marketplace Security tickets.
- Follow Atlassian Marketplace Security Bug Fix Policy timelines.
- Report security incidents to Atlassian through the required ecosystem support channel.

## Runs on Atlassian

The V1 architecture intentionally uses Atlassian-hosted Forge compute/storage and no external egress. Verify badge eligibility with the current Forge/Marketplace tooling before submission rather than claiming the badge manually.
