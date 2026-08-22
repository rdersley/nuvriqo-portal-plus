# Smart Approval Manager — Consolidated V1 Test Plan

Use this plan only after the app deploys cleanly to the Nuvriqo test Jira site. The objective is one complete end-to-end test cycle before any usability changes are made.

## 1. Installation and visibility

- Install/upgrade the development build on the Nuvriqo test site.
- Open a Jira Service Management issue as an agent.
- Confirm the **Smart Approval** issue panel is visible.
- Open project settings and confirm **Smart Approval Manager** settings are visible to a project administrator.
- Confirm a non-project-admin cannot save Smart Approval Manager settings.
- Sign in to the customer portal as a customer and confirm **My Approvals** is available.

## 2. Agent request flow

- On a TEST issue, search for an approver by name/email.
- Select the customer and add an optional approval message.
- Click **Request approval**.
- Confirm a pending approval appears immediately in the issue panel.
- Confirm the public Jira/JSM comment records that approval was requested.
- Confirm the approver is added as a request participant when that setting is enabled.
- Try requesting approval from the same approver again and confirm the duplicate is blocked.
- Request approval from a second approver and confirm both can exist independently.

## 3. Customer portal flow

- Sign in as the selected approver.
- Confirm the outstanding count appears in the portal summary.
- Open **My Approvals**.
- Confirm only approvals assigned to that signed-in account are shown.
- Confirm request key, summary, requested date and agent message are correct.
- Approve one request with an optional comment.
- Confirm it moves from pending to approval history.
- Confirm the Jira ticket receives the approval comment.
- Confirm the agent issue panel changes to **approved**.

## 4. Decline flow

- Create another approval.
- Attempt to decline it without a reason while **Require decline reason** is enabled.
- Confirm the decision is rejected and remains pending.
- Enter a reason and decline again.
- Confirm the approval becomes **declined** in portal and agent views.
- Confirm the reason is recorded on the Jira request and in approval history.

## 5. Reminders

- Create a pending approval.
- From the agent panel click **Send reminder**.
- Confirm the reminder count increases.
- Confirm a public reminder comment appears on the JSM request.
- Configure a short reminder interval in the test project.
- Allow the hourly scheduled trigger to run and confirm an automatic reminder is recorded.
- Confirm decided/cancelled approvals no longer receive reminders.

## 6. Cancellation

- Create a pending approval.
- Cancel it from the issue panel.
- Confirm status becomes **cancelled** for the agent.
- Confirm it no longer appears under the customer's pending approvals.
- Confirm cancellation is recorded on the request.

## 7. Workflow transitions

Test first with transition IDs blank, then with valid TEST-project transition IDs.

- Leave approve/decline transition IDs blank and confirm decisions are recorded without moving the Jira status.
- Configure a valid approval transition ID.
- Approve a request and confirm Jira transitions automatically.
- Configure a valid decline transition ID and confirm decline transitions automatically.
- Enter an invalid transition ID and confirm the approval decision remains recorded while the transition failure is retained in the audit data rather than losing the decision.

## 8. Project configuration

Verify all V1 settings persist after refreshing the page:

- Reminder interval
- Automatically add approver as request participant
- Require decline reason
- Approved transition ID
- Declined transition ID

Confirm configuration is isolated per project.

## 9. Security/access tests

- Customer A must not see Customer B's approvals.
- Customer A must not be able to decide Customer B's approval even if an approval ID is known.
- A Jira user without access to a ticket must not be able to retrieve that ticket's approvals through the agent resolver.
- A non-project-admin must not be able to modify project settings.
- A decided approval must not accept a second decision.
- A cancelled approval must not accept a decision.

## 10. UX review

During the same test cycle record, but do not immediately fix, any observations about:

- wording
- button placement
- panel size
- search speed
- portal clarity
- mobile portal experience
- useful extra ticket fields for the approver
- whether reminders should be public comments or a different notification mechanism
- whether changing/reassigning an approver should be promoted into V1

## Release gate

V1 is ready for Marketplace submission preparation only when:

- Forge lint has zero errors.
- Development deployment succeeds.
- Installation/upgrade succeeds on the Nuvriqo test site.
- All critical tests above pass.
- There are no cross-customer data leaks.
- Agent and customer workflows are understandable without training.
- Marketplace listing, privacy/security documentation and support details are complete.
