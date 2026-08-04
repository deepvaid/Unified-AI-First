import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardDonutData } from '@/stores/dashboards/types'
import DashboardDonutWidget from './DashboardDonutWidget.vue'

const RING: DashboardDonutData = {
  kind: 'donut',
  variant: 'ring',
  segments: [
    { label: 'Direct', value: 6300, formattedValue: '$6,300 · 31%' },
    { label: 'Email', value: 4450, formattedValue: '$4,450 · 21.9%' },
    { label: 'Paid search', value: 3450, formattedValue: '$3,450 · 17%' },
    { label: 'Social', value: 2440, formattedValue: '$2,440 · 12%' },
    { label: 'Organic', value: 2040, formattedValue: '$2,040 · 10%' },
    { label: 'Referral', value: 1650, formattedValue: '$1,650 · 8.1%' },
  ],
  centerValue: '$20,330',
  centerCaption: 'attributed',
  footerStats: [
    { label: 'Email open rate', value: '54.6%' },
    { label: 'Total contacts', value: '12,604' },
  ],
}

const PIE: DashboardDonutData = {
  kind: 'donut',
  variant: 'pie',
  segments: [
    { label: 'Online store', value: 25, formattedValue: '25' },
    { label: 'POS retail', value: 12, formattedValue: '12' },
    { label: 'Marketplace', value: 7, formattedValue: '7' },
    { label: 'Social shop', value: 3, formattedValue: '3' },
  ],
  footerStats: [
    { label: 'Fastest growing', value: 'Marketplace' },
    { label: 'Average order value', value: '$433' },
  ],
}

const meta = {
  title: 'Dashboards/Widgets/DashboardDonutWidget',
  component: DashboardDonutWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Donut widget from the Overview v2 design. The ring variant is a stroked-circle donut with a centered figure and legend below; the pie variant is a solid wedge pie with the legend beside it. Segment colors come from the chart blues palette by index.',
      },
    },
  },
} satisfies Meta<typeof DashboardDonutWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Ring: Story = {
  args: { data: RING },
}

export const Pie: Story = {
  args: { data: PIE },
}
