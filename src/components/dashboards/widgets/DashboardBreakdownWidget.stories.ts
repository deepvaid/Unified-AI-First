import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardBreakdownData } from '@/stores/dashboards/types'
import DashboardBreakdownWidget from './DashboardBreakdownWidget.vue'

const FULFILLMENT: DashboardBreakdownData = {
  kind: 'breakdown',
  rows: [
    { label: 'Picked', value: '5', chip: { status: 'Picking', type: 'fulfillment' } },
    { label: 'Packed', value: '5', chip: { status: 'Packed', type: 'fulfillment' } },
    { label: 'Label Created', value: '4', chip: { status: 'Ready to ship', type: 'fulfillment' } },
    { label: 'Shipped', value: '4', chip: { status: 'Shipped', type: 'fulfillment' } },
  ],
  linkLabel: 'Open fulfillment',
}

const TICKETS: DashboardBreakdownData = {
  kind: 'breakdown',
  headline: { value: '18', caption: 'open tickets' },
  rows: [
    { label: 'Awaiting your reply', value: '7' },
    { label: 'Breaching SLA', value: '2', tone: 'alert' },
    { label: 'Resolved today', value: '24' },
  ],
  linkLabel: 'Open ticket queue',
}

const DELIVERABILITY: DashboardBreakdownData = {
  kind: 'breakdown',
  headline: { value: '98.2%', caption: 'delivered' },
  progress: { pct: 98.2, tone: 'green' },
  rows: [
    { label: 'Bounce rate', value: '1.2%' },
    { label: 'Spam complaints', value: '0.04%' },
    { label: 'Unsubscribes', value: '0.31%' },
  ],
  warning: 'DKIM not verified on 1 sending domain',
}

const JOURNEYS: DashboardBreakdownData = {
  kind: 'breakdown',
  rows: [
    { label: 'Welcome series', meta: 'List Join · 22.4% conversion', value: '2,140', tone: 'success' },
    { label: 'Win-back — 90 days', meta: 'Inactivity 90d · 6.1% conversion', value: '612', tone: 'success' },
    { label: 'Post-purchase review', meta: 'Order Complete · 11.8% conversion', value: '318', tone: 'success' },
    { label: 'Cart abandoned', meta: 'Paused · needs review', value: '84', tone: 'warning' },
  ],
  linkLabel: 'View all journeys',
}

const meta = {
  title: 'Dashboards/Widgets/DashboardBreakdownWidget',
  component: DashboardBreakdownWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Flexible label/value breakdown card from the dotted Overview v2 design. Optional fields select the flourishes: MpStatusChip rows (fulfillment queue), a big-number headline (service tickets), a progress bar + warning chip (deliverability), or tone-dot rows with metas (journeys in flight). `drilldown` is emitted from the footer link.',
      },
    },
  },
} satisfies Meta<typeof DashboardBreakdownWidget>

export default meta
type Story = StoryObj<typeof meta>

export const FulfillmentQueue: Story = {
  args: { data: FULFILLMENT },
}

export const ServiceTickets: Story = {
  args: { data: TICKETS },
}

export const Deliverability: Story = {
  args: { data: DELIVERABILITY },
}

export const Journeys: Story = {
  args: { data: JOURNEYS },
}
