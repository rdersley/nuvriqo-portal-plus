# Nuvriqo Portal+ — Final Acceptance Test

Run this only after the Marketplace release candidate has passed build, lint, release and dependency checks. This is intended to be the single comprehensive human acceptance pass before production deployment and Marketplace submission.

## Test environments

Use a non-production Jira Service Management Cloud site and Forge development or staging environment. Test with an administrator/agent account and at least two portal-only customer accounts with different request visibility. Where audience rules are tested, put only one customer in the selected JSM organization.

## Installation / upgrade

- App installs/upgrades with only the documented scopes.
- Admin page opens under JSM project settings.
- Portal+ renders on the portal for a portal-only customer.
- No browser-visible resolver/CSP errors appear.
- Registered manifest has Marketplace licensing enabled while retaining the real Forge app ID.

## Fresh configuration

- Open Portal+ on a JSM project with no Portal+ configuration.
- Service desk is discovered automatically.
- Request types are discovered automatically.
- Workflow statuses are discovered automatically.
- Organizations populate only from the current service desk where organizations exist.
- Customer-visible request fields are discovered automatically.
- Fresh defaults do not require Jira numeric IDs.
- Awaiting customer/support are disabled until an administrator maps statuses.
- Default category is created from the discovered request types.

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
- Select up to three additional customer-visible request fields.
- Verify Portal+ prevents selecting more than three additional fields.
- Select an organization audience and save.
- Verify unsaved-change indicator appears and clears after save.
- Verify Restore defaults changes the form locally but does not persist until Save configuration is used.
- Refresh/reopen the admin page and confirm all configuration persists.

## Organization audience

Using two portal-only customers:

- Customer in a selected audience organization sees Portal+.
- Customer outside all selected audience organizations does not see Portal+.
- Removing all audience selections makes Portal+ available to every customer who already has JSM access.
- Audience membership never causes a customer to see a Jira request they cannot otherwise access.

## Customer dashboard

Using a portal-only customer in the allowed audience:

- Dashboard loads without Jira product/agent access.
- Only requests visible to that customer are returned.
- Open request count is sensible.
- Awaiting customer/support counts match configured mappings.
- Request list displays key, summary/request type and customer-visible status.
- Selected additional customer-visible fields appear as columns and show sensible values.
- Clicking a request opens the customer's JSM request.
- Quick-action categories appear in configured order.
- Clicking a quick action opens the correct existing JSM request form.
- A customer with no requests sees a useful empty state.

## Request search/filter/sort/pagination

With enough requests to exercise the controls:

- Search by issue key.
- Search by summary text.
- Filter by status.
- Filter by request type.
- Filter by Last 7 days.
- Filter by Last 30 days.
- Filter by Last 90 days.
- Filter by Last 12 months.
- Clear the date filter back to Any date.
- Combine search and filters.
- Sort newest first.
- Sort oldest first.
- Sort by key.
- Move to the next page and back using Previous/Next where more than ten matches exist.
- Changing a filter resets pagination to the first page.
- Empty filter results display a useful message.

## CSV export

- Export with no visible requests produces a useful message instead of a meaningless file.
- Export with visible requests downloads CSV.
- CSV contains only requests visible to the current customer.
- Key, summary, request type, status, created and updated values are sensible.
- Configured additional request fields are included in the export.
- Quotes/newlines in text do not corrupt CSV structure.
- Values beginning with spreadsheet-formula characters do not execute as formulas when the export is opened in a spreadsheet.
- Large export stops at the documented V1 limit of 1,000 visible requests.

## Permission isolation

Use a second portal-only customer who must not see the first customer's private requests:

- Portal+ does not expose inaccessible requests.
- Search does not expose inaccessible requests.
- Dashboard counts do not include inaccessible requests.
- Configurable columns do not expose hidden/non-customer fields.
- CSV does not include inaccessible requests.

## Licensing

In development/staging, use Forge's supported license test mechanism:

- Active/trial license: normal Portal+ configuration and premium features work.
- Inactive license: customer request visibility remains available in reduced mode, premium quick actions/export are unavailable, and admin configuration cannot be changed.
- Inactive-license state gives a readable customer/admin message rather than an unhandled exception.
- Returning to an active license restores normal functionality without losing configuration.

## Upgrade / migration

- Existing development configuration is retained after upgrading to the RC.
- Configuration migration to the current schema completes automatically.
- Existing category/status mappings do not disappear unexpectedly.
- New request-column configuration can be added after migration.

## Responsive / UX

- Portal+ remains usable on normal desktop width.
- Portal+ remains usable at narrow/mobile width.
- Extra custom columns collapse sensibly at narrow widths.
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

Then deploy the exact tested commit to staging and complete this checklist. Production deployment and Marketplace submission should use that approved commit without additional feature changes. Any code change after acceptance requires the affected scenarios plus the automated release checks to be repeated.
