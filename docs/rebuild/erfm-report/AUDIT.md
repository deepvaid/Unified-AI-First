# AUDIT — eRFM Report

**Source:** `https://uat.maropost.com/accounts/116000/erfm_report`
**Crawled:** 2026-08-31 · account 116000 (Regular UID Cloud-UAT) · authenticated Chrome session · viewport 1728px
**Stack:** legacy MMC micro-frontend (`#mfe-outlet-marketing`), Vue 3 + Vuetify 3, chunk
`src_modules_Reports_erfm_ErfmReportPage_vue.js`. Charts are **mixed**: ECharts via `vue-echarts`
(`VChart`) for the heatmap and Sankey, **Chart.js** via `vue-chartjs` (`Bar`) for the distribution
bars.

**Crawl method note:** the page never reaches `document_idle` (a hanging
`accounts-uat…/users/groups` request plus Amplitude polling), so **screenshot and
accessibility-tree capture were unavailable for the whole session**. The audit below was taken by
JavaScript evaluation against the live DOM and the live Vue component tree (component names,
`setupState`, props, chart option objects, and validation-rule return values). Everything recorded
as verbatim below was read out of the running app, not inferred. Items that could not be reached
are listed in §9.

---

## 1. Page purpose and primary user task

A two-date **comparison** report over Maropost's eRFM model — Engagement, Recency, Frequency and
Monetary. It answers "how did my customer base move between segment groups between date A and
date B, and which cohort should I market to next?"

Primary task: **read the RFM × Engagement matrix, pick a cell (or the equivalent pair of
dropdowns), and turn that cohort into a contact segment.** Everything else on the page is
supporting evidence for that decision.

Secondary tasks: rename the five groups to the merchant's own vocabulary (GROUPS drawer) and tune
the R/F/M scoring thresholds (SETTINGS drawer).

## 1b. The existing sandbox page is a different product

`src/views/Analytics/ERFMReport.vue` (route `ERFMReport`, `/accounts/:accountId/analytics/erfm_report`)
does **not** replicate this page. It was built in July from a URL-only tracker row — the A02 crawl
recorded `—` for every screenshot, so the real page was never observed. Concretely:

| Sandbox today | Real page |
|---|---|
| "Enhanced Recency, Frequency & Monetary segmentation" | **"eRFM Report (Engagement, Recency, Frequency, and Monetary)"** — the E is **Engagement** |
| 9 invented segments (Champions, Loyal Customers, Potential Loyalists, New Customers, Promising, At Risk, Can't Lose Them, Hibernating, Lost) | **5 groups**: `champions`, `loyal`, `recent`, `need_attention`, `inactive` |
| No engagement dimension at all | **5-level engagement axis** + Total |
| `MpDateRangeSelect` (one preset range) | **two independent dates** (Base Date vs Comparison Date) with min/max constraints |
| 4 `MpKpiCard`s (Customers Analyzed / Avg Recency / Avg Frequency / Avg Monetary) | **no KPI row exists** |
| One CSS distribution bar + 9 segment cards | heatmap · grouped bar chart · **Sankey** · transition table · performance table |
| "Export Segments" button + `downloadCsv` | **no export action anywhere on the page** |
| Per-card "action" buttons (no handler) | one **Create Segment** form that routes to the segment builder |
| No settings, no rename | **two header drawers** (GROUPS, SETTINGS) with full validation |

Both trackers mark this row done (`docs/uat-parity/parity-tracker.md` B-A02 #5, commit `1f448ef`;
`docs/ui-improvement/page-tracker.md` Module 02 row 5). Those verdicts are stale — see §9 and the
Phase 2 questions.

## 2. Layout structure and hierarchy

Single scrolling column inside `div.v-container.v-container--fluid.pa-10`. No tabs, no rail.

```
header.d-flex.justify-space-between
  span.text-h5.font-weight-medium   "eRFM Report (Engagement, Recency, Frequency, and Monetary)"
  div.d-flex
    v-btn outlined  [mdi-format-list-bulleted]  GROUPS     → ErfmGroupDrawer (right, temporary)
    v-btn outlined  [mdi-cog]                   SETTINGS   → ErfmSettingsDrawer (right, temporary)

§A  Date comparison bar        (.sticky-component)
      "Compare RFM group as of"  [Base Date] "vs" [Comparison Date]
      helper: "Use these specific dates to see the number of contacts in segment groups and compare changes."

§B  EngagementInsight
      "RFM & Engagement Insights"        switch: "Revenue"
      HeatmapChart  — 6 × 6 ECharts heatmap, x-axis on top, clickable cells + clickable axis labels
      CreateSegmentCard
        "Create Segment"
        "Click a cell or select from the dropdowns below to create a segment."
        [Select RFM Attribute *]  [Select Engagement Attribute *]
        RESET   CREATE(disabled)

§C  CompareDistribution
      "Compare Distribution Of Contacts"   select: Contacts | Added or Dropped | Percentage Change
      ContactsChart — grouped Chart.js bar, one bar pair per group, log-scaled

§D  GroupChange
      "Group Change Over Time"             switch: "Table Mode"
      SankeyChart (default) — 2-column Sankey, base date → comparison date
      GroupChangeTable (when Table Mode on) — 5 × 5 From/To transition matrix

§E  AveragePerformance
      "Average Performance"
      v-slide-group: [BASE DATE] [COMPARISON DATE]   (v-window / v-window-item pair)
      table — 5 rows × 7 columns
```

Hierarchy reads top-down as: *choose the window → see the distribution → act on a cell → verify
with movement and performance evidence.* The action (Create Segment) is correctly placed next to
the matrix it depends on.

## 3. Component inventory → design-system mapping

| Real page | Design-system target |
|---|---|
| `header` + `span.text-h5` + 2 outlined buttons | **`MpPageHeader`** (`title`, `subtitle`, `#actions`) |
| GROUPS / SETTINGS buttons | `v-btn variant="outlined"` in `#actions` |
| `ErfmGroupDrawer`, `ErfmSettingsDrawer` (`AppDrawerWrapper`, right, temporary, CANCEL/…/SAVE footer) | **`MpFormDrawer`** (`size="sm"`, `guarded`, `#footer`, `#footerStart`) |
| Date fields (readonly text + `mdi-calendar` + `v-menu` + `AppDatePicker`) | `v-text-field readonly` + `v-menu` + `v-date-picker`, wrapped per the `MpFormField` / label convention |
| Date bar as a whole | `v-card flat border rounded="lg"` on `component.card.padding` |
| `HeatmapChart` (ECharts heatmap, canvas) | **GAP** — no heatmap primitive. See GAPS.md; proposal is a tokenised CSS-grid matrix of real `<button>` cells |
| `SankeyChart` (ECharts sankey, canvas) | **GAP** — no Sankey primitive. See GAPS.md; proposal is inline SVG |
| `ContactsChart` (Chart.js grouped bar) | existing repo pattern: local `ApexChart` + `useChartTheme()` (as `LiveView.vue` does), or the CSS-bar pattern used by `SalesSummary.vue` |
| Metric select (Contacts / Added or Dropped / Percentage Change) | **`MpSegmentedControl`** (3 exclusive modes, `ariaLabel` required) — better than a bare select |
| "Revenue" switch, "Table Mode" switch | `v-switch` (theme defaults) |
| `CreateSegmentCard` (`VForm` + 2 `VSelect` + RESET/CREATE) | `v-card` + **`MpFormSection`** + **`MpFormGrid :cols="2"`** + `v-select` |
| `AveragePerformance` `VSlideGroup` + `VWindow` | **`MpSegmentedControl`** (Base date / Comparison date) driving one table — replaces the button+window pattern and gives real semantics |
| Both data tables (`AppDataTable`, `sortable:false`, `missingIndicator:'0'`) | `v-data-table` per the repo's data-table pattern; no toolbar (these are fixed 5-row matrices, not lists) |
| `dataNotFound` branch | **`MpEmptyState`** |
| Loading (`loading` ref per section) | **`MpTableSkeleton`** for the two tables; see §9 for the chart-region loading gap |
| Settings acknowledgement copy | **`MpAlert tone="warning"`** + a separate short checkbox label |

Nothing on this page needs a component that does not exist except the **heatmap matrix** and the
**Sankey** — both logged in GAPS.md.

## 4. Data fields, labels and copy (verbatim)

### Header
- Title: `eRFM Report (Engagement, Recency, Frequency, and Monetary)`
- Actions: `GROUPS` · `SETTINGS`

### §A Date comparison
- `Compare RFM group as of` · field labels `Base Date`, separator `vs`, `Comparison Date`
- Helper: `Use these specific dates to see the number of contacts in segment groups and compare changes.`
- Observed values: base `2026-06-02`, comparison `2026-08-30`
- Constraints (live state): `minimumBaseDate` `2025-07-29`, `maximumBaseDate` `2026-08-29`
  (= comparison date − 1 day). So base < comparison, and the window is bounded at ~13 months back.

### The five groups
API key → default label (`formatLabel`) → alias on this account:

| key | default label | account alias |
|---|---|---|
| `champions` | Champions | Champ Value |
| `loyal` | Loyal | Loyal Value |
| `recent` | Recent | Recent Value |
| `need_attention` | Need Attention | Attention Value |
| `inactive` | Inactive | Inactive Value |

Group colours (from the Sankey node `itemStyle`):
`champions #03B6FC` · `loyal #F53BAD` · `recent #29993E` · `need_attention #3D40C6` · `inactive #F2B500`

### The engagement axis
`Most Engaged` · `Highly Engaged` · `Engaged` · `Lightly Engaged` · `Not Engaged` · `Total`

### §B RFM & Engagement Insights
- Heading `RFM & Engagement Insights`; switch label `Revenue`
- Heatmap: x-axis (top) = engagement levels + `Total`; y-axis (bottom→top) =
  `Total`, `Inactive Value`, `Attention Value`, `Recent Value`, `Loyal Value`, `Champ Value`
- 36 cells, each `{ value: [xIndex, yIndex, contacts, percentChange], itemStyle: { color } }`
- `visualMap: { min: 0, max: 491354, show: false }` — colour scale is **hidden**
- `triggerEvent: true` on both axes (axis labels are hoverable/clickable)
- Observed cell data (`x`,`y`,contacts,%change):

```
x0 Most Engaged   : y0 10/+900   y1 7/+600    y2 0/0   y3 2/+100  y4 1/+100  y5 0/0
x1 Highly Engaged : y0 2/+100    y1 2/+100    y2 0/0   y3 0/0     y4 0/0     y5 0/0
x2 Engaged        : y0 9/+800    y1 9/+800    y2 0/0   y3 0/0     y4 0/0     y5 0/0
x3 Lightly Engaged: y0 23/+64.29 y1 19/+46.15 y2 1/0   y3 1/+100  y4 2/+100  y5 0/0
x4 Not Engaged    : y0 491310/+3.01  y1 491246/+3.01  y2 13/−74   y3 31/+158.33 y4 20/+185.71 y5 0/0
x5 Total          : y0 491354/+3.02  y1 491283/+3.02  y2 14/−72.55 y3 34/+183.33 y4 23/+228.57 y5 0/0
```
(y0 = Total, y1 = Inactive, y2 = Attention, y3 = Recent, y4 = Loyal, y5 = Champ)

### §B Create Segment
- Heading `Create Segment`
- Instruction `Click a cell or select from the dropdowns below to create a segment.`
- `Select RFM Attribute *` — items are the 5 groups (`{id, name}`), 1 rule (required)
- `Select Engagement Attribute *` — items are the 6 engagement values, 1 rule (required)
- Buttons `RESET` · `CREATE` (**disabled until both selects are filled**)
- Model: `{ group: '', engagement: '' }`

### §C Compare Distribution Of Contacts
- Heading `Compare Distribution Of Contacts`
- Select items: `Contacts` (default) · `Added or Dropped` · `Percentage Change`
  (backed by three components: `ContactsChart`, `AddedOrDroppedChart`, `PercentChangeChart`)
- Chart.js config: labels = 5 group names; two datasets keyed by date —
  base `2026-06-02` colour `#35C5FD`, comparison `2026-08-30` colour `#006BAF`;
  `data` is **log-scaled**, `originalValue` holds the real counts, `minBarLength: 1`
- Real counts — base `[0, 7, 12, 51, 476886]`, comparison `[0, 23, 34, 14, 491283]`
- Per-group table model (`item[]`):
  `{ group, base_total, base_percent, comparison_total, comparison_percent, percent_change }`
  e.g. `{ group: 'Inactive Value', base_total: 476886, base_percent: '99.99', comparison_total: 491283, comparison_percent: '99.99', percent_change: '3.02' }`
- Raw API rows (`distribution[]`):
  `{ champions, loyal, recent, need_attention, inactive, erfm_date, total }` — one per date
  (`2026-08-30` total `491354`; `2026-06-02` total `476956`)

### §D Group Change Over Time
- Heading `Group Change Over Time`; switch label `Table Mode` (default **off** → Sankey shown)
- Table headers: `From / To` (key `group`) then `Champ Value`/`to_champions`,
  `Loyal Value`/`to_loyal`, `Recent Value`/`to_recent`, `Attention Value`/`to_need_attention`,
  `Inactive Value`/`to_inactive` — each `width: 185`, `sortable: false`, `schema: { type: 'number' }`
- Sankey nodes: `{ name, value (log-scaled), realVal, itemStyle.color, depth, otherInfo: { date, nodeColor, sourceNode } }`
  — depth 0 = base date, depth 1 = comparison date. **Comparison-side node names are suffixed `1`**
  (`Champ Value1`) to keep them unique; the label formatter strips it.
- Node `realVal`: base `0, 7, 12, 51, 476879` → comparison `0, 23, 34, 14, 491283`
- Links (`realVal`): Loyal→Loyal 5 · Loyal→Attention 2 · Recent→Attention 12 ·
  Attention→Recent 1 · Attention→Inactive 50 · Inactive→Loyal 1 · Inactive→Recent 5 ·
  Inactive→Inactive 476873
- Level labels: depth 0 label position `left`, depth 1 `right`, both 14px Roboto
- `activeNode` / `inactiveNode` option groups + `updateHighlight` / `isConnected` →
  **clicking a node highlights it and its connected links and dims the rest**

### §E Average Performance
- Heading `Average Performance`; toggle `BASE DATE` (default active) / `COMPARISON DATE`
- Headers (all `sortable: false`, `align: center` except Group, `missingIndicator: '0'`):
  `Group` · `Days since purchase` · `Total orders` · `Placed order revenue` ·
  `Abandoned carts` · `Site visit` · `Click rate`
- Row keys: `group`, `daysSincePurchase`, `totalOrders`, `placedOrderRevenue`,
  `abandonedCarts`, `siteVisits`, `clickRate`
- Observed base-date rows:

| Group | Days since purchase | Total orders | Placed order revenue | Abandoned carts | Site visit | Click rate |
|---|---|---|---|---|---|---|
| Champ Value | 0 | 0 | 0 | 0 | 0 | 0 |
| Loyal Value | 5.57 | 5 | 1136.4 | 0 | 0 | 0 |
| Recent Value | 38.58 | 1.67 | 304.8 | 0 | 0 | 0 |
| Attention Value | 148.96 | 1.33 | 213726411.91 | 0.02 | 0 | 0 |
| Inactive Value | 180+ | 0 | 0 | 0 | 0 | 0 |

### GROUPS drawer
- Title `Groups` · description `Rename the groups here.`
- Five fields, labelled with the **default** names: `Champions`, `Loyal`, `Recent`,
  `Need Attention`, `Inactive`; values are the current aliases
- Footer: `CANCEL` · `RESET` · `SAVE` (SAVE disabled while pristine or invalid)
- Validation messages (verbatim, confirmed by invoking the rules):
  - required → `Group name is required`
  - duplicate → `Group name already exists`
  - emoji → `You cannot use emojis in this field.`
- `RESET` restores the **system default names**, not the last-saved aliases (confirmed:
  after `onReset()` the model became `Champions / Loyal / Recent / Need Attention / Inactive`)

### SETTINGS drawer
- Title `RFM Settings` · description `Configuration / setup the RFM module.`
- Three collapsible sections, all collapsed on open:
  `Recency Definitions` · `Frequency Definitions` · `Monetary Definitions`
- Acknowledgement copy, used verbatim as a **checkbox label** (disabled until settings load):
  `If you change the RFM definitions, the chart will be recalculated for the current 90-day period based on your updated definitions. Historical RFM data is stored with the definitions that was active at that time. Therefore, data saved under different criteria cannot be combined or viewed together in a single chart.`
- Footer: `CANCEL` · `APPLY`
- Settings model:
  `recency: { highestScoreDays, averageScoreDays, lowestScoreDays }` ·
  `frequency: { mostFrequent, averagelyFrequent }` ·
  `monetary: { highestSpender, averageSpender }`
- Validation messages (verbatim, confirmed by invoking the rules):
  - `Value is required.`
  - `Please enter a valid number.`
  - `Please enter a value greater than 0.`
  - `Only positive numbers are allowed.`
  - `Recency days cannot exceed 1000`
  - `value must be greater value of score of 2`
  - `value must be less than value of scores of 3`
  - `value must be greater than the values of score of 2 and score of 3`
- Decimals pass `isNumberRule` (`1.5` → valid)

### API surface (for mock shaping)
Base `…/v2/<accountId>/analytics/erfm_reports/`
- `group_aliases.json` (fetched once per section — **4× per page load**)
- `engagement_groups.json`
- `erfm_insights.json?base_date&comparison_date` — heatmap
- `contact_distribution.json?base_date&comparison_date` — §C
- `group_split_metrics.json?base_date&comparison_date` — §D
- `check_backdated_orders.json?base_date&comparison_date` — feeds `isDataOld` / `disableRefresh`
- `average_performance_metrics.json?base_date&comparison_date` — §E

Date parameter format is **inconsistent**: `DD-MM-YYYY` on every endpoint except
`average_performance_metrics.json`, which uses `YYYY-MM-DD`.

## 5. Interactions and behaviours

1. **Base / Comparison date** — readonly field opens a `v-menu` + `AppDatePicker`. `onBaseDateChange`
   re-derives bounds; base is capped at comparison − 1 day, floored at ~13 months back. Changing
   either date refetches all five section endpoints.
2. **Revenue switch** (§B) — swaps the heatmap's cell metric. Cells already carry both a contacts
   count and a percentage change; the switch is the contacts↔revenue axis. *(Toggle not observed
   live — see §9.)*
3. **Heatmap cell click** — `HeatmapChart.onClick` → `EngagementInsight.setSegment` → fills the
   Create Segment selects with that cell's group + engagement level. This is the page's central
   interaction.
4. **Heatmap axis-label hover** — `handleAxisTooltip` / `hideAxisTooltip` drive a `customTooltip`
   (`{ content, show, style }`), because axis labels are truncated (`width: 84.3`, `overflow: break`).
5. **Heatmap cell hover** — `handleMouseOver` / `handleMouseOut` + `customTooltip`.
6. **Create Segment selects** — either select can be set directly; both are required; `CREATE`
   stays disabled until the form is valid.
7. **RESET** (§B) — `resetSegment` clears both selects.
8. **CREATE** (§B) — `createSegment` builds a segment definition (`Contact Attributes` group with
   `RFM Group` and `Engagement Level` conditions pinned to a `specific date`) and
   `router.push`es to the **`Next_gen_segments`** builder. Segment name is templated as
   `Segment <group> and <engagement> on <date>`. It does **not** save a segment directly.
9. **Distribution metric select** (§C) — switches between `ContactsChart`,
   `AddedOrDroppedChart`, `PercentChangeChart`.
10. **Table Mode switch** (§D) — swaps the Sankey for the 5 × 5 transition table.
11. **Sankey node click** (§D) — `handleClick` → `updateHighlight` / `isConnected`: highlights the
    node and its connected links, dims everything else. `handleResize` re-lays out.
12. **BASE DATE / COMPARISON DATE toggle** (§E) — `activeTab` switches a `v-window` between the
    base and comparison performance tables.
13. **GROUPS drawer** — see FLOWS.md F1.
14. **SETTINGS drawer** — see FLOWS.md F2.
15. **Stale-data signal** — `isDataOld` and `disableRefresh` exist on the page and are fed by
    `check_backdated_orders.json`; both were `false` throughout. *(UI not observed — §9.)*

## 6. Accessibility issues observed

1. **The two primary visualisations are canvas-only.** The 36-cell heatmap and the Sankey are
   ECharts canvases: no accessible name, no text alternative, no roles, no tab stops. Every number
   in them — including the grand total of 491,354 contacts — is unavailable to a screen reader and
   unreachable by keyboard. This is the single largest defect on the page.
2. **The page's central action is a canvas hit-test.** "Click a cell … to create a segment" cannot
   be done from the keyboard. The two dropdowns are the only accessible path; they work, but the
   instruction copy points at the inaccessible one first.
3. **Colour carries meaning with no key.** `visualMap.show` is `false`, so the heatmap's colour
   ramp has no legend. The Sankey encodes group identity in five hues with no non-colour
   differentiator.
4. **No `<label>` element on any of the five GROUPS drawer inputs** (`querySelector('label')`
   returned empty for all five); the names render as adjacent text. Same for the two date fields.
   Programmatic association needs verifying — if it relies on proximity alone, the fields are
   unlabelled for AT.
5. **A 60-word paragraph is used as a checkbox label** in the SETTINGS drawer — the entire
   recalculation warning is the accessible name of the acknowledgement control.
6. **`BASE DATE` / `COMPARISON DATE` are `v-btn`s in a `v-slide-group` driving a `v-window`** — a
   tab pattern with, most likely, no `role="tab"` / `aria-selected` / arrow-key support. Needs
   confirmation, but the component choice makes correct semantics unlikely.
7. **Sortability is disabled on every column of both tables** (`sortable: false` throughout), so
   the tables are static grids — acceptable for a 5-row matrix, but the headers still render as
   interactive-looking cells.
8. **Group palette contrast is unmeasured.** `#03B6FC`, `#F53BAD`, `#29993E`, `#3D40C6`, `#F2B500`
   are used as fills behind labels in places; ratios must be checked against
   `npm run contrast:check` conventions before reuse.
9. **`Days since purchase` mixes types** — `180+` (string) sits in a numeric column, so the column
   has no consistent machine-readable meaning.
10. **Heading semantics** — section titles are `text-h5` / `text-h6` spans, not `h1`–`h3`
    elements, so the page has no heading outline.

## 7. UX friction points worth fixing

1. **`RESET` in the GROUPS drawer is mislabelled.** It restores Maropost's default names, not the
   values the merchant last saved — so a merchant who renamed groups months ago and clicks RESET
   to "undo my typing" silently loses their vocabulary. Confirmed behaviour, not a guess.
2. **Three scoring validation messages are broken English and reference invisible concepts** —
   "value must be greater value of score of 2", "value must be less than value of scores of 3",
   "value must be greater than the values of score of 2 and score of 3". Nothing on screen is
   labelled "score of 2".
3. **Inconsistent message punctuation and capitalisation** across the same forms:
   `Group name is required` (no period) vs `You cannot use emojis in this field.` (period);
   `Recency days cannot exceed 1000` (no period) vs `Value is required.` (period).
4. **A grammar error in the warning copy** the merchant is asked to accept:
   "the definitions that **was** active at that time".
5. **Log-scaled charts are not labelled as such.** Both §C bars and the Sankey silently log-scale
   (Inactive is 476,879 against Loyal's 7). Without a note, the §C chart reads as though Inactive
   is ~4× Loyal rather than ~68,000×. This is a correctness-of-impression problem, not cosmetics.
6. **`Placed order revenue` of 213,726,411.91 for Attention Value** renders unformatted, with no
   currency symbol, thousands separators, or outlier handling — it simply overflows the cell's
   meaning. Same column shows `1136.4` and `304.8`, so the column has no decimal discipline.
7. **The `Total` row and `Total` column sit inside the clickable matrix.** A "Total × Total" cell
   is selectable as though it were a cohort; `Total` also appears as a *choice* in the Engagement
   dropdown, which makes "all engagement levels" look like a level.
8. **`group_aliases.json` is fetched four times per page load** — once per section, because each
   section owns its own `groupNames` + `setGroupNames`. Purely wasteful.
9. **No export.** Every other Analytics report in the product exports CSV; this one — the one with
   the most decision-relevant tabular data — has no export affordance at all. *(Noted as an
   observation; adding one would be a new feature and is out of scope.)*
10. **The two switch labels read as nouns, not states.** "Revenue" and "Table Mode" don't say what
    is on now; a segmented control would.
11. **Base/comparison date constraints are invisible until violated** — nothing on screen says
    the base date must precede the comparison date or that history stops ~13 months back.
12. **Section headings are visually identical to each other** (`text-h6`) with no card grouping in
    §A, so the page reads as a flat stack of five equally-weighted blocks rather than
    "controls → insight → evidence".

## 8. Realistic mock-data shape for the rebuild

Extend `src/stores/useAnalytics.ts` (the report store, per playbook §6 — typed mock in a Pinia
store, no inline literals in the view). Proposed additions:

```ts
export type ErfmGroupKey = 'champions' | 'loyal' | 'recent' | 'need_attention' | 'inactive'
export type ErfmEngagement =
  | 'Most Engaged' | 'Highly Engaged' | 'Engaged' | 'Lightly Engaged' | 'Not Engaged' | 'Total'

export interface ErfmGroupAliases   { [K in ErfmGroupKey]: string }        // renameable labels
export interface ErfmCell           { group: ErfmGroupKey | 'total'; engagement: ErfmEngagement
                                      contacts: number; revenue: number; percentChange: number }
export interface ErfmDistributionRow{ group: ErfmGroupKey; baseTotal: number; basePercent: number
                                      comparisonTotal: number; comparisonPercent: number
                                      percentChange: number }
export interface ErfmTransition     { from: ErfmGroupKey; to: ErfmGroupKey; contacts: number }
export interface ErfmPerformanceRow { group: ErfmGroupKey; daysSincePurchase: number | string
                                      totalOrders: number; placedOrderRevenue: number
                                      abandonedCarts: number; siteVisits: number; clickRate: number }
export interface ErfmSettings {
  recency:   { highestScoreDays: number | null; averageScoreDays: number | null
               lowestScoreDays: number | null }
  frequency: { mostFrequent: number | null; averagelyFrequent: number | null }
  monetary:  { highestSpender: number | null; averageSpender: number | null }
}
```

Group colours belong in `tokens.json` as a named 5-stop categorical ramp (they are semantic group
identities, not chart series), then consumed as `var(--mp-*)`. Do **not** inline the observed hexes.

**Mock-data judgement call:** the live account's data is pathological — 99.99% Inactive, Champions
empty, one 213-million revenue figure, and a `180+` string in a numeric column. Reproducing it
faithfully would make the rebuilt page look broken and would hide the design in a single
saturated cell. Recommendation is to keep the **shapes, group names, column set and log-scaling
behaviour** exactly, but seed **plausible merchant numbers** (a realistic skew — Inactive largest
but not 99.99%) so every state is legible. Flagged for confirmation in Phase 2.

## 9. Unverified — carried into Phase 2 questions

| # | Item | Why unverified |
|---|---|---|
| 1 | **Screenshots of every state** | The page never reaches `document_idle`; `screenshot`, `get_page_text` and `read_page` all timed out for the entire session. Crawl is DOM/state-derived only. |
| 2 | **SETTINGS drawer field labels, order, suffixes and section contents** | `fetchERFMSettings` never resolved (degraded UAT backend); all nine values stayed `null` and the three sections rendered empty. Model shape and all validation messages **are** confirmed; the visible form is not. |
| 3 | **`Revenue` switch effect on the heatmap** | Toggled, but the tab's renderer became unresponsive before the re-render could be read. Inferred from `showRevenue` + the fact that cells carry both contacts and a second numeric. |
| 4 | **`Added or Dropped` and `Percentage Change` chart variants** | Component names confirmed (`AddedOrDroppedChart`, `PercentChangeChart`); their axes and series were not rendered during the crawl. |
| 5 | **`dataNotFound` empty state and `isDataOld` / `disableRefresh` stale-data UI** | All three were `false`; forcing them client-side was reverted by the owning effects before a render could be captured. There is no observed refresh button — the affordance's existence and copy are unknown. |
| 6 | **Per-section loading states** | Every section has its own `loading` ref, but the page had already settled; no skeleton or spinner was observed. |
| 7 | **`GroupChangeTable` rendered output** | Table Mode was off; headers and row model were read from state, the rendered table was not. |
| 8 | **GROUPS `SAVE` and SETTINGS `APPLY` outcomes** | **Deliberately not executed** — both are writes against a live UAT account (renaming groups; recalculating RFM definitions account-wide). Stopped at the last safe step. Success/error/toast behaviour is unknown. |
| 9 | **`CREATE` destination in detail** | `router.push` to `Next_gen_segments` with a prefilled definition is confirmed from the function body; the landing screen was not walked, to avoid leaving the page mid-crawl. |
| 10 | **Programmatic labelling of the drawer and date inputs** | No `<label>` element found; `aria-label` / `aria-labelledby` not checked before the tab was lost. |
| 11 | **Responsive behaviour** | `resize_window` depends on the same blocked injection path. Not tested at any breakpoint. |
| 12 | **Permission-restricted variant** | Only one role was available on this session. |
