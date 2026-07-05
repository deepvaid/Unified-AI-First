import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardActivityData } from '@/stores/dashboards/types'
import DashboardActivityWidget from './DashboardActivityWidget.vue'

const ACTIVITY: DashboardActivityData = {
  kind: 'activity',
  items: [
    {
      id: 'act-1',
      tag: 'email',
      icon: 'mail',
      eyebrow: '2 min ago',
      title: 'Spring Sale campaign delivered',
      meta: '12,480 recipients · 24.3% open rate',
    },
    {
      id: 'act-2',
      tag: 'order',
      icon: 'shopping-cart',
      eyebrow: '9 min ago',
      title: 'Order #10482 placed — $214.90',
      meta: 'Online store · 3 items',
    },
    {
      id: 'act-3',
      tag: 'audience',
      icon: 'users',
      eyebrow: '26 min ago',
      title: '38 new subscribers joined "VIP Customers"',
      meta: 'Segment refresh',
    },
    {
      id: 'act-4',
      tag: 'automation',
      icon: 'zap',
      eyebrow: '1 h ago',
      title: 'Welcome journey enrolled 12 contacts',
      meta: 'Journey: New customer welcome',
    },
    {
      id: 'act-5',
      tag: 'email',
      icon: 'mail-open',
      eyebrow: '2 h ago',
      title: 'Back-in-stock alert opened by 312 contacts',
      meta: 'Triggered email',
    },
  ],
}

const meta = {
  title: 'Dashboards/Widgets/DashboardActivityWidget',
  component: DashboardActivityWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Scrolling live-activity feed body for dashboard widgets. Each item gets a tag-colored icon chip (email / order / audience / automation), a monospace timestamp eyebrow, and optional meta line.',
      },
    },
  },
  args: {
    data: ACTIVITY,
  },
  argTypes: {
    data: { control: 'object' },
  },
  render: (args) => ({
    components: { DashboardActivityWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="max-width:420px;height:320px;padding:12px 18px;">
        <DashboardActivityWidget v-bind="args" />
      </v-card>
    `,
  }),
} satisfies Meta<typeof DashboardActivityWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ShortFeed: Story = {
  args: {
    data: { kind: 'activity', items: ACTIVITY.items.slice(0, 2) },
  },
}
