# Nuvriqo Portal+ — Security & Privacy Notes

This document is the technical source for the Marketplace Privacy & Security questionnaire and customer-facing trust documentation. Legal statements should be reviewed by the vendor before publication.

## Hosting and architecture

Portal+ V1 is a Forge application using Atlassian-hosted compute and Forge hosted storage. It does not use a custom remote backend, external database, third-party analytics service or customer-configured external API integration.

## Data egress

Portal+ V1 is designed with **no external data egress**. Jira/JSM data is read through Forge product APIs and Portal+ configuration is stored in Forge KVS.

## Customer authorization

Customer request data is retrieved with `api.asUser()` so Jira Service Management permissions remain authoritative. Portal+ does not use app-context access to broaden a customer's request visibility.

Administrative discovery uses app context for the service desk configuration needed to populate human-readable admin choices. Portal+ does not use these discovery calls to expose request data to customers.

## Stored data

Portal+ stores tenant/project configuration such as:

- dashboard display settings;
- selected workflow status IDs for dashboard state mapping;
- selected organization IDs for Portal+ audience configuration;
- Portal+ category names/descriptions;
- request type IDs/names mapped to Portal+ categories;
- configuration version and last-updated timestamp.

Portal+ V1 does not intentionally persist request descriptions, comments, attachments, customer email addresses, passwords, API tokens or Jira credentials in Forge KVS.

## Credentials and secrets

Portal+ does not request or store Atlassian passwords or personal API tokens. The app uses Forge authentication and declared OAuth scopes.

## OAuth scope justification

### `read:servicedesk-request`

Required to read JSM customer requests in customer context and to discover JSM service-desk/request-type information used by Portal+.

### `read:jira-work`

Required to read Jira project/status metadata used by the configurable Awaiting customer / Awaiting support status mappings.

### `manage:servicedesk-customer`

Required by the JSM organization discovery operation used to populate organization choices in Portal+ administration. Portal+ V1 does not use this scope to add, remove or alter customers as part of normal product behavior.

### `storage:app`

Required for Forge KVS storage of tenant/project Portal+ configuration.

## External hosts

None in V1.

## Data retention and deletion

Portal+ configuration exists only while stored in Forge KVS for the installation. Marketplace/customer documentation should describe the applicable Forge uninstall/storage retention behavior using Atlassian's current platform documentation at publication time.

Because V1 does not intentionally store user profile personal data in KVS, a Forge user-personal-data reporting/erasure implementation is not expected to be required for the configuration model. This must be re-reviewed if later versions begin persisting account IDs, email addresses, names or other user personal data.

## Security operations checklist

- Keep Node.js runtime on a Forge-supported non-EOL version.
- Run dependency vulnerability checks before each release.
- Address high/critical dependency vulnerabilities before release.
- Maintain a Marketplace security contact with access to Atlassian Marketplace Security tickets.
- Follow Atlassian Marketplace Security Bug Fix Policy timelines.
- Report security incidents to Atlassian through the required ecosystem support channel.

## Runs on Atlassian

The V1 architecture intentionally uses Atlassian-hosted Forge compute/storage and no external egress. Verify badge eligibility with the current Forge/Marketplace tooling before submission rather than claiming the badge manually.
