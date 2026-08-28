import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardDonutData } from '@/stores/dashboards/types'
import DashboardDonutWidget from './DashboardDonutWidget.vue'

const RING: DashboardDonutData = {
  kind: 'donut',
  variant: 'ring',
  segments: [
    { label: 'Direct', value: 6300, formattedValue: '$6,300 · 31%' },
    { label: 'Email', value: 4450, formattedValue: '$4,450 · 21.9%' },
    { label: 'Paid search', value: 3450, formattedValue: '$3,450 · 17%' },
    { label: 'Social', value: 2440, formattedValue: '$2,440 · 12%' },
    { label: 'Organic', value: 2040, formattedValue: '$2,040 · 10%' },
    { label: 'Referral', value: 1650, formattedValue: '$1,650 · 8.1%' },
  ],
  centerValue: '$20,330',
  centerCaption: 'attributed',
  footerStats: [
    { label: 'Email open rate', value: '54.6%' },
    { label: 'Total contacts', value: '12,604' },
  ],
}

const PIE: DashboardDonutData = {
  kind: 'donut',
  variant: 'pie',
  segments: [
    { label: 'Online store', value: 25, formattedValue: '25' },
    { label: 'POS retail', value: 12, formattedValue: '12' },
    { label: 'Marketplace', value: 7, formattedValue: '7' },
    { label: 'Social shop', value: 3, formattedValue: '3' },
  ],
  footerStats: [
    { label: 'Fastest growing', value: 'Marketplace' },
    { label: 'Average order value', value: '$433' },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardDonutWidget',
  component: DashboardDonutWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Donut widget from the Overview v2 design. The ring variant is a stroked-circle donut with a centered figure and legend below; the pie variant is a solid wedge pie with the legend beside it. Segment colors come from the chart blues palette by index.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardDonutData` — `{ kind: \'donut\', variant, segments, centerValue?, centerCaption?, footerStats? }`. `variant` picks `ring` (hollow, with a centre readout) or `pie` (solid). Segment colours are assigned **by index** from the dotted blues palette, so segment order is a visual decision, not just a data one.',
    },
  },
} satisfies Meta<typeof DashboardDonutWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Ring: Story = {
  args: { data: RING },
}

export const Pie: Story = {
  args: { data: PIE },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a donut with a legend. Its variants are the legend positions the container query picks between as the card narrows. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardDonutWidget },
    setup: () => ({ args }),
    template: `<DashboardDonutWidget v-bind="args" />`,
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
    components: { DashboardDonutWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardDonutWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardDonutWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardDonutWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, one dominant slice, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardDonutWidget },
    setup: () => ({ args }),
    template: `<DashboardDonutWidget v-bind="args" />`,
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
    components: { DashboardDonutWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardDonutWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardDonutWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
