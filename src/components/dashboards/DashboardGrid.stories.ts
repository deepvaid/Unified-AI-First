import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardFilterState, DashboardWidget } from '@/stores/dashboards/types'
import DashboardGrid from './DashboardGrid.vue'

const FILTERS: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

const WIDGETS: DashboardWidget[] = [
  {
    id: 'grid-kpi-revenue',
    type: 'kpi',
    title: 'Revenue',
    dataSource: 'commerce',
    metricId: 'commerce_revenue',
    layout: { x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
    drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
    lastRefreshedAt: minutesAgo(12),
  },
  {
    id: 'grid-kpi-orders',
    type: 'kpi',
    title: 'Orders',
    dataSource: 'commerce',
    metricId: 'commerce_orders',
    layout: { x: 4, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
    drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
    lastRefreshedAt: minutesAgo(30),
  },
  {
    id: 'grid-kpi-aov',
    type: 'kpi',
    title: 'Average Order Value',
    dataSource: 'commerce',
    metricId: 'commerce_aov',
    layout: { x: 8, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
    drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
    lastRefreshedAt: minutesAgo(65),
  },
  {
    id: 'grid-timeseries',
    type: 'timeseries',
    title: 'Revenue Over Time',
    dataSource: 'commerce',
    metricId: 'commerce_revenue_over_time',
    chartVariant: 'area',
    layout: { x: 0, y: 4, w: 7, h: 7, minW: 2, minH: 3 },
    drilldown: { routeName: 'OrdersReport', label: 'Open orders report' },
    lastRefreshedAt: minutesAgo(18),
  },
  {
    id: 'grid-table',
    type: 'table',
    title: 'Top Campaigns',
    dataSource: 'marketing',
    metricId: 'marketing_top_campaigns',
    layout: { x: 7, y: 4, w: 5, h: 7, minW: 2, minH: 3 },
    drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
    lastRefreshedAt: minutesAgo(41),
  },
]

const meta = {
  title: 'Dashboards/DashboardGrid',
  component: DashboardGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '12-column drag-and-drop widget grid (grid-layout-plus). Renders a `DashboardWidgetCard` (or setup guide) per widget, an empty state when there are no widgets, and switches to a stacked list below the md breakpoint. `editMode` enables drag/resize and shows column guides.',
      },
    },
  },
  args: {
    accountId: '2000290',
    dashboardId: '2000290-overview',
    widgets: WIDGETS,
    filters: FILTERS,
    editMode: false,
  },
  argTypes: {
    widgets: { control: 'object' },
    filters: { control: 'object' },
    editMode: { control: 'boolean' },
  },
  render: (args) => ({
    components: { DashboardGrid },
    setup: () => ({ args }),
    template: `
      <div style="max-width:1180px;">
        <DashboardGrid v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DashboardGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}

export const EditMode: Story = {
  args: { editMode: true },
}

export const Empty: Story = {
  args: { widgets: [] },
}
