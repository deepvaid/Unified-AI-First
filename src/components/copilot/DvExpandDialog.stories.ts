import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import DvExpandDialog from './DvExpandDialog.vue'
import { useDashboardsStore } from '@/stores/useDashboards'
import type { DashboardFilterState, DashboardWidgetDraft } from '@/stores/dashboards/types'
import { isolateStorage, overlayDocs } from '@/stories/decorators'

const ACCOUNT_ID = '2000290'
const DASHBOARD_ID = '2000290-home'
const FILTERS: DashboardFilterState = { rangePreset: 'last_30_days', grain: 'daily', comparison: 'previous_period' }

const CHANNEL_DRAFT: DashboardWidgetDraft = {
  dashboardId: DASHBOARD_ID,
  type: 'bar',
  chartVariant: 'vertical',
  title: 'Revenue by Channel',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_by_channel',
  drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
}

const KPI_DRAFT: DashboardWidgetDraft = {
  ...CHANNEL_DRAFT,
  type: 'kpi',
  chartVariant: undefined,
  title: 'Revenue',
  metricId: 'commerce_revenue',
}

const meta = {
  title: 'Product/Da Vinci/DvExpandDialog',
  component: DvExpandDialog,
  tags: ['autodocs'],
  // The render seeds the dashboards store, which persists to localStorage: put it back on unmount.
  decorators: [isolateStorage],
  args: {
    modelValue: true,
    draft: CHANNEL_DRAFT,
    accountId: ACCOUNT_ID,
    filters: FILTERS,
    typeLabel: 'Column',
    isAdded: false,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'Open state. `v-model` — the dialog emits `update:modelValue` and never closes itself.' },
    draft: { control: 'object', description: '`DashboardWidgetDraft` shown at full size — the real dashboard widget on live data.' },
    accountId: { control: 'text', description: 'Account the live preview reads its data from.' },
    filters: { control: 'object', description: '`DashboardFilterState` the preview renders under.' },
    typeLabel: { control: 'text', description: 'Subtitle: how the draft is drawn ("Column", "Ranked list"…).' },
    isAdded: { control: 'boolean', description: 'When true the primary action reads "Added" and is disabled.' },
    error: { control: 'text', description: 'Why the draft cannot be added right now. Shows an error alert and disables the action.' },
  },
  parameters: {
    docs: {
      // Every story opens the dialog on mount, so each gets its own frame on the docs page.
      ...overlayDocs('720px').docs,
      description: {
        component: `
## Overview
DvExpandDialog previews a draft at full size before it is committed — the same live
\`DashboardWidgetCard\` the dashboard renders, in the wide \`MpDialog\` (\`lg\`). A lone KPI tile is
kept to a tile-sized column rather than stretched into a banner. "Add to dashboard" emits \`add\`.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvExpandDialog },
    setup() {
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      const open = ref(true)
      return { args, open }
    },
    template: `
      <div>
        <v-btn color="primary" class="text-none" @click="open = true">Preview at full size</v-btn>
        <DvExpandDialog v-bind="args" v-model="open" @add="open = false" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvExpandDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Revenue by channel as a column chart at full size. */
export const Default: Story = {}

/** A KPI draft — kept tile-sized in the middle of the dialog rather than stretched into a banner. */
export const KpiDraft: Story = {
  args: { draft: KPI_DRAFT, typeLabel: 'KPI' },
}

/** Draft already committed — the primary action reads "Added" with a check and is disabled. */
export const AlreadyAdded: Story = {
  args: { isAdded: true },
}
