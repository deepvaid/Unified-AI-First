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
  title: 'Product/Dashboards/Widgets/DashboardBreakdownWidget',
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
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardBreakdownData` — `{ kind: \'breakdown\', headline?, progress?, rows, warning?, linkLabel? }`. A row may render its label as an `MpStatusChip` by supplying `chip: { status, type }` rather than plain text, which is how a breakdown of order states stays consistent with the tables it summarises.',
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** Two structures: a single headline with a breakdown beneath it, and the split headline that puts a comparison beside it. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardBreakdownWidget },
    setup: () => ({ args }),
    template: `<DashboardBreakdownWidget v-bind="args" />`,
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
    components: { DashboardBreakdownWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardBreakdownWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardBreakdownWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardBreakdownWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, with a trailing warning row, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardBreakdownWidget },
    setup: () => ({ args }),
    template: `<DashboardBreakdownWidget v-bind="args" />`,
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
    components: { DashboardBreakdownWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardBreakdownWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardBreakdownWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
