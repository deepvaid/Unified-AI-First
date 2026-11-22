import type { Meta, StoryObj } from '@storybook/vue3'
import DvChartCard from './DvChartCard.vue'
import { useDashboardsStore } from '@/stores/useDashboards'
import { constrain } from '@/stories/decorators'
import { grid } from '@/stories/storyTemplate'

const ACCOUNT_ID = '2000290'

const WEEK = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']
const THIS_WEEK = [940, 1129, 760, 890, 1159, 1040, 1304]
const LAST_WEEK = [810, 690, 720, 1010, 640, 705, 980]

const meta = {
  title: 'Product/Da Vinci/DvChartCard',
  component: DvChartCard,
  tags: ['autodocs'],
  args: {
    title: 'Revenue · last 7 days',
    subtitle: '$7,222 total · +61.2% vs prior week',
    labels: WEEK,
    series: [
      { name: 'Revenue', data: THIS_WEEK },
      { name: 'Previous 7 days', data: LAST_WEEK, isComparison: true },
    ],
    unit: 'currency',
    saveMetricId: 'commerce_revenue_over_time',
  },
  argTypes: {
    title: { control: 'text', description: 'Main title of the chart.' },
    subtitle: { control: 'text', description: 'Optional subtitle — the headline number and the time range.' },
    labels: { control: 'object', description: 'One label per point on the x-axis.' },
    series: { control: 'object', description: 'One entry per line. `isComparison` draws a previous-period series dashed, aligned point by point.' },
    unit: { control: 'select', options: ['currency', 'count', 'percent'], description: 'How values are formatted on the axis and in tooltips.' },
    saveMetricId: { control: 'text', description: 'The dashboard metric this chart can be saved as. Absent, or unsupported on the account, hides the Save button.' },
    savedTo: { control: 'object', description: 'The widget this chart was saved as — lives on the chat message so a remount can\'t save twice.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvChartCard is a chart in the conversation, drawn by the **same chart widget the dashboard uses** —
theme colours, currency axis, tooltips and dark mode come with it, so the numbers read exactly as
they do on the page. (It used to be a hand-drawn CSS chart with a fixed y-axis and buttons that did
nothing.)

- **Add to dashboard** saves the chart as its dashboard metric (\`saveMetricId\`) on the target
  dashboard; it is disabled once saved, and hidden when the account can't hold that metric.
- **Download CSV** exports every series.
- **Enlarge** opens the chart in a wide dialog.

## Don'ts
- Don't pass more than a few series — it is a glance, not a report.
- Don't use it for categories; a comparison series is for the previous period of the same points.
`,
      },
    },
  },
  decorators: [constrain('drawer')],
  render: (args) => ({
    components: { DvChartCard },
    setup() {
      // Seed the dashboards store so Save can resolve a target dashboard.
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      return { args }
    },
    template: '<DvChartCard v-bind="args" />',
  }),
} satisfies Meta<typeof DvChartCard>

export default meta
type Story = StoryObj<typeof meta>

/** Revenue this week beside last week — Save, Download and Enlarge are live. */
export const Default: Story = {}

/** One line, or a comparison — the structure is the same, the series count changes. */
export const Variants: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvChartCard }, [
    { label: 'Single series', args: { series: [{ name: 'Revenue', data: THIS_WEEK }], subtitle: '$7,222 total', saveMetricId: undefined } },
    { label: 'With previous period', args: {} },
    { label: 'Counts', args: { title: 'Orders · last 7 days', subtitle: '10 orders', unit: 'count', series: [{ name: 'Orders', data: [2, 1, 0, 3, 1, 2, 1] }], saveMetricId: undefined } },
  ], { columns: 'repeat(auto-fit, minmax(320px, 1fr))' }),
}

/** There is no size prop — the card fills its host (the 400px drawer), and the chart takes the dashboard chart's own height. */
export const Sizes: Story = {
  decorators: [constrain('dialog')],
  render: (args) => ({
    components: { DvChartCard },
    setup() {
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      return { args }
    },
    template: `
      <div style="display: flex; gap: var(--mp-space-24); align-items: flex-start; flex-wrap: wrap;">
        <div style="width: 320px;"><DvChartCard v-bind="args" /></div>
        <div style="width: 480px;"><DvChartCard v-bind="args" /></div>
      </div>
    `,
  }),
}

/** Nothing to chart (every value zero), and a chart that cannot be saved (no `saveMetricId`, as on an account without Commerce). */
export const States: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvChartCard }, [
    { label: 'No data', args: { series: [{ name: 'Revenue', data: [0, 0, 0, 0, 0, 0, 0] }], subtitle: '$0 total', saveMetricId: undefined } },
    { label: 'Not saveable', args: { saveMetricId: undefined } },
  ], { columns: 'repeat(auto-fit, minmax(320px, 1fr))' }),
}
