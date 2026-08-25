# Smart Approval Manager — Marketplace Release Candidate Test Plan

Use this plan after the release candidate deploys cleanly to the Nuvriqo test Jira site. The objective is one consolidated end-to-end test cycle before Marketplace submission.

## 1. Installation and visibility
- Install/upgrade the development build on the Nuvriqo test site.
- Confirm the **Smart Approval** issue panel is visible to agents.
- Confirm **Smart Approval Manager** project settings are visible to a project administrator.
- Confirm a non-project-admin cannot save settings.
- Sign in as a portal customer and confirm **My Approvals** loads without Smart Approval Manager asking the customer to grant individual OAuth access.

## 2. Manual single-approver flow
- Search for an approver by name/email.
- Select the customer, add a message and request approval.
- Confirm pending state, Jira audit comment and request-participant access.
- Confirm duplicate pending approval for the same approver/request is blocked.
- Approve from the portal and confirm Jira + agent history update.
- Repeat with decline and a required reason.

## 3. Manual multiple approvers — ALL
- Select at least two approvers.
- Choose **All approvers must approve**.
- Confirm each approver sees only their own pending decision.
- Approve as the first approver and confirm the group remains waiting.
- Approve as the final approver and confirm the group becomes approved.
- Confirm Jira only performs the approved transition after the final required approval.
- Repeat and decline as one approver; confirm the group becomes declined and remaining pending approvals no longer drive an approval transition.

## 4. Manual multiple approvers — ANY
- Select at least two approvers.
- Choose **Any one approver can approve**.
- Approve as one approver.
- Confirm the group becomes approved immediately.
- Confirm other pending approvals become no-longer-required and disappear from their waiting inbox.
- Confirm the Jira approved transition runs only once.

## 5. Customer portal
- Confirm portal outstanding count is correct.
- Confirm request key, summary, requested date, message and approval requirement are clear.
- Confirm decision comment is retained in history.
- Confirm Customer A cannot see or action Customer B's approvals.
- Confirm a decided/cancelled/no-longer-required approval cannot be actioned again.

## 6. Reminders and cancellation
- Send a manual reminder and confirm count/audit comment.
- Confirm scheduled reminders apply only to pending approvals.
- Cancel a pending approval and confirm it disappears from the customer's waiting list.
- Confirm cancelled approvals stop receiving reminders.

## 7. Default workflow transitions
Test with transition IDs blank first, then valid TEST-project mappings.
- Approval Required transition when a manual approval is requested.
- Approved transition only when the group approval requirement is satisfied.
- Declined transition when the group result becomes declined.
- Invalid transition ID must not erase the approval decision; failure should be retained in audit data.

## 8. Automatic rule builder
- Add a rule using the visual project-settings builder.
- Select a Jira/custom field condition.
- Search and add one or more approvers.
- Choose ALL or ANY mode.
- Save and refresh; confirm the rule persists.
- Disable the rule and confirm it does not execute.
- Remove/re-add conditions and approvers and confirm configuration remains valid.

## 9. Automatic rule execution
- Create/update an issue that matches a rule.
- Allow for Forge product-event delivery delay.
- Confirm approvals are created automatically for the configured approvers.
- Confirm the rule message and approval mode are correct.
- Confirm Approval Required transition executes when configured.
- Update the issue again and confirm duplicate pending approvals are not created.
- Test a near-match where one condition fails; confirm no approval is created.
- Test rule-specific workflow transition overrides.

## 10. Configuration isolation and safeguards
- Confirm reminder interval, participant setting, decline-reason setting, default approval mode, workflow mappings and rules persist.
- Confirm settings are isolated per project.
- Confirm project-admin protection applies to metadata/approver searches and saving configuration.
- Confirm disabled rules remain stored but do not run.

## 11. UX / mobile review
Review the agent panel, customer portal and project settings on desktop and a mobile-sized portal session. Record issues with wording, spacing, button order, search flow, long summaries/messages and multi-approver progress.

## Release gate
Marketplace submission preparation can proceed only when:
- `npm test` passes.
- `forge lint` has zero errors.
- Development deploy + upgrade succeeds.
- All critical flows above pass.
- No cross-customer data exposure is found.
- Automatic rules do not create duplicate pending approvals.
- Workflow failures do not lose approval decisions.
- Marketplace listing, support, privacy, terms and security documentation are complete.
