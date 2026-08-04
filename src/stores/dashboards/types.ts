export type DashboardKind = 'system' | 'custom'
export type DashboardWidgetType =
  | 'kpi'
  | 'timeseries'
  | 'bar'
  | 'pie'
  | 'table'
  | 'activity'
  | 'setup'
  | 'attention'
  | 'insights'
  | 'metric_explorer'
  | 'funnel'
  | 'donut'
  | 'gauge'
  | 'bar_list'
  | 'breakdown'
  | 'palette'
  | 'stacked_bar'
  | 'tabs'
export type DashboardChartVariant = 'horizontal' | 'vertical' | 'area' | 'line'
export type DashboardDataSource = 'commerce' | 'marketing' | 'analytics' | 'contacts' | 'service' | 'neto' | 'retail' | 'merchandising'
export type DashboardDatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'month_to_date'
  | 'quarter_to_date'
  | 'year_to_date'
  | 'black_friday_cyber_monday'
  | 'custom'
export type DashboardDateGrain = 'daily' | 'weekly' | 'monthly'
export type DashboardComparisonMode = 'none' | 'previous_period' | 'previous_year' | 'custom'
export type DashboardMetricUnit = 'currency' | 'count' | 'percent'

export type DashboardMetricId =
  | 'commerce_revenue'
  | 'commerce_orders'
  | 'commerce_aov'
  | 'commerce_revenue_over_time'
  | 'commerce_revenue_by_channel'
  | 'commerce_recent_orders'
  | 'marketing_open_rate'
  | 'marketing_click_rate'
  | 'marketing_sends'
  | 'marketing_open_rate_over_time'
  | 'marketing_campaign_revenue'
  | 'marketing_top_campaigns'
  | 'analytics_total_revenue'
  | 'analytics_total_orders'
  | 'analytics_active_subscribers'
  | 'analytics_sends_over_time'
  | 'contacts_total'
  | 'contacts_subscribed'
  | 'contacts_growth'
  | 'contacts_top_segments'
  | 'service_open_tickets'
  | 'service_resolution_rate'
  | 'service_ticket_volume'
  | 'service_recent_tickets'
  | 'service_new_tickets'
  | 'service_pending_tickets'
  | 'service_unresolved_tickets'
  | 'service_tickets_by_channel'
  | 'service_tickets_by_type'
  | 'marketing_email_volume'
  | 'marketing_recent_campaigns'
  | 'marketing_total_campaign_revenue'
  | 'marketing_deliverability_score'
  | 'contacts_by_domain'
  | 'contacts_subscriber_summary'
  | 'marketing_live_activity'
  | 'retail_revenue'
  | 'retail_sale_count'
  | 'retail_customer_count'
  | 'retail_gross_profit'
  | 'retail_discounted'
  | 'retail_discounted_pct'
  | 'retail_avg_sale_value'
  | 'retail_avg_items_per_sale'
  | 'retail_sales_today'
  | 'retail_avg_basket'
  | 'retail_returns_today'
  | 'retail_sales_by_location'
  | 'retail_top_skus'
  | 'retail_top_associates'
  | 'merch_total_revenue'
  | 'merch_cloud_revenue'
  | 'merch_cloud_share'
  | 'merch_aov'
  | 'merch_revenue_trend'
  | 'merch_contribution'
  | 'demo_channel_trend'
  | 'demo_channel_mix'
  | 'overview_attention'
  | 'davinci_insights'
  | 'commerce_conversion_rate'
  | 'service_support_health'
  | 'overview_metric_explorer'
  | 'overview_campaign_funnel'
  | 'commerce_revenue_attribution'
  | 'commerce_orders_by_channel'
  | 'commerce_new_vs_returning'
  | 'commerce_revenue_goal'
  | 'overview_tabs'
  | 'commerce_best_sellers'
  | 'retail_today_breakdown'
  | 'commerce_fulfillment_queue'
  | 'service_tickets_breakdown'
  | 'marketing_deliverability_breakdown'
  | 'marketing_journeys_in_flight'
  | 'design_palette'
  | 'commerce_channel_weekly'

export interface DashboardLayout {
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface DashboardWidgetFilter {
  field: string
  operator: 'eq' | 'in' | 'between'
  value: unknown
}

export interface DashboardWidgetDrilldown {
  routeName: string
  label: string
}

export interface DashboardAiProvenance {
  prompt: string
  summary: string
}

export interface DashboardWidget {
  id: string
  type: DashboardWidgetType
  title: string
  subtitle?: string
  dataSource: DashboardDataSource
  metricId: DashboardMetricId
  dimension?: string
  chartVariant?: DashboardChartVariant
  layout: DashboardLayout
  filters?: DashboardWidgetFilter[]
  drilldown: DashboardWidgetDrilldown
  aiProvenance?: DashboardAiProvenance
  lastRefreshedAt?: string
}

export interface DashboardFilterState {
  rangePreset: DashboardDatePreset
  startDate?: string
  endDate?: string
  grain: DashboardDateGrain
  comparison: DashboardComparisonMode
  comparisonStartDate?: string
  comparisonEndDate?: string
}

export type DashboardAccent =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral'

export interface Dashboard {
  id: string
  accountId: string
  kind: DashboardKind
  name: string
  description?: string
  icon?: string
  accent?: DashboardAccent
  isDefault: boolean
  favorite?: boolean
  lastViewedAt?: string
  widgets: DashboardWidget[]
  filters: DashboardFilterState
  createdAt: string
  updatedAt: string
}

export interface DashboardWidgetDraft {
  dashboardId: string
  widgetId?: string
  type: DashboardWidgetType
  title: string
  subtitle?: string
  dataSource: DashboardDataSource
  metricId: DashboardMetricId
  dimension?: string
  chartVariant?: DashboardChartVariant
  filters?: DashboardWidgetFilter[]
  drilldown: DashboardWidgetDrilldown
  layout?: Partial<DashboardLayout>
  aiProvenance?: DashboardAiProvenance
  lastRefreshedAt?: string
}

export interface DashboardWidgetLibraryEntry {
  id: string
  title: string
  description: string
  category: 'commerce' | 'marketing' | 'service' | 'davinci' | 'retail' | 'merchandising'
  type: DashboardWidgetType
  icon: string
  recommended?: boolean
  metricId: DashboardMetricId
  dataSource: DashboardDataSource
  drilldown: DashboardWidgetDrilldown
  chartVariant?: DashboardChartVariant
}

export interface DashboardTableColumn {
  key: string
  label: string
  align?: 'start' | 'center' | 'end'
}

export interface DashboardKpiData {
  kind: 'kpi'
  unit: DashboardMetricUnit
  value: number
  formattedValue: string
  delta: number | null
  deltaLabel: string
  helperText: string
  location?: string
  /** Inline secondary stat below the delta pill, e.g. "15 unresolved · oldest 3d". */
  secondaryStat?: string
}

export interface DashboardSeriesData {
  kind: 'series'
  unit: DashboardMetricUnit
  labels: string[]
  series: Array<{ name: string; data: number[] }>
}

export interface DashboardTableData {
  kind: 'table'
  columns: DashboardTableColumn[]
  rows: Array<Record<string, string | number>>
}

export interface DashboardActivityItem {
  id: string
  tag: 'email' | 'order' | 'audience' | 'automation'
  icon: string
  eyebrow: string
  title: string
  meta: string
}

export interface DashboardActivityData {
  kind: 'activity'
  items: DashboardActivityItem[]
}

export type DashboardAttentionSeverity = 'critical' | 'warning' | 'info'

export interface DashboardAttentionItem {
  id: string
  severity: DashboardAttentionSeverity
  title: string
  context: string
  occurredAt: string
  actionLabel: string
  dataSource: DashboardDataSource
  routeName: string
  /** Lucide icon shown in the tinted tile; falls back to a per-severity icon. */
  icon?: string
}

export interface DashboardAttentionData {
  kind: 'attention'
  items: DashboardAttentionItem[]
}

export interface DashboardInsightItem {
  id: string
  observation: string
  stat: string
  actionLabel: string
  routeName: string
}

export interface DashboardInsightsData {
  kind: 'insights'
  items: DashboardInsightItem[]
}

export interface DashboardMetricExplorerMetric {
  key: 'revenue' | 'orders' | 'aov' | 'conv'
  label: string
  /** Chart subtitle when this metric is selected, e.g. "Daily net revenue". */
  sub: string
  unit: DashboardMetricUnit
  value: number
  formattedValue: string
  delta: string
  deltaPositive: boolean
  /** Per-day series for the current window. */
  cur: number[]
  /** Per-day series for the previous window (same length as cur). */
  prev: number[]
  /** Whether the chart y-axis should start at zero for this metric. */
  zeroBased: boolean
}

export interface DashboardMetricExplorerData {
  kind: 'metric_explorer'
  vsLabel: string
  vsLabelLong: string
  /** The 5 evenly spaced axis ticks. */
  xLabels: string[]
  /** One label per data point, for the hover tooltip. */
  pointLabels: string[]
  metrics: DashboardMetricExplorerMetric[]
}

export interface DashboardStatPair {
  label: string
  value: string
}

export interface DashboardFunnelStage {
  label: string
  formattedValue: string
  share: string
  /** Stage size as a fraction of the first stage, 0–1 (drives the funnel path). */
  pct: number
  accent?: boolean
}

export interface DashboardFunnelData {
  kind: 'funnel'
  stages: DashboardFunnelStage[]
  footerStats: DashboardStatPair[]
  warning?: string
}

export interface DashboardDonutSegment {
  label: string
  value: number
  formattedValue: string
}

export interface DashboardDonutData {
  kind: 'donut'
  variant: 'ring' | 'pie'
  /** Colors are assigned by index from the dotted blues palette. */
  segments: DashboardDonutSegment[]
  centerValue?: string
  centerCaption?: string
  footerStats?: DashboardStatPair[]
}

export interface DashboardGaugeData {
  kind: 'gauge'
  pct: number
  centerValue: string
  centerCaption: string
  footerStats?: DashboardStatPair[]
}

export interface DashboardBarListRow {
  label: string
  value: string
  pct: number
  meta?: string
}

export interface DashboardBarListData {
  kind: 'bar_list'
  headline?: { value: string; delta?: string; deltaPositive?: boolean; caption?: string }
  rows: DashboardBarListRow[]
}

export interface DashboardBreakdownRow {
  label: string
  /** Second line under the label (journeys). */
  meta?: string
  value: string
  tone?: 'default' | 'alert' | 'success' | 'warning'
  /** Render the label as an MpStatusChip instead of text. */
  chip?: { status: string; type: 'order' | 'fulfillment' | 'payment' | 'campaign' | 'contact' | 'ticket' }
}

export interface DashboardBreakdownData {
  kind: 'breakdown'
  headline?: { value: string; caption?: string }
  /** Dotted progress bar under the headline (deliverability). */
  progress?: { pct: number; tone: 'blue' | 'green' }
  rows: DashboardBreakdownRow[]
  warning?: string
  /** Footer link label; routes via the widget's drilldown. */
  linkLabel?: string
}

export interface DashboardPaletteGroup {
  title: string
  /** Which chart(s) the ramp is used by. */
  caption: string
  /** Ordered hex shades, rendered as a segmented bar with hex labels. */
  shades: string[]
}

export interface DashboardPaletteData {
  kind: 'palette'
  groups: DashboardPaletteGroup[]
  footnote?: string
}

export interface DashboardStackedBarSegment {
  key: string
  value: number
  formattedValue: string
}

export interface DashboardStackedBarBucket {
  label: string
  segments: DashboardStackedBarSegment[]
}

export interface DashboardStackedBarData {
  kind: 'stacked_bar'
  buckets: DashboardStackedBarBucket[]
  /** Legend order matches segment order (bottom of the stack first). */
  legend: { key: string; label: string; total: string; pct: number }[]
}

export interface DashboardTabsOrderRow {
  order: string
  customer: string
  status: string
  total: string
}

export interface DashboardTabsCampaignRow {
  name: string
  revenue: string
  pct: number
  meta: string
}

export interface DashboardTabsData {
  kind: 'tabs'
  orders: DashboardTabsOrderRow[]
  activity: DashboardActivityItem[]
  campaigns: DashboardTabsCampaignRow[]
  campaignsCaption: string
}

export type DashboardWidgetData =
  | DashboardKpiData
  | DashboardSeriesData
  | DashboardTableData
  | DashboardActivityData
  | DashboardAttentionData
  | DashboardInsightsData
  | DashboardMetricExplorerData
  | DashboardFunnelData
  | DashboardDonutData
  | DashboardGaugeData
  | DashboardBarListData
  | DashboardBreakdownData
  | DashboardPaletteData
  | DashboardStackedBarData
  | DashboardTabsData
