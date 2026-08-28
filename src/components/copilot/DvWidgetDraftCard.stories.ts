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
  title: 'Product/Da Vinci/DvWidgetDraftCard',
  component: DvWidgetDraftCard,
  tags: ['autodocs'],
  args: {
    accountId: ACCOUNT_ID,
    dashboardId: DASHBOARD_ID,
    draft: TIMESERIES_DRAFT,
    selected: false,
  },
  argTypes: {
    filters: { control: 'object', description: '`DashboardFilterState` the preview renders under. Defaults to last 30 days / daily / previous period, so the card shows something sensible without one.' },
    accountId: {
      control: 'text',
      description: 'Account the widget would be added to. Passed straight through to the dashboards store when the draft is accepted.',
    },
    dashboardId: {
      control: 'text',
      description: 'Target dashboard id for the add action.',
    },
    draft: {
      control: 'object',
      description: '`DashboardWidgetDraft` this card represents — the title, type and data the preview renders.',
    },
    selected: {
      control: 'boolean',
      description: 'Marks this card as the chosen draft in a multi-draft set. Selection is presentational; the host owns which id is selected.',
    },
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
export const Default: Story = {}

/** KPI quad draft. */
/** Every draft type the card can preview. */
export const Variants: Story = {
  render: () => ({
    components: { DvWidgetDraftCard },
    setup: () => ({ ts: TIMESERIES_DRAFT, kpi: KPI_DRAFT, tbl: TABLE_DRAFT }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">timeseries</div>
          <DvWidgetDraftCard :draft="ts" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">kpi</div>
          <DvWidgetDraftCard :draft="kpi" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">table</div>
          <DvWidgetDraftCard :draft="tbl" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Selected vs unselected. Tab to the card to see the focus ring. */
export const States: Story = {
  render: () => ({
    components: { DvWidgetDraftCard },
    setup: () => ({ d: TIMESERIES_DRAFT }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">unselected</div>
          <DvWidgetDraftCard :draft="d" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">selected</div>
          <DvWidgetDraftCard :draft="d" selected />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Mini-table draft. */
export const KpiDraft: Story = {
  args: { draft: KPI_DRAFT },
}

export const TableDraft: Story = {
  args: { draft: TABLE_DRAFT },
}

/** Selected ring — shown while Da Vinci is talking about this draft. */
export const Selected: Story = {
  args: { selected: true },
}
