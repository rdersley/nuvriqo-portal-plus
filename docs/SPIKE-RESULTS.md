# Portal+ Technical Spike Results

Status: **CONDITIONAL GO**

Date: 20 August 2026

## Executive result

Current Atlassian Forge/JSM capabilities support the core Portal+ V1 architecture. The remaining live-site validation cannot be completed from the current ChatGPT Atlassian connection because that connection exposes Confluence scopes only and no Jira/JSM read scopes. That is an environment limitation, not a known Forge limitation.

Recommendation: proceed with the Forge project skeleton and the minimum portal prototype. Do not begin broad V1 feature implementation until the prototype is deployed to a real JSM Cloud site and the customer-account checks below pass.

## Confirmed platform capabilities

### Portal modules

Forge supports JSM customer-facing modules including:

- `jiraServiceManagement:portalHeader`
- `jiraServiceManagement:portalSubheader`
- `jiraServiceManagement:portalFooter`
- `jiraServiceManagement:portalRequestDetail`
- `jiraServiceManagement:portalRequestDetailPanel`
- `jiraServiceManagement:portalRequestViewAction`
- `jiraServiceManagement:portalUserMenuAction`
- `jiraServiceManagement:portalRequestCreatePropertyPanel`

Header/subheader/footer can be restricted to portal pages such as help center, portal, create request, view request, approvals, profile and my requests.

Full-page Jira modules do not support portal customer/unlicensed access, so V1 must remain an embedded/hybrid experience rather than a completely separate Forge full-page replacement.

### Portal-only customer access

As of June 2026 Forge supports online `asUser()` calls for JSM portal-only customer accounts. As of July 2026 Forge also supports offline impersonation for those customers. Calls preserve the customer's Jira/JSM permission checks.

This supports the core security model: customer request data should be retrieved in customer context rather than through a privileged app context.

### Customer requests

The JSM REST API `GET /rest/servicedeskapi/request` returns requests visible to the executing customer. For customers, results are limited to requests they created, that were created on their behalf, or in which they participate.

The endpoint supports useful inputs including:

- search term
- request ownership
- request status
- approval status
- organization ID
- service desk ID
- request type ID
- pagination

This is sufficient as the baseline for enhanced My Requests and dashboard aggregation.

### Approvals

The JSM request approval endpoints require permission to view the request, making approvals a viable candidate for Portal+ once tested with a real portal-only account.

Recommendation: keep Approvals as SHOULD until the live prototype confirms the UX and response shape.

### SLA

The official JSM SLA request endpoints require the caller to be an agent for the service desk and to have Browse Projects permission.

Therefore a portal-only customer cannot safely retrieve SLA records through normal customer-context access.

Decision: SLA countdown / SLA-risk remains outside the guaranteed V1 baseline. Do not use privileged app-context access merely to expose SLA data to customers without a separate security design and explicit validation.

### Storage and Marketplace architecture

Forge hosted storage provides tenant-specific persistent storage and data-residency support. For the first implementation, Portal+ configuration should use Forge KVS unless query requirements demonstrate a clear need for Custom Entity Store.

Keeping compute and storage Atlassian-hosted also preserves a path toward Runs on Atlassian eligibility.

## Proposed V1 module set

### Customer experience

Primary prototype:

- `jiraServiceManagement:portalSubheader` on `portal` and `help_center` for the dashboard/service layer.
- `jiraServiceManagement:portalSubheader` on `my_requests` for enhanced request tools where useful.
- `jiraServiceManagement:portalRequestDetailPanel` for request-level Portal+ information when needed.

The exact balance between header and subheader will be chosen after live visual testing; subheader is the initial default because it supports page restrictions and a sizeable configurable viewport.

### Administration

Use a licensed-admin Jira project settings page for Portal+ configuration. Customer modules must never expose admin configuration controls.

## Initial scope requirements

Likely baseline scopes:

- `read:servicedesk-request`
- `read:jira-work`
- `storage:app`

Additional scopes should be added only when a confirmed feature requires them.

Do not add write scopes for the initial read-only prototype.

## Dashboard-state model

Do not hard-code customer-specific status names.

Prototype strategy:

- Open Requests: requests not in a closed status state returned by the customer request API.
- Recent Requests: order by latest activity / API ordering.
- Awaiting My Response and Awaiting Support: require an admin-configurable status mapping in V1 unless a reliable cross-project semantic signal is confirmed during live testing.

The configuration UI should discover available customer-facing statuses and let the admin map statuses into Portal+ semantic buckets.

## Discovery strategy

Admin-context discovery should supply human-readable choices for:

- JSM projects/service desks
- request types
- request groups where supported/useful
- organizations
- relevant customer-visible fields
- statuses/status mappings

No numeric Jira/JSM IDs should be entered manually in normal setup.

## Live validation still required

The current Atlassian connector available to this ChatGPT session has access to `https://nuvriqo.atlassian.net` but only with Confluence scopes. It cannot query Jira/JSM, so the following must be proven after deployment from the local Forge environment:

1. Portal subheader renders for a portal-only customer.
2. `asUser()` successfully retrieves only that customer's visible requests.
3. A second customer cannot see the first customer's inaccessible requests.
4. Portal/service desk context IDs are available as expected.
5. Organization membership discovery works in the customer context needed by Portal+.
6. Custom-field values required for My Requests are available and remain customer-safe.
7. CSV download interaction works acceptably from the selected portal module.
8. Admin status discovery/mapping provides reliable Awaiting Customer / Awaiting Support counters.
9. Approvals can be surfaced cleanly for portal-only customers.

## GO / NO-GO

**GO for repository/app scaffolding and a minimum read-only portal prototype.**

**NO-GO for broad V1 implementation until the live customer-account prototype passes the nine checks above.**

This preserves the locked V1 scope while avoiding development against assumptions that can only be proven inside an installed JSM portal.
