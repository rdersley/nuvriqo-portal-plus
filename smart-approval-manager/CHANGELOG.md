# Changelog

## 1.0.0 - Marketplace release candidate

### Added
- Jira issue panel for requesting customer approvals.
- Approver search and multi-select.
- Optional approval message.
- Grouped multi-approver approvals.
- **All approvers must approve** and **Any one approver can approve** modes.
- Duplicate pending-approval protection per approver/request.
- Customer portal **My Approvals** summary and inbox.
- Consent-free Smart Approval customer portal resolver.
- Approve and decline actions with decision comments.
- Configurable required decline reason.
- Pending, approved, declined, cancelled and no-longer-required approval states.
- Group approval progress and audit events.
- Manual reminder action and hourly automatic reminder processing.
- Approval cancellation.
- Optional automatic addition of approvers as JSM request participants.
- Optional Jira workflow transition when approval is requested.
- Optional Jira workflow transition after approval or decline.
- Automatic approval rules triggered by Jira issue-created / issue-updated events.
- Rule conditions using Jira and custom fields.
- Guided visual rule builder for project administrators.
- Per-rule approver lists, approval mode, messages, reminders and workflow overrides.
- Per-project administration settings.
- Persistent Forge KVS audit trail.
- Server-side permission, project-admin and approver validation.
- Marketplace, privacy/security and consolidated QA documentation.

### Proven in TEST
- Agent can request approval from a Jira issue.
- Assigned customer sees the approval in the JSM portal.
- Customer can approve without granting Smart Approval Manager individual OAuth consent.
- Decision is stored in approval history and written back to Jira with an audit comment.

### Final release gate
- Complete consolidated decline / reminder / cancellation regression tests.
- Complete multi-approver **all** and **any** tests.
- Complete automatic-rule positive/negative/duplicate-event tests.
- Validate configured workflow transitions.
- Run `npm test` and `forge lint` with zero errors.
- Deploy release candidate and capture Marketplace screenshots.
- Complete Atlassian Marketplace security/privacy questionnaire.
