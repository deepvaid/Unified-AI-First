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

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget inside a card, at the size a dashboard row gives it. The inset is
 * the card's (`mp-card-inset`, `component.card.padding`), so its content starts on the same
 * edge as every other widget in the family.
 */
export const InContextDashboardRow: Story = {
  args: { data: INSIGHTS },
  render: (args) => ({
    components: { DashboardInsightsWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" class="mp-card-inset" style="max-width: 560px; height: 320px"><DashboardInsightsWidget v-bind="args" /></v-card>
    `,
  }),
}
