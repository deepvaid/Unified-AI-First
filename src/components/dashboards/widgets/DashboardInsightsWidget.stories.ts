import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardInsightsData } from '@/stores/dashboards/types'
import DashboardInsightsWidget from './DashboardInsightsWidget.vue'

const INSIGHTS: DashboardInsightsData = {
  kind: 'insights',
  items: [
    {
      id: 'ins-carts',
      observation: 'Cart abandonment is up 14% on mobile since Tuesday',
      stat: '312 carts, $8.4k est. value',
      actionLabel: 'Investigate',
      routeName: 'OrdersReport',
    },
    {
      id: 'ins-subject',
      observation: 'Campaigns with question-style subject lines opened 9% more this month',
      stat: '6 of your last 20 sends, avg 31.2% open rate',
      actionLabel: 'View campaigns',
      routeName: 'CampaignReports',
    },
    {
      id: 'ins-vip',
      observation: 'Your VIP repeat buyers segment grew twice as fast as the overall list',
      stat: '+312 contacts in 30 days',
      actionLabel: 'View segment',
      routeName: 'Segments',
    },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardInsightsWidget',
  component: DashboardInsightsWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Da Vinci insights body for dashboard widgets: 2–3 AI-generated observations, each with a muted supporting stat and a text-button action that emits `action`. Shows 3 shimmer rows on first load, a "No new insights right now." empty/error state, and a permanent "AI-generated, verify before acting" footer caption.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardInsightsData` — `{ kind: \'insights\', items }`. Each item is an `observation` plus the `stat` that evidences it, and an `actionLabel`/`routeName` pair for the drill-down. Insights are narrative; use `DashboardAttentionWidget` when the row is something that needs fixing.',
    },
  },
} satisfies Meta<typeof DashboardInsightsWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: INSIGHTS,
  },
}

export const Empty: Story = {
  args: {
    data: { kind: 'insights', items: [] },
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a list of Da Vinci observations. Its variants are the insight tones. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardInsightsWidget },
    setup: () => ({ args }),
    template: `<DashboardInsightsWidget v-bind="args" />`,
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
    components: { DashboardInsightsWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardInsightsWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardInsightsWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardInsightsWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated and empty — nothing notable in the window. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardInsightsWidget },
    setup: () => ({ args }),
    template: `<DashboardInsightsWidget v-bind="args" />`,
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
    components: { DashboardInsightsWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardInsightsWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardInsightsWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
