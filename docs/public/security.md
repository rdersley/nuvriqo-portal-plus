# Nuvriqo Portal+ security and data handling

This page explains how Nuvriqo Portal+ for Jira Service Management ("Portal+") protects your data. It covers version 1.0 and later.

## Summary

- Portal+ runs entirely on Atlassian Forge, Atlassian's hosted app platform. Nuvriqo runs no servers, databases or analytics for it.
- Portal+ declares no external hosts, so no Jira data leaves Atlassian.
- Customers only ever see requests they reported or that are shared with an organisation they belong to. Portal+ checks this on the server for every call.
- Portal+ stores only its own configuration and uploaded logos. It does not store request content or personal data.
- Portal+ never asks for passwords or API tokens.

## Architecture

Portal+ is made of two Forge modules: a portal header shown in the Jira Service Management customer portal, and a project settings page for administrators. Both run on Atlassian-hosted compute, and all Jira data is read and written through Atlassian's product APIs. The app has no web triggers, remote back ends or REST APIs of its own.

## How customer visibility is enforced

Portal+ calls Jira with app permissions, so that portal customers don't see an "Allow access" consent screen. Because of this, Portal+ enforces what each customer can see itself, on the server, on every request:

- The customer's identity comes from the Forge platform, never from the browser.
- Every request search is limited to the current service project, and to requests the customer reported or that are shared with one of their JSM organisations.
- An administrator can narrow an experience further with a custom field filter, for example a Customer field. These filters only narrow what a customer sees. They never add requests the customer couldn't otherwise see.
- Before showing a request, saving a field or running an action, Portal+ checks again that this exact request is inside the customer's boundary. Requests outside it are refused.
- On a help center, the address only chooses the branding. The customer must still belong to that experience's organisations.
- Automated tests run the real server code against simulated Jira data and fail on any cross-customer exposure or injected query.

## What Portal+ can change in Jira

Portal+ writes to Jira only when an administrator turns a feature on for an experience:

- **Field edits:** customers can edit only the fields the administrator allows, and only field types Portal+ supports (text, number, date, date-time and dropdown). Values are checked before they're saved.
- **Close and Escalate:** these move a request only into a status the administrator selected, through the project's normal workflow.
- **Audit comment:** after each edit or action Portal+ adds an internal, agent-only comment naming the customer, because Jira attributes app changes to the app. Administrators can turn this off.

## Data Portal+ stores

Portal+ stores the following in Atlassian's Forge storage for your installation:

- configuration entered by administrators: experience names, wording, colours, organisation and status selections, request types, help center URL endings, field selections, announcements, links, and guide titles and links;
- logos uploaded by administrators (PNG, JPG, WebP or SVG, up to 150 KB);
- small technical caches, such as which project a portal belongs to.

Portal+ does not store request descriptions, comments, attachments, customer names, email addresses, account IDs, passwords or API tokens. Forge storage is hosted by Atlassian and follows Atlassian's data residency and encryption at rest.

## Access to your data

Nuvriqo staff cannot see your Jira data or Portal+ configuration through the app. If you contact support, we only see what you choose to send us.

## Permissions (scopes)

| Scope | Why Portal+ needs it |
| --- | --- |
| `read:jira-work` | Search the customer's requests, and read request fields, statuses, field metadata and available transitions |
| `write:jira-work` | Administrator-enabled field edits, Close and Escalate, and the internal audit comment |
| `read:servicedesk-request` | Read service desks, request types and their fields, request SLAs and status history |
| `manage:servicedesk-customer` | Read which JSM organisations a customer belongs to, and list organisations for configuration. Portal+ never adds, removes or changes customers or organisations |
| `storage:app` | Store the configuration and logos described above |

## Data retention and deletion

Configuration and logos stay in Forge storage while Portal+ is installed. After uninstalling, Atlassian's Forge platform handles stored app data according to its retention policy. To remove data sooner, delete the experiences and logos on the Portal+ settings page before uninstalling, or contact support.

## Secure development

- Every release runs automated checks: build, release consistency, style checks and the customer-separation tests above.
- Dependencies are audited before each release, and high or critical issues are fixed first.
- Portal+ stays on a Forge-supported Node.js runtime.
- We follow Atlassian's Security Bug Fix Policy for Marketplace apps.

## Reporting a security issue

Email **support@nuvriqo.com** with "Security" in the subject line. Include your site address, the Portal+ version and steps to reproduce. Please don't include passwords, API tokens or confidential request content. We'll acknowledge your report and keep you updated until it's resolved.

For privacy details, see the Portal+ privacy policy.
