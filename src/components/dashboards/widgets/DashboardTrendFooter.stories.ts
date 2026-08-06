import type { Meta, StoryObj } from '@storybook/vue3'
import DashboardTrendFooter from './DashboardTrendFooter.vue'

const meta = {
  title: 'Dashboards/Widgets/DashboardTrendFooter',
  component: DashboardTrendFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'shadcn-style card footer: a medium-weight trend sentence with a small trending icon over a muted caption line. Widgets attach it via the optional `footer` field on their data payload; DashboardWidgetCard renders it between the chart body and the source-cloud footer.',
      },
    },
  },
} satisfies Meta<typeof DashboardTrendFooter>

export default meta
type Story = StoryObj<typeof meta>

export const TrendingUp: Story = {
  args: {
    trend: 'Trending up by 19.4% this month',
    caption: 'July 1 – July 30, 2026',
    direction: 'up',
  },
}

export const TrendingDown: Story = {
  args: {
    trend: 'Direct trending down by 6.7% this period',
    caption: 'Weekly revenue by traffic source · W1 – W12',
    direction: 'down',
  },
}

export const Steady: Story = {
  args: {
    trend: 'Delivery rate steady at 97.0%',
    caption: 'Across the last 5 campaigns',
    direction: 'none',
  },
}
