# PARITY — New Custom Report

**Source:** `uat.maropost.com/accounts/116000/analytics/custom_reports/new`
**Rebuild:**
- Chooser — [`src/views/Analytics/CreateCustomReport.vue`](../../../src/views/Analytics/CreateCustomReport.vue)
- Wizards — [`src/views/Analytics/CreateCustomReportWizard.vue`](../../../src/views/Analytics/CreateCustomReportWizard.vue)
- Catalogue — [`src/views/Analytics/customReportCatalog.ts`](../../../src/views/Analytics/customReportCatalog.ts)
- Picker — [`src/components/analytics/ReportFieldPicker.vue`](../../../src/components/analytics/ReportFieldPicker.vue)

**Routes:** `/analytics/custom_reports/new` (`CreateCustomReport`) ·
`/analytics/custom_reports/new/:type` (`CreateCustomReportWizard`)
**Audit:** [AUDIT.md](AUDIT.md)

Scope per your Phase-2 decision: **all five wizards at full parity.**

---

## Chooser

| # | Audited | Status | Notes |
|---|---|---|---|
| 1 | Heading "New Custom Report Type" | ✅ | "New custom report" |
| 2 | Sub "Select the type of report you would like to create." | ✅ | Reworded |
| 3 | Five option cards, each with title + description | ✅ | `MpOptionCard`, all five, descriptions preserved in substance |
| 4 | Card click routes to that type's wizard | ✅ | Click selects, Continue commits; double-click still goes straight through |
| 5 | `← Back` link | ✅ | `MpPageHeader` `backTo` |
| 6 | `CANCEL` button | ✅ | |
| 7 | Full-bleed cyan brand canvas | ❌ **Dropped** | No design-system equivalent; see GAPS.md and IMPROVEMENTS #13 |
| 8 | — | ➕ | Step count shown on each card (`3 steps` / `2 steps`) — fixes audit G1 |

## Per-type shape

| # | Type | Slug | Steps | Status |
|---|---|---|---|---|
| 9 | Email campaign | `campaign` | 3 | ✅ |
| 10 | SMS campaign | `sms` | 3 | ✅ |
| 11 | SMS message | `message` | 2 | ✅ |
| 12 | Deliverability | `deliverability` | 2 | ✅ |
| 13 | Growth & attrition | `growth_attrition` | 2 | ✅ |
| 14 | Date-range heading varies per type | ✅ | `dateRangeTitle` in the catalogue; `null` for growth, matching the source |
| 15 | Breakup toggle only on Email campaign | ✅ | `hasBreakupToggle` |
| 16 | Assigned numbers only on SMS message | ✅ | `hasAssignedNumbers` |
| 17 | Unknown slug | ➕ | `MpErrorState` with a route back to the chooser. Source 404s on `/new/growth` |

## Step 1 — Schedule & delivery (all types)

| # | Audited | Status | Notes |
|---|---|---|---|
| 18 | Numbered stepper, completed → ✓ | ✅ | `MpWizardSteps` — now with `aria-current="step"` and visible labels |
| 19 | Breadcrumb gains the report name after step 1 | ⚠️ **Changed** | Kept the page title stable instead; the name is visible in the field. Logged in IMPROVEMENTS |
| 20 | `Report Name *`, the only gate on Next | ✅ | |
| 21 | `Once` / `Recurring` radio, default Once | ✅ | |
| 22 | Recurring swaps date range → Recur Every * / Time * / Report Delivery Date | ✅ | |
| 23 | Recur Every options: Day/Week/Month/Year | ✅ | |
| 24 | Recipient Email — optional on Once, required on Recurring | ✅ | Label and section description both change |
| 25 | Subject | ✅ | |
| 26 | Message | ✅ | |
| 27 | From/To default to year-start → today | ✅ | Local-calendar dates (the source's own picker is fine; our first cut had a UTC bug, fixed) |
| 28 | Breakup toggle + its explanation | ✅ | Explanation always visible |
| 29 | Date-range tooltip "filters campaigns in Step 2" | ✅ | Now a section description, and only on types where it is true |
| 30 | `help center article` link | ❌ **Dropped** | Points at a live help centre with no sandbox equivalent. Logged in IMPROVEMENTS |
| 31 | — | ➕ | From-date-after-To-date validation. The source has none |

## Step 2 — Report details

### Shared
| # | Audited | Status | Notes |
|---|---|---|---|
| 32 | `Report Type` (file format) — csv/xls/pdf/xlsx | ✅ | Relabelled `File format`, see IMPROVEMENTS #9 |
| 33 | `Date Format` — DD/MM/YYYY, MM/DD/YYYY | ✅ | |

### Email campaign
| # | Audited | Status | Notes |
|---|---|---|---|
| 34 | `Campaign Type(s) *` multi-select, 6 options | ✅ | `All Campaign Types` dropped as a *value* — see IMPROVEMENTS #4 |
| 35 | `Campaign Tags` multi-select | ✅ | |
| 36 | OR / AND radio, needs ≥2 tags | ✅ | Now **appears** at 2 tags instead of sitting permanently disabled |
| 37 | `Brands` multi-select | ✅ | |
| 38 | `Campaign Name` multi-select, refreshed by the filters above | ✅ | `campaignNameOptions` recomputes |
| 39 | 500-campaign cap | ✅ | Enforced; error only when actually exceeded |
| 40 | Red cap banner on entry | ⚠️ **Changed** | No longer fires on load. See IMPROVEMENTS #3 |
| 41 | Grey helper panel (2 lines) | ✅ | Folded into the section description |
| 42 | Body paragraph about matching | ✅ | Folded into field hints |
| 43 | `Preview of selections` live summary | ✅ | Moved directly under the filters, given `role="status"`, and shows a live match count |
| 44 | — | ➕ | Zero-match warning ("this report would come back empty") |

### SMS campaign / SMS message
| # | Audited | Status | Notes |
|---|---|---|---|
| 45 | SMS/Journey/Transactional **checkboxes** (multi) | ✅ | Checkboxes, not radios — matches the source |
| 46 | `Campaign Name *`, disabled until a source is checked | ✅ | With an explanatory hint |
| 47 | Campaign options load from the checked sources | ✅ | `SMS_CAMPAIGNS` map |
| 48 | `Include Test Messages` | ✅ | |
| 49 | `Include All Campaigns Messages` (SMS campaign only, gated) | ✅ | |
| 50 | `Include All Messages` | ✅ | |
| 51 | `Assigned Numbers` (SMS message, step 1) | ✅ | 5 mock numbers |

### Deliverability
| # | Audited | Status | Notes |
|---|---|---|---|
| 52 | `ISPs *` picker, 25 providers | ✅ | All 25, exact list |
| 53 | `Performance Metrics` picker, 11 metrics | ✅ | All 11, exact list |

### Growth & attrition
| # | Audited | Status | Notes |
|---|---|---|---|
| 54 | `Lists *` multi-select rendering `name (count)` | ✅ | From `useCdpEntities.lists` |
| 55 | `Performance Metrics` picker, 10 metrics | ✅ | All 10, exact list |

## Step 3 — Fields / metrics (Email campaign, SMS campaign)

| # | Audited | Status | Notes |
|---|---|---|---|
| 56 | Mandatory fields as read-only chips | ✅ | Email: all 10 · SMS: all 7 |
| 57 | Mandatory tooltip | ✅ | Now a visible section description |
| 58 | Optional fields, empty by default | ✅ | Email: 28 · SMS: 15 — exact lists |
| 59 | Optional tooltip | ✅ | Now visible |
| 60 | `ADD OPTIONAL FIELDS` button | ✅ | |
| 61 | Button → pencil icon once fields are chosen | ⚠️ **Changed** | Stays a labelled button ("Edit optional fields"). Fixes audit B9 |
| 62 | Selections render as removable chips | ✅ | |
| 63 | `BACK` / `SUBMIT` | ✅ | "Back" / "Create report" |

## Picker drawer (shared by all four pickers)

| # | Audited | Status | Notes |
|---|---|---|---|
| 64 | Right-side drawer, title + description | ✅ | `MpFormDrawer size="md"` |
| 65 | Search | ✅ | |
| 66 | `Select All` | ✅ | With indeterminate state |
| 67 | `Selected X (n)` / `Unselected X (n)` groups | ✅ | Live counts |
| 68 | Live binding, no Apply | ⚠️ **Changed** | Added Cancel/Apply. Fixes audit G10 |
| 69 | ✕ close | ✅ | |
| 70 | — | ➕ | `MpEmptyState` on a search miss |

## States

| # | State | Status | Notes |
|---|---|---|---|
| 71 | Default / empty | ✅ | |
| 72 | Loading | ✅ | Route-level |
| 73 | Validation, step 1 | ✅ | Per-field messages on Continue |
| 74 | Validation, step 2 | ✅ | Per-field messages |
| 75 | Error (500 cap) | ✅ | `v-alert type="error"`, blocks Continue |
| 76 | Warning (zero match) | ➕ | New |
| 77 | Disabled (SMS campaign field, gated) | ✅ | With reason |
| 78 | Deep-link to a wizard slug | ➕ **Fixed** | The source renders a permanently blank wizard (audit §4b); the rebuild hydrates |
| 79 | Unknown slug | ➕ **Fixed** | `MpErrorState` instead of a 404 page |
| 80 | Success | ⚠️ **Inferred** | Toast + redirect, per your Phase-2 decision. **Never observed on UAT** |
| 81 | Server error | ➖ **Not built** | No backend |
| 82 | Permission-restricted | ➖ **Not built** | No low-privilege account available |
| 83 | Unsaved-changes guard | ➕ **Added** | Source has none |

---

## Verification

- `npm run type-check` — passes
- `npm run build` — passes
- **axe-core 4.12.1, WCAG 2.0/2.1 A + AA — 0 violations** on: the chooser, wizard steps 1, 2 and 3,
  and the picker drawer. Remaining `incomplete` entries are `pseudoContent` colour-contrast checks
  (app-shell dotted background) plus Vuetify's own menu `aria-controls`, which points at a menu not
  rendered until opened. Neither originates in this code.
- Responsive: verified at 375 px — no horizontal overflow; the stepper collapses to numbers.
- All five wizards walked in-browser; Email campaign taken end-to-end through submit, producing a
  record in `useAnalytics.customReports`, a success toast and a redirect to the reports list.

## Known gaps

- **`Breakup report by days` has no visible effect.** Same as the source — its effect was not
  observable there either (audit unverified #3). The flag is collected but not acted on.
- **The 500-cap cannot be exercised** with 12 mock campaigns. The rule and its error state are
  implemented and unit-reachable, but not demonstrable with the current fixtures.
- **Mock campaign/SMS data is invented.** Real UAT campaign names were account-specific test junk
  (`dfwa`, `SFARWQF - Copy`); the rebuild uses realistic merchant-shaped names instead.
