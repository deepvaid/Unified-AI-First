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

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget inside a card, at the size a dashboard row gives it. The inset is
 * the card's (`mp-card-inset`, `component.card.padding`), so its content starts on the same
 * edge as every other widget in the family.
 */
export const InContextDashboardRow: Story = {
  args: { data: LIVE_PALETTE },
  render: (args) => ({
    components: { DashboardPaletteWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" class="mp-card-inset" style="max-width: 560px; height: 320px"><DashboardPaletteWidget v-bind="args" /></v-card>
    `,
  }),
}
