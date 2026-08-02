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
  title: 'Dashboards/Widgets/DashboardInsightsWidget',
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
