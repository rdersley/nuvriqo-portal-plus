# Portal+ customer UI system

Portal+ must feel like a premium customer workspace, not a Forge widget bolted onto Jira. Functionality and visual quality are equal release requirements.

## Visual principles

1. Clear hierarchy: branded service header, important customer metrics, actions, services, requests, reports and companion modules.
2. Calm density: useful information without recreating Jira's administration-heavy visual density.
3. Customer language: labels such as `Waiting for you`, `With support`, `My Assets`, `Approvals` and `Reports` instead of internal Jira terminology.
4. Strong responsive behaviour: cards and request rows become touch-friendly mobile components rather than squeezed desktop tables.
5. Brand-aware, not over-themed: organisation branding/accent colour should be visible while retaining accessible contrast and predictable interaction patterns.
6. Progressive disclosure: advanced filters, custom fields, SLA detail and reporting controls appear when useful without overwhelming the default home view.
7. Companion consistency: Smart Approval and Asset Manager modules must look native to Portal+, not like separate embedded products.

## Primary customer surfaces

### Home
- premium branded hero/header
- request counters
- Action Centre
- service quick actions
- announcements
- companion app cards

### My Requests
- clean configurable list/table
- strong search and advanced filters
- saved views
- responsive card view on mobile
- export controls grouped with request tools
- status and SLA badges with consistent semantics

### Request Detail
- summary and status header
- SLA card
- read-only customer-visible fields
- editable fields clearly distinguished from agent-maintained fields
- customer actions in a dedicated action area
- related requests
- associated asset/device panel
- approvals panel where relevant

### Reports
- KPI row
- Created vs Resolved trend
- Request Type breakdown
- Status breakdown
- SLA Met/Breached
- Average Resolution Time
- date-range controls and export

### My Assets
- device/asset cards using Portal+ visual components
- status badge, assigned user/holder, location and model
- clear Report a Problem action

### Approvals
- waiting-for-you summary
- approval cards with request, requester context where safe, age and status
- clear Review action

## Release visual acceptance

Before Marketplace submission, every major surface must be reviewed at desktop, tablet and mobile widths. Loading, empty, error, disabled and unlicensed states are part of the visual release gate, not optional polish.
