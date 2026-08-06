import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardSeriesData } from '@/stores/dashboards/types'
import DashboardChartWidget from './DashboardChartWidget.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

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
  title: 'Dashboards/Widgets/DashboardChartWidget',
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
    data: { control: 'object' },
    widgetType: { control: 'select', options: ['timeseries', 'bar'] },
    chartVariant: { control: 'select', options: ['area', 'line', 'vertical', 'horizontal'] },
    height: { control: { type: 'number', min: 120, max: 480, step: 20 } },
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

export const DarkModeTimeseries: Story = {
  globals: darkModeGlobals,
  ...TimeseriesArea,
}

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
