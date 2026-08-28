# PARITY — Custom Reports (list)

**Source:** `uat.maropost.com/accounts/116000/analytics/custom_reports`
**Rebuild:** [`src/views/Analytics/CustomReports.vue`](../../../src/views/Analytics/CustomReports.vue)
**Route:** `/accounts/:accountId/analytics/custom_reports` (name `CustomReports`, unchanged)
**Audit:** [AUDIT.md](AUDIT.md)

Scope per your Phase-2 decision: **strict parity — the previous card grid and its drawer builder
were deleted.**

---

## Header

| # | Audited | Status | Notes |
|---|---|---|---|
| 1 | Title `Custom Reports` | ✅ | Now a real `<h1>` (source used a styled `<span>`) |
| 2 | Type filter `All ▾`, 6 options | ✅ | `All` + the five types, exact source labels |
| 3 | `NEW REPORT` button | ✅ | `New report`, routes to the type chooser |
| 4 | — | ➕ | Search by name — your Phase-2 decision, see IMPROVEMENTS |
| 5 | — | ➕ | Record count (`43 RECORDS`) and a removable active-filter chip |

## Table

| # | Audited | Status | Notes |
|---|---|---|---|
| 6 | Column `Name`, sortable | ✅ | |
| 7 | Column `Type` | ✅ | Five values, source labels (`Campaign Based`, `SMS Report`, …) |
| 8 | Column `Status` | ✅ | `Scheduled` / `Recurring` via `MpStatusChip type="report"` |
| 9 | Status colours: Scheduled amber, Recurring blue | ✅ | New `report` tone map on `MpStatusChip` — `scheduled: warning`, `recurring: brand` |
| 10 | Column `Updated At`, sortable | ✅ | `Updated at`; format `MMM DD, YYYY at HH:MM AM/PM` matched exactly |
| 11 | Column `Actions` | ✅ | |
| 12 | Default sort: Updated At descending | ✅ | |
| 13 | Row hover fill | ✅ | Vuetify default |
| 14 | **Rows are not clickable — no open/edit** | ✅ | Kept for parity (audit F1). See "Deliberate deviations" |
| 15 | Sort on Type / Status / Actions disabled | ✅ | |

## Row actions

| # | Audited | Status | Notes |
|---|---|---|---|
| 16 | `Duplicate Report` | ✅ | Appends ` copy`, inserts at top with a fresh timestamp, success toast |
| 17 | `Download Report` | ✅ | Toast only — no file to generate in a mock sandbox. Documented as simulated |
| 18 | `Delete Report` | ✅ | `MpConfirmDialog` `danger`, names the report, lists consequences |
| 19 | All three always enabled | ✅ | |
| 20 | — | ➕ | Delete separated by a divider and rendered in the error colour |

## Pagination

| # | Audited | Status | Notes |
|---|---|---|---|
| 21 | Rows-per-page select | ✅ | Same options: 5 / 10 / 25 / 50 / 100 |
| 22 | Default 10 | ✅ | Kept, despite audit F11 |
| 23 | Range label `1-10 of N` | ✅ | |
| 24 | Prev / next | ✅ | Vuetify adds first/last as well |

## States

| # | State | Status | Notes |
|---|---|---|---|
| 25 | Default | ✅ | |
| 26 | Loading | ✅ | `MpTableSkeleton` on first load, replacing the source's `Loading... Please wait` text row |
| 27 | Filtered / searched to zero | ➕ | `MpEmptyState` + Clear filters. **Unreachable in the source** (audit unverified #1) |
| 28 | No reports at all | ➕ | `MpEmptyState` + New report. Also unreachable in the source |
| 29 | Delete confirmation | ➕ | Source's is unverified; this is the sandbox convention |
| 30 | Error | ➖ **Not built** | No backend |
| 31 | Permission-restricted | ➖ **Not built** | No low-privilege account available |

---

## Verification

- `npm run type-check` — passes
- `npm run build` — passes
- **axe-core 4.12.1, WCAG 2.0/2.1 A + AA — 0 violations, 21 passes.** Remaining `incomplete`
  entries are the app shell's `pseudoContent` contrast checks and Vuetify's own menu
  `aria-controls`; neither originates in this code.
- **Zero console errors**, confirmed in a fresh tab.
- Responsive at 375 px: no page-level horizontal overflow; the table scrolls inside its own
  container and the toolbar stacks.
- Interaction sweep: sort both columns, type filter, search, filter chip removal, Clear filters,
  duplicate, delete + confirm, pagination, and a create→list round trip
  (Deliverability report appears at top with the right Type, Status and timestamp).

## Store changes

`CustomReport` was restructured to model what this page actually holds. The old shape described a
chart (`metric` × `dimension` × `visualization` × `source`) that exists nowhere in UAT and drove
only the deleted card grid.

| Before | After |
|---|---|
| `source`, `visualization`, `metric`, `dimension`, `schedule`, `owner`, `lastRun`, `status` | *(removed — dead once the card grid went)* |
| `reportType?` (4 values, no Growth & Attrition) | `reportType` (required, **5** values matching the list's labels) |
| `scheduleMode?` | `scheduleMode` (required) |
| — | `updatedAt` |
| 6 seeded rows | **42** seeded rows across all five types and both schedule modes |

`ReportTypeDef` gained `listLabel`, because the chooser and the list name the same five things
differently (audit F6) — `Email campaign` → `Campaign Based`, `SMS campaign` → `SMS Report`.

## Deliberate deviations

1. **No edit or open path**, matching the source (audit F1). This is the one place where parity
   costs real capability: the previous sandbox page could edit a report and this cannot.
   **Flagged for your review** — the source's limitation may not be one worth replicating.
2. **Status column keeps the source's misleading name.** The values are schedule modes, not
   execution states. Per your Phase-2 decision the column reads `Status`; the mislabelling is
   logged in IMPROVEMENTS.md rather than fixed.
3. **Search added** (your Phase-2 decision) — the one feature not present in the source.
4. **`aria-sort` is mirrored onto the header cells** by a local watcher, because Vuetify 3's
   `v-data-table` emits none. This is the same WCAG 1.3.1 gap the source has (audit A5); fixing it
   only here is a stopgap — see GAPS.md.
