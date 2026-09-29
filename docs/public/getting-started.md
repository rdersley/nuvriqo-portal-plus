# Portal+ — Getting Started

This page takes you from installing Portal+ to a published customer dashboard in about 15 minutes.

## Requirements

- Jira Service Management Cloud.
- Permission to install apps on your Jira site (site or organisation admin).
- Jira project administrator rights on the service project you want to set up.
- Customers in JSM organisations, if you want to give different customers different experiences. A single experience for everyone works without organisations.

## 1. Install Portal+

1. In Jira, go to **Apps → Explore more apps** and search for **Nuvriqo Portal+**.
2. Choose **Try it free** or **Buy now**, and approve the app's permissions.

Portal+ runs entirely on Atlassian Forge, so there is nothing to host and no data leaves Atlassian. Customers never see an "Allow access" prompt.

## 2. Open the Portal+ settings

1. Open your service project.
2. Go to **Project settings → Apps → Nuvriqo Portal+**.

Portal+ discovers the project's request types, organisations, workflow statuses and customer-visible fields automatically. Each service project is configured separately.

## 3. Set up your first experience

An experience is one customer-facing version of Portal+. Start with **Experience 1**:

1. **Brand identity:** enter a brand name and upload a logo (PNG, JPG, WebP or SVG, up to 150 KB), and pick an accent colour.
2. **Dashboard:** set the heading and intro text, and choose which modules to show.
3. **Status mappings:** choose which statuses count as *Awaiting customer* and *Awaiting support*.
4. **Services:** group request types into service tiles so customers can raise the right request quickly.
5. **Experience audience:** leave it empty to make this the fallback experience for all customers, or pick the JSM organisations it is for.

## 4. Publish

Click **Save & publish**. Portal+ stays hidden on the portal until at least one experience is published, so customers never see an empty dashboard.

## 5. Check the customer view

Open your customer portal as a customer (or ask a colleague who is one). Portal+ appears at the top of the portal home page and help center pages, with the customer's own requests, counters and services.

## Next steps

- Serving several customers from one project? Give each one an experience and their own help center. See the Administrator Guide.
- Turn on SLA progress, customer reports and Excel export under **Self-service & customer actions**.
- Let customers edit chosen fields, or close and escalate requests, using only the workflow steps you allow.
- Add customer guides from your Confluence knowledge base under **Documents**.

If Portal+ doesn't appear, see Troubleshooting.
