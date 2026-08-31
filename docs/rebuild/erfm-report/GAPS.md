# GAPS — eRFM Report rebuild

Design-system components this page needed and the library does not have, with proposed specs.
Each is stood in for by the closest existing thing, flagged in code comments at the use site.

---

## 1. `MpMatrix` — the rows × columns heat matrix

**Use case.** Two sections of this page are matrices: RFM group × engagement level (§B, selectable
cells) and base-group → comparison-group movement (§D, read-only). Upstream renders both as ECharts
canvases.

**Why not ApexCharts.** The repo already made and recorded this call, in
`src/components/dashboards/widgets/DashboardHeatmapWidget.vue`:

> *Built in CSS grid rather than ApexCharts' heatmap because that renderer has no cell-gap control
> and no per-cell labels — both of which this design needs.*

Both reasons apply here, and a third: Apex's heatmap has no keyboard or screen-reader surface, which
is the audit's single largest accessibility defect on this page.

**Current stand-in.** `src/components/analytics/ErfmMatrix.vue` — a page-local component following
`DashboardHeatmapWidget`'s exact ramp (`tintHex` + `readableInkOn` + `Math.pow(ratio, 0.6)` easing),
tokens and scale legend, but rendered as a semantic `<table>` of `<button>` cells.

**Why this is a gap.** There are now **two** CSS-grid matrices in the repo with the same geometry,
the same ramp and the same easing constant, diverging only in markup (`role="img"` div grid vs.
table) and features. That is the point at which the geometry should be an atom.

**Proposed spec.**

```ts
MpMatrix
  rowLabels: string[]
  colLabels: string[]
  cells: number[][]                      // rows × cols
  cornerLabel?: string                   // names the row axis ("Group", "From / To")
  secondary?: (number | null)[][]         // a second per-cell figure (e.g. % change)
  unit?: NumericUnit
  showTotals?: boolean                   // appends a Total column and Total row
  selectable?: boolean                   // cells become buttons + aria-pressed
  selected?: { row: number; col: number } | null
  emphasis?: 'default' | 'prominent'     // cell min-height ramp
  caption: string                        // required; visually-hidden <caption>
emits
  select: [{ row: number; col: number }]
```

Semantics baked in: `<table>` with `<th scope="col">` / `<th scope="row">`; per-cell accessible
names composed from row + column + value + secondary; zero renders as an em dash; a `Fewer → More`
scale legend; a hover/focus readout slot; horizontal scroll inside its own container; a container
query that drops the secondary figure on narrow cards.

Adopting it should also migrate `DashboardHeatmapWidget` to compose it, at which point the
`role="img"` variant becomes `selectable: false`.

---

## 2. `MpSankeyChart` — two-column flow diagram

**Use case.** §D "Group change over time" is a Sankey upstream: base-date groups on the left,
comparison-date groups on the right, 8 links carrying contact counts, with node-click highlighting
of connected links.

**Current stand-in.** The From/To matrix (gap 1) in the chart half of §D's toggle, per the agreed
decision — ApexCharts cannot render a Sankey, and the page should not gain a second chart
dependency for one section. **All 25 transition values are present** in both the matrix and the
table view, so no data is lost; what is lost is the sense of *flow* between two dates.

**Proposed spec.**

```ts
MpSankeyChart
  nodes: { id: string; label: string; column: 0 | 1; value: number }[]
  links: { from: string; to: string; value: number }[]
  columnLabels?: [string, string]        // e.g. the two dates
  scale?: 'linear' | 'log'              // log for skewed data — must render a note when log
  height?: number
emits
  selectNode: [id: string]
```

Notes for whoever builds it:
- Inline SVG, not a canvas — nodes and links should be focusable with accessible names, which is
  what the ECharts version cannot offer.
- Upstream log-scales node and link thickness (`value` log-scaled, truth kept in `realVal`) because
  its live account is 68,000× skewed. Any log rendering needs a visible note; upstream has none.
- Upstream suffixes right-column node names with `1` to keep ids unique (`Champ Value1`) and strips
  it in the label formatter. A proper `id` / `label` split avoids that.
- The five per-group brand colours upstream uses are recorded in AUDIT §4 (`#03B6FC`, `#F53BAD`,
  `#29993E`, `#3D40C6`, `#F2B500`). They should become a named categorical ramp in `tokens.json`
  when something consumes them — deliberately not added while nothing does.

---

## 3. `MpSectionHeader` cannot wrap its actions

**Not a missing component — a defect in an existing one**, affecting every consumer.

Its root is `d-flex align-center justify-space-between mb-4` with no `flex-wrap`, and the actions
slot is `d-flex ga-2 flex-shrink-0`. So any action wider than the leftover space overflows the
card rather than wrapping. Measured here at 375px: a three-segment control needs 325px against
271px of card width, and the header's `scrollWidth` exceeded its `clientWidth` by 127px.

**Current stand-in.** A page-local `.erfm-head` wrapping row that pairs the title and the control
outside the `#actions` slot, plus an `overflow-x: auto` sleeve for the control itself.

**Proposed fix.** Add `flex-wrap: wrap` and a `gap` to the root, and drop `flex-shrink-0` from the
actions div (or make it `flex-shrink-0` only above `layout.breakpointCompact`). Worth checking the
~40 existing consumers for reflow before landing, which is why it is logged rather than changed.

---

## 4. No collapsible-section primitive for forms

**Use case.** The settings drawer has three collapsible groups (`Recency definitions`,
`Frequency definitions`, `Monetary definitions`).

`MpFormSection` is a heading, not a disclosure. The component inventory has no accordion.

**Current stand-in.** Raw `v-expansion-panels` / `v-expansion-panel`, styled only by the card radius
token.

**Proposed spec.** Either `MpFormSection` gains `collapsible?: boolean` + `defaultOpen?: boolean`
(preferred — one section component, one heading style, disclosure as an option), or an `MpAccordion`
molecule wrapping `v-expansion-panels` with the token radii and heading type already settled. The
first is the smaller API and keeps `MpFormSection` as "the one in-form section heading".

---

## 5. The segment builder ignores a prefilled definition ⚠️

**Not a component gap — an unfinished integration**, and the one place a flow does not complete.

Upstream's `createSegment` builds a definition (a `Contact Attributes` group holding an `RFM Group`
condition and an `Engagement Level` condition pinned to a specific date) and `router.push`es it to
the next-gen segment builder. The rebuild makes the same handoff, carrying `rfmGroup`,
`engagement`, `onDate` and `name` in the query — verified landing at
`/accounts/116000/segments/next-gen?rfmGroup=loyal&engagement=Highly+Engaged&onDate=2026-08-30&…`.

**`src/views/Contacts/CreateSegmentNextGen.vue` does not read those params**, so the builder opens
empty. Applying the prefill means editing that view, which playbook §4 forbids for this slice and
which was not in scope for this page.

**Proposed change** (one page, small): in `CreateSegmentNextGen.vue`, on mount, if
`route.query.rfmGroup` is present, seed the first condition group with an `RFM Group` condition and
an `Engagement Level` condition from the query and set the segment name from `route.query.name`.
The eRFM side needs no change.

---

## Not gaps

- **`MpFormDrawer`** covered both header-action flows exactly — guarded close, focus trap,
  `#footer` / `#footerStart`, the size ramp. No changes wanted.
- **`MpSegmentedControl`** replaced three separate upstream patterns (a switch, a switch, and
  buttons-in-a-slide-group) with no API strain.
- **`MpAlert` / `MpConfirmDialog` / `MpEmptyState` / `MpTableSkeleton` / `MpFormGrid` /
  `MpPageHeader`** all fit as-is. `MpTableSkeleton`'s `rows` × `columns` props happen to suit a
  matrix as well as a table.
- **The chart palette plugin** (`useChartTheme`, `chartLegendOptions`, `tintHex`, `readableInkOn`)
  had everything both the matrix ramp and the bar chart needed — including a `chart.heatmapInk`
  token already anticipating matrix cells. No new tokens were required for this page.
