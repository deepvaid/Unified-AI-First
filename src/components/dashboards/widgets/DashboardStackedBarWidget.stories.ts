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
  title: 'Dashboards/Widgets/DashboardStackedBarWidget',
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
} satisfies Meta<typeof DashboardStackedBarWidget>

export default meta
type Story = StoryObj<typeof meta>

export const WeeklyChannels: Story = {
  args: { data: WEEKLY_CHANNELS },
}
