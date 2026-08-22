# Changelog

## 1.0.0 - V1 candidate

### Added
- Jira issue panel for requesting customer approvals.
- Approver search and selection.
- Optional approval message.
- Multiple independent approvers per request.
- Duplicate pending-approval protection per approver/request.
- Customer portal **My Approvals** experience.
- Approve and decline actions with optional decision comments.
- Configurable required decline reason.
- Pending and historical approval views.
- Manual reminder action.
- Scheduled automatic reminders.
- Approval cancellation.
- Optional automatic addition of approvers as JSM request participants.
- Optional Jira workflow transitions for approved and declined decisions.
- Per-project administration settings.
- Persistent Forge KVS audit trail.
- Server-side permission and approver validation.
- Project-admin protection for configuration changes.
- Marketplace, privacy/security and consolidated QA documentation.

### Release gate
- Replace the temporary manifest app ID with the registered Forge app ID.
- Run `forge lint` with zero errors.
- Deploy/install to the Nuvriqo TEST environment.
- Complete `docs/TEST-PLAN.md`.
- Fix all critical/high findings before Marketplace submission.
