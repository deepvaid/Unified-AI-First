# Recurring Campaign Reports — parity checklist

Rebuild: [`RecurringCampaignReports.vue`](../../../../src/views/Analytics/RecurringCampaignReports.vue)
at `/accounts/:accountId/reports/recurring_campaign_report` (old `/analytics/recurring_campaign_reports`
redirects). Store: `useAnalytics.recurringReports`.

| # | Audited item | Status |
|---|---|---|
| 1 | Breadcrumb/eyebrow context + H1 "Recurring Campaign Reports" | ✅ `MpPageHeader` |
| 2 | Table columns: expander · Name · Sent · Delivered · Opens · Clicks · Bounces · Total Revenue | ✅ expander pinned first (Vuetify defaults it last) |
| 3 | Expandable parent rows, lazy-loaded child occurrences with spinner in expander area | ✅ 450 ms simulated load, spinner row |
| 4 | Child rows "↳ MMM DD, YYYY at HH:MM AM" with same metric columns | ✅ |
| 5 | Parent name links to the campaign report | ✅ → `CampaignReport` route |
| 6 | Occurrence label links to that occurrence's campaign report | ✅ |
| 7 | Pagination footer, rows-per-page default 10 | ✅ `v-data-table` footer |
| 8 | No header actions / no filters (UAT has none) | ✅ none added |
| 9 | Empty state (unreachable in UAT; required by system rules) | ✅ `MpEmptyState` |
| 10 | Metric formatting: thousands separators, `$` revenue | ✅ `toLocaleString` + `formatCurrency` |

Deviations (all logged in ../IMPROVEMENTS.md):
- Toolbar search added (slice-standard "search on every list" rule).
- Expander buttons carry aria-labels + aria-expanded (UAT's are unnamed).
- Loading state on first paint via `MpTableSkeleton` (UAT shows the shell spinner).
