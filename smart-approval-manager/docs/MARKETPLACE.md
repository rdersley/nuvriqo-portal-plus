# Marketplace Readiness Pack

## Product name
Nuvriqo Smart Approval Manager for Jira Service Management

## One-line summary
Make Jira Service Management approvals effortless for agents and customers with a clear agent panel and a dedicated portal approval inbox.

## Short description
Smart Approval Manager gives JSM agents a simple way to request approval from a customer and gives customer approvers one place in the portal to see, approve and decline every request waiting for them.

## Marketplace description
Jira Service Management approvals can be powerful, but approval configuration and day-to-day use can become harder than the decision itself. Smart Approval Manager focuses on a simple workflow: an agent chooses an approver directly from the ticket, and the approver sees all waiting decisions in one customer-portal view.

Agents can request approvals, add a message, monitor status, send reminders and cancel pending requests without leaving the ticket. Customers get a visible My Approvals area in the portal with clear Approve and Decline actions and a history of previous decisions.

Project administrators can configure automatic reminder timing, require decline reasons, automatically add approvers as request participants and optionally map approved or declined decisions to Jira workflow transitions.

### Key features
- Request approval directly from a Jira issue
- Search and select the approver
- Customer portal My Approvals inbox
- Approve or decline in a few clicks
- Decision comments and configurable decline reasons
- Pending / approved / declined / cancelled states
- Manual and automatic reminders
- Approval audit history
- Optional workflow transitions after decisions
- Per-project settings
- Forge-hosted storage; no external application server required

## Suggested categories / keywords
Jira Service Management, approvals, customer portal, workflow, service desk, approval reminders, approver, JSM

## Suggested launch positioning
**Simple approvals for JSM customers.**

The product should be marketed on ease of use rather than claiming to replace every advanced approval/workflow product. V1 is strongest for service teams that need customer/client sign-off without making the approver understand Jira.

## Suggested initial pricing hypothesis
Start as a paid cloud app with a low-friction entry tier. Final pricing should be set only after Marketplace competitor/pricing validation immediately before submission.

## Screenshot plan
1. Agent issue panel — no approval yet / Request approval
2. Agent search + selected approver
3. Agent pending approval with reminder controls
4. Customer portal My Approvals summary
5. Customer My Approvals inbox
6. Approve/Decline decision screen
7. Approval history
8. Project settings

## Pre-submission checklist
- [ ] Create dedicated GitHub repository `nuvriqo-smart-approval-manager`
- [ ] Run `forge register` and commit the real app ID
- [ ] Install on Nuvriqo test Jira site
- [ ] Complete agent happy-path test
- [ ] Complete customer approve test
- [ ] Complete customer decline test
- [ ] Test required decline reason
- [ ] Test manual reminder
- [ ] Test automatic reminder
- [ ] Test cancellation
- [ ] Test request participant addition
- [ ] Test with transition IDs blank
- [ ] Test approved transition mapping
- [ ] Test declined transition mapping
- [ ] Test two simultaneous approvers on different tickets
- [ ] Verify one customer cannot see another customer's approval
- [ ] Verify cancelled/decided approvals cannot be actioned twice
- [ ] Run `forge lint`
- [ ] Run production deployment
- [ ] Capture Marketplace screenshots
- [ ] Publish privacy policy URL
- [ ] Publish support URL
- [ ] Publish terms/EULA URL if required
- [ ] Complete Atlassian security/privacy questionnaire
- [ ] Confirm app scopes match actual implementation
- [ ] Create Marketplace listing and upload assets

## Known V1 boundaries
- Smart Approval Manager uses its own approval records; it does not call Atlassian native JSM approval endpoints.
- Approver search depends on Jira user-search visibility for the acting agent.
- Automatic reminders run hourly, so reminders are approximate rather than minute-exact.
- Transition IDs are configured manually in V1.
- Multi-stage chains, delegation/out-of-office and approval analytics are post-V1 candidates.
