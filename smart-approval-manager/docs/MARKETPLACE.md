# Smart Approval Manager — Marketplace Release Pack

## Product name
Nuvriqo Smart Approval Manager for Jira Service Management

## One-line summary
Make customer approvals simple with agent-controlled requests, a dedicated portal approval inbox and smart rule-based approver preparation.

## Short description
Smart Approval Manager gives JSM teams a simple approval experience from both sides of the service desk. Rules prepare the right approvers and settings when ticket conditions — and optionally an approval-stage status — are met. The agent reviews the prepared request and remains in control of when it is sent. Customers see every decision waiting for them in My Approvals.

## Marketplace description
Approvals should be easy for the agent requesting them and effortless for the customer making the decision.

Nuvriqo Smart Approval Manager adds a focused approval experience to Jira Service Management. Agents can request approval directly from the issue, select one or more approvers, add a message, send reminders and track the result without leaving the ticket.

For repeatable workflows, project administrators create **approval preparation rules**. Rules can match Jira fields such as request type, priority, client or custom fields, assign one or more approvers, choose whether all approvers or any one approver is sufficient, and optionally wait until the ticket reaches a selected approval-stage status.

Crucially, a matching rule does not automatically send an approval. It prepares the approval for the agent. The agent reviews the pre-populated approvers and deliberately clicks **Request approval**. Only then is the customer asked to decide and the optional approval-requested workflow action performed.

Customer approvers get a dedicated **My Approvals** area in the JSM portal. They can see requests waiting for them, review the message, approve or decline, add a decision comment and view approval history.

## Key features
- Request approval directly from the Jira issue view
- Smart approval preparation rules — without removing agent control
- Optional status-triggered preparation for approval-stage workflows
- Jira/custom-field condition builder with guided value selectors
- Automatic approver pre-population
- One or multiple approvers
- **All approvers must approve** or **Any one approver can approve**
- Customer portal **My Approvals** inbox
- Approve and Decline actions with decision comments
- Configurable required decline reasons
- Manual and automatic reminders
- Cancel pending approvals
- Group approval progress and audit history
- Friendly Jira status selectors for requested / approved / declined workflow actions
- Rule-specific workflow overrides
- Automatic request-participant addition when an approval is sent
- Per-project configuration
- Forge-hosted compute and storage; no external app server required

## Customer experience
Customers do not need a Jira Service Management agent licence. Smart Approval Manager exposes assigned pending decisions in the customer portal and validates each decision against the assigned Atlassian account before accepting it.

## Suggested keywords
Jira Service Management, JSM approvals, customer approvals, customer portal, workflow approval, approval reminders, approver, multi approver, request approval, approval automation

## Launch positioning
**Simple, agent-controlled customer approvals for Jira Service Management.**

Lead with ease of use, portal visibility and smart preparation rather than heavyweight BPM. Strong use cases include customer/client sign-off, hardware replacement approval, access approval, purchasing approval and service workflows where approvers should not need to understand Jira.

## Screenshot / highlight plan
1. Agent panel — prepared approval with pre-populated approver
2. Agent — Request approval and pending group progress
3. Customer portal — My Approvals inbox and decision actions
4. Project settings — friendly workflow status selectors
5. Approval preparation rule — Jira conditions + approvers
6. Status-triggered preparation setting
7. Completed approval — Jira audit/history

## Release gate
- [x] Forge app registered with dedicated app ID
- [x] Installed on Nuvriqo Jira TEST site
- [x] Agent request -> customer portal -> approve journey proven
- [x] Consent-free customer portal flow proven
- [x] Rule-assisted preparation proven
- [x] Matching rules do not automatically send approvals
- [x] Status-triggered preparation proven
- [x] Friendly workflow/status selectors proven
- [x] Remote Forge QA passed on status-trigger release candidate
- [ ] Final regression: decline + required reason
- [ ] Final regression: manual + automatic reminders
- [ ] Final regression: cancellation
- [ ] Final regression: request participant addition
- [ ] Final regression: multiple approvers ALL
- [ ] Final regression: multiple approvers ANY
- [ ] Final regression: requested / approved / declined workflow actions
- [ ] Final regression: customer isolation and repeat-action protection
- [ ] Final `npm test` and `forge lint`
- [ ] Deploy final release to production Forge environment
- [ ] Capture Marketplace screenshots/highlights
- [x] Dedicated GitHub repository created
- [ ] Migrate frozen v1 source to dedicated repository
- [ ] Tag `v1.0.0`
- [ ] Complete Atlassian security/privacy questionnaire
- [ ] Create Marketplace listing and upload assets

## Security and data handling
- Built on Atlassian Forge.
- Approval records and project configuration are stored in Forge-hosted storage.
- Portal decisions are authorised against the assigned Atlassian account ID.
- Jira-side comments and workflow transitions occur only after authorised actions.
- Project configuration is restricted to Jira project administrators.
- No external application server or external approval database is required for V1.

## V1 boundaries
- Smart Approval Manager maintains its own approval records rather than using Atlassian native JSM approval endpoints.
- Approver search depends on Jira user-search visibility for the acting agent/admin.
- Automatic reminders run hourly, so timing is approximate.
- Jira events can be asynchronous, so rule preparation may not appear instantly after a ticket update.
- Forge does not forcibly pop open the issue panel when a status changes; status-gated rules prepare the approval so it is ready when the agent opens Smart Approval.
- Sequential multi-stage chains, out-of-office delegation and advanced analytics remain candidates for later releases.
