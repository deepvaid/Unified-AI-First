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
  title: 'Dashboards/Widgets/DashboardPaletteWidget',
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
} satisfies Meta<typeof DashboardPaletteWidget>

export default meta
type Story = StoryObj<typeof meta>

export const LivePalette: Story = {
  args: { data: LIVE_PALETTE },
}
