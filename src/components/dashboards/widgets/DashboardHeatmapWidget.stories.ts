import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardHeatmapData } from '@/stores/dashboards/types'
import { darkModeGlobals } from '@/stories/storybookTheme'
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
  title: 'Dashboards/Widgets/DashboardHeatmapWidget',
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

export const DarkMode: Story = {
  args: { data: DATA },
  globals: darkModeGlobals,
}
