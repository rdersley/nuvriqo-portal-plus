# Nuvriqo Portal+ documentation

Portal+ adds a branded customer workspace to the Jira Service Management (JSM) customer portal. Customers see their requests, SLAs, reports and guides in one place; your team keeps using JSM exactly as before.

**Works with:** Jira Service Management Cloud. **Version:** 1.0.0.

---

## 1. Getting started

1. Install Portal+ from the Atlassian Marketplace and approve its permissions.
2. Open your service project and go to **Project settings → Apps → Nuvriqo Portal+**.
3. Portal+ discovers the project's request types, organisations, statuses and customer-visible fields automatically.
4. Set up **Experience 1** (see *Experiences* in the Administrator Guide), then click **Save & publish**.
5. Open your customer portal. Portal+ appears at the top of the portal and help center pages.

Portal+ stays hidden until at least one experience is published, so customers never see an empty dashboard.

---

## 2. Experiences

An **experience** is one customer-facing version of Portal+: its branding, content and settings. You can have up to 12 per project, for example one per customer organisation.

### Who sees which experience

- **Experience audience:** the JSM organisations the experience is for. A customer gets the experience whose audience best matches their organisations.
- **Fallback:** one experience may have no audience. Customers who match no other experience get it. Without a fallback, unmatched customers don't see Portal+.
- **Help centers** let an experience appear on a specific JSM help center (see *Several customers on one project*).

### Experience settings

| Setting | What it does |
| --- | --- |
| Dashboard heading, Intro text | The title and line of text at the top of the dashboard |
| Dashboard modules | Show or hide Open requests, Awaiting customer, Awaiting support, Action Centre and the request list |
| Status mappings | Which workflow statuses count as *Awaiting customer* and *Awaiting support* (a status can't be both) |
| My Requests columns | Up to 8 extra fields shown as columns, including standard fields such as Description |
| Service tiles & Quick Actions | Categories of request types customers can raise; each category can be limited to certain organisations |
| Announcements | Short banners (information, warning, success) |
| Useful links | Links to other resources (must use https://) |
| Documents | Guides for this customer (see *Documents*) |
| Page layout | **Track requests first** (counters, Action Centre, then My Requests) or **Raise requests first** (Services at the top, for portals where Portal+ is the main page) |
| Tabs from other Nuvriqo apps | Adds tabs for Nuvriqo apps that announce themselves on the project |
| Always show Approvals / My Assets tab | Shows the Smart Approval or Asset Manager tab even before there is any data |
| Extra menu tabs | Up to 4 tabs you add yourself, each showing a card with your text and an optional button (https:// or a link on your site) |

---

## 3. Several customers on one project (help centers)

If you serve several customers from one service project, you can give each one their own branded help center.

1. In JSM, create a help center per customer (for example `/helpcenter/acme`) and link each to the same service project.
2. In Portal+, create an experience per customer. Set its **Experience audience** to that customer's organisations.
3. Under **Customer profile → Help centers**, enter the help center's URL ending (for example `acme`). Each help center can belong to only one experience.
4. Optionally, under **Limit requests to**, choose a dropdown custom field (for example *Customer*) and the value(s) for this customer.

**How access works:** the help center address decides the branding. The customer's JSM organisations decide what they can see. If someone opens another customer's help center, Portal+ shows them nothing.

**Limit requests to** only ever *narrows* what a customer sees. Customers see requests they reported or that are shared with their organisation, and within those, only requests whose field matches. Portal+ never shows a request JSM itself would hide from that customer.

To tag new requests automatically, add a Jira Automation rule that sets the field from the request's organisation. See *Automation: set Customer from organisation* for step-by-step rules.

---

## 4. Branding

Under **Brand identity**:

- **Brand name:** shown in the top bar and page title; its initials are used when there is no logo.
- **Logo:** upload a PNG, JPG, WebP or SVG up to 150 KB. It is stored inside Atlassian's Forge platform; nothing is loaded from external sites.
- **Accent colour, Hero title, Hero message, Search panel heading and text.**
- **Support button label and URL:** an optional button linking to your support page.
- **Show "Powered by Nuvriqo Portal+":** untick for a fully white-labelled portal. The small "Portal+" tag in the top bar follows this setting.

---

## 5. Self-service & customer actions

Open **Self-service & customer actions** in an experience.

### Request detail fields

Lists the fields customers can already see on your request forms. For each:

- **Show:** display it when a customer opens a request.
- **Customer can edit:** let customers change it after submitting. Supported types: text, multi-line text, number, date, date and time, dropdown. Other types (such as people or Assets fields) can only be shown.
- **Required when editing:** the customer can't clear it.

A field is only editable when it is also on the request type's edit screen in Jira.

### Service levels, reports & export

- **Show SLA progress:** SLA status on requests and in the detail panel. Requires SLAs set up in the project.
- **Show customer reports:** created vs resolved, by request type and status, SLA performance and average resolution time, with a period selector.
- **Offer Excel export:** adds Excel (.xlsx) alongside CSV. Exports contain the customer's own requests, up to 1,000.

### Customer actions

- **Let customers close requests / escalate requests:** choose the status each action moves a request to. Portal+ only runs a workflow transition into that status, and only when Jira offers it for that request without extra screen fields.
- **Internal note:** after a customer edits a field, closes or escalates, Portal+ adds an internal comment (agents only) naming the customer, because Jira records the change as made by the app. You can switch this off.

---

## 6. Documents

Add folders of guides for each experience. For each guide enter a title, a link and an optional description.

- Paste a normal Confluence page link from your knowledge base space; Portal+ converts it to the customer knowledge base link when you publish.
- Customers see a **Guides & documents** section with search, and a Documents tab.

Documents in a shared knowledge base space can still be found by any customer of the project through the standard knowledge base. Use this for customer-specific guides, not confidential material.

---

## 7. For customers

- **Home:** counters, requests needing your attention, services, announcements and guides.
- **My Requests:** search, filter by status, request type and date, save views, and export to CSV or Excel.
- **Request detail:** click a request to see its details, SLA and progress, update permitted fields, or close or escalate it where your provider allows.
- **Reports:** your request activity and service performance for a chosen period.

---

## 8. Companion apps

If Nuvriqo **Smart Approval Manager** or **Asset Manager** is installed, Portal+ shows **Approvals** and **My Assets** sections automatically. Portal+ works fully without them.

---

## 9. Troubleshooting

| Problem | Check |
| --- | --- |
| Portal+ doesn't appear | An experience is published; the customer is in its audience, or a fallback experience exists |
| Portal+ is blank on a help center | The help center's URL ending matches the experience's Customer profile, and the customer is in that experience's audience |
| A request is missing | The customer reported it or it is shared with their organisation; if **Limit requests to** is set, the request's field has a matching value |
| No SLA figures | SLAs are set up in the project and **Show SLA progress** or reports is ticked; SLAs only count once a cycle completes |
| Close or Escalate is missing | A target status is chosen; the transition is available from the request's current status and needs no extra screen fields |
| A field can't be edited | It is ticked *Customer can edit*, is a supported type, and is on the request type's edit screen |
| Logo won't save | PNG, JPG, WebP or SVG, 150 KB or smaller |
| Export stops at 1,000 | Exports are capped at 1,000 requests; the message says when a list was cut short |

Still stuck? See the support page.

---

## 10. Data and security (summary)

Portal+ runs entirely on Atlassian Forge, with no Nuvriqo servers and no data sent outside Atlassian. It stores only its configuration and uploaded logos, not request content or personal data. Customers see only requests they reported or that are shared with their organisations; this is checked on every request. See the privacy policy for details.
