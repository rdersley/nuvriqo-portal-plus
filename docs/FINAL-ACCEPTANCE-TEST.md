# Nuvriqo Portal+ — Final Acceptance Test

Run this only after the Marketplace release candidate has passed build, lint, release and dependency checks.

## Test environments

Use a non-production Jira Service Management Cloud site and Forge development or staging environment. Test with both an administrator/agent account and a portal-only customer account.

## Installation / upgrade

- App installs/upgrades with only the documented scopes.
- Admin page opens under JSM project settings.
- Portal+ renders on the portal for a portal-only customer.
- No browser-visible resolver/CSP errors appear.

## Fresh configuration

- Open Portal+ on a JSM project with no Portal+ configuration.
- Service desk is discovered automatically.
- Request types are discovered automatically.
- Workflow statuses are discovered automatically.
- Organizations populate where the project has organizations.
- Fresh defaults do not require Jira numeric IDs.
- Awaiting customer/support cards are not misleading before mapping.

## Admin configuration

- Change display name.
- Enable/disable each dashboard module.
- Map one or more Awaiting customer statuses.
- Map one or more Awaiting support statuses.
- Verify the same status cannot be saved in both mappings.
- Add at least two service categories.
- Assign request types to categories.
- Reorder categories and confirm order persists.
- Verify duplicate visible category names are rejected.
- Verify unsaved-change indicator appears and clears after save.
- Refresh/reopen the admin page and confirm all configuration persists.

## Customer dashboard

Using a portal-only customer:

- Dashboard loads without Jira product/agent access.
- Only requests visible to that customer are returned.
- Open request count is sensible.
- Awaiting customer/support counts match configured mappings.
- Recent/request list displays key, summary/type and customer-visible status.
- Clicking a request opens the customer's JSM request.
- Quick-action categories appear in configured order.
- Clicking a quick action opens the correct existing JSM request form.

## Request search/filter/sort

With several requests visible:

- Search by issue key.
- Search by summary text.
- Filter by status.
- Filter by request type.
- Sort newest first.
- Sort oldest first.
- Sort by key.
- Empty filter results display a useful message.

## CSV export

- Export with no visible requests produces a useful message instead of a meaningless file.
- Export with visible requests downloads CSV.
- CSV contains only requests visible to the current customer.
- Key, summary, request type, status, created and updated values are sensible.
- Quotes/newlines in text do not corrupt CSV structure.
- Large export stops at the documented V1 limit.

## Permission isolation

Use a second portal-only customer who must not see the first customer's private requests:

- Portal+ does not expose inaccessible requests.
- Search does not expose inaccessible requests.
- Dashboard counts do not include inaccessible requests.
- CSV does not include inaccessible requests.

## Licensing

In development/staging, use Forge's supported license test mechanism:

- Active/trial license: normal Portal+ configuration and premium features work.
- Inactive license: customer request visibility remains available in reduced mode, premium quick actions/export are unavailable, and admin configuration cannot be changed.
- No unhandled error appears in either state.

## Upgrade / migration

- Existing V1 development configuration is retained after upgrading to the RC.
- Configuration migration completes automatically.
- No category/status mappings disappear unexpectedly.

## Responsive / UX

- Portal+ remains usable on normal desktop width.
- Portal+ remains usable at narrow/mobile width.
- No internal iframe scrollbar clips critical content.
- Loading, empty and error states are readable.
- Atlassian's native portal/request controls remain usable below Portal+.

## Release commands

Before signing off the RC:

```powershell
npm install
npm test
npm audit --omit=dev --audit-level=high
forge lint
```

Then deploy the exact tested commit to staging and complete this checklist. Production deployment and Marketplace submission should use that approved commit without additional feature changes.
