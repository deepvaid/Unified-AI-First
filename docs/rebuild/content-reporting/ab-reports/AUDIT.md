# A/B Campaign Reports — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/ab_reports` (+ one representative detail at
`/campaigns/3357/ab_report`), 2026-09-01. No records mutated.

## Page purpose & primary user task

List every A/B test campaign with roll-up metrics; drill into a per-test comparison dashboard
that pits variant A vs variant B vs the final (winner) send.

## 1. List — `/accounts/:id/ab_reports`

```
Breadcrumb: "My A/B Campaign Reports"
H1: "A/B Campaign Reports"          Header controls: [Start Date 📅] [End Date 📅]
└── Table card
      ├── columns: [expander] · Name · Contacts · Sent · Delivered · Opens · Clicks · Bounces ·
      │            Total Revenue · Sent At · Updated At
      ├── parent rows (35), expandable → child rows: variant A, variant B, remainder/final
      │   (e.g. "dvf - sdc", "dvf - dsc", "dvf") each with own Sent At
      └── footer: Rows per page (10) · "1-10 of 35" · prev/next
```

- Start Date / End Date are two separate small date-picker popovers (mini calendar), filtering
  the list by send window.
- Name links to `/accounts/:id/campaigns/:campaignId/ab_report` (the comparison detail).
- Sent At is blank on rows whose final send hasn't fired.

## 2. Detail — `/accounts/:id/campaigns/:campaignId/ab_report` ("AB Campaign Dashboard")

```
Breadcrumb: A/B Campaign Reports > <name>
H1: <campaign name>
└── 3-column comparison, one column per send:
      [<name> | Final Campaign          [variant A name]        [variant B name]
       "Decided by TopChoice", ⓘ]
      ├── 4 KPI tiles per column: Total Sent (count) · Total Opens (%) ·
      │   Total Clicks (%) · Click-to-Open (%) — each tile has a small colored icon
      ├── Metrics table (rows × 3 columns), each cell "<pct>% (<count>)" and LINKED:
      │   Delivered → delivered_report        Total Opens / Unique Opens → open_report
      │   Total Clicks / Unique Clicks → link_report
      │   Bounced / Soft / Hard Bounced → bounce_report
      │   Unsubscribed · Complaints
      ├── "Overview" section (rows × 3): Send Time · Subject · Pre-Header · Content (link to
      │   the content record) · From Name · Size (%) · Contacts Count · Conversions ·
      │   Total Revenue · Total Orders · Total Items Purchased · Total Unique Items Purchased ·
      │   Conversion Rate · Average Order Value
      └── "Details" section (single-column, readonly): From Email · Reply To · Language ·
          Brand · Lists (n) [chips] · Segments (n) · Suppress Lists (n) ·
          Suppress Secure Lists (n) · Suppress Segments (n) · Suppress Journeys (n) ·
          Campaign Tags (n)
```

- The final-campaign column is highlighted (tinted background) and captioned
  "Decided by TopChoice" with an info tooltip.
- "Size" is the audience split (65% / 21% / 12% etc. — the A/B split + remainder).

## Data shape (per A/B test)

```ts
{ id, name, contacts, sent, delivered, opens, clicks, bounces, totalRevenue,
  sentAt: string | null, updatedAt,
  variants: [ // A, B, final
    { name, kind: 'A'|'B'|'final', decidedBy?: 'TopChoice',
      totalSent, opensPct, clicksPct, clickToOpenPct,
      metrics: { delivered, totalOpens, uniqueOpens, totalClicks, uniqueClicks,
                 bounced, softBounced, hardBounced, unsubscribed, complaints }, // % + count each
      overview: { sendTime, subject, preHeader, contentName, fromName, sizePct,
                  contactsCount, conversions, totalRevenue, totalOrders,
                  totalItemsPurchased, totalUniqueItemsPurchased, conversionRate,
                  averageOrderValue } } ],
  details: { fromEmail, replyTo, language, brand, lists: string[], segments: string[],
             suppressLists/SecureLists/Segments/Journeys: string[], campaignTags: string[] } }
```

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| List page header | `MpPageHeader` + date fields in `#actions` |
| List table | `v-data-table` with `show-expand` (variant child rows) |
| Detail KPI tiles | `MpKpiCard` (4 per column) |
| Comparison table | `v-table` with sticky first column, winner column tinted via tokens |
| Details chips | `v-chip` groups under `MpFormSection`-style headings |
| Per-metric drill links | keep as links → campaign sub-reports (out of scope to rebuild) |

## Accessibility issues observed

- Start/End Date popover calendar is tiny and mouse-only in practice (keyboard focus not
  visible when tabbing days).
- Expander buttons unnamed (same as recurring report).
- On the detail, metric-cell links read as bare percentages ("100.0% (1)") with no context of
  row+column for screen readers.
- The winner column's meaning is conveyed by background tint alone.

## UX friction worth fixing

- Two bare date fields with no preset ranges, no clear affordance, no applied-filter chip.
- Detail page repeats "0.0% (0)" dozens of times with no visual differentiation of the winner
  beyond tint; no delta/winner badges.
- "Sent At" blank cells (final not sent) look like missing data.

## Sandbox divergence (existing view is INVENTED)

`src/views/Analytics/ABCampaignReports.vue` (124 lines) — invented columns/design, no variant
child rows, no comparison detail page. Route differs: sandbox
`/analytics/ab_campaign_reports` vs UAT `/ab_reports`.
