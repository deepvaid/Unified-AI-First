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
  title: 'Dashboards/Widgets/DashboardBarListWidget',
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
} satisfies Meta<typeof DashboardBarListWidget>

export default meta
type Story = StoryObj<typeof meta>

export const BestSellers: Story = {
  args: { data: BEST_SELLERS },
}

export const WithHeadline: Story = {
  args: { data: RETAIL },
}
