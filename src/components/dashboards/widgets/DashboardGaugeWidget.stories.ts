import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardGaugeData } from '@/stores/dashboards/types'
import DashboardGaugeWidget from './DashboardGaugeWidget.vue'

const DATA: DashboardGaugeData = {
  kind: 'gauge',
  pct: 68,
  centerValue: '68%',
  centerCaption: 'of $30,000',
  footerStats: [
    { label: 'Pace per day', value: '$678' },
    { label: 'Needed per day', value: '$2,418' },
  ],
}

const meta = {
  title: 'Dashboards/Widgets/DashboardGaugeWidget',
  component: DashboardGaugeWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Rolling revenue-goal gauge from the Overview v2 design: a round-capped progress ring on a soft track, centered percentage, and pace/needed footer stats.',
      },
    },
  },
} satisfies Meta<typeof DashboardGaugeWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { data: DATA },
}

export const ThreeQuarterArc: Story = {
  args: {
    data: {
      kind: 'gauge',
      pct: 100,
      centerValue: '10 / 10',
      centerCaption: 'score',
      arc: 'three-quarter',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "shadcn radial variant (`arc: 'three-quarter'`): a 270° arc whose gap opens at the bottom — used by the Deliverability score on the Overview.",
      },
    },
  },
}
