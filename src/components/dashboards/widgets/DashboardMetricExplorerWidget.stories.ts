import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardMetricExplorerData } from '@/stores/dashboards/types'
import DashboardMetricExplorerWidget from './DashboardMetricExplorerWidget.vue'

const CUR = [420, 510, 380, 640, 720, 560, 480, 900, 760, 540, 610, 830, 470, 520, 690, 1150, 880, 620, 540, 700, 460, 590, 810, 760, 520, 640, 980, 720, 830, 1100]
const PREV = [390, 420, 350, 500, 560, 470, 410, 620, 580, 460, 500, 610, 400, 430, 520, 700, 640, 520, 470, 560, 410, 480, 590, 560, 450, 510, 660, 540, 600, 700]

// One tooltip label per data point (Jul 3 → Aug 1).
const POINT_LABELS = CUR.map((_, i) => {
  const date = new Date(2026, 6, 3 + i)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})

const DATA: DashboardMetricExplorerData = {
  kind: 'metric_explorer',
  vsLabel: 'vs prev 30 days',
  vsLabelLong: 'compared with the previous 30 days',
  xLabels: ['Jul 3', 'Jul 10', 'Jul 17', 'Jul 24', 'Aug 1'],
  pointLabels: POINT_LABELS,
  metrics: [
    { key: 'revenue', label: 'Revenue', sub: 'Daily net revenue', unit: 'currency', value: 20330, formattedValue: '$20,330', delta: '+30.2%', deltaPositive: true, cur: CUR, prev: PREV, zeroBased: true },
    { key: 'orders', label: 'Orders', sub: 'Orders placed per day', unit: 'count', value: 47, formattedValue: '47', delta: '+14.6%', deltaPositive: true, cur: CUR.map((v) => v / 430), prev: PREV.map((v) => v / 380), zeroBased: true },
    { key: 'aov', label: 'Average order value', sub: 'Average order value per day', unit: 'currency', value: 433, formattedValue: '$433', delta: '+13.6%', deltaPositive: true, cur: CUR.map((v) => 300 + v / 4), prev: PREV.map((v) => 280 + v / 4), zeroBased: false },
    { key: 'conv', label: 'Conversion rate', sub: 'Visit-to-order conversion', unit: 'percent', value: 2.6, formattedValue: '2.6%', delta: '+0.4 pp', deltaPositive: true, cur: CUR.map((v) => 2 + v / 900), prev: PREV.map((v) => 1.8 + v / 900), zeroBased: false },
  ],
}

const meta = {
  title: 'Dashboards/Widgets/DashboardMetricExplorerWidget',
  component: DashboardMetricExplorerWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Composite metric explorer from the dotted Overview v2 design: a joined 4-cell KPI selector strip (Revenue / Orders / AOV / Conversion) driving an embedded shadcn-style gradient area chart (0.8 → 0.1 vertical ramp, solid stroke, horizontal-only grid, no y-axis) with a hover tooltip and active dots. The Compare toggle overlays the previous period as a second, paler gradient area. Metric selection is widget-local; the data window follows the dashboard filters.',
      },
    },
  },
  decorators: [() => ({ template: '<div style="height:560px;border:1px solid var(--border-subtle);border-radius:18px;overflow:hidden;background:var(--surface-primary)"><story /></div>' })],
} satisfies Meta<typeof DashboardMetricExplorerWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { data: DATA },
}

export const NoComparison: Story = {
  args: {
    data: {
      ...DATA,
      vsLabel: '',
      vsLabelLong: 'no comparison',
      metrics: DATA.metrics.map((m) => ({ ...m, delta: '', prev: [] })),
    },
  },
}
