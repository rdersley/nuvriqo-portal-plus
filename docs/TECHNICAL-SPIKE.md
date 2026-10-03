# Portal+ Technical Spike

## Purpose

Validate the assumptions that gate V1 implementation before feature coding begins.

## Exit criteria

The spike is complete when we have evidence for each item below and have recorded any required V1 scope adjustment.

### Portal placement

- Identify the exact Forge JSM modules used for the customer experience.
- Confirm rendering for portal-only customers.
- Record size/navigation constraints of each extension point.

### Customer request access

- Retrieve requests available to a portal-only customer.
- Verify inaccessible requests are not returned.
- Verify pagination and useful filtering inputs.

### Dashboard state model

Prove reliable derivation of:

- Open Requests
- Awaiting My Response
- Awaiting Support
- Recent Requests

Do not hard-code status names. Determine a configurable/generic mapping strategy where JSM does not expose a suitable semantic state.

### Discovery

Prove discovery of:

- service desks/projects
- request types
- request groups where available/useful
- organizations
- Jira/JSM fields relevant to customer requests
- statuses or status categories needed for configuration

### Audience

- Determine current customer's organization membership using supported APIs/context.
- Confirm Portal+ can select visible categories/shortcuts without exposing configuration belonging to unrelated audiences.

### Enhanced My Requests

Prove retrieval/rendering of:

- key
- summary
- request type
- customer-visible status
- created/updated dates
- selected customer-visible custom fields

Validate search/filter/sort strategy and pagination.

### CSV

- Prove safe CSV creation from only the requests/fields the customer is entitled to see.
- Confirm a usable download interaction from the selected Forge portal module.

### SHOULD features

#### SLA

Determine whether customer-facing SLA information can be implemented without unsafe privilege elevation or permission leakage. If not, keep SLA out of V1.

#### Approvals

Determine whether approvals requiring the current customer can be retrieved and presented reliably. If clean and low-risk, recommend V1 inclusion; otherwise V1.1.

## Deliverable

At completion create `docs/SPIKE-RESULTS.md` containing:

- evidence/result for every gate
- chosen Forge modules
- required scopes
- final storage choice
- API endpoints used
- known limitations
- any V1 scope changes
- GO / NO-GO recommendation for implementation

No V1 feature build should begin before the spike receives GO.
