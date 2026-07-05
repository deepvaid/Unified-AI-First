import type { Meta, StoryObj } from '@storybook/vue3'
import DvWidgetDraftCard from './DvWidgetDraftCard.vue'
import { useDashboardsStore } from '@/stores/useDashboards'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'

// Seeded demo account (Pinia is registered in .storybook/preview.ts); the
// default seeded dashboard for it is `2000290-home` ("Overview").
const ACCOUNT_ID = '2000290'
const DASHBOARD_ID = '2000290-home'

// Draft shapes mirror useDashboards.buildAiWidgetDraft() output (metric ids,
// drilldowns, and provenance come from stores/dashboards/metricCatalog.ts).
const TIMESERIES_DRAFT: DashboardWidgetDraft = {
  dashboardId: DASHBOARD_ID,
  type: 'timeseries',
  title: 'Open Rate Trend',
  dataSource: 'marketing',
  metricId: 'marketing_open_rate_over_time',
  chartVariant: 'line',
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  aiProvenance: {
    prompt: 'show open rate trend for last 30 days',
    summary: 'Da Vinci mapped your prompt to Open Rate Trend as a timeseries widget.',
  },
}

const KPI_DRAFT: DashboardWidgetDraft = {
  dashboardId: DASHBOARD_ID,
  type: 'kpi',
  title: 'Revenue',
  dataSource: 'commerce',
  metricId: 'commerce_revenue',
  drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
  aiProvenance: {
    prompt: 'add a revenue kpi summary',
    summary: 'Da Vinci mapped your prompt to Revenue as a kpi widget.',
  },
}

const TABLE_DRAFT: DashboardWidgetDraft = {
  dashboardId: DASHBOARD_ID,
  type: 'table',
  title: 'Top Campaigns',
  dataSource: 'marketing',
  metricId: 'marketing_top_campaigns',
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  aiProvenance: {
    prompt: 'show a table of top campaigns',
    summary: 'Da Vinci mapped your prompt to Top Campaigns as a table widget.',
  },
}

const meta = {
  title: 'Copilot/DvWidgetDraftCard',
  component: DvWidgetDraftCard,
  tags: ['autodocs'],
  args: {
    accountId: ACCOUNT_ID,
    dashboardId: DASHBOARD_ID,
    draft: TIMESERIES_DRAFT,
    selected: false,
  },
  argTypes: {
    accountId: { control: 'text' },
    dashboardId: { control: 'text' },
    draft: { control: 'object' },
    selected: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvWidgetDraftCard is the AI widget draft proposed by Da Vinci inside the copilot
drawer: type eyebrow + Draft badge, title block, a live \`DvDraftPreview\`, and an
"Add widget" action. Adding opens \`DvRefineDialog\` (rename / switch visualisation),
then commits the widget to the target dashboard via the dashboards store; the
maximize action opens \`DvExpandDialog\`. The full flow is interactive in this story —
after adding, the card dims into its "Added" state.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvWidgetDraftCard },
    setup() {
      // Seed the dashboards store so commitDraft() can resolve the target dashboard.
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      return { args }
    },
    template: `
      <div style="max-width: 360px;">
        <DvWidgetDraftCard v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvWidgetDraftCard>

export default meta
type Story = StoryObj<typeof meta>

/** Line-chart draft — the most common Da Vinci proposal. */
export const TimeseriesDraft: Story = {}

/** KPI quad draft. */
export const KpiDraft: Story = {
  args: { draft: KPI_DRAFT },
}

/** Mini-table draft. */
export const TableDraft: Story = {
  args: { draft: TABLE_DRAFT },
}

/** Selected ring — shown while Da Vinci is talking about this draft. */
export const Selected: Story = {
  args: { selected: true },
}
