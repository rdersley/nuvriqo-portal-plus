# Nuvriqo Smart Approval Manager for JSM

A Forge app that makes customer approvals simple for Jira Service Management agents and portal customers.

## V1 user experience

### Agent
1. Open a JSM ticket.
2. Open **Smart Approval**.
3. Search for an approver by name/email.
4. Add an optional decision message.
5. Click **Request approval**.
6. Track pending/approved/declined/cancelled status and send reminders from the same panel.

### Customer approver
1. Sign in to the JSM customer portal.
2. See **My approvals** in the portal summary.
3. Open **My Approvals** from the portal user menu.
4. Review every request currently awaiting their decision.
5. Approve or decline. Declines can require a reason.
6. See previous decisions in approval history.

## V1 capabilities

- Agent-side approval request panel on Jira issues
- Customer-focused approval inbox in the JSM portal
- Approver search
- Optional message to approver
- Approve / decline decisions
- Configurable required decline reason
- Approval history and audit events
- Manual reminders
- Configurable automatic reminder interval
- Automatic request-participant addition so approvers can access the request
- Optional Jira workflow transition on approval
- Optional Jira workflow transition on decline
- Per-project settings
- Forge-hosted storage using `@forge/kvs`
- No external backend or external data store

## Architecture

The app intentionally uses its own approval records rather than Atlassian's native JSM approval REST endpoints, because those endpoints are not available to Forge apps. Jira/JSM remains the system of record for the request itself, while Smart Approval Manager owns the approval assignment, decision and audit data.

Approval data is stored three ways for efficient access:
- `approval#<id>` canonical record
- `issue#<issueKey>#<createdAt>#<id>` agent issue index
- `approver#<accountId>#<createdAt>#<id>` portal approver index

All three values contain the same approval record and are updated together.

## First-time registration

A brand-new Marketplace app must have its own Forge app ID. From this folder:

```bash
npm install
forge register
```

Choose the app name **Nuvriqo Smart Approval Manager**. Replace the placeholder `app.id` in `manifest.yml` with the generated app ARI if the CLI does not update it automatically.

Then:

```bash
forge lint
forge deploy -e development
forge install -e development
```

Install it first on the Nuvriqo test site, not a production customer site.

## Recommended first test

Use the TEST service project:
1. Open a TEST ticket as an agent.
2. Request approval from a portal customer.
3. Confirm the customer is added as a request participant.
4. Log in as that customer.
5. Confirm the ticket appears under My Approvals.
6. Approve it.
7. Confirm the agent panel shows Approved and the public Jira comment is present.
8. Repeat with Decline and a required reason.
9. Configure transition IDs and repeat to confirm workflow movement.

## Marketplace readiness

See `docs/MARKETPLACE.md` and `docs/SECURITY-PRIVACY.md` before submission.
