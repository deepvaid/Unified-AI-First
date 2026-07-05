import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardFilterState, DashboardWidgetDraft } from '@/stores/dashboards/types'
import WidgetEditStep from './WidgetEditStep.vue'

const FILTERS: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

const CHART_DRAFT: DashboardWidgetDraft = {
  dashboardId: '2000290-overview',
  type: 'bar',
  title: 'Revenue by Channel',
  subtitle: 'Compare revenue across sales channels',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_by_channel',
  chartVariant: 'vertical',
  drilldown: { routeName: 'SalesSummary', label: 'Open sales summary' },
}

const KPI_DRAFT: DashboardWidgetDraft = {
  dashboardId: '2000290-overview',
  type: 'kpi',
  title: 'Revenue',
  dataSource: 'commerce',
  metricId: 'commerce_revenue',
  drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
}

const meta = {
  title: 'Dashboards/Wizard/WidgetEditStep',
  component: WidgetEditStep,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Step 2 of the widget wizard: edit title/subtitle, switch chart type (bar / column / area / pie — only for chart-capable drafts), and watch a live `DashboardWidgetCard` preview built from the draft. Emits `update:draft` on every change.',
      },
    },
  },
  args: {
    accountId: '2000290',
    draft: CHART_DRAFT,
    filters: FILTERS,
  },
  argTypes: {
    draft: { control: 'object' },
    filters: { control: 'object' },
  },
  render: (args) => ({
    components: { WidgetEditStep },
    setup() {
      const draft = ref<DashboardWidgetDraft>({ ...args.draft })
      watch(
        () => args.draft,
        (next) => {
          draft.value = { ...next }
        },
      )
      return { args, draft }
    },
    template: `
      <div style="max-width:560px;">
        <WidgetEditStep
          :account-id="args.accountId"
          :draft="draft"
          :filters="args.filters"
          @update:draft="draft = $event"
        />
      </div>
    `,
  }),
} satisfies Meta<typeof WidgetEditStep>

export default meta
type Story = StoryObj<typeof meta>

export const ChartWidget: Story = {}

export const KpiWidget: Story = {
  args: { draft: KPI_DRAFT },
}
