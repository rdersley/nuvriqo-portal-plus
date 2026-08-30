# Local setup — technical prototype

The repository deliberately contains `manifest.template.yml` rather than a registered `manifest.yml` because the Forge app registration must be created under the developer's Atlassian account.

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
