import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardBarListData } from '@/stores/dashboards/types'
import DashboardBarListWidget from './DashboardBarListWidget.vue'

const BEST_SELLERS: DashboardBarListData = {
  kind: 'bar_list',
  rows: [
    { label: 'Trail Runner XT', value: '$6,480', pct: 100, meta: '54 units · 4 left in stock' },
    { label: 'Alpine Shell Jacket', value: '$4,180', pct: 65, meta: '19 units · 96 in stock' },
    { label: 'Canvas Tote', value: '$2,240', pct: 35, meta: '56 units · 7 left in stock' },
    { label: 'Merino crew socks, 3-pack', value: '$1,104', pct: 17, meta: '46 units · 210 in stock' },
  ],
}

const RETAIL: DashboardBarListData = {
  kind: 'bar_list',
  headline: { value: '$620', delta: '+9.4%', deltaPositive: true },
  rows: [
    { label: 'Melbourne CBD', value: '$236', pct: 38 },
    { label: 'Chadstone', value: '$180', pct: 29 },
    { label: 'Click & collect', value: '$120', pct: 19 },
    { label: 'Brisbane', value: '$84', pct: 14 },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardBarListWidget',
  component: DashboardBarListWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Progress-bar list from the Overview v2 design: label/value rows over gradient pills, with optional per-row meta and an optional big-number headline (used by Retail today).',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardBarListData` — `{ kind: \'bar_list\', headline?, rows }`. Each row is `{ label, value, pct, meta? }` where `pct` (0–100) drives the bar width. The optional `headline` renders a value + delta above the list.',
    },
  },
} satisfies Meta<typeof DashboardBarListWidget>

export default meta
type Story = StoryObj<typeof meta>

export const BestSellers: Story = {
  args: { data: BEST_SELLERS },
}

export const WithHeadline: Story = {
  args: { data: RETAIL },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a ranked list with an inline meter per row. Its variants are the metrics it ranks by. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardBarListWidget },
    setup: () => ({ args }),
    template: `<DashboardBarListWidget v-bind="args" />`,
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
    components: { DashboardBarListWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardBarListWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardBarListWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardBarListWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, a single dominant row, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardBarListWidget },
    setup: () => ({ args }),
    template: `<DashboardBarListWidget v-bind="args" />`,
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
    components: { DashboardBarListWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardBarListWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardBarListWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
