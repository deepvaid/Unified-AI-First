import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardAttentionData } from '@/stores/dashboards/types'
import DashboardAttentionWidget from './DashboardAttentionWidget.vue'

const ATTENTION: DashboardAttentionData = {
  kind: 'attention',
  items: [
    {
      id: 'att-payments',
      severity: 'critical',
      title: '3 payments failed in the last 24h',
      context: 'Retry or contact the customers before the orders auto-cancel.',
      occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'Review',
      dataSource: 'commerce',
      routeName: 'SalesOrders',
    },
    {
      id: 'att-stock',
      severity: 'warning',
      title: 'Low stock: 2 of your top 10 sellers',
      context: 'Trail Runner XT and Canvas Tote are below their reorder point.',
      occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'View products',
      dataSource: 'commerce',
      routeName: 'ProductsList',
    },
    {
      id: 'att-approval',
      severity: 'info',
      title: 'Campaign ‘Spring Refresh’ pending approval',
      context: 'Scheduled to send tomorrow at 9:00 AM once approved.',
      occurredAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'Approve',
      dataSource: 'marketing',
      routeName: 'EmailCampaigns',
    },
    {
      id: 'att-dns',
      severity: 'warning',
      title: 'Sending domain DNS not verified',
      context: 'Unverified DKIM records hurt deliverability on every send.',
      occurredAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      actionLabel: 'Fix',
      dataSource: 'marketing',
      routeName: 'CampaignReports',
    },
  ],
}

const meta = {
  title: 'Dashboards/Widgets/DashboardAttentionWidget',
  component: DashboardAttentionWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Prioritized "Needs your attention" list body for dashboard widgets. Each row carries a severity dot (critical / warning / info), a per-row source-cloud chip (items span clouds, so there is no card-level chip), a relative timestamp, and a right-aligned action button that emits `action`. Shows a pulse-bar skeleton on first load and a "You\'re all caught up" empty state.',
      },
    },
  },
} satisfies Meta<typeof DashboardAttentionWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: ATTENTION,
  },
}

export const Empty: Story = {
  args: {
    data: { kind: 'attention', items: [] },
  },
}
