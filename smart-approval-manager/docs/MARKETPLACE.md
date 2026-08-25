# Marketplace Readiness Pack

## Product name
Nuvriqo Smart Approval Manager for Jira Service Management

## One-line summary
Make customer approvals simple with an agent-side request panel, a dedicated portal approval inbox, automatic approver rules and flexible Jira workflow actions.

## Short description
Smart Approval Manager gives JSM teams a simple approval experience from both sides of the service desk. Agents can request approval directly from a Jira ticket, customers see every decision waiting for them in My Approvals, and administrators can automate approver selection and workflow transitions with project-level rules.

## Marketplace description
Approvals should be easy for the person requesting them and effortless for the person making the decision.

Nuvriqo Smart Approval Manager adds a focused approval experience to Jira Service Management. Agents can request approval directly from the issue, select one or more approvers, add a message, send reminders and track the result without leaving the ticket.

Customer approvers get a dedicated My Approvals area in the JSM portal. They can immediately see requests waiting for them, review the approval message, approve or decline, add a decision comment and view their approval history.

For repeatable workflows, project administrators can create automatic approval rules. Rules can match Jira fields such as request type, priority, client or custom fields, assign one or more approvers, choose whether all approvers or any one approver is sufficient, and optionally move the Jira ticket when approval is requested, approved or declined.

### Key features
- Request approval directly from the Jira issue view
- Select one or multiple approvers
- Choose **All approvers must approve** or **Any one approver can approve**
- Customer portal **My Approvals** inbox
- Clear Approve and Decline actions
- Optional decision comments and configurable required decline reasons
- Automatic approver rules based on Jira/custom field conditions
- Visual rule builder in project settings
- Automatic or manual reminders
- Cancel pending approvals
- Pending / approved / declined / cancelled / no-longer-required states
- Group approval progress and audit history
- Optional Jira transition when approval is requested
- Optional Jira transition after approval
- Optional Jira transition after decline
- Rule-specific workflow overrides
- Automatic request-participant addition
- Per-project configuration
- Forge-hosted compute and storage; no external app server required

## Customer experience
Customers do not need a Jira Service Management agent licence. Smart Approval Manager exposes pending decisions in the customer portal and validates every decision against the assigned Atlassian account before accepting it.

## Suggested categories / keywords
Jira Service Management, approvals, customer portal, workflow, approval automation, approval reminders, approver, multi approver, JSM, request approval

## Launch positioning
**Simple customer approvals for Jira Service Management.**

Lead with ease of use, portal visibility and quick setup rather than trying to position the app as a heavyweight enterprise BPM suite. The strongest use cases are customer/client sign-off, hardware replacement approval, access approval, purchasing approval and other service workflows where approvers should not need to understand Jira.

## Suggested pricing hypothesis
Paid Cloud app with a low-friction entry tier. Final pricing should be validated against current Marketplace competitors immediately before submission.

## Screenshot plan
1. Agent issue panel — Request approval
2. Agent selecting multiple approvers
3. Agent pending approval with group progress and reminder controls
4. Customer Help Center — My Approvals summary
5. Customer My Approvals inbox
6. Customer Approve / Decline decision screen
7. Agent approval history after decision
8. Project settings — default behaviour and workflow actions
9. Project settings — visual automatic approval rule builder

## Pre-submission checklist
- [x] Forge app registered with dedicated app ID
- [x] Installed on Nuvriqo Jira test site
- [x] Agent happy-path approval request tested
- [x] Customer approval through portal tested
- [x] Consent-free Smart Approval customer portal flow tested
- [x] Decision written back to Jira and audit comment confirmed
- [ ] Complete customer decline test
- [ ] Test required decline reason
- [ ] Test manual reminder
- [ ] Test automatic reminder
- [ ] Test cancellation
- [ ] Test request participant addition
- [ ] Test multiple approvers — all must approve
- [ ] Test multiple approvers — any one can approve
- [ ] Test automatic rule matching
- [ ] Test rule does not match when conditions fail
- [ ] Test duplicate automatic events do not create duplicate pending approvals
- [ ] Test approval-required transition mapping
- [ ] Test approved transition mapping
- [ ] Test declined transition mapping
- [ ] Verify one customer cannot see another customer's approval
- [ ] Verify decided/cancelled approvals cannot be actioned twice
- [ ] Run final `forge lint`
- [ ] Deploy release candidate to production environment
- [ ] Capture final Marketplace screenshots
- [x] Publish privacy policy URL
- [x] Publish support URL
- [x] Publish terms URL
- [ ] Complete Atlassian security/privacy questionnaire
- [ ] Confirm final requested scopes match implementation
- [ ] Create dedicated Smart Approval Manager GitHub repository
- [ ] Create Marketplace listing and upload assets

## Security and data handling
- Built on Atlassian Forge.
- Approval records are stored in Forge-hosted storage.
- Portal decisions are authorised against the assigned Atlassian account ID.
- Jira-side comments and workflow transitions are performed by the app after the decision is authorised.
- Project configuration is restricted to Jira project administrators.
- No external application server is required for V1.

## V1 boundaries
- Smart Approval Manager maintains its own approval records rather than using Atlassian native JSM approval endpoints.
- Approver search depends on Jira user-search visibility for the acting agent/admin.
- Automatic reminders run hourly, so delivery timing is approximate.
- Workflow transitions are configured using Jira transition IDs; a future version may provide richer workflow discovery/mapping.
- Automatic rules respond to Jira product events and may not run instantly.
- Sequential multi-stage approval chains, out-of-office delegation and advanced analytics remain candidates for later releases.
