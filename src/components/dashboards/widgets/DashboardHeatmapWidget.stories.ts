import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardHeatmapData } from '@/stores/dashboards/types'
import DashboardHeatmapWidget from './DashboardHeatmapWidget.vue'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = ['6a', '9a', '12p', '3p', '6p', '9p']

/** Day-of-week × send-hour email engagement — the canonical use for this widget. */
const DATA: DashboardHeatmapData = {
  kind: 'heatmap',
  unit: 'count',
  rows: DAYS,
  columns: HOURS,
  cells: [
    [120, 480, 610, 540, 890, 340],
    [140, 520, 660, 580, 940, 360],
    [155, 545, 700, 615, 1010, 385],
    [148, 530, 685, 600, 980, 372],
    [130, 470, 590, 505, 820, 300],
    [60, 210, 290, 260, 410, 180],
    [45, 180, 240, 215, 350, 150],
  ],
  rowAxisLabel: 'Day of week',
  columnAxisLabel: 'Send hour',
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardHeatmapWidget',
  component: DashboardHeatmapWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`DashboardHeatmapWidget\` renders a rows × columns matrix where cell colour carries the value.
It's built in CSS grid rather than ApexCharts' heatmap because that renderer has no cell-gap
control and no per-cell labels. The ramp anchors on the active chart theme's lead series colour
and uses perceptual easing (\`ratio ^ 0.6\`) so a single outlier doesn't flatten the matrix.

### Use when
- Comparing one metric across two categorical dimensions (day × hour, channel × segment).

### Don't use when
- Either dimension is continuous, or there's only one dimension — use a bar or line widget.

### Behaviour notes
- **Zero cells** render as a faint wash with no printed "0" — the reference matrix drowned in zeroes.
- **Narrow cards** (\`@container (max-width: 420px)\`) drop the in-cell numbers; colour still carries
  the read and the hover readout gives the exact figure.
- \`total\` overrides the share denominator in the hover readout; it defaults to the matrix sum.

### A11y
- **Provides:** the grid is \`role="img"\` with a summary \`aria-label\`; every cell is a focusable
  \`<button>\` labelled \`"{row}, {column}: {value}"\`, and focus drives the same readout as hover.
- **Consumer:** give the containing widget card an accessible name describing the metric.
        `,
      },
    },
  },
  argTypes: {
    data: { control: 'object', description: 'DashboardHeatmapData — rows, columns, cells[rowIndex][columnIndex], unit, optional total and axis labels.' },
  },
} satisfies Meta<typeof DashboardHeatmapWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { data: DATA },
}

/** Axis labels omitted and an explicit `total` — the share line divides by that instead of the matrix sum. */
export const ExplicitTotal: Story = {
  args: {
    data: {
      ...DATA,
      total: 20000,
      rowAxisLabel: undefined,
      columnAxisLabel: undefined,
    },
  },
}

/** Currency unit with a sparse matrix — most cells zero, one hot cell setting the ramp ceiling. */
export const SparseMatrix: Story = {
  args: {
    data: {
      kind: 'heatmap',
      unit: 'currency',
      rows: ['Online store', 'POS', 'Marketplace', 'Wholesale'],
      columns: ['Q1', 'Q2', 'Q3', 'Q4'],
      cells: [
        [0, 0, 1200, 48200],
        [0, 340, 0, 2100],
        [0, 0, 0, 890],
        [0, 0, 0, 0],
      ],
      rowAxisLabel: 'Channel',
      columnAxisLabel: 'Quarter',
    },
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a day/hour grid. Its variants are the scales it colours against. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardHeatmapWidget },
    setup: () => ({ args }),
    template: `<DashboardHeatmapWidget v-bind="args" />`,
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
    components: { DashboardHeatmapWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardHeatmapWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardHeatmapWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardHeatmapWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Populated, sparse, and empty. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardHeatmapWidget },
    setup: () => ({ args }),
    template: `<DashboardHeatmapWidget v-bind="args" />`,
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
    components: { DashboardHeatmapWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardHeatmapWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardHeatmapWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
