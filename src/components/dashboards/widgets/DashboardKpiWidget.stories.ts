import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardKpiData } from '@/stores/dashboards/types'
import DashboardKpiWidget from './DashboardKpiWidget.vue'

const REVENUE_KPI: DashboardKpiData = {
  kind: 'kpi',
  unit: 'currency',
  value: 48210,
  formattedValue: '$48,210',
  delta: 12.4,
  deltaLabel: '+12.4%',
  helperText: 'Gross revenue in the selected period',
}

const OPEN_RATE_KPI: DashboardKpiData = {
  kind: 'kpi',
  unit: 'percent',
  value: 21.8,
  formattedValue: '21.8%',
  delta: -2.3,
  deltaLabel: '-2.3 pp',
  helperText: 'Average campaign open rate',
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

const meta = {
  title: 'Dashboards/Widgets/DashboardKpiWidget',
  component: DashboardKpiWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'KPI body for dashboard widgets: metric icon chip, big value, trend pill with comparison label, side sparkline, and a source-cloud footer. `compact` tightens the layout for short grid cells; container queries hide the sparkline when narrow.',
      },
    },
  },
  args: {
    data: REVENUE_KPI,
    title: 'Revenue',
    subtitle: 'Last 30 days',
    comparisonLabel: 'vs prev 30d',
    icon: 'dollar-sign',
    dataSource: 'commerce',
    lastRefreshedAt: minutesAgo(24),
    compact: false,
    aiGenerated: false,
    showViewReport: false,
  },
  argTypes: {
    data: { control: 'object' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    comparisonLabel: { control: 'text' },
    icon: { control: 'text' },
    dataSource: {
      control: 'select',
      options: ['commerce', 'marketing', 'analytics', 'contacts', 'service', 'retail'],
    },
    compact: { control: 'boolean' },
    aiGenerated: { control: 'boolean' },
    showViewReport: { control: 'boolean' },
  },
  render: (args) => ({
    components: { DashboardKpiWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="max-width:360px;height:190px;">
        <DashboardKpiWidget v-bind="args" />
      </v-card>
    `,
  }),
} satisfies Meta<typeof DashboardKpiWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NegativeTrend: Story = {
  args: {
    data: OPEN_RATE_KPI,
    title: 'Open Rate',
    icon: 'mail-open',
    dataSource: 'marketing',
  },
}

export const Compact: Story = {
  args: { compact: true },
}

export const DaVinciGenerated: Story = {
  args: { aiGenerated: true },
}

export const RetailWithViewReport: Story = {
  args: {
    data: {
      kind: 'kpi',
      unit: 'currency',
      value: 8214,
      formattedValue: '$8,214',
      delta: 4.8,
      deltaLabel: '+4.8%',
      helperText: 'Point-of-sale revenue today',
      location: 'Melbourne Flagship',
    },
    title: 'Retail Revenue',
    subtitle: 'Today',
    comparisonLabel: 'vs yesterday',
    icon: 'shopping-bag',
    dataSource: 'retail',
    showViewReport: true,
  },
}
