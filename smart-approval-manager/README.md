# Nuvriqo Smart Approval Manager for JSM

A Forge app that makes customer approvals simple for Jira Service Management agents, project admins and portal customers.

## V1 workflow

1. Project admins create **approval preparation rules** using Jira/custom-field conditions.
2. A rule can prepare immediately when its conditions match, or wait until the ticket reaches a selected approval-stage status.
3. Matching rules pre-populate the approver(s), ALL/ANY requirement, message, reminder interval and workflow actions.
4. The agent reviews the prepared approval and deliberately clicks **Request approval**.
5. Only then are approval records created, participants added, the customer notified and the optional approval-requested workflow action run.
6. Customers review pending decisions from **My Approvals** in the JSM portal.
7. Approval or decline is recorded with audit history and can move the Jira ticket to the configured target status.

Rules never send an approval automatically. The agent remains the human gate.

## V1 capabilities

- Agent-side approval request panel
- Customer portal My Approvals inbox
- Consent-free customer approval experience
- One or multiple approvers
- ALL-approvers or ANY-one approval requirements
- Decision comments and configurable required decline reason
- Group approval progress and audit events
- Manual and hourly automatic reminders
- Cancel pending approvals
- Automatic request-participant addition when approval is sent
- Visual approval preparation rule builder
- Rules based on Jira/custom-field values
- Optional status-gated approval preparation
- Friendly Jira status selectors for workflow actions
- Optional Jira transition when approval is requested, approved or declined
- Per-rule workflow overrides
- Per-project configuration
- Forge-hosted storage using `@forge/kvs`
- No external backend or external data store

## Architecture

Smart Approval Manager maintains its own approval records while Jira/JSM remains the system of record for the request. Jira issue-created/updated events evaluate preparation rules and store a prepared suggestion only. The approval is not created until an agent explicitly sends it.

Customer decisions are authorised against the assigned Atlassian account ID before any Jira-side comment or transition is performed. Approval records are indexed for efficient access by approval ID, Jira issue and approver account.

## Development validation

```bash
npm install
npm test
forge lint
forge deploy -e development
```

Install and test on a non-production Jira Service Management site before production deployment.

## Release status

V1 is feature-frozen. The core manual approval, portal decision, rule-assisted preparation and status-triggered preparation journeys have been proven on the Nuvriqo TEST site. Remaining work is release regression, production deployment and Marketplace submission assets/questionnaires.

See `docs/TEST-PLAN.md`, `docs/MARKETPLACE.md` and `docs/SECURITY-PRIVACY.md` for the release pack.
