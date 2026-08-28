import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardSeriesData } from '@/stores/dashboards/types'
import DashboardPieWidget from './DashboardPieWidget.vue'

const CHANNEL_SHARE: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: ['Online Store', 'Retail POS', 'Marketplace', 'Wholesale'],
  series: [
    { name: 'Revenue', data: [45200, 28100, 15400, 9800] },
  ],
}

const TICKETS_BY_CHANNEL: DashboardSeriesData = {
  kind: 'series',
  unit: 'count',
  labels: ['Email', 'Chat', 'Phone', 'Social'],
  series: [
    { name: 'Tickets', data: [142, 96, 54, 23] },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardPieWidget',
  component: DashboardPieWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Donut chart body for pie-type dashboard widgets. Renders the first series of a `DashboardSeriesData` payload with percentage data labels and a bottom legend; tooltips format by the data unit.',
      },
    },
  },
  args: {
    data: CHANNEL_SHARE,
    height: 260,
  },
  argTypes: {
    data: {
      control: 'object',
      description: '`DashboardSeriesData` — segment labels and values. Colours are assigned by index from the chart palette.',
    },
    height: {
      control: { type: 'number', min: 140, max: 480, step: 20 },
      description: 'Explicit plot height in px; 0 (the default) lets the card size it. Chart canvas geometry, deliberately off the spacing scale.',
    },
  },
  render: (args) => ({
    components: { DashboardPieWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="max-width:420px;height:300px;padding:12px 18px;">
        <DashboardPieWidget v-bind="args" />
      </v-card>
    `,
  }),
} satisfies Meta<typeof DashboardPieWidget>

export default meta
type Story = StoryObj<typeof meta>

export const RevenueShare: Story = {}

export const TicketsByChannel: Story = {
  args: { data: TICKETS_BY_CHANNEL },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a pie with a legend. Its variants are the legend positions. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardPieWidget },
    setup: () => ({ args }),
    template: `<DashboardPieWidget v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — a widget fills the grid cell it is placed in. What Phase 4
 * (P4-1) guarantees is that the **inset** does not change with the cell: the distance from
 * the card's border to this widget's content is `component.card.padding` at every size,
 * inherited from the card standard set in Phase 3 rather than a second widget-only pair.
 *
 * Rendered below at three cell sizes inside a real `DashboardWidgetCard` — run your eye down
 * the left edges.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardPieWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardPieWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardPieWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardPieWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, one dominant slice, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardPieWidget },
    setup: () => ({ args }),
    template: `<DashboardPieWidget v-bind="args" />`,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget where it actually lives — inside a `DashboardWidgetCard`, in a
 * dashboard row beside its siblings. This is the composition P4-1 is judged on: the header
 * band, the body inset and the footer are the card's, and every widget in the family sits on
 * the same edge.
 */
export const InContextDashboardRow: Story = {
  render: (args) => ({
    components: { DashboardPieWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardPieWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardPieWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
