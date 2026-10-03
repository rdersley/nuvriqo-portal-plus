# Portal+ companion-app integrations

## Goal
Portal+ is the customer-facing shell for optional Nuvriqo apps. Companion apps remain independently installable and licensed, but can contribute customer-facing modules such as Approvals and My Assets.

## V1 integration contract
A Portal+ module contains a stable module id, provider id/version, title, description, priority, up to four counters, actions, customer-visible items, health and metadata.

Portal+ renders only enabled, healthy modules and sorts them consistently.

## Smart Approval transport
Forge App Events can signal between apps installed on the same Jira site, but the current Preview does not allow publishing a custom payload. For the first real integration, Smart Approval therefore mirrors a minimal customer-safe approval snapshot into a Jira issue property using the key `nuvriqo.smart-approval.portal`.

Portal+ requests that property in the same JQL search it already uses for customer-visible requests. It only evaluates integration metadata on requests that have already passed Portal+'s reporter/organisation visibility boundary. It then filters approval rows by the signed-in customer's accountId.

The shared snapshot intentionally excludes display names, email addresses, comments, reasons and other free text. It contains only provider metadata, issue key, approval id, approver accountId, status and timestamps.

This gives us a practical cross-app data path without an external Nuvriqo backend and without exposing another app's Forge KVS.

## Provider detection
For V1, Portal+ considers a provider detected when a valid provider issue property is present on at least one customer-visible request. A provider may still render with zero pending actions so the customer sees that the companion capability is available.

Later we can add installation-level presence signalling through Forge App Events once that path is sufficiently useful/stable, while keeping customer data in the issue-property channel.

## Planned providers
1. Smart Approval Manager — pending approvals and review links.
2. Assets Manager — assigned assets, status and support actions once its portal model is available.
3. Other Nuvriqo apps — only where there is a useful customer-facing module; agent/admin-only apps do not need Portal+ integration.
