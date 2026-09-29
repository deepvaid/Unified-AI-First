import type { Meta, StoryObj } from '@storybook/vue3'
import DvWidgetDraftCard from './DvWidgetDraftCard.vue'
import { useDashboardsStore } from '@/stores/useDashboards'
import { constrain, measure } from '@/stories/decorators'
import { grid } from '@/stories/storyTemplate'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'

// Seeded demo accounts (Pinia is registered in .storybook/preview.ts). 2000290 has every cloud;
// 2000292 has no Commerce, so a commerce draft there cannot be added.
const ACCOUNT_ID = '2000290'
const DASHBOARD_ID = '2000290-home'
const NO_COMMERCE_ACCOUNT_ID = '2000292'
const NO_COMMERCE_DASHBOARD_ID = '2000292-home'

// Draft shapes mirror `draftFromResolution()` output (src/davinci/widgetRequest.ts): metric ids,
// drilldowns and provenance come from stores/dashboards/metricCatalog.ts, and every draft carries
// an explicit chart variant.
const draft = (partial: Pick<DashboardWidgetDraft, 'type' | 'title' | 'dataSource' | 'metricId'> & Partial<DashboardWidgetDraft>): DashboardWidgetDraft => ({
  dashboardId: DASHBOARD_ID,
  drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
  aiProvenance: { prompt: `show ${partial.title.toLowerCase()}`, summary: `Da Vinci mapped your prompt to ${partial.title}.` },
  ...partial,
})

const LINE_DRAFT = draft({ type: 'timeseries', chartVariant: 'line', title: 'Open Rate Trend', dataSource: 'marketing', metricId: 'marketing_open_rate_over_time' })
const KPI_DRAFT = draft({ type: 'kpi', title: 'Revenue', dataSource: 'commerce', metricId: 'commerce_revenue' })
const TABLE_DRAFT = draft({ type: 'table', title: 'Top Campaigns', dataSource: 'marketing', metricId: 'marketing_top_campaigns' })
const COLUMN_DRAFT = draft({ type: 'bar', chartVariant: 'vertical', title: 'Revenue by Channel', dataSource: 'commerce', metricId: 'commerce_revenue_by_channel' })
const DONUT_DRAFT = draft({ type: 'donut', title: 'Email Address by Domain', dataSource: 'contacts', metricId: 'contacts_by_domain' })
const LIST_DRAFT = draft({ type: 'bar_list', title: 'Best Sellers', dataSource: 'commerce', metricId: 'commerce_best_sellers' })
const GAUGE_DRAFT = draft({ type: 'gauge', title: 'Deliverability Score', dataSource: 'marketing', metricId: 'marketing_deliverability_score' })

const NOTE = 'Orders can only be shown as a KPI tile, so I drafted that instead of a line chart.'

const meta = {
  title: 'Product/Da Vinci/DvWidgetDraftCard',
  component: DvWidgetDraftCard,
  tags: ['autodocs'],
  args: {
    accountId: ACCOUNT_ID,
    dashboardId: DASHBOARD_ID,
    draft: LINE_DRAFT,
    selected: false,
  },
  argTypes: {
    accountId: { control: 'text', description: 'Account the widget would be added to. Passed straight through to the dashboards store when the draft is accepted.' },
    dashboardId: { control: 'text', description: 'Target dashboard id for the add action. Off a dashboard route the card uses this; on one it lands the widget on the dashboard being viewed.' },
    draft: { control: 'object', description: '`DashboardWidgetDraft` this card represents. The preview is the real dashboard widget for its `metricId` / `type` / `chartVariant`.' },
    filters: { control: 'object', description: '`DashboardFilterState` to preview under. Defaults to the target dashboard\'s own filters, so the numbers match the page.' },
    note: { control: 'text', description: 'What differs from what was asked for ("Orders can only be shown as a KPI tile…"). Shown above the preview until the widget is added.' },
    added: { control: 'object', description: 'The widget this draft became. Lives on the chat message, so a remount can\'t offer Add twice; the card still re-enables Add if that widget is deleted.' },
    selected: { control: 'boolean', description: 'Marks this card as the chosen draft in a multi-draft set. Presentational; the host owns which id is selected.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvWidgetDraftCard is the widget Da Vinci drafts inside the copilot: a type eyebrow + Draft badge, an
optional note, the **live** dashboard widget (same card, same data, same numbers as the dashboard
— never sample art), and an "Add widget" action. Adding opens \`DvRefineDialog\` (rename, choose
one of the views the metric can really be drawn as), then commits to the target dashboard; the
maximize action opens \`DvExpandDialog\`.

When the dashboard cannot take the widget (it is full, or the account lacks the cloud) the reason
shows in an error alert and Add is disabled — it never fails silently.
`,
      },
    },
  },
  decorators: [constrain('drawer')],
  render: (args) => ({
    components: { DvWidgetDraftCard },
    setup() {
      // Seed the dashboards store so the card can resolve its target dashboard.
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      return { args }
    },
    template: '<DvWidgetDraftCard v-bind="args" />',
  }),
} satisfies Meta<typeof DvWidgetDraftCard>

export default meta
type Story = StoryObj<typeof meta>

/** Open-rate line chart — the Refine → Add flow is live: after adding, the card dims into "Added". */
export const Default: Story = {}

/** Every kind of widget Da Vinci drafts, each drawn as the real thing. */
export const Variants: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvWidgetDraftCard }, [
    { label: 'Line chart', args: { draft: LINE_DRAFT } },
    { label: 'KPI tile', args: { draft: KPI_DRAFT } },
    { label: 'Table', args: { draft: TABLE_DRAFT } },
    { label: 'Column chart', args: { draft: COLUMN_DRAFT } },
    { label: 'Donut', args: { draft: DONUT_DRAFT } },
    { label: 'Ranked list', args: { draft: LIST_DRAFT } },
    { label: 'Gauge', args: { draft: GAUGE_DRAFT } },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}

/** There is no size prop: the card fills its host. It lives in the 400px drawer, so it is shown at the drawer measure and at a narrow panel. */
export const Sizes: Story = {
  decorators: [constrain('dialog')],
  render: (args) => ({
    components: { DvWidgetDraftCard },
    setup() {
      useDashboardsStore().ensureAccountDashboards(ACCOUNT_ID)
      return { args, narrow: measure.narrow, drawer: measure.drawer }
    },
    template: `
      <div style="display: flex; gap: var(--mp-space-24); align-items: flex-start; flex-wrap: wrap;">
        <div :style="{ width: narrow }"><DvWidgetDraftCard v-bind="args" /></div>
        <div :style="{ width: drawer }"><DvWidgetDraftCard v-bind="args" /></div>
      </div>
    `,
  }),
}

/** Resting, selected, with a note (the request could not be honoured exactly), added, and blocked (Commerce is not on this account). */
export const States: Story = {
  decorators: [constrain('dialog')],
  render: (args) => ({
    components: { DvWidgetDraftCard },
    setup() {
      const store = useDashboardsStore()
      store.ensureAccountDashboards(ACCOUNT_ID)
      store.ensureAccountDashboards(NO_COMMERCE_ACCOUNT_ID)
      // "Added" needs a widget that really exists on the dashboard.
      const existing = store.getDashboardById(ACCOUNT_ID, DASHBOARD_ID)?.widgets[0]
      const added = existing
        ? { title: existing.title, dashboardName: 'Overview', widgetId: existing.id, dashboardId: DASHBOARD_ID, accountId: ACCOUNT_ID }
        : null
      const ordersKpi = draft({ type: 'kpi', title: 'Orders', dataSource: 'commerce', metricId: 'commerce_orders' })
      const blocked = { ...KPI_DRAFT, dashboardId: NO_COMMERCE_DASHBOARD_ID }
      return { args, ordersKpi, added, blocked, NO_COMMERCE_ACCOUNT_ID, NO_COMMERCE_DASHBOARD_ID }
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--mp-space-24);">
        <div><div class="text-caption text-medium-emphasis mb-2">Resting</div><DvWidgetDraftCard v-bind="args" /></div>
        <div><div class="text-caption text-medium-emphasis mb-2">Selected</div><DvWidgetDraftCard v-bind="args" selected /></div>
        <div><div class="text-caption text-medium-emphasis mb-2">With a note</div><DvWidgetDraftCard v-bind="args" :draft="ordersKpi" note="${NOTE}" /></div>
        <div><div class="text-caption text-medium-emphasis mb-2">Added</div><DvWidgetDraftCard v-bind="args" :added="added" /></div>
        <div><div class="text-caption text-medium-emphasis mb-2">Blocked — no Commerce on this account</div>
          <DvWidgetDraftCard :account-id="NO_COMMERCE_ACCOUNT_ID" :dashboard-id="NO_COMMERCE_DASHBOARD_ID" :draft="blocked" />
        </div>
      </div>
    `,
  }),
}
