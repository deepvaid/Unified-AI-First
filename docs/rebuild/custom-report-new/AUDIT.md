# AUDIT — New Custom Report

**Source:** `https://uat.maropost.com/accounts/116000/analytics/custom_reports/new`
**Crawled:** 2026-08-28 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session
**Legacy stack:** Vue 2 + Vuetify 2

> Crawl method: the type chooser plus **all five** report-type flows were entered; the Email Campaign
> flow was walked end-to-end through step 3 with live data. **Nothing was submitted** — SUBMIT was
> never clicked, so the success state is inferred. See "Unverified".

---

## 1. Page purpose and primary user task

Build a scheduled, emailed data export. Despite living under Analytics, this is **not** a chart
builder — every output is a file (`.csv` / `.xls` / `.xlsx` / `.pdf`) delivered to a recipient
address, either once or on a recurring schedule.

The user task: *pick what kind of report → say when and to whom → scope the data → choose the
columns → submit.*

**Critical structural finding:** `/custom_reports/new` is **not a form**. It is a **type chooser**
that routes into **five different wizards with different step counts and different fields**. Any
rebuild is six surfaces, not one.

---

## 2. Layout structure and hierarchy

### 2a. The chooser — `/analytics/custom_reports/new`

```
AppBar + AppSidebar (global)
└── Full-bleed branded canvas   ← white top / diagonal cyan wedge / solid cyan bottom
    ├── "← Back" link (top-left, above everything)
    ├── H  "New Custom Report Type"
    ├── Sub "Select the type of report you would like to create."
    ├── Row of 5 option cards (white, line-art illustration, title, 2-line description)
    └── [CANCEL] (centred, outlined)
```

The diagonal cyan wedge is a one-off brand illustration used nowhere else in the product.

### 2b. The wizards — `/analytics/custom_reports/new/{slug}`

```
AppBar + AppSidebar (Analytics group auto-expands, "Custom Reports" marked active)
└── Content column (centred, ~905px)
    ├── Breadcrumb  "Reports › Create New Report › New Campaign Report"
    │                 ← gains the report name in quotes once step 1 is passed
    ├── Numbered stepper  ①──②──③   (completed steps become ✓; passive — not clickable)
    ├── H2  step title  +  subtitle line
    ├── step body
    └── [BACK] [NEXT]  or  [BACK] [SUBMIT]      (inline, not sticky)
```

---

## 3. The five report types

| Card title | Slug | Steps | Card description (verbatim) |
|---|---|---|---|
| Email Campaign | `campaign` | **3** | Create reports for all email campaigns, journeys and transactional emails. |
| SMS Campaign | `sms` | **3** | Create custom reports for all sms campaigns. |
| SMS Message | `message` | **2** | Create report to see individual outbound and inbound SMS messages. |
| Deliverability | `deliverability` | **2** | Create report to assess the success of your campaigns based on deliverability. |
| Growth & Attrition | `growth_attrition` | **2** | Create report to see how your lists have changed over a period of time. |

Step-1 shape differs per type — this is not cosmetic:

| Type | Date-range heading | Breakup toggle | Extra step-1 field |
|---|---|---|---|
| Email Campaign | `Campaign Date Range` ⓘ | **yes** | — |
| SMS Campaign | `Campaign Date Range` ⓘ | no | — (dates are `From Date *` / `To Date *`) |
| SMS Message | `Campaign Date Range` ⓘ | no | **`Assigned Numbers`** select above Schedule Report |
| Deliverability | `Report Date Range` | no | — |
| Growth & Attrition | *(none — dates sit bare under Schedule Report)* | no | — |

Sub-step headings per type (from live DOM):

- **Email Campaign** — ① Schedule & Delivery (Schedule Report / Campaign Date Range / Delivery Details)
  ② Report Details (+ Custom Report Details) ③ Report Fields/Metrics (Mandatory Fields / Optional Fields)
- **SMS Campaign** — ① same ② Report Details (+ `SMS Report Details`) ③ Report Metrics
  (`Mandatory Metrics` / `Optional Metrics`, button `Add optional Metrics`)
- **SMS Message** — ① same (+ Assigned Numbers) ② Report Details (+ `SMS Report Details`) — **no metrics step**
- **Deliverability** — ① same ② Report Details + `Report Metrics` (`ISPs *` w/ `Add ISPs`, `Performance Metrics` w/ `Add Performance Metrics`)
- **Growth & Attrition** — ① same ② Report Details + `Report Metrics` (`Lists *`, `Performance Metrics`)

---

## 4. Email Campaign flow — full detail (the reference implementation)

### Step 1 — Schedule & Delivery
Subtitle: `Select a method for scheduling your report. To learn more about campaign reporting, read help center article.`
(`help center article` is an inline link.)

| Field | Control | Required | Notes |
|---|---|---|---|
| `Report Name *` | text | **yes** | the *only* gate on NEXT |
| `Schedule Report` | radio `Once` / `Recurring` | — | default `Once` |
| `Breakup report by days` | switch + ⓘ | no | default off |
| `From Date` / `To Date` | date pickers | no | default `January 1, 2026` → `August 28, 2026` (year-start → today) |
| `Recipient Email` | text | no on Once, **`*` on Recurring** | |
| `Subject` | text (emoji picker on the right) | no | |
| `Message` | text | no | |

**Recurring swaps the date block entirely** — `Campaign Date Range` (From/To) is replaced by:
`Recur Every *` (Day / Week / Month / Year) · `Time *` (time picker) · `Report Delivery Date` (date picker).

Tooltips (verbatim):
- Breakup toggle — `Turning the toggle on will provide you day by day breakdown of the report data.`
- Campaign Date Range — `Date range selected here will filter out the campaigns sent within that time period, in Step 2`

### Step 2 — Report Details
Subtitle: `Enter the details of your report.`

| Field | Control | Options |
|---|---|---|
| `Report Type` | select | `Comma Separated List (.csv)` · `Excel Spreadsheet (.xls)` · `PDF Document (.pdf)` · `Excel 2012 Sheet (.xlsx)` |
| `Date Format` | select | `DD/MM/YYYY` · `MM/DD/YYYY` |

Then a bordered **Custom Report Details** panel:

- **Error banner (red, in-panel):**
  `A maximum of 500 email campaigns only may be selected` / `Please refine your selections.`
  Shows on entry because the default selection is everything; **disables NEXT**.
- `Campaign Type(s) *` — multi-select chips, clearable. Options:
  `All Campaign Types` · `Recurring Campaigns` · `Transactional Campaigns` · `Sent Campaigns` ·
  `Journey Based Campaigns` · `Test Campaigns`. `All Campaign Types` behaves as select-all/none.
  Defaults to `All Campaign Types`.
- **Helper panel (grey, right of the field):**
  `Re-selection of campaign types auto-refreshes all pick list options` /
  `You must select at least one Campaign Type, Campaign Tag, Brand or Campaign Name`
- `Campaign Tags` — multi-select + ⓘ
- `OR` / `AND` radio (+ ⓘ each) — **disabled until ≥2 campaign tags are chosen**
- `Brands` — multi-select + ⓘ
- Body copy: `The campaigns chosen for your custom report will be those matching the Campaign Type,
  Campaign Tag and Brand, that were sent within the date range you specified on Step 1.
  Alternatively, you can choose individual campaigns from the picklist below that are selected from
  options you've specified above.`
- `Campaign Name` — multi-select + ⓘ

**`Preview of selections`** — a live blue summary chip that restates the query in English:
`All Campaigns within date range "Jan 1, 2026 - Aug 28, 2026"` → after narrowing →
`All Recurring Campaigns within date range "Jan 1, 2026 - Aug 28, 2026"`.
**This is the single best idea on the page.**

### Step 3 — Report Fields/Metrics
Subtitle: `Enter the details of your report ISPs/Metrics.`

**`Mandatory Fields` ⓘ** — 10 read-only pill chips:
`Campaign ID` · `Campaign Name` · `Campaign Type` · `Campaign Send Date` · `Total Contacts` ·
`From Email` · `Subject` · `Total Emails Sent` · `Emails Delivered` · `Delivered Percentage`
Tooltip: `Mandatory fields represent mandatory data points for the campaigns you have selected to
create the report for. Mandatory fields cannot be changed.`

**`Optional Fields` ⓘ** — `Please select optional metrics based on which you want to create all report.`
Tooltip: `Optional fields represent data points that help provide more detailed information in the
report being created. They can be selected based on what information you want the report to provide.`

Button `ADD OPTIONAL FIELDS` → opens a right drawer. **Once any field is chosen the button is
replaced by a small pencil icon floated to the far right**, and the picks render as removable chips.

**Optional Fields drawer** — `Select the optional fields you would like to include in your report.`
Search · `Select All` checkbox · `Selected Fields (n)` group · `Unselected Fields (n)` group ·
**no Apply/Cancel footer — selections bind live**, ✕ to close.

All 28 optional fields:
`From Name` · `Total Email Opens` · `Total Email Opens Percentage` · `Unique Email Opens` ·
`Unique Email Opens Percentage` · `Total Emails Clicks` · `Total Emails Clicks Percentage` ·
`Unique Email Clicks` · `Unique Email Clicks Percentage` · `Total Email Bounces` ·
`Total Email Bounces Percentage` · `Soft Bounces` · `Soft Bounces Percentage` · `Hard Bounces` ·
`Hard Bounces Percentage` · `Complaints` · `Complaints Percentage` · `Unsubscribes` ·
`Unsubscribes Percentage` · `Click To Open Percentage` · `Campaign Tags` · `Brand Name` ·
`Total Revenue` · `Total Orders` · `Total Items Purchased` · `Total Unique Items Purchased` ·
`Conversion Rate` · `Average Order Value`

Footer: `BACK` · `SUBMIT`

### SMS-specific fields (SMS Campaign + SMS Message, step 2)
`SMS Report Details` section: **checkboxes** (not radios — multi-select)
`SMS Campaign` / `Journey Campaign` / `Transactional Campaign` · `Campaign Name *` (multi-select,
**disabled and empty until a campaign type is checked**; its label carries a live count —
`Campaign Name * (1)`) · checkboxes `Include Test Messages`, `Include All Campaigns Messages`
(SMS Campaign only; **disabled until a campaign type is checked**), `Include All Messages`.

---

## 4b. Second-pass crawl — the four pickers not opened in pass 1

All four use the **same drawer component** as Optional Fields: title, one-line description, Search,
`Select All`, `Selected X (n)` / `Unselected X (n)` groups, live binding, no Apply/Cancel footer.

### Deliverability → `ISPs *` — drawer `ISPs`
`Select the ISPs metrics you would like to include in your report.` — **25 options:**
`Aol.Com` · `Att.Net` · `Bellsouth.Net` · `Btest.Com` · `Btinternet.Com` · `Charter.Net` ·
`Comcast.Net` · `Cox.Net` · `Earthlink.Net` · `Gmail.Com` · `Gmx.De` · `Hotmail.Com` · `Live.Com` ·
`Me.Com` · `Msn.Com` · `Optonline.Net` · `Sbcglobal.Net` · `Shaw.Ca` · `Verizon.Net` · `Web.De` ·
`Yahoo.Ca` · `Yahoo.Co.Uk` · `Yahoo.Com` · `Ymail.Com` · `Yopmail.Com`

### Deliverability → `Performance Metrics` — **11 options:**
`Send Total` · `Received Total` · `Delivery Rate` · `Open Total` · `Open Rate` · `Click Total` ·
`Click Rate` · `Bounced` · `Bounce Rate` · `Complaint Total` · `Complaint Rate`

### Growth & Attrition → `Performance Metrics` — **10 options** (a completely different set):
`Total DNM` · `DNM Per List` · `Total User Attrition` · `User Attrition Per List` ·
`Total Subscribed User Growth` · `Subscribed User Growth Per List` · `Total Unsubscribed User Growth` ·
`Unsubscribed User Growth Per List` · `First Time Contacts Per List` · `Resubscribers Per List`

### Growth & Attrition → `Lists *`
Inline multi-select checkbox menu (**not** a drawer). Options render as **`name (count)`** —
`0903 (71)`, `116000_integration1 (325)`, `11july-list (46)`, `123321 (38)`, `12Aug-neto (0)`,
`12sept (38)`, … Maps directly onto the sandbox's `CdpList.name` + `CdpList.count`.

### SMS Campaign → step 3 `Report Metrics`
Subtitle: `Enter the details of your report Metrics.` (no "ISPs/" — Email Campaign's subtitle is
the buggy one.)
**Mandatory Metrics (7):** `Campaign ID` · `Campaign Name` · `Type` · `Campaign Send Date/Time` ·
`Contacts` · `SMS Sent` · `SMS Delivered`
**Optional Metrics (15)** — drawer `Performance Metrics`:
`Delivery Rate` · `SMS Replies` · `Replies Rate` · `Unsubscribes` · `Unsubscribe Rate` ·
`SMS Inbound` · `SMS Outbound` · `DNM` · `SMS Failed` · `Permanent Failure` · `Temporary Failure` ·
`Valid/Invalid Keyword` · `Valid/Invalid Keyword Response` · `Click Count` · `Unique Click Count`

Note the button here is `Add optional Metrics` (lowercase "o") vs Email Campaign's
`ADD OPTIONAL FIELDS` — and the body copy is `create the report` (correct) vs Email Campaign's
`create all report` (broken). The two flows were clearly written by different hands.

### Additional bug found in pass 2
**Deep-linking a wizard slug is broken.** Navigating directly to
`/analytics/custom_reports/new/growth_attrition` renders the breadcrumb and the stepper but
**no step content at all** — a permanently blank wizard. The flow only hydrates when entered
through the chooser. (`/new/campaign` behaved the same way on a cold load.) Also,
`/new/growth` — a plausible guess at the slug — returns the full-page `404 Not Found` screen.

---

## 5. Component inventory → design-system mapping

| Legacy element | Marobase equivalent |
|---|---|
| Type-chooser option cards | `MpOptionCard` (has `title`, `description`, `#media`) |
| Branded diagonal canvas | — **no equivalent; recommend dropping** (see GAPS) |
| Numbered stepper ①──②──③ | `MpWizardSteps` (`steps`, `current`, passive — exact match) |
| Breadcrumb + step title | `MpPageHeader` `backTo` + `title` + `subtitle` |
| `Schedule Report` / `Delivery Details` sub-sections | `MpFormSection` |
| Text / select / date / time fields | bare Vuetify in `MpFormGrid :cols="2"` |
| Radio pairs (Once/Recurring, OR/AND) | `MpFormField` wrapping `v-radio-group` |
| Switches | `v-switch` |
| Multi-selects w/ chips | `v-autocomplete multiple chips` |
| Red 500-cap banner | `v-alert type="error"` (see GAPS) |
| Grey helper panel | `v-alert type="info"` variant tonal |
| Blue `Preview of selections` | `v-alert type="info"` or `MpListRow` |
| Mandatory field pills (read-only) | `MpStatusChip type="general"` or plain `v-chip` |
| Optional-field chips (removable) | `v-chip closable` |
| Optional Fields drawer | `MpFormDrawer size="md"` |
| BACK / NEXT / SUBMIT | `v-btn` pair in page footer |
| ⓘ tooltips | `v-tooltip` |
| 404 "Not Found" | `MpErrorState` |

---

## 6. Accessibility findings

| # | Severity | Finding | WCAG |
|---|---|---|---|
| B1 | High | **Heading order skips H3.** Step titles are `H2`, sub-sections jump straight to `H4`. And there is no `H1`. | 1.3.1 |
| B2 | High | **The stepper is decorative markup** — no `aria-current="step"`, no accessible "Step 2 of 3" text. Progress is conveyed by colour and a ✓ glyph alone. | 1.3.1, 1.4.1 |
| B3 | High | **The 500-cap error banner has no `role="alert"`** and no association with the `Campaign Type(s)` field it constrains. A screen-reader user hits a disabled NEXT with no announced reason. | 3.3.1, 4.1.3 |
| B4 | High | **Type-chooser cards are not keyboard-operable as a group** — no radio semantics, no `aria-checked`, and the selection immediately navigates. | 2.1.1, 4.1.2 |
| B5 | Medium | **`Preview of selections` updates silently** — the page's best feature is invisible to assistive tech (no live region). | 4.1.3 |
| B6 | Medium | **Optional Fields drawer** has no focus trap or `aria-modal` verified, and the `Selected (n)` / `Unselected (n)` counts change without announcement. | 2.4.3, 4.1.3 |
| B7 | Medium | **Disabled OR/AND radios** give no reason (needs ≥2 tags). | 3.3.2 |
| B8 | Medium | **Hover-only ⓘ tooltips** carry load-bearing rules (the whole date-range→step-2 relationship). | 1.4.13, 2.1.1 |
| B9 | Medium | **The button→pencil swap** in step 3 replaces a labelled button with a bare icon and no accessible name. | 4.1.2, 2.4.6 |
| B10 | Low | **Breadcrumb not in a `<nav>`.** | 1.3.1 |
| B11 | Low | The chooser's `← Back` and the footer `CANCEL` are two controls for the same escape, neither obviously primary. | 3.2.4 |

---

## 7. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| G1 | **Five wizards with three different step counts under one entry point.** No indication on the chooser cards that some flows are 2 steps and others 3. | The chooser makes a big commitment feel small. |
| G2 | **Step 2 opens in an error state, every time.** Default = all campaign types = over the 500 cap. The user is greeted by a red banner and a dead NEXT before touching anything. | Worst first impression in the flow. |
| G3 | **The 500 cap is only discoverable by violating it.** Nothing warns beforehand; no count of how many are currently matched. | |
| G4 | **`All Campaign Types` is a trap** — it is both a value and a select-all, and it is the default that triggers G2. | |
| G5 | **Three competing explanations stacked in step 2** — red banner, grey helper panel, and a body paragraph, all describing the selection rules. | Nobody reads any of them. |
| G6 | **`Preview of selections` is buried at the very bottom** of the longest step, far from the controls it describes. | The one thing that makes the query legible is where nobody looks. |
| G7 | **Passive stepper.** Completed steps show ✓ but are not clickable — going back is BACK-only, and BACK re-renders rather than restoring scroll. | |
| G8 | **Copy errors in shipped UI:** `Enter details for whom the report will be sent too.` ("too" → "to"); `create all report` (→ "the report"); `Enter the details of your report ISPs/Metrics.` shown on the **Email Campaign** flow where ISPs do not apply. | |
| G9 | **`Report Type` means file format.** Colliding with "report type" from the chooser (Email Campaign / SMS / …). Two different meanings, one label, two screens apart. | |
| G10 | **Optional-fields drawer has no Apply/Cancel** — changes are irrevocable-by-default with no way to back out of an exploratory selection. | |
| G11 | **28 optional fields in a flat list** with only a search; no grouping (engagement / bounces / revenue) despite the obvious clusters. | |
| G12 | **Footer not sticky** on long steps. | |
| G13 | **The branded diagonal-cyan chooser canvas** looks like a different product from every other screen. | |
| G14 | **`Time *` and `Recur Every *` are required but appear only after switching to Recurring** — the required-ness of the step changes under the user. | |
| G15 | **No unsaved-changes guard** on leaving mid-wizard. | |
| G16 | **`Assigned Numbers` (SMS Message) sits above `Schedule Report`** — a data-scope field placed inside the scheduling step, inconsistent with every other type. | |

---

## 8. Mock-data notes

`src/stores/useAnalytics.ts` already has a `CustomReport` interface with "wizard parity fields"
(`reportType`, `scheduleMode`, `recipientEmail`, `subject`, `message`) — but its
`CustomReportType` union is `'SMS Message' | 'Deliverability' | 'Campaign Based' | 'SMS Report'`,
which **does not match** the five real types. It also has no `addCustomReport` action
(`CustomReports.vue` mutates the ref directly) and does not persist `dateRange`.

Option lists (`metrics`, `dimensions`, `dateRanges`, `visualizations`) are hard-coded inside
`CustomReports.vue` and describe a **chart** builder — a different product from what UAT ships.

---

## 9. Unverified — carried into Phase 2 questions

1. **Success state.** SUBMIT was never clicked. Redirect-to-list vs toast vs a "report queued"
   screen is unknown. → **Resolved in Phase 2:** rebuild uses sandbox conventions
   (`useToast().success` + redirect), documented as inferred.
2. **Server-side validation / failure** on submit.
3. **`Breakup report by days` = ON produced no visible field change** — its effect may be
   output-only, or may surface in a step not reached.
4. ~~The `ISPs`, `Performance Metrics`, `Lists` and SMS `Campaign Name` pickers~~ →
   **Resolved in the second-pass crawl, section 4b.** All four opened and enumerated.
5. **OR/AND enabled state** — inferred to need ≥2 tags; not confirmed (no tags in this account).
6. **Permission-restricted state.**
7. **Edit mode** — whether an existing report reopens in this wizard.
