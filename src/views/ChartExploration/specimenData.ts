/**
 * Fixture data for the /chart-exploration specimen grid.
 *
 * Hand-written (not derived from useWidgetData) on purpose: the specimen grid is a
 * same-chart-four-systems comparison, so every column MUST plot identical numbers.
 * The dashboard generators are Date.now()-seeded and would drift between columns.
 *
 * Shapes match `DashboardSeriesData` exactly, so these can be handed straight to
 * DashboardChartWidget / DashboardPieWidget — the same contract DashboardWidgetCard
 * uses when it forwards `useWidgetData().data`.
 */
import type { DashboardSeriesData } from '@/stores/dashboards/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

/** Multi-series line — three channels, tests hue separation and stroke hierarchy. */
export const SPECIMEN_LINE: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: MONTHS,
  series: [
    { name: 'Email', data: [32000, 35500, 34200, 39800, 42600, 41200, 46400, 49100] },
    { name: 'Paid Search', data: [21400, 22800, 26100, 24900, 27600, 30200, 29400, 32800] },
    { name: 'Organic', data: [14200, 15100, 14800, 16900, 18300, 17600, 19800, 21400] },
  ],
}

/** Area with a previous-period series — tests fill philosophy and comparison treatment. */
export const SPECIMEN_AREA: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: MONTHS,
  series: [
    { name: 'This period', data: [48200, 52400, 50100, 58600, 62300, 59800, 67200, 71500] },
    { name: 'Previous period', data: [41600, 45200, 46800, 49300, 52100, 54600, 55900, 58200], isComparison: true },
  ],
}

/**
 * Grouped bar — tests bar fill, radius and column width at two series.
 * Five categories, not eight: option D floats a value label above every bar, and
 * sixteen of them collide inside a 260px specimen cell (they fit fine at the real
 * widget's ~700px, see the panels above). Fewer categories keeps the comparison
 * about the bar treatment rather than about label crowding.
 */
export const SPECIMEN_BAR: DashboardSeriesData = {
  kind: 'series',
  unit: 'count',
  labels: MONTHS.slice(0, 5),
  series: [
    { name: 'Sent', data: [18400, 21200, 19600, 24800, 26400] },
    { name: 'Delivered', data: [17600, 20300, 18900, 23700, 25200] },
  ],
}

/** Donut — six slices, tests slice adjacency and legend anatomy. */
export const SPECIMEN_DONUT: DashboardSeriesData = {
  kind: 'series',
  unit: 'count',
  labels: ['Email', 'Paid Search', 'Organic', 'Social', 'Referral', 'Direct'],
  series: [{ name: 'Sessions', data: [3200, 2400, 1900, 1400, 900, 620] }],
}

/**
 * Diverging bar — the only chart on the page with values below zero. This is what
 * exercises `treatment.posNeg` (the `plotOptions.bar.colors.ranges` path in
 * DashboardChartWidget); nothing on the real dashboard has negative data.
 */
export const SPECIMEN_DIVERGING: DashboardSeriesData = {
  kind: 'series',
  unit: 'count',
  labels: MONTHS,
  series: [{ name: 'Net contact change', data: [12, -8, 15, -4, 9, -11, 6, -3] }],
}

