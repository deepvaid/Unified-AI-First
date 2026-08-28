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
  title: 'Product/Da Vinci/DvRefineDialog',
  component: DvRefineDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    draft: TIMESERIES_DRAFT,
    sourceLabel: 'Marketing → Email Campaigns · Last 30 days',
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'Open state. `v-model` \u2014 the dialog emits `update:modelValue` and never closes itself.' },
    draft: {
      control: 'object',
      description: '`DashboardWidgetDraft` being refined. The dialog seeds its title field and chart-type tiles from this and emits `apply` with the changed subset.',
    },
    sourceLabel: {
      control: 'text',
      description: 'Where the draft came from, shown as context in the header, e.g. the originating prompt or dashboard.',
    },
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a two-column refine panel: the form on the left, a live preview on the right. Its variants are the visualisation tiles, which re-render the preview in place. */
export const Variants: Story = {
  render: (args) => ({
    components: { DvRefineDialog },
    setup: () => ({ args }),
    template: `<DvRefineDialog v-bind="args" />`,
  }),
}

/** There is no `size` prop — this is `MpDialog`'s `md` (640px). Phase 4 replaced its own `max-width="720"` and its `16×20 / 20 / 12×16` bands with the shell; the only inset this file still owns is the gap between its two columns. */
export const Sizes: Story = {
  render: (args) => ({
    components: { DvRefineDialog },
    setup: () => ({ args }),
    template: `<DvRefineDialog v-bind="args" />`,
  }),
}

/** Resting, mid-refresh (the preview shows a spinner while it re-renders), and a table draft where the preview is a grid rather than a chart. */
export const States: Story = {
  render: (args) => ({
    components: { DvRefineDialog },
    setup: () => ({ args }),
    template: `<DvRefineDialog v-bind="args" />`,
  }),
}
