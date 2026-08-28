import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardPaletteData } from '@/stores/dashboards/types'
import DashboardPaletteWidget from './DashboardPaletteWidget.vue'
import {
  DOTTED_BLUES,
  DOTTED_PIE_BLUES,
  FUNNEL_GRADIENT_STOPS,
  STACK_BLUES,
  TREND_CURRENT,
  TREND_PREVIOUS,
} from '../dotted/dottedChartMath'

const LIVE_PALETTE: DashboardPaletteData = {
  kind: 'palette',
  groups: [
    { title: 'Trend lines', caption: 'Store performance — current / previous', shades: [TREND_CURRENT, TREND_PREVIOUS] },
    { title: 'Stacked bars', caption: 'Revenue by channel', shades: [...STACK_BLUES] },
    { title: 'Ring & donut ramp', caption: 'Revenue attribution', shades: [...DOTTED_BLUES] },
    { title: 'Pie ramp', caption: 'Orders by sales channel', shades: [...DOTTED_PIE_BLUES] },
    { title: 'Funnel gradient', caption: 'Campaign to purchase', shades: FUNNEL_GRADIENT_STOPS.map((stop) => stop.color) },
  ],
  footnote: '20 shades across 5 chart families',
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardPaletteWidget',
  component: DashboardPaletteWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Palette-review widget from the Overview v2 design: one segmented bar per chart family showing every shade in ramp order with hex labels, so stakeholders can review the dashboard chart colors in one card. The dashboard instance reads the live ramps from dottedChartMath, so it never drifts from what the charts actually render.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardPaletteData` — `{ kind: \'palette\', groups, footnote? }`. Each group is a named ramp: `title`, a `caption` naming which charts consume it, and `shades` — ordered hex values rendered as a segmented bar with hex labels. This widget documents the chart palette rather than plotting data.',
    },
  },
} satisfies Meta<typeof DashboardPaletteWidget>

export default meta
type Story = StoryObj<typeof meta>

export const LivePalette: Story = {
  args: { data: LIVE_PALETTE },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — the chart palette specimen used to check a theme. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardPaletteWidget },
    setup: () => ({ args }),
    template: `<DashboardPaletteWidget v-bind="args" />`,
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
    components: { DashboardPaletteWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardPaletteWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardPaletteWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardPaletteWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Each palette in the theme. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardPaletteWidget },
    setup: () => ({ args }),
    template: `<DashboardPaletteWidget v-bind="args" />`,
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
    components: { DashboardPaletteWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardPaletteWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardPaletteWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
