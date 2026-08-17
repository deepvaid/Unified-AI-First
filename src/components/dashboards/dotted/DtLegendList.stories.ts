import type { Meta, StoryObj } from '@storybook/vue3'
import { darkModeGlobals } from '@/stories/storybookTheme'
import DtLegendList, { type DtLegendRow } from './DtLegendList.vue'
import { DOTTED_PIE_BLUES } from './dottedChartMath'

const ROWS: DtLegendRow[] = [
  { label: 'Online store', value: '$18,410', color: DOTTED_PIE_BLUES[0]! },
  { label: 'POS', value: '$9,180', color: DOTTED_PIE_BLUES[1]! },
  { label: 'Marketplaces', value: '$4,320', color: DOTTED_PIE_BLUES[2]! },
  { label: 'Wholesale', value: '$1,270', color: DOTTED_PIE_BLUES[3]! },
]

const ROWS_WITH_DELTAS: DtLegendRow[] = [
  { label: 'Online store', value: '$18,410', color: DOTTED_PIE_BLUES[0]!, delta: '↗ 5%', deltaPositive: true },
  { label: 'POS', value: '$9,180', color: DOTTED_PIE_BLUES[1]!, delta: '↗ 12%', deltaPositive: true },
  { label: 'Marketplaces', value: '$4,320', color: DOTTED_PIE_BLUES[2]!, delta: '↘ 3%', deltaPositive: false },
  { label: 'Wholesale', value: '$1,270', color: DOTTED_PIE_BLUES[3]!, delta: '↘ 8%', deltaPositive: false },
]

const meta = {
  title: 'Dashboards/Dotted/DtLegendList',
  component: DtLegendList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`DtLegendList\` renders the swatch + label + value legend rows next to the dotted donut/pie
widgets (\`DashboardDonutWidget\`). Rows can carry an optional period-over-period \`delta\`
rendered in \`--pos\`/\`--neg\` tints via \`deltaPositive\`. It exports the \`DtLegendRow\` type
consumed by the widget data shapes.

### Use when
- Listing the series behind a donut/pie mark, with values and optional change indicators.

### Don't use when
- The legend needs interaction (hover-highlight, toggling series) — the dotted family is static.
        `,
      },
    },
  },
  argTypes: {
    rows: { control: 'object', description: 'DtLegendRow[] — label, value, swatch color, optional delta + deltaPositive.' },
    gap: { control: { type: 'range', min: 4, max: 20, step: 1 }, description: 'Vertical gap between rows in px (default 9).' },
  },
} satisfies Meta<typeof DtLegendList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { rows: ROWS },
}

/** Rows with period-over-period deltas — positive tinted `--pos`, negative `--neg`. */
export const WithDeltas: Story = {
  args: { rows: ROWS_WITH_DELTAS },
}

/** Wider row spacing for taller card layouts. */
export const LooseSpacing: Story = {
  args: { rows: ROWS, gap: 16 },
}

export const DarkMode: Story = {
  args: { rows: ROWS_WITH_DELTAS },
  globals: darkModeGlobals,
}
