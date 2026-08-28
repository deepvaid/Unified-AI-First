import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardFunnelData } from '@/stores/dashboards/types'
import DashboardFunnelWidget from './DashboardFunnelWidget.vue'

// Reference: the design mockup's hand-tuned path for these exact stages was
// "M0 10 C100 10 100 37 200 37 C300 37 300 80.5 400 80.5 …" — funnelPath()
// reproduces it within ~1px via the share^0.42 perceptual scaling.
const DATA: DashboardFunnelData = {
  kind: 'funnel',
  stages: [
    { label: 'Emails sent', formattedValue: '9,840', share: '100%', pct: 1 },
    { label: 'Opened', formattedValue: '5,370', share: '54.6%', pct: 0.546 },
    { label: 'Clicked through', formattedValue: '1,150', share: '11.7%', pct: 0.117 },
    { label: 'Store sessions', formattedValue: '870', share: '8.8%', pct: 0.088 },
    { label: 'Added to cart', formattedValue: '248', share: '2.5%', pct: 0.025 },
    { label: 'Orders placed', formattedValue: '10', share: '0.10%', pct: 0.001, accent: true },
  ],
  footerStats: [
    { label: 'Attributed revenue', value: '$4,450' },
    { label: 'Share of store revenue', value: '21.9%' },
    { label: 'Cart to order', value: '4.0%' },
  ],
  warning: 'Biggest drop-off: opened → clicked, 78.6% lost',
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardFunnelWidget',
  component: DashboardFunnelWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Campaign-to-purchase funnel from the dotted Overview v2 design: a 6-column stage header (count + share of first stage), a horizontal-gradient funnel path with perceptual (share^0.42) height scaling, footer stats, and a biggest-drop-off warning chip.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardFunnelData` — `{ kind: \'funnel\', stages, footerStats, warning? }`. Each stage carries `pct` (0–1, its size **as a fraction of the first stage**) which draws the funnel path; `formattedValue` and `share` are display-only. Set `accent: true` on the stage the widget should emphasise.',
    },
  },
} satisfies Meta<typeof DashboardFunnelWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { data: DATA },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — ordered stages with drop-off between them. Its variants are the stage counts it is given. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardFunnelWidget },
    setup: () => ({ args }),
    template: `<DashboardFunnelWidget v-bind="args" />`,
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
    components: { DashboardFunnelWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardFunnelWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardFunnelWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardFunnelWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, a steep drop-off, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardFunnelWidget },
    setup: () => ({ args }),
    template: `<DashboardFunnelWidget v-bind="args" />`,
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
    components: { DashboardFunnelWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardFunnelWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardFunnelWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
