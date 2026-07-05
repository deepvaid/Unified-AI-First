import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import DvRefineDialog from './DvRefineDialog.vue'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'

const TIMESERIES_DRAFT: DashboardWidgetDraft = {
  dashboardId: '2000290-home',
  type: 'timeseries',
  title: 'Open Rate Trend',
  dataSource: 'marketing',
  metricId: 'marketing_open_rate_over_time',
  chartVariant: 'line',
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
}

const TABLE_DRAFT: DashboardWidgetDraft = {
  dashboardId: '2000290-home',
  type: 'table',
  title: 'Top Campaigns',
  dataSource: 'marketing',
  metricId: 'marketing_top_campaigns',
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
}

const meta = {
  title: 'Copilot/DvRefineDialog',
  component: DvRefineDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    draft: TIMESERIES_DRAFT,
    sourceLabel: 'Marketing → Email Campaigns · Last 30 days',
  },
  argTypes: {
    draft: { control: 'object' },
    sourceLabel: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvRefineDialog is the confirm/refine step between "Add widget" on
\`DvWidgetDraftCard\` and the actual commit: rename the widget, switch the
visualisation tile (KPI / Bar / Line / Area / Donut / Table / Scatter / Funnel),
and watch the compact \`DvDraftPreview\` update live behind a brief loading veil.
Applying emits the mapped \`DashboardWidgetType\` + \`chartVariant\` back to the host.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvRefineDialog },
    setup() {
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

/** Line-trend draft — switch tiles to see the live preview swap. */
export const Default: Story = {}

/** Table draft — the Table tile starts selected. */
export const TableDraft: Story = {
  args: { draft: TABLE_DRAFT },
}
