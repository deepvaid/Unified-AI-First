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
    lastRefreshedAt: minutesAgo(24),
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
  args: {
    dataSource: 'commerce',
    lastRefreshedAt: minutesAgo(14 * 60),
  },
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a hero number with a trend and an optional sparkline. Its variants are whether the sparkline and the secondary stat are present. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardKpiWidget },
    setup: () => ({ args }),
    template: `<DashboardKpiWidget v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — a widget fills the grid cell it is placed in. The KPI card is the
 * deliberately **dense** member of the family: Phase 4 (P4-1) gave it one uniform inset from
 * the scale's compact tier (`component.card.paddingCompact`, 12) rather than the 20 the rest
 * take. Denser than a card, but from the scale — it used to be an ad-hoc `14px 16px 12px`,
 * three different values on one box.
 *
 * Rendered below at three cell sizes, including the narrow container where the sparkline drops
 * below the value.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardKpiWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardKpiWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardKpiWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardKpiWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Positive trend, negative trend, no trend, and a narrow container where the spark drops below the value. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardKpiWidget },
    setup: () => ({ args }),
    template: `<DashboardKpiWidget v-bind="args" />`,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget where it actually lives — inside a `DashboardWidgetCard`, in a
 * dashboard row beside its siblings. This is the composition P4-1 is judged on: the header
 * band, the body inset and the footer are the card's, and every widget in the family sits on
 * the same edge.
 */
export const InContextDashboardRow: Story = {
  render: (args) => ({
    components: { DashboardKpiWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardKpiWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardKpiWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
