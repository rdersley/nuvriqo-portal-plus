# Portal+ V1 Architecture

## Decision

Portal+ V1 uses a Forge/Cloud-first hybrid embedded architecture. Jira Service Management remains the service-management engine and source of truth; Portal+ provides the enhanced customer and administration experience through supported Forge/JSM extension points.

## Logical architecture

```text
                 NUVRIQO PORTAL+
                        |
          +-------------+-------------+
          |                           |
    CUSTOMER LAYER              ADMIN LAYER
          |                           |
    Forge UI / JSM              Forge Custom UI
    portal modules                    |
          |                           |
       asUser()                     asApp()
          |                           |
          +-------------+-------------+
                        |
                 Portal+ services
                        |
        +---------------+---------------+
        |               |               |
     JSM APIs      Forge Storage     Jira APIs
        |               |               |
    Requests          Portal          Fields /
    Request types     config          metadata
    Organizations
```

## Responsibilities

### Jira Service Management

Authoritative for:

- customer identity
- customer permissions
- organizations
- service desks/projects
- request types/forms
- requests
- comments
- statuses/workflows
- notifications
- approvals
- SLA definitions/data where APIs permit

### Portal+

Responsible for:

- service/category presentation
- audience-aware navigation
- dashboard presentation
- request summaries
- enhanced request-list configuration
- safe export
- Portal+ branding/configuration
- mapping discovered Jira/JSM entities to Portal+ configuration

## Data-access rule

Customer-visible request data should be retrieved in customer context wherever Forge/JSM supports it. App-context access must not be used to bypass customer permissions.

Admin discovery/configuration can use app context where required, with only the scopes necessary for the feature.

## Storage model — initial

Tenant-scoped configuration will need entities conceptually equivalent to:

- PortalConfig
- Category
- CategoryRequestTypeMapping
- AudienceRule
- DashboardConfig
- RequestTableConfig

Exact Forge storage implementation will be selected after the technical spike.

## Technical-spike gates

Before feature implementation, prove on a real JSM Cloud site:

1. Supported customer-facing Forge module placement.
2. Portal-only customer access to the chosen modules.
3. Customer-context request retrieval.
4. Request type/service desk discovery.
5. Customer organization detection.
6. Request status data sufficient for dashboard counters.
7. Customer-visible field retrieval.
8. CSV generation/download approach in the supported portal context.
9. Whether SLA data can be exposed safely without elevated customer access.
10. Whether approvals can be surfaced cleanly in V1.

## Non-goals

Portal+ V1 does not replace JSM authentication, permissions, workflows or request storage and does not depend on unsupported full-page customer modules.
