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

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardKpiWidget',
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
    compact: false,
    aiGenerated: false,
    showViewReport: false,
  },
  argTypes: {
    data: {
      control: 'object',
      description: '`DashboardKpiData` — the value, delta and comparison the tile displays.',
    },
    title: {
      control: 'text',
      description: 'Overrides the metric\'s own label. Leave empty to use what `data` carries.',
    },
    subtitle: {
      control: 'text',
      description: 'Supporting line under the title, e.g. the metric definition.',
    },
    comparisonLabel: {
      control: 'text',
      description: 'Wording for the comparison period, e.g. \\"vs previous 30 days\\". Shown beside the delta.',
    },
    icon: {
      control: 'text',
      description: 'Lucide icon name (kebab-case) for the tile. Empty renders no icon.',
    },
    dataSource: {
      control: 'select',
      options: ['commerce', 'marketing', 'analytics', 'contacts', 'service', 'retail'],
      description: '`DashboardDataSource` — which cloud the metric comes from. Renders an `MpSourceCloudChip`, so a KPI always says where its number came from.',
    },
    compact: {
      control: 'boolean',
      description: 'The dense tier. Takes a uniform `component.card.paddingCompact` (12) instead of the standard 20 — this is the one widget that is deliberately denser than the rest of the family.',
    },
    aiGenerated: {
      control: 'boolean',
      description: 'Marks the tile as Da Vinci-generated with the shared chip from `component.chip.*` — the same ramp `DashboardWidgetCard` uses, so the two copies cannot drift.',
    },
    showViewReport: {
      control: 'boolean',
      description: 'Adds a View report action that emits `viewReport`. Off by default; only turn it on where a report actually exists to open.',
    },
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

export const NarrowContainer: Story = {
  render: (args) => ({
    components: { DashboardKpiWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" style="width:200px;height:190px;">
        <DashboardKpiWidget v-bind="args" />
      </v-card>
    `,
  }),
}

export const WithSecondaryStat: Story = {
  args: {
    data: {
      kind: 'kpi',
      unit: 'count',
      value: 15,
      formattedValue: '15',
      delta: -7.4,
      deltaLabel: '-7.4%',
      helperText: 'Open tickets requiring action',
      secondaryStat: '18 unresolved · oldest 3d',
    },
    title: 'Support health',
    subtitle: 'Last 30 days',
    comparisonLabel: 'vs prev 30d',
    icon: 'heart-pulse',
    dataSource: 'service',
  },
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

export const WithSparklineData: Story = {
  args: {
    data: {
      ...REVENUE_KPI,
      sparkline: [820, 940, 610, 1180, 890, 1320, 760, 1450, 1210, 980, 1610, 1340, 1120, 1780],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shopify stat-card style: real windowed values from `sparkline` are smoothed (moving average + downsample) and drawn as a soft bezier area curve — a stylized read of the trend, not a precise chart. Without data, the delta-shaped wobble fallback renders.',
      },
    },
  },
}
