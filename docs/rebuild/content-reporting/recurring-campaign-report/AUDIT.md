# Recurring Campaign Reports — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/reports/recurring_campaign_report`, 2026-09-01.
Legacy Vuetify 2 app inside the Vuetify 3 shell. No records mutated.

## Page purpose & primary user task

Roll-up report for **recurring campaigns** (campaigns that re-send on a schedule). Each parent row
is the recurring campaign with lifetime totals; expanding it lazy-loads one child row per
**occurrence** (each actual send). The only tasks are: scan totals, expand to per-send numbers,
and click through to a campaign report.

## Layout structure

```
Breadcrumb: "My Recurring Campaign Reports"
H1: "Recurring Campaign Reports"
(no header actions, no search, no filters, no tabs)
└── Table card
      ├── columns: [expander] · Name · Sent · Delivered · Opens · Clicks · Bounces · Total Revenue · [spacer]
      ├── parent rows (19 total), expander shows a spinner while children load
      ├── child rows: "↳ <Mon DD, YYYY at HH:MM AM>" + same metric columns
      └── footer: Rows per page (10) · "1-10 of 19" · prev/next
```

## Data fields

| Field | Notes |
|---|---|
| Name | link → `/accounts/:id/campaigns/:campaignId` (standard campaign report detail) |
| Sent / Delivered / Opens / Clicks / Bounces | integer counts |
| Total Revenue | currency, `$0` format |
| Child row label | occurrence send datetime, links to that occurrence's campaign report |

Parent totals are the sum of the child occurrences (30 = 6 × 5 in the sampled row).

## Interactions

- Expand/collapse parent row — children are lazy-loaded (spinner in the expander cell).
- Name / occurrence click → campaign report detail (already rebuilt: `CampaignDetail` pattern).
- Pagination + rows-per-page.
- Nothing else. No search, no date filter, no export, no row actions.

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| Page header + breadcrumb | `MpPageHeader` (`backTo` n/a; breadcrumb via header) |
| Table | `v-data-table` with `show-expand`, expandable occurrence rows |
| Loading child rows | inline `v-progress-circular` in expander cell (or preload in mock) |
| Empty state | `MpEmptyState` (UAT shows none — 19 records; parity requires one anyway) |
| Toolbar | `MpDataTableToolbar` **only if we add search (improvement, flag)** — UAT has none |

## Accessibility issues observed

- Expander button has no accessible name (icon-only, no aria-label).
- Child rows carry no relationship semantics (no `aria-level`/grouping) — screen readers read
  them as unrelated rows; the "↳" glyph is the only hierarchy cue.
- Metric cells are plain text with no column scope issues (headers are proper `th`).

## UX friction worth fixing (improvement candidates, not parity)

- 19 records with no search or sort on any metric column.
- No date-range filter even though A/B reports (sibling page) has Start/End Date.
- Parent row totals and child rows use the identical visual weight — hierarchy only via "↳".
- No export.

## Sandbox divergence (existing view is INVENTED)

`src/views/Analytics/RecurringCampaignReports.vue` (117 lines) shows Frequency / Next Run /
Avg Opens columns, a frequency quick-filter and a date-range select — **none of that exists in
UAT**, and it misses the real columns, the expandable occurrence rows, and the campaign links.
Same "invented page" family as the eRFM report. Route also differs:
sandbox `/analytics/recurring_campaign_reports` vs UAT `/reports/recurring_campaign_report`.
