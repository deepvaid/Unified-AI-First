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
  title: 'Product/Dashboards/Wizard/WidgetEditStep',
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
    accountId: { control: 'text', description: 'Account the widget belongs to, used to resolve the live preview data.' },
    draft: {
      control: 'object',
      description: '`DashboardWidgetDraft` under edit. The step emits `update:draft` on every change, so the host owns the value.',
    },
    filters: {
      control: 'object',
      description: '`DashboardFilterState` used to render the live preview, so what you configure is what the dashboard will show.',
    },
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** The step renders a different form per widget type — chart, KPI, table — against the same
 *  live preview. Those are its variants. */
export const Variants: Story = {
  render: (args) => ({
    components: { WidgetEditStep },
    setup: () => ({ args }),
    template: `<WidgetEditStep v-bind="args" />`,
  }),
}

/** There is no `size` prop — the step fills the wizard drawer's body and inherits its inset.
 *  Its field rhythm comes from `component.field.groupGap`, the same one settings pages use. */
export const Sizes: Story = {
  render: (args) => ({
    components: { WidgetEditStep },
    setup: () => ({ args }),
    template: `<WidgetEditStep v-bind="args" />`,
  }),
}

/** Editing a chart and editing a KPI — the preview re-renders as the form changes. */
export const States: Story = {
  render: (args) => ({
    components: { WidgetEditStep },
    setup: () => ({ args }),
    template: `<WidgetEditStep v-bind="args" />`,
  }),
}
