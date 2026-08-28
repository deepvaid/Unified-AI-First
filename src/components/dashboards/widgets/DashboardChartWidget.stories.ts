import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardSeriesData } from '@/stores/dashboards/types'
import DashboardChartWidget from './DashboardChartWidget.vue'

const REVENUE_SERIES: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: ['06-01', '06-04', '06-07', '06-10', '06-13', '06-16', '06-19', '06-22', '06-25', '06-28', '07-01', '07-04'],
  series: [
    { name: 'Revenue', data: [4200, 5100, 4800, 6400, 5900, 7200, 6800, 8100, 7600, 8900, 9400, 10200] },
  ],
}

const CHANNEL_SERIES: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: ['Online Store', 'Retail POS', 'Marketplace', 'Wholesale', 'Social'],
  series: [
    { name: 'Revenue', data: [45200, 28100, 15400, 9800, 6200] },
  ],
}

// Long, multi-series names so the legend has something to truncate.
const CHANNEL_MULTI_SERIES: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  series: [
    { name: 'Paid Search', data: [1200, 1400, 1600, 1800, 2000] },
    { name: 'Organic Search', data: [900, 1100, 1000, 1300, 1250] },
    { name: 'Email Marketing', data: [700, 650, 800, 900, 950] },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardChartWidget',
  component: DashboardChartWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'ApexCharts body for timeseries and bar widgets. Multi-series charts use dashed secondary strokes and explicit legend marker colours. Single-series bar charts distribute palette colors across categories. Shows a skeleton until the chart lazily mounts.',
      },
    },
  },
  args: {
    data: REVENUE_SERIES,
    widgetType: 'timeseries',
    chartVariant: 'area',
    height: 260,
  },
  argTypes: {
    data: {
      control: 'object',
      description: '`DashboardSeriesData` — the series to plot, with its own labels and units.',
    },
    widgetType: {
      control: 'select', options: ['timeseries', 'bar'],
      description: '`timeseries` or `bar`. Selects the base chart family; `chartVariant` then refines it.',
    },
    chartVariant: {
      control: 'select', options: ['area', 'line', 'vertical', 'horizontal'],
      description: 'Refines the family — e.g. area vs line for a timeseries, grouped vs stacked for bars. Leave undefined to take the widget type\'s default.',
    },
    height: {
      control: { type: 'number', min: 120, max: 480, step: 20 },
      description: 'Explicit plot height in px; 0 (the default) lets the card size it. Chart canvas geometry, deliberately off the spacing scale.',
    },
  },
  render: (args) => ({
    components: { DashboardChartWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="max-width:560px;height:300px;padding:12px 18px;">
        <DashboardChartWidget v-bind="args" />
      </v-card>
    `,
  }),
} satisfies Meta<typeof DashboardChartWidget>

export default meta
type Story = StoryObj<typeof meta>

export const TimeseriesArea: Story = {}

export const TimeseriesLine: Story = {
  args: { chartVariant: 'line' },
}

export const ColumnChart: Story = {
  args: {
    data: CHANNEL_SERIES,
    widgetType: 'bar',
    chartVariant: 'vertical',
  },
}

export const HorizontalBarChart: Story = {
  args: {
    data: CHANNEL_SERIES,
    widgetType: 'bar',
    chartVariant: 'horizontal',
  },
}

const COMPARISON_SERIES: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: ['06-01', '06-04', '06-07', '06-10', '06-13', '06-16', '06-19', '06-22', '06-25', '06-28', '07-01', '07-04'],
  series: [
    { name: 'Revenue', data: [4200, 5100, 4800, 6400, 5900, 7200, 6800, 8100, 7600, 8900, 9400, 10200] },
    { name: 'Previous period', data: [3800, 4300, 4600, 5200, 5500, 6100, 6300, 6900, 7100, 7400, 7900, 8300], isComparison: true },
  ],
}

export const WithComparisonSeries: Story = {
  args: {
    data: COMPARISON_SERIES,
    widgetType: 'timeseries',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shopify-style period comparison: a series flagged `isComparison` renders as a dashed line in the theme\'s comparison colour with no area fill, next to the solid current-period line.',
      },
    },
  },
}

export const NarrowContainer: Story = {
  args: {
    data: CHANNEL_MULTI_SERIES,
    widgetType: 'timeseries',
    chartVariant: 'line',
    height: 260,
  },
  render: (args) => ({
    components: { DashboardChartWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="width:200px;height:260px;padding:12px 10px;">
        <DashboardChartWidget v-bind="args" />
      </v-card>
    `,
  }),
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** The chart variants — line, area, bar — over the same series, plus the legend and tooltip that come with them. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardChartWidget },
    setup: () => ({ args }),
    template: `<DashboardChartWidget v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — a widget fills the grid cell it is placed in. What Phase 4
 * (P4-1) guarantees is that the **inset** does not change with the cell: the distance from
 * the card's border to this widget's content is `component.card.padding` at every size,
 * inherited from the card standard set in Phase 3 rather than a second widget-only pair.
 *
 * Rendered below at three cell sizes inside a real `DashboardWidgetCard` — run your eye down
 * the left edges.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardChartWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardChartWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardChartWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardChartWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, single-series, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardChartWidget },
    setup: () => ({ args }),
    template: `<DashboardChartWidget v-bind="args" />`,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget where it actually lives — inside a `DashboardWidgetCard`, in a
 * dashboard row beside its siblings. This is the composition P4-1 is judged on: the header
 * band, the body inset and the footer are the card's, and every widget in the family sits on
 * the same edge.
 */
export const InContextDashboardRow: Story = {
  render: (args) => ({
    components: { DashboardChartWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardChartWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardChartWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
