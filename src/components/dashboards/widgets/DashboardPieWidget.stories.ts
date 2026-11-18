import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardSeriesData } from '@/stores/dashboards/types'
import DashboardPieWidget from './DashboardPieWidget.vue'

const CHANNEL_SHARE: DashboardSeriesData = {
  kind: 'series',
  unit: 'currency',
  labels: ['Online Store', 'Retail POS', 'Marketplace', 'Wholesale'],
  series: [
    { name: 'Revenue', data: [45200, 28100, 15400, 9800] },
  ],
}

const TICKETS_BY_CHANNEL: DashboardSeriesData = {
  kind: 'series',
  unit: 'count',
  labels: ['Email', 'Chat', 'Phone', 'Social'],
  series: [
    { name: 'Tickets', data: [142, 96, 54, 23] },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardPieWidget',
  component: DashboardPieWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Donut chart body for pie-type dashboard widgets. Renders the first series of a `DashboardSeriesData` payload with percentage data labels and a bottom legend; tooltips format by the data unit.',
      },
    },
  },
  args: {
    data: CHANNEL_SHARE,
    height: 260,
  },
  argTypes: {
    data: {
      control: 'object',
      description: '`DashboardSeriesData` — segment labels and values. Colours are assigned by index from the chart palette.',
    },
    height: {
      control: { type: 'number', min: 140, max: 480, step: 20 },
      description: 'Explicit plot height in px; 0 (the default) lets the card size it. Chart canvas geometry, deliberately off the spacing scale.',
    },
  },
  render: (args) => ({
    components: { DashboardPieWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" class="mp-card-inset" style="max-width: 420px; height: 320px">
        <DashboardPieWidget v-bind="args" />
      </v-card>
    `,
  }),
} satisfies Meta<typeof DashboardPieWidget>

export default meta
type Story = StoryObj<typeof meta>

export const RevenueShare: Story = {}

export const TicketsByChannel: Story = {
  args: { data: TICKETS_BY_CHANNEL },
}
