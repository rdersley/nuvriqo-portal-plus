# Live help center tests

These checks sign in as two real test customers from different organisations
and confirm Portal+ keeps them apart on a shared JSM project.

## 1. Save a session for each test customer (once, and again when it expires)

Run this, sign in as the customer in the browser that opens, wait until your avatar shows (you are signed in), then close the browser window.
Keep the files outside the repo: they act as signed-in logins.

```
npx playwright codegen --save-storage=C:\jiraapps\portal-plus-notes\customer-a.json "https://nuvriqo.atlassian.net/servicedesk/customer/user/login?destination=portals"
npx playwright codegen --save-storage=C:\jiraapps\portal-plus-notes\customer-b.json "https://nuvriqo.atlassian.net/servicedesk/customer/user/login?destination=portals"
```

## 2. Set the environment and run

| Variable | Example | Meaning |
| --- | --- | --- |
| `PORTALPLUS_LIVE_SITE` | `https://nuvriqo.atlassian.net` | Site to test |
| `PORTALPLUS_LIVE_PORTAL_ID` | `35` | Shared service desk portal ID (optional; enables the portal-page checks) |
| `PORTALPLUS_LIVE_A_STATE` | `C:\jiraapps\portal-plus-notes\customer-a.json` | Customer A's saved session |
| `PORTALPLUS_LIVE_A_HELPCENTER` | `acme` | Customer A's help center URL ending |
| `PORTALPLUS_LIVE_A_BRAND` | `Acme Support` | Brand name set in A's experience |
| `PORTALPLUS_LIVE_B_*` | | The same three for customer B |

```
npm run test:live
```

Screenshots of every page and the exported CSV are saved under `live-test-results/`;
the HTML report is in `live-test-report/`.

### Sites without several help centers

Multiple help centers need JSM Premium. Without them, leave both `*_HELPCENTER` variables empty and set `PORTALPLUS_LIVE_PORTAL_ID`: both customers use the default portal, separation is checked through organisations, and tests 4 and 5 are skipped. The two brand names must differ.

## What is checked

1. A on A's help center: Portal+ shows A's brand and requests.
2. B on A's help center: Portal+ stays hidden; none of A's brand, requests or guides appear.
3. B on B's help center: B's brand; no request or guide shared with A.
4. A on the default help center portal page: same experience and requests as test 1.
5. A on A's help center home page: A's dashboard, no B requests.
6. A's CSV export: rows present, none of B's requests.
