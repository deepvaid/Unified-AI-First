import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardFilterState, DashboardWidgetDraft } from '@/stores/dashboards/types'
import WidgetWizardDrawer from './WidgetWizardDrawer.vue'

const FILTERS: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

const EDIT_DRAFT: DashboardWidgetDraft = {
  dashboardId: '2000290-overview',
  widgetId: 'widget-demo',
  type: 'bar',
  title: 'Revenue by Channel',
  subtitle: 'Compare revenue across sales channels',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_by_channel',
  chartVariant: 'vertical',
  drilldown: { routeName: 'SalesSummary', label: 'Open sales summary' },
}

const DAVINCI_DRAFT: DashboardWidgetDraft = {
  dashboardId: '2000290-overview',
  type: 'timeseries',
  title: 'Campaign Revenue Trend',
  dataSource: 'marketing',
  metricId: 'marketing_total_campaign_revenue',
  chartVariant: 'area',
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  aiProvenance: {
    prompt: 'show me how campaign revenue is trending',
    summary: 'Time series of attributed campaign revenue.',
  },
}

const meta = {
  title: 'Product/Dashboards/WidgetWizardDrawer',
  component: WidgetWizardDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Two-step add/edit widget flow inside an `MpFormDrawer`: pick a widget from the library, then refine title/subtitle/chart type with a live preview. Passing an `initialDraft` with a `widgetId` (or AI provenance) skips straight to the edit step.',
      },
    },
  },
  args: {
    accountId: '2000290',
    dashboardId: '2000290-overview',
    dashboardFilters: FILTERS,
    initialDraft: null,
  },
  argTypes: {
    accountId: {
      control: 'text',
      description: 'Account the new widget belongs to.',
    },
    dashboardId: {
      control: 'text',
      description: 'Dashboard the wizard will add the finished widget to.',
    },
    dashboardFilters: {
      control: 'object',
      description: '`DashboardFilterState` inherited from the dashboard, so the wizard preview shows the widget under the filters it will actually run under.',
    },
    initialDraft: {
      control: 'object',
      description: 'Seed the wizard with an existing draft to edit instead of creating. When it carries a `widgetId` the drawer switches to Edit mode (title, subtitle and the save action all change).',
    },
  },
  render: (args) => ({
    components: { WidgetWizardDrawer },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn color="primary" prepend-icon="plus" @click="open = true">Add widget</v-btn>
        <WidgetWizardDrawer v-bind="args" v-model="open" />
      </section>
    `,
  }),
} satisfies Meta<typeof WidgetWizardDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const LibraryStep: Story = {}

export const EditExistingWidget: Story = {
  args: { initialDraft: EDIT_DRAFT },
}

export const DaVinciDraft: Story = {
  args: { initialDraft: DAVINCI_DRAFT },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * The wizard's two structures are its two steps: **library** (pick a widget type) and **edit**
 * (configure the one you picked). Both live in the same `MpFormDrawer` shell, so they share
 * its header/body/footer rhythm.
 */
export const Variants: Story = {
  render: (args) => ({
    components: { WidgetWizardDrawer },
    setup: () => ({ args }),
    template: `<WidgetWizardDrawer v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop. The drawer is wider than the 480 default because the edit step puts
 * a live preview beside the form; the width is set once on the `MpFormDrawer` it composes.
 * Below 640px it goes full-bleed like every other drawer.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { WidgetWizardDrawer },
    setup: () => ({ args }),
    template: `<WidgetWizardDrawer v-bind="args" />`,
  }),
}

/** Opening on the library step, opening straight into edit for an existing widget, and the
 *  Da Vinci draft hand-off where the wizard arrives pre-filled. */
export const States: Story = {
  render: (args) => ({
    components: { WidgetWizardDrawer },
    setup: () => ({ args }),
    template: `<WidgetWizardDrawer v-bind="args" />`,
  }),
}
