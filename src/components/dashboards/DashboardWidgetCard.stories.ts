import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardFilterState, DashboardWidget } from '@/stores/dashboards/types'
import { buildLayoutFromPreset } from './widgetSizePresets'
import DashboardWidgetCard from './DashboardWidgetCard.vue'

const FILTERS: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

const KPI_WIDGET: DashboardWidget = {
  id: 'story-kpi',
  type: 'kpi',
  title: 'Revenue',
  dataSource: 'commerce',
  metricId: 'commerce_revenue',
  layout: buildLayoutFromPreset('kpi', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
  lastRefreshedAt: minutesAgo(24),
}

const TIMESERIES_WIDGET: DashboardWidget = {
  id: 'story-timeseries',
  type: 'timeseries',
  title: 'Revenue Over Time',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_over_time',
  chartVariant: 'area',
  layout: buildLayoutFromPreset('timeseries', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'OrdersReport', label: 'Open orders report' },
  lastRefreshedAt: minutesAgo(51),
}

const BAR_WIDGET: DashboardWidget = {
  id: 'story-bar',
  type: 'bar',
  title: 'Revenue by Channel',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_by_channel',
  chartVariant: 'vertical',
  layout: buildLayoutFromPreset('bar', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'SalesSummary', label: 'Open sales summary' },
  lastRefreshedAt: minutesAgo(8),
}

const TABLE_WIDGET: DashboardWidget = {
  id: 'story-table',
  type: 'table',
  title: 'Top Campaigns',
  dataSource: 'marketing',
  metricId: 'marketing_top_campaigns',
  layout: buildLayoutFromPreset('table', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  lastRefreshedAt: minutesAgo(95),
}

const ACTIVITY_WIDGET: DashboardWidget = {
  id: 'story-activity',
  type: 'activity',
  title: 'Live activity',
  dataSource: 'marketing',
  metricId: 'marketing_live_activity',
  layout: buildLayoutFromPreset('activity', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  lastRefreshedAt: minutesAgo(2),
}

const AI_WIDGET: DashboardWidget = {
  ...TIMESERIES_WIDGET,
  id: 'story-ai',
  title: 'Campaign Revenue Trend',
  aiProvenance: {
    prompt: 'show me how campaign revenue is trending this month',
    summary: 'Time series of attributed campaign revenue.',
  },
}

const meta = {
  title: 'Dashboards/DashboardWidgetCard',
  component: DashboardWidgetCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Frame for every dashboard widget: title/subtitle header, action menu, data body (KPI, chart, pie, table, or activity — resolved from the widget `metricId` via `useWidgetData` mock stores), and a source-cloud footer. `editable` shows drag handles + resize/remove actions; `preview` renders the dashed wizard-preview style.',
      },
    },
  },
  args: {
    accountId: '2000290',
    widget: TIMESERIES_WIDGET,
    filters: FILTERS,
    editable: false,
    preview: false,
    showActions: true,
  },
  argTypes: {
    widget: { control: 'object' },
    filters: { control: 'object' },
    editable: { control: 'boolean' },
    preview: { control: 'boolean' },
    showActions: { control: 'boolean' },
  },
  render: (args) => ({
    components: { DashboardWidgetCard },
    setup: () => ({ args }),
    template: `
      <div :style="{ height: args.widget.type === 'kpi' ? '200px' : '340px', maxWidth: args.widget.type === 'kpi' ? '340px' : '560px' }">
        <DashboardWidgetCard v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DashboardWidgetCard>

export default meta
type Story = StoryObj<typeof meta>

export const Chart: Story = {}

export const Kpi: Story = {
  args: { widget: KPI_WIDGET },
}

export const BarChart: Story = {
  args: { widget: BAR_WIDGET },
}

export const Table: Story = {
  args: { widget: TABLE_WIDGET },
}

export const Activity: Story = {
  args: { widget: ACTIVITY_WIDGET },
}

export const DaVinciGenerated: Story = {
  args: { widget: AI_WIDGET },
}

export const EditMode: Story = {
  args: { editable: true },
}

export const WizardPreview: Story = {
  args: { preview: true, showActions: false },
}
