import type { Meta, StoryObj } from '@storybook/vue3'
import DvDraftPreview from './DvDraftPreview.vue'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'

function draft(overrides: Partial<DashboardWidgetDraft>): DashboardWidgetDraft {
  return {
    dashboardId: '2000290-home',
    type: 'timeseries',
    title: 'Open Rate Trend',
    dataSource: 'marketing',
    metricId: 'marketing_open_rate_over_time',
    drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
    ...overrides,
  }
}

const meta = {
  title: 'Copilot/DvDraftPreview',
  component: DvDraftPreview,
  tags: ['autodocs'],
  args: {
    draft: draft({}),
    density: 'comfortable',
  },
  argTypes: {
    draft: { control: 'object' },
    density: {
      control: 'select',
      options: ['compact', 'comfortable', 'expanded'],
      description: 'compact = refine-dialog preview · comfortable = draft card · expanded = full-size dialog',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvDraftPreview renders a static, deterministic mock visualisation for a
\`DashboardWidgetDraft\` — the preview inside \`DvWidgetDraftCard\`,
\`DvRefineDialog\` (compact), and \`DvExpandDialog\` (expanded). The preview kind
follows \`draft.type\` (+ \`chartVariant\` for line/area); mock numbers are picked
from presets keyed off \`metricId\`/\`dimension\` hints, so no store or API is involved.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvDraftPreview },
    setup: () => ({ args }),
    template: `
      <div :style="{ maxWidth: args.density === 'expanded' ? '640px' : '360px' }">
        <DvDraftPreview v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvDraftPreview>

export default meta
type Story = StoryObj<typeof meta>

/** 2×2 KPI quad with trend deltas (preset picked from the metric id). */
export const KpiQuad: Story = {
  args: { draft: draft({ type: 'kpi', title: 'Revenue', dataSource: 'commerce', metricId: 'commerce_revenue' }) },
}

/** Vertical bars with legend — channel labels inferred from the dimension hint. */
export const BarChart: Story = {
  args: {
    draft: draft({
      type: 'bar',
      title: 'Revenue by Channel',
      dataSource: 'commerce',
      metricId: 'commerce_revenue_by_channel',
      dimension: 'channel',
    }),
  },
}

/** Line trend with point markers. */
export const LineTrend: Story = {
  args: { draft: draft({ chartVariant: 'line' }) },
}

/** Area variant of the same trend (gradient fill under the line). */
export const AreaTrend: Story = {
  args: { draft: draft({ chartVariant: 'area' }) },
}

/** Donut with four primary-tinted slices and legend. */
export const Donut: Story = {
  args: { draft: draft({ type: 'pie', title: 'Tickets by Channel', dataSource: 'service', metricId: 'service_tickets_by_channel' }) },
}

/** Mini table — campaign columns inferred from the metric id. */
export const MiniTable: Story = {
  args: { draft: draft({ type: 'table', title: 'Top Campaigns', metricId: 'marketing_top_campaigns' }) },
}

/** Activity feed rows (fallback preview kind). */
export const ActivityFeed: Story = {
  args: { draft: draft({ type: 'activity', title: 'Live Activity', metricId: 'marketing_live_activity' }) },
}

/** Expanded density — the full-size treatment used inside DvExpandDialog. */
export const ExpandedDensity: Story = {
  args: {
    density: 'expanded',
    draft: draft({ type: 'kpi', title: 'Revenue', dataSource: 'commerce', metricId: 'commerce_revenue' }),
  },
}
