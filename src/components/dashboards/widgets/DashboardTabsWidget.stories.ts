import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardTabsData } from '@/stores/dashboards/types'
import DashboardTabsWidget from './DashboardTabsWidget.vue'
import { surfaceFrame } from '@/stories/decorators'

const DATA: DashboardTabsData = {
  kind: 'tabs',
  orders: [
    { order: '#10000', customer: 'James Anderson', status: 'Processing', total: '$739.93' },
    { order: 'POS-12048', customer: 'Hannah Cole', status: 'Completed', total: '$124.30' },
    { order: 'POS-12047', customer: 'Walk-in customer', status: 'Completed', total: '$38.50' },
    { order: 'POS-12042', customer: 'Aria Singh', status: 'Pending', total: '$227.70' },
    { order: 'POS-12037', customer: 'Olivia Walker', status: 'Completed', total: '$81.40' },
  ],
  activity: [
    { id: 'a1', tag: 'email', icon: 'send', eyebrow: '2m ago', title: 'Spring Refresh — Segment A sent', meta: '2,400 recipients' },
    { id: 'a2', tag: 'order', icon: 'shopping-bag', eyebrow: '6m ago', title: 'Order #A-29481 placed by Maya Lin', meta: '$248.00 · paid' },
    { id: 'a3', tag: 'audience', icon: 'users', eyebrow: '14m ago', title: 'Segment ‘VIP repeat buyers’ updated', meta: '+312 contacts' },
    { id: 'a4', tag: 'automation', icon: 'zap', eyebrow: '22m ago', title: 'Automation ‘Cart abandoned — Step 2’ triggered', meta: '84 contacts in flow' },
  ],
  campaigns: [
    { name: 'Flash sale — 4 hours only, 40% off sitewide', revenue: '$2,150', pct: 100, meta: '69.6% open rate · 2,480 sent' },
    { name: 'Winter clearance — final markdowns', revenue: '$1,180', pct: 55, meta: '47.4% open rate · 2,900 sent' },
    { name: 'New arrivals — trail season picks', revenue: '$680', pct: 32, meta: '37.4% open rate · 2,240 sent' },
    { name: 'Restock alert — Trail Runner XT', revenue: '$440', pct: 20, meta: '41.8% open rate · 2,220 sent' },
  ],
  campaignsCaption: 'Last 30 days · by attributed revenue',
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardTabsWidget',
  component: DashboardTabsWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tabbed list card from the dotted Overview v2 design: Recent orders (MpStatusChip rows), Live activity (cloud-tinted icon tiles), and Top campaigns (gradient revenue bars). Tab state is widget-local; "View all" emits `drilldown`.',
      },
    },
  },
  decorators: [surfaceFrame({ height: '420px' })],
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardTabsData` — `{ kind: \'tabs\', orders, activity, campaigns, campaignsCaption }`. One dataset per tab; all three are required because the tab bar is always rendered in full. This widget draws its own header, which is why its story frame supplies the card edges.',
    },
  },
} satisfies Meta<typeof DashboardTabsWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { data: DATA },
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget inside a card, at the size a dashboard row gives it. This widget
 * draws its own header and inset, so the card adds none: the same arrangement
 * `DashboardWidgetCard` uses for it.
 */
export const InContextDashboardRow: Story = {
  args: { data: DATA },
  render: (args) => ({
    components: { DashboardTabsWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="max-width: 560px; height: 360px"><DashboardTabsWidget v-bind="args" /></v-card>
    `,
  }),
}
