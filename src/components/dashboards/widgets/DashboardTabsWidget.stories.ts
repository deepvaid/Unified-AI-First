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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a bespoke tab bar above a panel. It replaces the card's own header, which is why it draws its own edges. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardTabsWidget },
    setup: () => ({ args }),
    template: `<DashboardTabsWidget v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — a widget fills the grid cell it is placed in. This is one of the
 * three **bespoke-header** widgets: `DashboardWidgetCard` zeroes its body inset for these, so
 * the widget draws its own edges. Phase 4 (P4-1) made it state that inset as
 * `component.card.padding` — the role token, not the `20` primitive — so a change to the
 * standard moves it with the rest of the family.
 *
 * Rendered below at three cell sizes; the left edges should match the standard widgets'.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardTabsWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardTabsWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardTabsWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardTabsWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Each tab selected, and the narrow layout where the bar scrolls. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardTabsWidget },
    setup: () => ({ args }),
    template: `<DashboardTabsWidget v-bind="args" />`,
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
    components: { DashboardTabsWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardTabsWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardTabsWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
