import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardStackedBarData } from '@/stores/dashboards/types'
import DashboardStackedBarWidget from './DashboardStackedBarWidget.vue'

const bucket = (label: string, online: number, marketplace: number, instore: number) => ({
  label,
  segments: [
    { key: 'online', value: online, formattedValue: `$${online.toLocaleString('en-US')}` },
    { key: 'marketplace', value: marketplace, formattedValue: `$${marketplace.toLocaleString('en-US')}` },
    { key: 'instore', value: instore, formattedValue: `$${instore.toLocaleString('en-US')}` },
  ],
})

const WEEKLY_CHANNELS: DashboardStackedBarData = {
  kind: 'stacked_bar',
  buckets: [
    bucket('Jun 29', 2480, 940, 720),
    bucket('Jul 6', 3310, 1180, 380),
    bucket('Jul 13', 2260, 720, 540),
    bucket('Jul 20', 3640, 1420, 860),
    bucket('Jul 27', 2140, 830, 410),
    bucket('Aug 3', 3980, 1260, 680),
  ],
  legend: [
    { key: 'online', label: 'Online store', total: '$17,810', pct: 63 },
    { key: 'marketplace', label: 'Marketplace', total: '$6,350', pct: 24 },
    { key: 'instore', label: 'In store', total: '$3,590', pct: 13 },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardStackedBarWidget',
  component: DashboardStackedBarWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Stacked bar chart from the Overview v2 design, after shadcn's \"Bar Chart - Stacked + Legend\": rounded two-segment stacks in the trend blues (light at the bottom, dark on top) with a centered swatch legend. Native title tooltips carry the per-segment values.",
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardStackedBarData` — `{ kind: \'stacked_bar\', buckets, legend, variant? }`. `variant` is `columns` (default — one vertical stack per bucket) or `bar` (a single full-width horizontal bar with the legend above it). **Legend order must match segment order**, bottom of the stack first.',
    },
  },
} satisfies Meta<typeof DashboardStackedBarWidget>

export default meta
type Story = StoryObj<typeof meta>

export const WeeklyChannels: Story = {
  args: { data: WEEKLY_CHANNELS },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — stacked series per category. Its variants are the series counts. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardStackedBarWidget },
    setup: () => ({ args }),
    template: `<DashboardStackedBarWidget v-bind="args" />`,
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
    components: { DashboardStackedBarWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardStackedBarWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardStackedBarWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardStackedBarWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, a single series, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardStackedBarWidget },
    setup: () => ({ args }),
    template: `<DashboardStackedBarWidget v-bind="args" />`,
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
    components: { DashboardStackedBarWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardStackedBarWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardStackedBarWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
