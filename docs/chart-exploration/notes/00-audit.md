# 00 — Current Dashboard: Chart Visual Language Audit

Baseline for the chart visual-system exploration. Scope: the **visualization layer
only** — this is deliberately not a dashboard-UX critique. The dashboard itself
(layout, widgets, data, hierarchy) is the fixed canvas every option renders onto.

Surface: `/accounts/2000290/dashboard` → `src/views/DashboardView.vue`, "Overview"
seed. Default chart theme: `shopify` (`src/plugins/chartPalette.ts:170-196`) — Polaris
Viz *grammar* (flat marks, 2px strokes, dashed previous-period) with the hue held in
the Maropost blue→teal family.

## 1. Inventory

| # | Widget | Chart | Tech | Series | Color source | Legend | Tooltip | Grid/axis |
|---|--------|-------|------|--------|-------------|--------|---------|-----------|
| 1–4 | Revenue / Orders / AOV / Open Rate | KPI sparkline (area+stroke) | SVG, Catmull-Rom | 1 | `series[0]` `#13ACF0`; fill currentColor 0.16→0 | — | — | none |
| 5 | Revenue over time | area | Apex | 2 (1 + dashed comparison) | series + `comparisonColor #0A97D5` | Apex, square 8px, top-right | custom `.mp-chart-tip` | y-lines only, y-labels shown |
| 6 | Deliverability | 270° ring gauge | SVG (DtGauge) | 1 (80%) | `series[0]` | — | — | none |
| 7 | Revenue by channel | line ×6 + Trend/Compare toggle | Apex | 6 | full `series[6]` | Apex, square, top-right | custom, 6 rows (often pinned top-right) | y-lines, y-labels shown |
| 8 | Traffic mix | donut (62%) | Apex | 6 slices | full `series[6]` | Apex, **round**, bottom-center | custom (duplicated CSS) | — |
| 9 | Email volume | grouped bar 2×8 | Apex | 2 | `series[0..1]`, solid, radius 3 | Apex, square, top-right | custom | y-lines, **y-labels hidden** |
| 10 | Contacts by domain | ring donut + legend list | SVG (DtRingDonut) | 5 segments | `series[0..4]` | **custom DtLegendList** (8px rounded-2 swatch + value) | **none** | — |
| 11–12 | Top campaigns / Recent orders | tables | v-table | — | CSS vars (`--accent`) | — | — | — |
| 13 | Live activity | feed | CSS | — | cloud CSS vars | — | — | — |

Shopify light palette: series `#13ACF0 #075E82 #6FD1F5 #0092D4 #35C4BE #A9E3E0` ·
axis `#0A4C66 #0C749E #0A97D5 #13ACF0 #63CCF7` · comparison `#0A97D5` ·
chrome: grid `rgba(26,24,20,0.06)`, axisLabel `rgba(26,24,20,0.55)`, legendLabel `rgba(26,24,20,0.72)`.

## 2. What works

- **A real theme system exists.** `chartPalette.ts` is mode-aware, injectable per
  subtree (`CHART_PALETTE_OVERRIDE`), URL-switchable (`?chart=`), token-backed for the
  legacy palettes. The exploration extends it rather than fighting it.
- **The comparison grammar is genuinely good.** Dashed previous-period stroke with no
  area fill (Shopify's own move) reads instantly and is already wired end-to-end
  (`isComparison` flag → stroke dash + legend dot).
- **Flat-mark discipline.** Solid fills, 2px strokes, radius-3 bars, hover-only
  markers, horizontal-only gridlines — the baseline is calm and dense-data-safe.
- **Custom tooltip anatomy** (`.mp-chart-tip`) is consistent where it appears: title,
  swatch-dot rows, right-aligned values, surface/border/elevation tokens.
- **Single-hue lightness ramp** keeps the dashboard from rainbowing, and the KPI
  sparklines' smoothing (moving average + Catmull-Rom) looks deliberate.

## 3. What's weak (the case for this exploration)

These are visualization-*system* gaps — exactly what a chosen visual language must fix
or standardize. Each option should demonstrate a stance on all of them.

1. **Four legend systems on one screen.** Apex square/top-right (area, line, bar),
   Apex round/bottom-center (donut), custom `DtLegendList` (ring donut), and the
   stacked-bar's own swatch+total+percent list. Marker shape, size, placement, and
   typography all differ.
2. **Six-blues ramp collapses at adjacency.** With 6 series (Revenue by channel),
   slots like `#6FD1F5`/`#63CCF7`-adjacent pairs and `#35C4BE`/`#A9E3E0` separate by
   lightness only; mid-chart crossings are hard to track and the two palest slots
   nearly vanish on white. This is the #1 legibility complaint a multi-series palette
   must answer.
3. **Tooltip CSS is copy-pasted 3×** (`DashboardChartWidget`, `DashboardPieWidget`,
   `DashboardMetricExplorerWidget`) and two SVG widgets (gauge, ring donut) plus the
   stacked bar have **no tooltip at all** (the stacked bar falls back to a native
   OS `title` tooltip — a different look and delay).
4. **Axis policy is inconsistent.** Area/line show y-labels; the bar chart hides them
   (values only in the tooltip); SVG widgets have no axes; the metric explorer draws
   its own 4 fixed gridlines in a *different gray* (`--border-subtle` vs `chrome.grid`).
5. **Several widgets bypass the theme entirely** with hardcoded ramps
   (`dottedChartMath.ts:11-33`): DOTTED_BLUES, STACK_BLUES, BAR_GRADIENT,
   TREND_CURRENT/PREVIOUS, and an **off-family indigo funnel gradient**
   (`#5B5BF0→#4EC3F0`) that violates the blue→teal rule the palette establishes.
6. **Three positive/negative vocabularies**: KPI tinted pill + chevron; metric-explorer
   bare full-strength text; breakdown dots/alert text. No warning/neutral definition
   anywhere. No diverging treatment exists (data is all-positive today, but the
   system must define one).
7. **Emphasis/interaction states are library defaults.** Legend hover-dimming,
   deselected series, selection — none are designed; Apex's stock opacities apply.
8. **Small inconsistencies that read as drift**: donut widget type is `pie` but renders
   a donut, visually competing with the SVG ring donut two cells away; marker stroke
   hardcoded `#ffffff` (light); `charts.css` skins a native tooltip that the main
   widgets never show.

Known bugs (documented, deliberately untouched on this branch): KPI sparkline
dark-mode array-identity check (`DashboardKpiWidget.vue:48`) paints `?chart=blue`
dark sparklines from the palette instead of `--accent`.

## 4. Baseline captures

`docs/chart-exploration/00-current/` — captured with explicit `?chart=shopify`
(so a future default change can't silently shift the baseline), light mode, 1440px,
via `scripts/chart-exploration/capture.mjs`. These images are the "00 — Current
Dashboard" section of the review and the pixel-parity reference for every
implementation commit.
