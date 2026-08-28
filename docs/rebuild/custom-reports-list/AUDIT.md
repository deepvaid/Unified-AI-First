# AUDIT — Custom Reports (list)

**Source:** `https://uat.maropost.com/accounts/116000/analytics/custom_reports`
**Existing sandbox page:** `http://localhost:5173/accounts/2000290/analytics/custom_reports`
→ [`src/views/Analytics/CustomReports.vue`](../../../src/views/Analytics/CustomReports.vue) (298 lines)
**Crawled:** 2026-08-28 · account 116000 · Chrome, authenticated session
**Legacy stack:** Vue 2 + Vuetify 2

> Crawl method: full interaction sweep — type filter, both sortable columns, pagination,
> rows-per-page, row actions menu, row click — plus DOM/ARIA inspection.
> **No record was created, duplicated, downloaded or deleted.** All three row actions are
> write/side-effecting on live UAT data, so their outcomes are inferred. See "Unverified".

---

## 1. Page purpose and primary user task

The register of saved custom reports for the account. It is a **management list, not a viewer**:
you come here to find a saved report and then duplicate, download or delete it — or to start a new
one.

**Critical structural finding:** there is **no way to open, view or edit a report from this page.**
Rows are not links, row clicks do nothing, and the actions menu offers only Duplicate / Download /
Delete. Once created, a report's configuration is effectively write-once — the only way to get a
variant is to duplicate it and rebuild, or delete and start over.

## 1b. The existing sandbox page is a different product

This matters more than usual, because the sandbox already has a `CustomReports.vue`:

| | UAT (source) | Sandbox (current) |
|---|---|---|
| Layout | **Data table**, 5 columns, paginated | **Card grid**, 3-up responsive |
| Scale | 210 reports, server-paginated | 6 reports, all rendered |
| Filter | Type dropdown (6 options) | none |
| Sort | Name, Updated At (server-side) | none |
| Row actions | Duplicate · Download · Delete | Edit · Run |
| Create | `NEW REPORT` → type chooser | `Create Report` → type chooser *(rewired in the previous task)* |
| Edit | **not possible** | `MpFormDrawer` builder |
| Per-report data shown | Name, Type, Status, Updated At | Name, metric×dimension, source, visualization, schedule, owner, lastRun, status |

The sandbox page is a chart-library concept (`metric` by `dimension`, visualization type, Run).
UAT is a scheduled-export register. **They share a name and nothing else.** This is a rebuild, not
a polish.

---

## 2. Layout structure and hierarchy

```
AppBar + AppSidebar (global)
└── Content column (max ~875px, centred, generous gutters)
    ├── Header row — all three on one line:
    │     "Custom Reports"        (span, styled — not a heading)
    │     [ All ▾ ]               type filter, ~235px, outlined
    │     [ NEW REPORT ]          dark filled, uppercase
    ├── Table card (white, hairline border, subtle radius)
    │     ├── Header row: Name↕ | Type | Status | Updated At↕ | Actions
    │     ├── 10 data rows (default), row hover = grey fill
    │     └── Footer: "Rows per page: [10 ▾]   1-10 of 210   ‹  ›"
    └── (no page-level footer)
```

There is **no search field** on this page — the only narrowing tool is the type filter.
The global AppBar search is unrelated.

---

## 3. Component inventory → design-system mapping

| # | Legacy element | Observed behaviour | Marobase equivalent |
|---|---|---|---|
| 1 | Page title "Custom Reports" | Styled `span`, not a heading | `MpPageHeader` `title` |
| 2 | Type filter `All ▾` | Single-select, 6 options, server-side, resets to page 1 | `MpDataTableToolbar` `#filter-content` or a toolbar `v-select` |
| 3 | `NEW REPORT` button | Routes to the type chooser | `MpPageHeader` `#actions` → `v-btn` |
| 4 | Table | `v-data-table` (Vuetify 2), server-driven | `v-data-table` + `MpDataTableToolbar` |
| 5 | Sortable headers (Name, Updated At) | `aria-sort="none"`, arrow glyph on active | `v-data-table` native sort |
| 6 | Status chip | Outlined pill; `Recurring` blue, `Scheduled` amber | **`MpStatusChip`** — needs a new `type` map, see GAPS |
| 7 | Row actions `⋮` | Menu: Duplicate / Download / Delete | `MpRowActionsMenu` |
| 8 | Pagination footer | Rows-per-page select + range + prev/next | `v-data-table` footer |
| 9 | In-table loading row | `Loading... Please wait` + thin progress bar under the header | `MpTableSkeleton` |
| 10 | App-shell boot screen | "Just a moment / Preparing an optimised workspace for you" + progress bar | n/a — sandbox has no equivalent boot gate |
| 11 | Empty state | **not reached** — see Unverified | `MpEmptyState` |
| 12 | Delete confirmation | **not tested** — destructive | `MpConfirmDialog` `danger` |

---

## 4. Data fields, labels and copy (verbatim)

### Header
- Title: `Custom Reports`
- Filter values: `All` · `Campaign Based` · `SMS Report` · `SMS Message` · `Deliverability` · `Growth & Attrition`
- Button: `NEW REPORT`

### Table columns
| Column | Content | Sortable |
|---|---|---|
| `Name` | Free text, often long (`116000 Recurring Growth & Attrition report- 7th Nov 2025`); wraps to 3–4 lines | **yes** |
| `Type` | One of the 5 report types | no |
| `Status` | `Scheduled` (amber) or `Recurring` (blue) | no |
| `Updated At` | `MMM DD, YYYY at HH:MM AM/PM`, wraps to 2 lines | **yes** |
| `Actions` | `⋮` kebab | no |

### Row actions menu
`Duplicate Report` · `Download Report` · `Delete Report` — all three always enabled, regardless of
type or status.

### Pagination
- `Rows per page:` · options **5 / 10 / 25 / 50 / 100**, default `10`
- Range label `1-10 of 210` (`1-0 of 210` while loading)
- Prev / next chevrons; prev disabled on page 1

### Loading
- In-table: `Loading... Please wait`
- App boot: `Just a moment` / `Preparing an optimised workspace for you`

### Observed data
210 reports on this account. Sample names show the real-world shape — long, dated, prefixed with
the account id, and littered with test junk (`hbt test`, `allfin`, `ergfdv`, `efvds`, `fdsc`,
`dsvbrh`, `hard`, `abtyuc`, `gacampcustcheck`, `niks088`, `ss_growth_116000`,
`116000- Recurring Growth & Attrition 3rd Oct 2025 copy`).

**Type distribution:** Growth & Attrition = 9 of 210 (verified by filtering).

---

## 5. Interactions and behaviours

| Behaviour | Detail |
|---|---|
| **Default sort** | `Updated At` descending — newest first |
| **Sort** | Server-side. Clicking a sortable header shows `Loading... Please wait`, sets the range to `1-0 of N`, then re-renders. Arrow glyph marks the active column |
| **Filter** | Server-side; updates the total (`1-9 of 9` for Growth & Attrition). **Preserves the active sort.** Menu stays open after selecting |
| **Pagination** | Server-side; rows-per-page change re-fetches |
| **Row hover** | Grey fill across the full row |
| **Row click** | **Nothing.** URL unchanged, no navigation, no drawer |
| **Duplicate** | Inferred: creates a copy. A row named `…3rd Oct 2025 copy` exists, so the convention appears to be a ` copy` suffix. **Not executed** |
| **Download** | Inferred: downloads the generated file. **Not executed** |
| **Delete** | Inferred: removes the report, presumably behind a confirm. **Not executed** |
| **Create** | `NEW REPORT` → `/analytics/custom_reports/new` (the type chooser rebuilt in the previous task) |

---

## 6. Accessibility findings

Verified against the live DOM.

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | High | **The 10 row-action kebabs have no accessible name.** `aria-label` null, no `title`, no text content — a screen reader announces ten identical "button"s with nothing to tell them apart | 4.1.2, 2.4.6 |
| A2 | High | **The type filter has no label.** `input-14` has no `<label for>` and no `aria-label`; its only clue is the current value ("All") | 3.3.2, 4.1.2 |
| A3 | High | **A raw i18n key is exposed as an accessible name.** The rows-per-page control carries `aria-label="$vuetify.dataTable.itemsPerPageText"` — an untranslated Vuetify translation key read aloud verbatim. Shipped bug | 4.1.2 |
| A4 | Medium | **No `<h1>`.** The visible page title is a styled `<span class="secondary--font">`; the only heading on the page is an unrelated `H2` | 1.3.1, 2.4.6 |
| A5 | Medium | **Sortable headers never update `aria-sort`** — it stays `"none"` on all five columns even when a sort is active. Sort state is conveyed by an arrow glyph only | 1.3.1, 4.1.2 |
| A6 | Medium | **The loading state is not announced.** `Loading... Please wait` is a plain table cell with no `role="status"`/`aria-live`, so sorting or filtering is silent to assistive tech | 4.1.3 |
| A7 | Medium | **Table has no accessible name** — no `<caption>`, no `aria-label` | 1.3.1 |
| A8 | Low | **Menus and overlays render semi-transparent**, letting table text show through the filter dropdown, the actions menu and the rows-per-page menu. Text-on-text at roughly 50% opacity fails contrast in every overlay on the page | 1.4.3 |
| A9 | Low | **Status is colour + text**, which is fine — but the two amber/blue outlined pills are the only status affordance and carry no icon | (passes 1.4.1) |

---

## 7. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| F1 | **No way to open or edit a saved report.** Rows are inert; the menu has no Edit or View | The single biggest gap. A typo in a recipient email means duplicating and rebuilding, or deleting and starting over |
| F2 | **No search.** 210 reports, and the only filter is by type | Finding `116000 Recurring Email campaign report- 7th Nov 2025` among 210 means paging through 21 pages or sorting alphabetically and hunting |
| F3 | **`Status` does not mean status.** The values are `Scheduled` and `Recurring` — that is the *schedule mode*, not an execution state. Nothing tells you whether a report last ran, succeeded, or failed | The column named after health tells you nothing about health |
| F4 | **No "last run" or "next run" anywhere** | For a page whose entire purpose is scheduled exports, the schedule itself is invisible beyond a one-word mode |
| F5 | **`Updated At` is the only date** and it wraps to two lines in a narrow column, while `Name` wraps to four | Two of five columns are mostly whitespace and line breaks |
| F6 | **Type-name inconsistency with the create flow.** The chooser says `Email Campaign` and `SMS Campaign`; this list says `Campaign Based` and `SMS Report` | The same five things are named differently on adjacent screens |
| F7 | **The type filter dropdown stays open after you pick** a value, overlaying the results it just changed | You cannot see the effect of your own action without dismissing the menu |
| F8 | **Every overlay is semi-transparent**, so menu items sit on top of table text | Looks broken; hurts legibility (see A8) |
| F9 | **No bulk actions and no row selection** despite 210 rows and obvious test-junk to clear out | Deleting the ~15 junk reports visible in the first two pages is 15 separate menu journeys |
| F10 | **Destructive Delete sits directly below Download** in a 3-item menu with no separation or emphasis | One slip between adjacent items is unrecoverable |
| F11 | **Default page size 10 against 210 rows** = 21 pages | 25 or 50 would suit the data volume better |
| F12 | **No indication of who created a report or when it was created** | On a shared account with 210 reports, ownership is invisible |

---

## 8. Realistic mock-data shape for the rebuild

The sandbox's `CustomReport` interface does not fit this page:

- `status: 'Ready' | 'Running' | 'Scheduled'` — UAT's values are `Scheduled` | `Recurring`, which is
  the schedule mode. The existing `scheduleMode?: 'Once' | 'Recurring'` field is the real match.
- `CustomReportType = 'SMS Message' | 'Deliverability' | 'Campaign Based' | 'SMS Report'` — **four**
  values, missing `Growth & Attrition`. UAT's filter has all five.
- No `updatedAt` field. `lastRun` exists but is a different concept.
- `visualization`, `metric`, `dimension`, `source` have no counterpart on UAT and drive the entire
  card grid.

Only 6 seeded reports; the page's defining characteristic is 210. A realistic seed needs ~40+ rows
across all five types with mixed schedule modes and a spread of `updatedAt` dates.

---

## 9. Unverified — carried into Phase 2 questions

1. **Empty state.** Unreachable — every one of the five type filters returns rows on this account.
2. **Delete confirmation.** Not tested; destructive against live UAT data.
3. **Duplicate outcome.** Not tested; writes a record. The naming convention (` copy` suffix) is
   inferred from an existing row.
4. **Download outcome.** Not tested; triggers a file download.
5. **Error state** (failed fetch, failed download).
6. **Permission-restricted state** — no low-privilege account available.
7. **Responsive behaviour.** The browser pane would not shrink below 1054px, so narrow-width
   behaviour was **not directly re-tested on this page**. The same app shell was verified broken
   below ~900px on `/contact/new` earlier in this session (sidebar holds full width, content
   collapses), and this page inherits that shell.
