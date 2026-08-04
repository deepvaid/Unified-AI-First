import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardStackedBarData } from '@/stores/dashboards/types'
import DashboardStackedBarWidget from './DashboardStackedBarWidget.vue'

const WEEKLY_CHANNELS: DashboardStackedBarData = {
  kind: 'stacked_bar',
  buckets: [
    { label: 'Jun 29', segments: [
      { key: 'online', value: 3620, formattedValue: '$3,620' },
      { key: 'instore', value: 940, formattedValue: '$940' },
    ] },
    { label: 'Jul 6', segments: [
      { key: 'online', value: 4480, formattedValue: '$4,480' },
      { key: 'instore', value: 1210, formattedValue: '$1,210' },
    ] },
    { label: 'Jul 13', segments: [
      { key: 'online', value: 3980, formattedValue: '$3,980' },
      { key: 'instore', value: 760, formattedValue: '$760' },
    ] },
    { label: 'Jul 20', segments: [
      { key: 'online', value: 5240, formattedValue: '$5,240' },
      { key: 'instore', value: 1480, formattedValue: '$1,480' },
    ] },
    { label: 'Jul 27', segments: [
      { key: 'online', value: 4370, formattedValue: '$4,370' },
      { key: 'instore', value: 1120, formattedValue: '$1,120' },
    ] },
    { label: 'Aug 3', segments: [
      { key: 'online', value: 4890, formattedValue: '$4,890' },
      { key: 'instore', value: 1360, formattedValue: '$1,360' },
    ] },
  ],
  legend: [
    { key: 'online', label: 'Online' },
    { key: 'instore', label: 'In store' },
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
