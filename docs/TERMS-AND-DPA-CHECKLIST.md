# Nuvriqo Portal+ — Terms / DPA Checklist

Atlassian requires customer terms for paid cloud transactions and may require a DPA where the vendor acts as a processor. This file is a release checklist, not legal advice or a substitute for vendor legal review.

## Before Marketplace submission

- Decide whether Nuvriqo will use Atlassian's standard/customizable end-user agreement or publish its own End User Terms / Terms of Service.
- Publish the final terms at a permanent HTTPS URL controlled by Nuvriqo.
- Review whether Nuvriqo is a Data Processor for Portal+ V1 under applicable GDPR/data-protection law.
- If a DPA is required, publish/execute the appropriate DPA process and expose the relevant URL/instructions to customers.
- Ensure company/legal identity, registered/business address and contact details are accurate across Marketplace, privacy policy, terms and invoices.
- Ensure support and security contact details are current.
- Do not claim certifications, data residency capabilities or Marketplace trust badges until Atlassian confirms eligibility.

## V1 technical facts relevant to legal review

- Forge-hosted app; no Nuvriqo-hosted remote backend in V1.
- No external analytics or third-party data egress designed into V1.
- Portal+ configuration stored in Atlassian Forge KVS.
- Customer requests read from Jira/JSM using Forge APIs.
- Customer request access uses customer context (`asUser`) where Portal+ acts on behalf of the portal customer.
- No passwords or Atlassian personal API tokens requested or stored.
- Configuration may contain Jira entity identifiers such as project/service-desk/request-type/status/organization IDs and administrator-authored category text.

## Publication gate

Marketplace submission must not use repository drafts as the public legal URLs until the vendor has reviewed and intentionally published them.
