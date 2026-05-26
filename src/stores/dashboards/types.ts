export type DashboardKind = 'system' | 'custom'
export type DashboardWidgetType = 'kpi' | 'timeseries' | 'bar' | 'pie' | 'table' | 'activity' | 'setup'
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

export type DashboardWidgetData = DashboardKpiData | DashboardSeriesData | DashboardTableData | DashboardActivityData
