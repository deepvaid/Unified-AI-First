import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import DvRefineDialog from './DvRefineDialog.vue'
import { useDashboardsStore } from '@/stores/useDashboards'
import type { DashboardFilterState, DashboardWidgetDraft } from '@/stores/dashboards/types'

const ACCOUNT_ID = '2000290'
const DASHBOARD_ID = '2000290-home'
const FILTERS: DashboardFilterState = { rangePreset: 'last_30_days', grain: 'daily', comparison: 'previous_period' }

const draft = (partial: Pick<DashboardWidgetDraft, 'type' | 'title' | 'dataSource' | 'metricId'> & Partial<DashboardWidgetDraft>): DashboardWidgetDraft => ({
  dashboardId: DASHBOARD_ID,
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  ...partial,
})

/** Email volume can be drawn four ways (line, area, column, bar) — the tile picker has four tiles. */
const MULTI_VIEW_DRAFT = draft({ type: 'timeseries', chartVariant: 'area', title: 'Email Volume', dataSource: 'marketing', metricId: 'marketing_email_volume' })
/** Orders has exactly one view (a KPI tile) — the picker collapses to a static row. */
const SINGLE_VIEW_DRAFT = draft({ type: 'kpi', title: 'Orders', dataSource: 'commerce', metricId: 'commerce_orders', drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' } })
const TABLE_DRAFT = draft({ type: 'table', title: 'Top Campaigns', dataSource: 'marketing', metricId: 'marketing_top_campaigns' })

const meta = {
  title: 'Product/Da Vinci/DvRefineDialog',
  component: DvRefineDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    draft: MULTI_VIEW_DRAFT,
    accountId: ACCOUNT_ID,
    filters: FILTERS,
    sourceLabel: 'Marketing → Email Volume · Latest sends',
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'Open state. `v-model` — the dialog emits `update:modelValue` and never closes itself.' },
    draft: { control: 'object', description: '`DashboardWidgetDraft` being refined. The dialog seeds its name and the selected view from this and emits `apply` with the choice.' },
    accountId: { control: 'text', description: 'Account the live preview reads its data from.' },
    filters: { control: 'object', description: '`DashboardFilterState` the preview renders under — the target dashboard\'s own, so the numbers match the page.' },
    sourceLabel: { control: 'text', description: 'Where the draft\'s data comes from and what span it covers, e.g. "Marketing → Email Volume · Latest sends".' },
    error: { control: 'text', description: 'Why the draft cannot be added right now (dashboard full, unsupported). Shows an error alert and disables "Add to dashboard".' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvRefineDialog is the confirm step between "Add widget" on \`DvWidgetDraftCard\` and the commit:
rename the widget and pick how it is drawn. The choices are **exactly the views the metric can be
drawn as** (\`optionsForMetric\`) — a metric with one view shows a static row instead of tiles. The
preview is the real dashboard widget on live data, remounted when the view changes.
Applying emits the chosen \`DashboardWidgetType\` + \`chartVariant\` back to the host.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvRefineDialog },
    setup() {
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height: 640px;">
        <v-btn color="primary" class="text-none" prepend-icon="plus" @click="open = true">
          Add widget
        </v-btn>
        <DvRefineDialog v-bind="args" v-model="open" @apply="open = false" />
      </section>
    `,
  }),
} satisfies Meta<typeof DvRefineDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Email volume — four views; switch tiles to see the live preview swap. */
export const Default: Story = {}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** Dialogs overlay, so variants are one story each: the views a metric offers decide the picker. This is the single-view case — Orders can only be a KPI tile. */
export const Variants: Story = {
  args: { draft: SINGLE_VIEW_DRAFT, sourceLabel: 'Commerce → Orders · Last 30 days' },
}

/** There is no `size` prop — this is `MpDialog`'s `md` (640px); the only inset the file owns is the gap between its two columns. A table draft shows the preview as a grid rather than a chart. */
export const Sizes: Story = {
  args: { draft: TABLE_DRAFT, sourceLabel: 'Marketing → Top Campaigns · All time' },
}

/** The draft cannot be added: the reason shows and "Add to dashboard" is disabled. */
export const States: Story = {
  args: { error: 'Overview already has 24 widgets, the most a dashboard can hold. Remove one, or add this to another dashboard.' },
}
