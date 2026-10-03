# Portal+ — Automation: set Customer from organisation

Use these Jira Automation rules when several customers share one service project and each customer's Portal+ experience uses **Limit requests to** with a dropdown field such as *Customer*.

## Why you need it

Portal+ narrows each customer's dashboard, reports and exports to their own Customer value (for example Customer = Acme). A request with no Customer value matches no customer, so it doesn't appear in any Portal+ view until someone sets the field. These rules set it automatically from the request's JSM organisation.

Organisation membership still decides what a customer can see. The Customer field only narrows it.

## Before you start

Jira now calls issues "work items", so your menus may show either name.

1. **Share requests with the customer's organisation by default.** The rules read the request's **Organizations** field, which Portal+ also uses for organisation sharing. Set this under **Project settings → Customer permissions**.
2. **Note the Customer field's ID** (for example `customfield_10050`). Find it under **Jira settings → Work items → Custom fields**. In Portal+, the **Limit requests to** list in each experience's Customer profile shows your dropdown fields.

Option A below also needs each Customer dropdown option to be spelled exactly like its JSM organisation (option "Acme" for organisation "Acme"). If the names differ, use Option B.

## Rule 1: tag new requests

This rule sets Customer on every new request that doesn't already have one. Create it under **Project settings → Automation → Create rule**.

1. **Trigger:** *Work item created* (or *Issue created*).
2. **Condition:** *JQL condition* `Customer is EMPTY` (use your field's name). This leaves requests an agent has already tagged untouched.
3. **Action:** Option A or Option B below.
4. **Name** it "Portal+: set Customer from organisation" and turn it on.

### Option A: one action for all customers

Use this when option names match organisation names exactly. Add **Edit work item fields → More options → Additional fields** and paste the JSON below, replacing `customfield_XXXXX` with your field's ID.

```json
{
  "fields": {
    "customfield_XXXXX": { "value": "{{issue.Organizations.first.name}}" }
  }
}
```

### Option B: one branch per customer

Use this when the names differ (organisation "Acme Corporation", option "Acme"). Add an **If / else block** with one branch per customer.

| Branch | JQL condition | Edit work item fields |
| --- | --- | --- |
| If | `Organizations = "Acme Corporation"` | Customer = Acme |
| Else if | `Organizations = "Globex Ltd"` | Customer = Globex |
| Else if | one row per further customer | that customer's option |
| Else (optional) | none | *Send email* to your team: "Request {{issue.key}} has no customer organisation" |

## Rule 2 (optional): keep Customer in sync

This rule updates Customer when an agent moves a request to another organisation. Build it like Rule 1 with two changes:

- **Trigger:** *Field value changed → Organizations*.
- **No condition:** leave out the `Customer is EMPTY` check, so the field always follows the organisation.

## Rule 3: backfill existing requests (run once)

This rule tags requests created before Rule 1 existed. Run it once, then disable or delete it.

1. **Trigger:** *Scheduled*, with **Run a JQL search**: `project = KEY AND Customer is EMPTY AND Organizations is not EMPTY` (use your project key).
2. **Action:** the same edit as Rule 1, Option A or B.
3. Click **Run rule**, check the **Audit log**, then disable the rule.

A scheduled run processes up to 1,000 requests. If you have more, run it again until the JQL returns nothing.

## Check it worked

A new request from a customer's help center should show that customer's Customer value and appear in their Portal+ view straight away.

1. As a customer in the Acme organisation, raise a request from Acme's help center (for example `/helpcenter/acme`).
2. As an agent, open the request and confirm **Customer = Acme**. The rule's **Audit log** shows each run.
3. In Portal+ on Acme's help center, confirm the new request appears.

## Known limits

- A customer in two organisations gets the first one under Option A. Under Option B, the order of the branches decides.
- Automation runs count towards your Jira plan's monthly limit. Rule 1 runs once per new request.
