# Nuvriqo Portal+ — Final Acceptance Test

Run this only after the expanded Marketplace release candidate has passed build, release, dependency and remote Forge QA checks. This is intended to be the single comprehensive human acceptance pass before production deployment and Marketplace submission.

## Test setup

Use a non-production Jira Service Management Cloud site with:

- one administrator/agent account;
- at least two portal-only customers;
- at least two JSM customer organizations;
- requests in several customer-visible statuses;
- enough visible requests to exercise filtering/pagination;
- at least three request types.

For the multi-experience test, place Customer A in Organization A and Customer B in Organization B. Keep a third/fallback scenario available where useful.

## Installation / technical gate

- App installs/upgrades with only the documented scopes.
- Admin page opens under JSM project/space settings.
- Portal+ renders for a portal-only customer.
- No resolver, CSP or JavaScript errors appear in the browser console.
- Registered manifest has Marketplace licensing enabled while retaining the real Forge app ID.
- `npm test`, production dependency audit and `forge lint` pass on the exact acceptance commit.

## Discovery

- Service desk is discovered automatically.
- Request types are discovered automatically.
- Workflow statuses are discovered automatically.
- Organizations come from the current service desk.
- Customer-visible request fields are discovered automatically.
- Normal setup does not require Jira numeric IDs.

## Multi-experience builder

Create at least three experiences:

1. Organization A branded experience.
2. Organization B branded experience.
3. Fallback experience with no organization audience.

Verify:

- experiences can be added;
- experiences can be duplicated;
- experience names/headings persist after save/reload;
- organization audiences persist;
- the fallback has no organization selection;
- duplicate or invalid configuration is rejected where applicable;
- unsaved-change status appears and clears after publish;
- the correct saved/published timestamp appears.

## Branding

Configure different branding for Organization A and B:

- brand name;
- accent colour;
- dashboard heading;
- intro text;
- hero title/message;
- support label and HTTPS support URL;
- Powered by Nuvriqo Portal+ on/off;
- mobile app display name;
- dedicated mobile/white-label logo/icon references where desired.

Verify:

- accent colour changes the Service Hub treatment;
- generated web brand mark reflects the selected brand without external image egress;
- brand name renders correctly;
- hero content appears only when configured;
- support button appears only when configured and navigates correctly;
- Powered by visibility follows the setting;
- Organization A never receives Organization B branding and vice versa.

## Admin preview

Before publishing each experience:

- open Preview;
- verify the modal is visual, not a text alert;
- verify heading, intro, brand name, accent colour and generated brand treatment;
- verify configured dashboard cards;
- verify Action Centre preview;
- verify service tiles and request-type buttons;
- verify announcements;
- verify useful-resource cards;
- verify mobile identity summary;
- close with the Close control;
- close with Escape.

## Service categories and audience rules

- Add at least two categories to Organization A.
- Assign request types to each category.
- Add one category visible only to Organization A.
- Add another category with no category audience.
- Save and reload.

Verify Customer A sees both eligible categories, while a customer outside the category audience does not see the restricted category. Category audience rules must never broaden Jira request visibility.

## Announcements and resources

- Add information, warning and success announcements.
- Confirm text/style renders sensibly in the customer Service Hub.
- Add HTTPS resources such as documentation/status pages.
- Confirm resources render and navigate correctly.
- Confirm invalid/non-HTTPS resource URLs are rejected/removed according to validation rules.

## Status mapping and Action Centre

- Map one or more Awaiting customer statuses.
- Map one or more Awaiting support statuses.
- Enable both dashboard counters and Action Centre.
- Verify the same status cannot be used in both mappings.

Using a customer with matching requests:

- Awaiting you counter matches the configured customer mapping;
- Awaiting support counter matches the configured support mapping;
- Action Centre lists actual requests awaiting the customer;
- Action Centre items show request key/status and open the native JSM request;
- Action Centre is hidden when there are no matching actions or the module is disabled.

## Customer request explorer

Verify:

- only requests visible to the signed-in portal customer are returned;
- Open count is sensible;
- Visible count is sensible;
- request list shows key, summary/request type and customer-visible status;
- up to three configured customer-visible fields render;
- clicking a request opens the native JSM request;
- customer with no requests gets a useful empty state.

Exercise:

- search by request key;
- search by summary;
- status filter;
- request-type filter;
- Last 7/30/90 days and Last 12 months;
- Any date reset;
- combined filters;
- newest/oldest/key sorting;
- Previous/Next pagination with >10 matching requests;
- pagination resets when filters change;
- empty filter results show a useful message.

## CSV export

- No visible requests produces a useful message.
- Visible requests download CSV.
- Export contains only requests visible to the customer.
- Key, summary, request type, status, created and updated values are sensible.
- Configured customer-visible columns are included.
- Quotes/newlines do not corrupt the CSV.
- Spreadsheet-formula-leading characters are neutralized.
- Export stops at the documented 1,000-request limit.

## Permission isolation

Using customers with different visibility:

- Customer A cannot see Customer B's private requests.
- Search/filtering cannot expose inaccessible requests.
- Counters do not include inaccessible requests.
- Action Centre does not include inaccessible requests.
- CSV does not include inaccessible requests.
- organization/experience selection changes presentation only, not Jira authorization.

## Shared client contract / mobile readiness

Invoke the internal `getClientContract` through the supported Forge test surface and verify the selected customer receives contract version 1 containing:

- correct selected experience ID/name;
- service desk ID;
- branding configuration;
- heading/subtitle;
- eligible services/request types;
- announcements;
- resources;
- dashboard module configuration;
- dashboard counts;
- customer action items;
- normalized request summaries;
- licence state.

Confirm the contract changes appropriately for Organization A vs Organization B and contains no requests inaccessible to that customer.

This contract is not yet a public native-mobile internet endpoint; no external mobile authentication/token path should be considered approved by this test.

## Licensing

Using Forge-supported licence testing:

- active/trial licence: normal configuration and premium features work;
- inactive production licence: admin cannot publish changes;
- export/premium navigation behaves according to the release policy;
- readable licence messaging appears rather than unhandled errors;
- reactivation restores features without configuration loss.

## Upgrade / migration

- Existing pre-V7 configuration migrates automatically into an Experience.
- Existing categories/status mappings/request columns are retained where valid.
- New branding fields receive safe defaults.
- Existing customers continue to receive a usable fallback experience.

## Responsive / mobile-width web UX

- Desktop rendering is clean.
- Tablet/narrow width remains usable.
- Phone-width layout remains usable.
- Brand mark/heading/buttons do not overlap.
- cards and service tiles collapse sensibly.
- request custom columns collapse sensibly.
- preview remains usable at narrow width.
- no internal iframe scrollbar clips critical controls.
- native JSM portal controls remain usable beneath Portal+.

## Release commands

Before sign-off:

```powershell
npm install
npm test
npm audit --omit=dev --audit-level=high
forge lint
```

Deploy the exact tested commit to staging and complete this checklist. Production deployment and Marketplace submission must use the accepted commit without additional feature changes. Any subsequent code change requires the affected acceptance scenarios plus automated release checks to be repeated.
