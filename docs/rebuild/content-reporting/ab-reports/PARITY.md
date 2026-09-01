# A/B Campaign Reports — parity checklist

Rebuild: [`ABCampaignReports.vue`](../../../../src/views/Analytics/ABCampaignReports.vue) at
`/accounts/:accountId/ab_reports` (old `/analytics/ab_campaign_reports` redirects) +
[`ABCampaignReportDetail.vue`](../../../../src/views/Analytics/ABCampaignReportDetail.vue) at
`/accounts/:accountId/campaigns/:id/ab_report`. Store: `useAnalytics.abReports`.

## List

| # | Audited item | Status |
|---|---|---|
| 1 | H1 "A/B Campaign Reports" + Start/End date filtering in the header | ✅ consolidated into `MpDateRangeSelect` (flagged) |
| 2 | Columns: expander · Name · Contacts · Sent · Delivered · Opens · Clicks · Bounces · Total Revenue · Sent At · Updated At | ✅ |
| 3 | Expandable rows → variant children (A, B, final) with own Sent At, lazy spinner | ✅ |
| 4 | Name links to `/campaigns/:id/ab_report` | ✅ |
| 5 | Sent At blank when final unsent | ✅ (null → empty) |
| 6 | Pagination, rows-per-page 10 | ✅ |
| 7 | Empty state | ✅ `MpEmptyState` |

## Detail ("AB Campaign Dashboard")

| # | Audited item | Status |
|---|---|---|
| 1 | Breadcrumb "A/B Campaign Reports > name" | ✅ `backTo` + eyebrow |
| 2 | 3 columns: Final ("Decided by TopChoice") · variant A · variant B | ✅ final column tinted + labelled chip |
| 3 | 4 KPI tiles per column (Total Sent / Total Opens % / Total Clicks % / Click-to-Open %) | ✅ |
| 4 | 10-row metric table, cells "pct% (count)" | ✅ |
| 5 | Metric cells link to delivered/open/link/bounce sub-reports | ⚠️ rendered as text — legacy sub-report pages are outside slice scope (GAPS.md) |
| 6 | Overview rows (14: Send Time … Average Order Value) | ✅ |
| 7 | Details: From Email / Reply To / Language / Brand + chip sections with counts (Lists, Segments, 4 suppressions, Campaign Tags) | ✅ |
| 8 | Unsent test: final column zeroed with "—" send time | ✅ (Holiday Preview seed) |
| 9 | Not-found id | ✅ `MpEmptyState` + back action (UAT behavior unverified) |

Deviations (../IMPROVEMENTS.md): date-range control replaces two bare date fields; winner
labelled with a chip instead of tint-only; wide table scrolls inside the card
(`overflow-x: auto`).
