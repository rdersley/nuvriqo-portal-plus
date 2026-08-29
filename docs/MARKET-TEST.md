# Portal+ integrated market-test build

Target: consolidated Nuvriqo sandbox test cycle before Marketplace release hardening.

## Included in this branch

- Forge runtime and JSM portal entry points
- Customer dashboard with open/waiting/important counts
- Enhanced request list with text/status/priority filtering
- Customer Priority Manager (Normal / Important / Critical)
- Customer-friendly progress tracker with configurable Jira-status mappings
- CSV generation from the filtered request set
- Project-admin configuration for branding, modules and progress mapping
- Module switches for Export, Priority, Progress, Smart Approvals and Follow-Up
- Customer-permission checks for request access
- Tenant/user-scoped Forge KVS storage

## Product-family rule

Portal+ is the suite product. Features that make sense independently remain separately sellable apps as well. Shared behaviour should be implemented as reusable logic rather than divergent copies.

Standalone candidates:

- Ticket Export for JSM
- Smart Approval Manager
- Customer Follow-Up / Auto-Close Manager
- Customer Priority Manager (after demand validation)
- Portal Progress Tracker (after demand validation)

Portal+ includes the customer-facing capabilities of those products where they improve the overall portal experience.

## Consolidated test flow

1. Install/upgrade Portal+ on the Nuvriqo test site.
2. Open the JSM portal as a customer with existing requests.
3. Confirm dashboard counts reflect visible requests only.
4. Search requests by key, summary, request type and status.
5. Filter by status.
6. Mark one request Important and another Critical; reload and verify persistence.
7. Filter by customer priority.
8. Confirm progress labels/percentages make sense for current Jira statuses.
9. Generate CSV after applying filters and verify only the filtered rows are present.
10. As a project admin, change Portal+ title/welcome text and verify the portal updates.
11. Disable individual modules and verify the corresponding controls disappear.
12. Configure at least one explicit progress mapping and verify it overrides automatic mapping.
13. Repeat as a different customer and confirm they cannot see or affect another customer's private priority metadata.
14. Repeat with an agent/project admin and confirm settings permissions.

## Release blockers before Marketplace submission

- Real Forge app ID in manifest
- `npm install` / lockfile committed
- `forge lint` clean
- Sandbox deployment successful
- Full customer-permission QA complete
- Accessibility/usability pass
- Security/privacy review
- Marketplace listing assets and pricing confirmed
- Dedicated documentation/support URLs published
