import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardFilterState, DashboardWidget } from '@/stores/dashboards/types'
import { buildLayoutFromPreset } from './widgetSizePresets'
import DashboardWidgetCard from './DashboardWidgetCard.vue'

const FILTERS: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

const KPI_WIDGET: DashboardWidget = {
  id: 'story-kpi',
  type: 'kpi',
  title: 'Revenue',
  dataSource: 'commerce',
  metricId: 'commerce_revenue',
  layout: buildLayoutFromPreset('kpi', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'SalesOrders', label: 'Open sales orders' },
  lastRefreshedAt: minutesAgo(24),
}

const TIMESERIES_WIDGET: DashboardWidget = {
  id: 'story-timeseries',
  type: 'timeseries',
  title: 'Revenue Over Time',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_over_time',
  chartVariant: 'area',
  layout: buildLayoutFromPreset('timeseries', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'OrdersReport', label: 'Open orders report' },
  lastRefreshedAt: minutesAgo(51),
}

const BAR_WIDGET: DashboardWidget = {
  id: 'story-bar',
  type: 'bar',
  title: 'Revenue by Channel',
  dataSource: 'commerce',
  metricId: 'commerce_revenue_by_channel',
  chartVariant: 'vertical',
  layout: buildLayoutFromPreset('bar', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'SalesSummary', label: 'Open sales summary' },
  lastRefreshedAt: minutesAgo(8),
}

const TABLE_WIDGET: DashboardWidget = {
  id: 'story-table',
  type: 'table',
  title: 'Top Campaigns',
  dataSource: 'marketing',
  metricId: 'marketing_top_campaigns',
  layout: buildLayoutFromPreset('table', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  lastRefreshedAt: minutesAgo(95),
}

const ACTIVITY_WIDGET: DashboardWidget = {
  id: 'story-activity',
  type: 'activity',
  title: 'Live activity',
  dataSource: 'marketing',
  metricId: 'marketing_live_activity',
  layout: buildLayoutFromPreset('activity', 'M', { x: 0, y: 0 }),
  drilldown: { routeName: 'CampaignReports', label: 'Open campaign reports' },
  lastRefreshedAt: minutesAgo(2),
}

const TABS_WIDGET: DashboardWidget = {
  id: 'story-tabs',
  type: 'tabs',
  title: 'Recent activity',
  dataSource: 'commerce',
  metricId: 'overview_tabs',
  layout: buildLayoutFromPreset('table', 'M', { x: 0, y: 0 }),
  lastRefreshedAt: minutesAgo(6),
}

const ATTENTION_WIDGET: DashboardWidget = {
  id: 'story-attention',
  type: 'attention',
  title: 'Needs attention',
  dataSource: 'commerce',
  metricId: 'overview_attention',
  layout: buildLayoutFromPreset('table', 'M', { x: 0, y: 0 }),
  lastRefreshedAt: minutesAgo(11),
}

const AI_WIDGET: DashboardWidget = {
  ...TIMESERIES_WIDGET,
  id: 'story-ai',
  title: 'Campaign Revenue Trend',
  aiProvenance: {
    prompt: 'show me how campaign revenue is trending this month',
    summary: 'Time series of attributed campaign revenue.',
  },
}

const meta = {
  title: 'Product/Dashboards/DashboardWidgetCard',
  component: DashboardWidgetCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Frame for every dashboard widget: title/subtitle header, unified action menu (Expand, Edit, View report, Size presets, Remove), data body (KPI, chart, pie, table, or activity — resolved from the widget `metricId` via `useWidgetData` mock stores), and a source-cloud footer. `draggable` reveals the hover drag grip in grid context; `preview` renders the dashed wizard-preview style.',
      },
    },
  },
  args: {
    accountId: '2000290',
    widget: TIMESERIES_WIDGET,
    filters: FILTERS,
    draggable: false,
    preview: false,
    showActions: true,
  },
  argTypes: {
    accountId: { control: 'text', description: 'Account the widget belongs to, used by the widget body to resolve its data.' },
    widget: {
      control: 'object',
      description: '`DashboardWidget` — its `type` selects which of the 17 widget bodies renders inside the card shell.',
    },
    filters: {
      control: 'object',
      description: '`DashboardFilterState` passed down to the widget body. Normally the dashboard-level filters, unchanged.',
    },
    draggable: {
      control: 'boolean',
      description: 'Grid context only: reveals the drag grip on hover.',
    },
    preview: {
      control: 'boolean',
      description: 'Renders the card as a non-interactive preview — used by the widget wizard and the copilot draft flow, where the card is a specimen rather than a live widget.',
    },
    showActions: {
      control: 'boolean',
      description: 'Shows the floating action overlay (expand / edit / refresh / remove). Its geometry comes from `component.widget.actionSize|actionGap|actionInset`, and the card\'s header clearance is calc()ed from those, so hiding it does not leave a hole.',
    },
  },
  render: (args) => ({
    components: { DashboardWidgetCard },
    setup: () => ({ args }),
    template: `
      <div :style="{ height: args.widget.type === 'kpi' ? '200px' : '340px', maxWidth: args.widget.type === 'kpi' ? '340px' : '560px' }">
        <DashboardWidgetCard v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DashboardWidgetCard>

export default meta
type Story = StoryObj<typeof meta>

export const Chart: Story = {}

export const Kpi: Story = {
  args: { widget: KPI_WIDGET },
}

export const BarChart: Story = {
  args: { widget: BAR_WIDGET },
}

export const Table: Story = {
  args: { widget: TABLE_WIDGET },
}

export const Activity: Story = {
  args: { widget: ACTIVITY_WIDGET },
}

export const DaVinciGenerated: Story = {
  args: { widget: AI_WIDGET },
}

export const Draggable: Story = {
  args: { draggable: true },
}

export const WizardPreview: Story = {
  args: { preview: true, showActions: false },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * The three inset cases in the family, side by side. **Standard** widgets sit inside the
 * card's own header/body bands; **KPI** widgets take the body inset to zero and draw their
 * own denser one; **bespoke-header** widgets (tabs, attention, metric explorer) replace the
 * header entirely and draw both edges themselves.
 *
 * Phase 4 (P4-1) gave the whole 17-widget family one inset. It comes from `component.card.*`
 * — the standard Phase 3 set at 20px precisely because this family already used it — not from
 * a second widget-only pair. Header is `card.padding card.padding card.gapCompact`; body is
 * `0 card.padding card.padding`. A bespoke widget states the same role token directly.
 *
 * The bespoke card is also the **P4-2** case: its own top-right controls are held clear of the
 * floating drag/kebab overlay by a clearance that is now `calc()`ed from the overlay's three
 * `component.widget.action*` tokens. It used to be two hand-computed magic numbers — and the
 * pair case (76) was in fact 2px short of the 78px the overlay actually occupies.
 */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardWidgetCard },
    setup: () => ({ args, kpi: KPI_WIDGET, tabs: TABS_WIDGET, attention: ATTENTION_WIDGET }),
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">standard — card header (20/20/8) + card body (0/20/20)</div>
          <div style="height: 300px; max-width: 560px"><DashboardWidgetCard v-bind="args" /></div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">kpi — card body inset 0, widget draws its own compact 12</div>
          <div style="height: 200px; max-width: 340px"><DashboardWidgetCard v-bind="args" :widget="kpi" /></div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">bespoke header — widget draws both edges; note the clearance around the floating actions</div>
          <div style="height: 320px; max-width: 560px"><DashboardWidgetCard v-bind="args" :widget="tabs" draggable /></div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">bespoke header (attention) — the shorter toggle row, re-centred against the overlay</div>
          <div style="height: 220px; max-width: 560px"><DashboardWidgetCard v-bind="args" :widget="attention" draggable /></div>
        </div>
      </div>
    `,
  }),
}

/**
 * There is no `size` prop — a widget fills its grid cell, and the grid decides the cell.
 * What the card guarantees is that the inset never changes with the cell: a 1×1 KPI and a
 * 4×3 chart have the same distance from their border to their content.
 *
 * The one responsive step is below 768px, where the inset drops to the `16` primitive.
 * There is no 16 role stop, and adding one would be the second inset scale P4-1 exists to
 * avoid — so it is deliberately a primitive there.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardWidgetCard },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 200px"><DashboardWidgetCard v-bind="args" /></div>
        <div style="width: 420px; height: 260px"><DashboardWidgetCard v-bind="args" /></div>
        <div style="width: 640px; height: 320px"><DashboardWidgetCard v-bind="args" /></div>
      </div>
    `,
  }),
}

/**
 * Resting, hover (a soft lift, no border change), draggable (grip fades in on hover),
 * preview (dashed border, no actions), and the empty state a widget shows when its query
 * returns nothing.
 *
 * The floating action overlay is the P4-2 case: its clearance for a bespoke header used to
 * be two hand-computed magic numbers (`76px` / `60px`) and is now `calc()`ed from the
 * overlay's own `component.widget.action*` tokens, so it cannot drift from the buttons again.
 */
export const States: Story = {
  render: (args) => ({
    components: { DashboardWidgetCard },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">resting / hover</div>
          <div style="width: 340px; height: 240px"><DashboardWidgetCard v-bind="args" /></div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">draggable — grip appears on hover</div>
          <div style="width: 340px; height: 240px"><DashboardWidgetCard v-bind="args" draggable /></div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">preview — dashed, no actions</div>
          <div style="width: 340px; height: 240px"><DashboardWidgetCard v-bind="args" preview /></div>
        </div>
      </div>
    `,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** A real dashboard row — a KPI, a chart and a table beside each other at the
 * sizes the grid actually gives them. This is the composition P4-1 is judged on: run your eye
 * down the left edge of the three cards and the content should start at the same distance from
 * the border in every one, whatever the widget inside is doing.
 */
export const InContextDashboardRow: Story = {
  render: (args) => ({
    components: { DashboardWidgetCard },
    setup: () => ({ args, kpi: KPI_WIDGET, bar: BAR_WIDGET, table: TABLE_WIDGET }),
    template: `
      <div class="d-flex flex-column ga-4">
        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--mp-space-16)">
          <div style="height: 180px"><DashboardWidgetCard v-bind="args" :widget="kpi" /></div>
          <div style="height: 180px"><DashboardWidgetCard v-bind="args" :widget="kpi" /></div>
          <div style="height: 180px"><DashboardWidgetCard v-bind="args" :widget="kpi" /></div>
          <div style="height: 180px"><DashboardWidgetCard v-bind="args" :widget="kpi" /></div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--mp-space-16)">
          <div style="height: 300px"><DashboardWidgetCard v-bind="args" /></div>
          <div style="height: 300px"><DashboardWidgetCard v-bind="args" :widget="bar" /></div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--mp-space-16)">
          <div style="height: 300px"><DashboardWidgetCard v-bind="args" :widget="table" /></div>
          <div style="height: 300px"><DashboardWidgetCard v-bind="args" /></div>
        </div>
      </div>
    `,
  }),
}
