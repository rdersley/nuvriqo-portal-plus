# Security and Privacy Notes

## Hosting and data flow
Smart Approval Manager is designed as a Forge-hosted app. Approval data is stored in Atlassian Forge Key-Value Store for the specific app installation. V1 does not require an external application server, external database, analytics service or advertising tracker.

## Approval data stored
For each approval the app stores:
- approval ID
- Jira issue key/id and project identifiers
- issue summary and status captured when approval is requested
- approver Atlassian account ID and display name
- requesting user's Atlassian account ID
- optional approval message
- decision status and optional decision reason
- timestamps
- reminder count/timing
- audit events
- optional workflow transition outcome/error

## Access controls
- Agent functions are exposed through Jira agent/project modules.
- Portal decisions validate the current Forge invocation `accountId` against the approval's assigned approver account ID before accepting a decision.
- Portal list queries are keyed by the current approver account ID.
- Approval decisions are rejected after the approval is no longer pending.
- Jira/JSM API calls are made through Forge authentication and are limited by declared scopes and Jira permissions.
- When enabled, the approver is added as a JSM request participant so normal portal request access can be granted.

## Data minimisation
The app stores only the ticket summary rather than a full copy of the Jira request. Full ticket content, attachments and comments are not copied into app storage.

## Retention
V1 keeps approval records for audit/history until the app installation data is removed. A configurable retention/purge policy is a candidate enhancement before or after Marketplace launch depending on Atlassian review requirements and customer feedback.

## External transfers
V1 is designed with no external data transfer. If a future version adds third-party email/SMS or analytics, the privacy documentation and Forge egress permissions must be updated before release.

## Marketplace publication actions
Before listing, publish customer-facing Privacy Policy, Security, Support and Terms pages on the Nuvriqo website and replace any listing placeholders with those public URLs.

## Security test cases
- Customer A cannot list Customer B approvals.
- Customer A cannot decide Customer B approval by changing an approval ID.
- A decided approval cannot be decided again.
- A cancelled approval cannot be decided.
- Invalid transition IDs do not undo a recorded customer decision; the transition failure is recorded for the agent/admin to diagnose.
- App remains usable when request participant addition is disallowed; the failure is logged and stored without silently changing the decision owner.
