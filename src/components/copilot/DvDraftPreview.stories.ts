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
  title: 'Product/Da Vinci/DvDraftPreview',
  component: DvDraftPreview,
  tags: ['autodocs'],
  args: {
    draft: draft({}),
    density: 'comfortable',
  },
  argTypes: {
    draft: {
      control: 'object',
      description: '`DashboardWidgetDraft` — the widget Da Vinci proposed. `draft.type` selects the preview shape (KPI, bar, line/area, pie, table, funnel, scatter); the chart canvas geometry is deliberately off the spacing scale because it is plotting area, not padding.',
    },
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

export const Default: Story = {
  args: { draft: draft({ type: 'timeseries', title: 'Open Rate Trend' }) },
}



/** Every preview kind the component can render, from the draft's `type`. */
export const Variants: Story = {
  render: () => ({
    components: { DvDraftPreview },
    setup: () => ({
      kinds: [
        { label: 'kpi', d: draft({ type: 'kpi', title: 'Revenue', dataSource: 'commerce', metricId: 'commerce_revenue' }) },
        { label: 'bar', d: draft({ type: 'bar', title: 'Revenue by Channel', dataSource: 'commerce', metricId: 'commerce_revenue_by_channel', dimension: 'channel' }) },
        { label: 'timeseries', d: draft({ type: 'timeseries', title: 'Open Rate Trend' }) },
        { label: 'donut', d: draft({ type: 'donut', title: 'Orders by Status', dataSource: 'commerce', metricId: 'commerce_orders_by_status', dimension: 'status' }) },
        { label: 'table', d: draft({ type: 'table', title: 'Top Products', dataSource: 'commerce', metricId: 'commerce_top_products' }) },
      ],
    }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--mp-space-24);">
        <div v-for="k in kinds" :key="k.label">
          <div class="text-caption text-medium-emphasis mb-2">{{ k.label }}</div>
          <DvDraftPreview :draft="k.d" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * `density` is the size axis — the same draft at the three sizes it is rendered at:
 * the refine dialog, the draft card, and the full-size expand dialog.
 */
export const Sizes: Story = {
  render: () => ({
    components: { DvDraftPreview },
    setup: () => ({ d: draft({ type: 'kpi', title: 'Revenue', dataSource: 'commerce', metricId: 'commerce_revenue' }) }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div v-for="den in ['compact', 'comfortable', 'expanded']" :key="den">
          <div class="text-caption text-medium-emphasis mb-2">density="{{ den }}"</div>
          <DvDraftPreview :draft="d" :density="den" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** The delta states a KPI preview can show — up, down, and flat. */
export const States: Story = {
  render: () => ({
    components: { DvDraftPreview },
    setup: () => ({
      d: draft({ type: 'kpi', title: 'Revenue', dataSource: 'commerce', metricId: 'commerce_revenue' }),
      t: draft({ type: 'timeseries', title: 'Open Rate Trend' }),
    }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">KPI quad — up / down / flat deltas in one preset</div>
          <DvDraftPreview :draft="d" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">timeseries — deterministic mock series</div>
          <DvDraftPreview :draft="t" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

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
