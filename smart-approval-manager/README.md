# Nuvriqo Smart Approval Manager for JSM

A Forge app that makes customer approvals simple for Jira Service Management agents, project admins and portal customers.

## What it does

### Agent
1. Open a JSM ticket and open **Smart Approval**.
2. Search and select one or more approvers.
3. Choose whether **all approvers** or **any one approver** is enough.
4. Add an optional decision message.
5. Request approval.
6. Track waiting/approved/declined progress, send reminders or cancel pending approvals from the same panel.

### Customer approver
1. Sign in to the JSM customer portal.
2. See the **My approvals** summary.
3. Open **My Approvals** from the portal user menu.
4. Review every request currently awaiting a decision.
5. Approve or decline and optionally add a decision comment.
6. See previous decisions in approval history.

### Project administrator
1. Open **Smart Approval Manager** in project settings.
2. Configure default reminder and decline behaviour.
3. Optionally map Approval Required / Approved / Declined to Jira workflow transition IDs.
4. Create automatic approval rules using the guided rule builder.
5. Match request type, priority, client or custom fields.
6. Assign one or more approvers and choose **all** or **any** approval logic per rule.

## V1 capabilities

- Agent-side approval request panel
- Customer portal My Approvals inbox
- Consent-free customer approval experience
- One or multiple approvers
- All-approvers or any-one approval requirements
- Decision comments and configurable required decline reason
- Group approval progress and audit events
- Manual reminders
- Hourly automatic reminder processing
- Cancel pending approvals
- Automatic request-participant addition
- Visual automatic approval rule builder
- Rules based on Jira/custom-field values
- Automatic approval creation on issue-created / issue-updated events
- Optional Jira transition when approval is requested
- Optional Jira transition after approval
- Optional Jira transition after decline
- Per-rule workflow transition overrides
- Per-project configuration
- Forge-hosted storage using `@forge/kvs`
- No external backend or external data store

## Architecture

Smart Approval Manager maintains its own approval records while Jira/JSM remains the system of record for the request. The app uses separate agent/config resolvers and a customer portal resolver. Customer decisions are authorised against the assigned Atlassian account ID before any Jira-side comment or transition is performed.

Approval records are indexed for efficient access by approval ID, Jira issue and approver account.

## Development validation

```bash
npm install
npm test
forge lint
forge deploy -e development
```

Install and test on a non-production Jira Service Management site before production deployment.

## Release validation

The release candidate should cover:

- manual single-approver approve and decline
- manual multiple approvers using **all** mode
- manual multiple approvers using **any** mode
- required decline reason
- reminder and cancellation behaviour
- automatic rule matching and non-matching cases
- duplicate-event protection
- request-participant access
- Approval Required / Approved / Declined transition mappings
- customer isolation between approvers
- repeat-action protection after a decision
- customer portal access without an Atlassian consent prompt for Smart Approval Manager

See `docs/TEST-PLAN.md`, `docs/MARKETPLACE.md` and `docs/SECURITY-PRIVACY.md` for the complete release pack.
