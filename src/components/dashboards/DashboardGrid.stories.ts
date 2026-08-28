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
  title: 'Product/Dashboards/DashboardGrid',
  component: DashboardGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '12-column drag-and-drop widget grid (grid-layout-plus). Renders a `DashboardWidgetCard` (or setup guide) per widget, an empty state when there are no widgets, and switches to a stacked list below the md breakpoint. Layout is always directly editable on desktop — drag by the card header/handle, resize from the corner; column guides appear only during an interaction.',
      },
    },
  },
  args: {
    accountId: '2000290',
    dashboardId: '2000290-overview',
    widgets: WIDGETS,
    filters: FILTERS,
  },
  argTypes: {
    accountId: { control: 'text', description: 'Account the dashboard belongs to. Passed down to every widget.' },
    dashboardId: { control: 'text', description: 'Id of the dashboard being rendered.' },
    setupTasks: { control: 'object', description: '`SetupGuideTask[]`. When present, the setup guide renders as the first grid item; omit it once setup is done.' },
    setupCompleted: { control: 'number', description: 'How many setup tasks are done \u2014 the numerator in the guides progress line.' },
    setupProgress: { control: 'number', description: 'Setup completion percentage (0-100) for the guides progress bar.' },
    setupTotal: { control: 'number', description: 'Overall setup task count when `setupTasks` is a subset (e.g. the next 5 of 16).' },
    setupGuideRoute: { control: 'object', description: '`RouteLocationRaw` for the guides View full guide link. Omit it and the link is not rendered.' },
    widgets: {
      control: 'object',
      description: '`DashboardWidget[]` — each carries its own `layout` (`x`, `y`, `w`, `h`, `minW`, `minH`) in grid units, so the array is both the content and the layout. Reordering it does not move anything; changing `layout` does.',
    },
    filters: {
      control: 'object',
      description: '`DashboardFilterState` — `{ rangePreset, grain, comparison }`, applied to every widget in the grid. One filter state for the whole dashboard, not per widget.',
    },
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

export const Empty: Story = {
  args: { widgets: [] },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * Two structures: a populated grid, and the empty grid that invites the first widget. The grid
 * itself only places cards — every inset you see inside them belongs to `DashboardWidgetCard`
 * and the `component.card.*` standard (P4-1).
 */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardGrid },
    setup: () => ({ args }),
    template: `<DashboardGrid v-bind="args" />`,
  }),
  parameters: { canvas: 'full' },
}

/**
 * There is no `size` prop. Widget sizes are per-widget (`widgetSizePresets.ts`) and the grid
 * reflows them; the gap between cells is `component.card.gap` (16), the same token that spaces
 * a card's own sections, so the rhythm inside a card and the rhythm between cards agree.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardGrid },
    setup: () => ({ args }),
    template: `<DashboardGrid v-bind="args" />`,
  }),
  parameters: { canvas: 'full' },
}

/** Populated, empty, and edit mode where every card grows a drag grip. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardGrid },
    setup: () => ({ args }),
    template: `<DashboardGrid v-bind="args" />`,
  }),
  parameters: { canvas: 'full' },
}
