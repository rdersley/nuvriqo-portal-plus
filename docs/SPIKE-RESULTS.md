# Portal+ Technical Spike Results

Status: **GO / LIVE PORTAL PASS**

Date: 20 August 2026

## Executive result

The Portal+ architecture has now been deployed and visually validated on the real Nuvriqo Jira Service Management Cloud site.

The Forge administration module renders successfully in JSM Space settings. The customer-facing `jiraServiceManagement:portalSubheader` module renders successfully on both the JSM portal page and the native Requests / My Requests page. Crucially, the customer-facing module was confirmed while signed in as a **portal-only customer account**, clearing the key Forge unlicensed-customer UI gate.

Decision: **GO for V1 implementation.**

The remaining API/data checks below are implementation tests rather than architecture blockers. They must still be verified as each data-backed feature is introduced, and Jira/JSM permissions remain authoritative.

## Live validation evidence

Confirmed on `nuvriqo.atlassian.net`:

- Forge app registered as **Nuvriqo Portal Plus** in the Nuvriqo Developer Space.
- Development deployment completed with Forge lint reporting no issues.
- Portal+ admin Custom UI renders under JSM Space settings > Apps.
- Portal+ customer module renders on the service portal above the native request-type area.
- Portal+ customer module renders on the native Requests / My Requests page above Atlassian's request controls.
- Portal+ customer module renders for a **portal-only JSM customer**.

This proves the central V1 delivery model: Portal+ can enhance the existing Atlassian customer experience without replacing JSM authentication, request forms, permissions or the underlying portal.

## Confirmed platform capabilities

### Portal modules

Forge supports JSM customer-facing modules including portal header/subheader/footer, request detail modules, request actions, user menu actions and request-create extension points.

Full-page Jira modules do not support portal customer/unlicensed access, so V1 remains an embedded/hybrid experience rather than a completely separate Forge full-page replacement.

### Portal-only customer access

Forge supports online `asUser()` calls for JSM portal-only customer accounts. Customer-context calls preserve Jira/JSM permission checks.

Portal-only UI rendering has now been proven live. Customer request retrieval through `asUser()` remains the required implementation pattern for request data.

### Customer requests

The JSM customer request API is the baseline for enhanced My Requests and dashboard aggregation. Portal+ must never use privileged app-context reads merely to bypass customer request visibility.

### SLA

Customer-facing SLA countdown / SLA-risk remains outside the guaranteed V1 baseline. The official JSM SLA request endpoints have agent requirements, so SLA must not be exposed through privilege elevation without a separately validated security design.

### Storage

Portal+ configuration will begin with Forge hosted storage/KVS. A more complex storage model should only be introduced if query requirements justify it.

## V1 module decision

### Customer experience

Use `jiraServiceManagement:portalSubheader` as the primary V1 customer surface. Live testing confirms useful placement on:

- the service portal; and
- Requests / My Requests.

Additional request-detail modules may be introduced only when a V1 feature specifically requires them.

### Administration

Use the JSM/Jira project settings application page for Portal+ administration. Live rendering is confirmed. Customer modules must never expose administrative controls.

## Dashboard-state model

Do not hard-code customer-specific status names.

V1 strategy:

- Open Requests: derive from customer-visible requests and closed/open state.
- Recent Requests: customer-visible requests ordered by recent activity where supported.
- Awaiting My Response / Awaiting Support: use admin-configurable status mapping unless a reliable generic semantic signal is proven during implementation.

## Discovery strategy

Admin-context discovery should provide human-readable selections for service desk/project, request types, organizations, relevant fields and status mappings. Normal setup must not require administrators to type Jira numeric IDs.

## Remaining implementation validation

These checks remain mandatory while implementing the corresponding V1 capabilities, but they no longer block starting V1:

1. Prove `asUser()` request retrieval for the portal-only test customer and inspect the response shape.
2. Verify a second customer cannot retrieve inaccessible requests.
3. Confirm portal/service-desk context IDs used by the installed module.
4. Validate organization membership discovery for audience rules.
5. Validate customer-safe custom-field retrieval.
6. Validate CSV download UX from the portal context.
7. Validate admin status discovery/mapping for Awaiting Customer / Awaiting Support counters.
8. Validate approvals before promoting Approvals from SHOULD into V1.

## GO / NO-GO

**GO — begin the locked Portal+ V1 implementation.**

The first build increment should replace the technical prototype with a real dashboard shell and turn the admin prototype into discovery/configuration UI. Data-backed features should be introduced incrementally with customer-permission tests alongside them.
