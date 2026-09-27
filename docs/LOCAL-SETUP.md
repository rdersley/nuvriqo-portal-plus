# Local setup — technical prototype

The repository tracks the registered `manifest.yml` (the Nuvriqo Portal+ app ID) and `manifest.template.yml`, an identical copy with `REPLACE_WITH_FORGE_APP_ID` for registering a separate app under another Atlassian account. `npm run release:check` validates `manifest.yml` and fails if the template drifts from it in anything other than the app ID. The steps below apply only to that separate registration.

## First registration

From the repository root on the development machine:

1. Copy `manifest.template.yml` to `manifest.yml`.
2. Run `npm install`.
3. Run `forge register "Nuvriqo Portal Plus"`.
4. Confirm that Forge replaces the app ID in `manifest.yml` with the newly registered app ARI.
5. Run `forge lint`.
6. Run `forge deploy -e development`.
7. Install on the test JSM site with `forge install -e development --site nuvriqo.atlassian.net --product Jira`.

Do not run `forge register` repeatedly after the app is registered; re-registering creates a new app ID and disconnects the project from environments/storage associated with the previous ID.

## Prototype test

After installation, sign in as a portal-only JSM customer and verify:

- the Portal+ subheader appears on an allowed portal page;
- the resolver health call succeeds once the Custom UI invokes it;
- `getMyRequests` returns only requests visible to that customer;
- another portal customer cannot retrieve requests they are not entitled to see.

These checks complete the first live gate in `docs/SPIKE-RESULTS.md`.
