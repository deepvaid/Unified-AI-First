import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAccountsStore, type Account } from '@/stores/useAccounts'
import {
  getAvailableMetrics,
  getMetricDescriptor,
  isDashboardSourceAvailable,
} from '@/stores/dashboards/metricCatalog'
import {
  getDefaultPreset,
  getPreset,
  type WidgetSize,
} from '@/components/dashboards/widgetSizePresets'
import type {
  Dashboard,
  DashboardAccent,
  DashboardComparisonMode,
  DashboardDatePreset,
  DashboardLayout,
  DashboardWidget,
  DashboardWidgetDraft,
  DashboardWidgetType,
} from '@/stores/dashboards/types'

interface PersistedAccountDashboards {
  dashboards: Dashboard[]
}

interface PersistedDashboardStateV1 {
  version: 1
  accounts: Record<string, PersistedAccountDashboards>
}

interface PersistedDashboardStateV2 {
  version: 2
  accounts: Record<string, PersistedAccountDashboards>
}

interface PersistedDashboardStateV3 {
  version: 3
  accounts: Record<string, PersistedAccountDashboards>
}

type AnyPersistedDashboardState = PersistedDashboardStateV1 | PersistedDashboardStateV2 | PersistedDashboardStateV3

const STORAGE_KEY = 'mp.dashboard-hub.v13'
const LEGACY_STORAGE_KEY_V1 = 'mp.dashboard-hub.v1'
const MAX_WIDGETS_PER_DASHBOARD = 24
const PERSIST_DEBOUNCE_MS = 250

function nowIso(): string {
  return new Date().toISOString()
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createWidgetId(): string {
  return `widget-${Math.random().toString(36).slice(2, 10)}`
}

function createDashboardId(accountId: string, slug: string): string {
  return `${accountId}-${slug}`
}

function createDefaultFilters(): Dashboard['filters'] {
  return {
    rangePreset: 'last_30_days',
    grain: 'daily',
    comparison: 'previous_period',
  }
}

const LEGACY_PRESET_MAP: Record<string, DashboardDatePreset> = {
  '7D': 'last_7_days',
  '30D': 'last_30_days',
  '90D': 'last_90_days',
  YTD: 'year_to_date',
}

const DATE_PRESETS: DashboardDatePreset[] = [
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'month_to_date',
  'quarter_to_date',
  'year_to_date',
  'black_friday_cyber_monday',
  'custom',
]

const COMPARISON_MODES: DashboardComparisonMode[] = ['none', 'previous_period', 'previous_year', 'custom']

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function normalizeDashboardFilters(filters: unknown): Dashboard['filters'] {
  const fallback = createDefaultFilters()
  if (!filters || typeof filters !== 'object') return fallback

  const payload = filters as Record<string, unknown>
  const legacyPreset = isString(payload.preset) ? LEGACY_PRESET_MAP[payload.preset] : undefined
  const rangePreset = isString(payload.rangePreset) && DATE_PRESETS.includes(payload.rangePreset as DashboardDatePreset)
    ? payload.rangePreset as DashboardDatePreset
    : legacyPreset ?? fallback.rangePreset
  const comparison = isString(payload.comparison) && COMPARISON_MODES.includes(payload.comparison as DashboardComparisonMode)
    ? payload.comparison as DashboardComparisonMode
    : fallback.comparison
  const grain = payload.grain === 'weekly' || payload.grain === 'monthly'
    ? payload.grain
    : fallback.grain

  return {
    rangePreset,
    startDate: isString(payload.startDate) ? payload.startDate : undefined,
    endDate: isString(payload.endDate) ? payload.endDate : undefined,
    grain,
    comparison,
    comparisonStartDate: isString(payload.comparisonStartDate) ? payload.comparisonStartDate : undefined,
    comparisonEndDate: isString(payload.comparisonEndDate) ? payload.comparisonEndDate : undefined,
  }
}

function seededRefreshedAt(): string {
  // Spread seeded widgets across the last 0-180 minutes so the dashboard
  // doesn't show "Updated just now" on every card after a fresh load.
  const minutesAgo = Math.floor(Math.random() * 180)
  return new Date(Date.now() - minutesAgo * 60_000).toISOString()
}

function normalizePersistedDashboard(dashboard: Dashboard): Dashboard {
  return {
    ...dashboard,
    filters: normalizeDashboardFilters(dashboard.filters),
    widgets: dashboard.widgets.map((widget) =>
      widget.lastRefreshedAt ? widget : { ...widget, lastRefreshedAt: seededRefreshedAt() },
    ),
  }
}

function createLayout(x: number, y: number, w: number, h: number, minW = 2, minH = 2): DashboardLayout {
  return { x, y, w, h, minW, minH }
}

function makeWidget(
  title: string,
  metricId: DashboardWidget['metricId'],
  type: DashboardWidgetType,
  layout: DashboardLayout,
): DashboardWidget {
  const metric = getMetricDescriptor(metricId)
  if (!metric) {
    throw new Error(`Unknown metric "${metricId}"`)
  }

  const preset = getDefaultPreset(type)
  return {
    id: createWidgetId(),
    type,
    title,
    dataSource: metric.dataSource,
    metricId,
    layout: {
      ...layout,
      minW: layout.minW ?? preset.minW,
      minH: layout.minH ?? preset.minH,
    },
    drilldown: metric.drilldown,
    lastRefreshedAt: seededRefreshedAt(),
  }
}

function makeRetailKpi(
  title: string,
  metricId: DashboardWidget['metricId'],
  layout: DashboardLayout,
): DashboardWidget {
  return makeWidget(title, metricId, 'kpi', layout)
}

function makeSetupWidget(layout: DashboardLayout): DashboardWidget {
  const preset = getDefaultPreset('setup')
  return {
    id: createWidgetId(),
    type: 'setup',
    title: 'Setup guide',
    dataSource: 'analytics',
    metricId: 'contacts_total' as DashboardWidget['metricId'],
    drilldown: { routeName: 'dashboard-detail', label: 'Setup guide' },
    layout: {
      ...layout,
      minW: layout.minW ?? preset.minW,
      minH: layout.minH ?? preset.minH,
    },
  }
}

function buildHomeWidgets(account: Account): DashboardWidget[] {
  const widgets: DashboardWidget[] = []

  if (account.subscriptions.includes('commerce')) {
    widgets.push(
      makeWidget('Revenue', 'commerce_revenue', 'kpi', createLayout(0, 0, 3, 4)),
      makeWidget('Orders', 'commerce_orders', 'kpi', createLayout(3, 0, 3, 4)),
      makeWidget('Open Rate', 'marketing_open_rate', 'kpi', createLayout(6, 0, 3, 4)),
      makeWidget('Total Contacts', 'contacts_total', 'kpi', createLayout(9, 0, 3, 4)),
      makeSetupWidget(createLayout(0, 4, 4, 8)),
      makeWidget('Revenue Over Time', 'commerce_revenue_over_time', 'timeseries', createLayout(4, 4, 8, 8)),
      makeWidget('Live activity', 'marketing_live_activity', 'activity', createLayout(0, 12, 6, 8)),
      makeWidget('Top Campaigns', 'marketing_top_campaigns', 'table', createLayout(6, 12, 6, 7)),
      makeWidget('Recent Orders', 'commerce_recent_orders', 'table', createLayout(0, 20, 7, 7)),
      makeWidget('Revenue by Channel', 'commerce_revenue_by_channel', 'bar', createLayout(7, 20, 5, 7)),
      makeWidget('Email Volume', 'marketing_email_volume', 'timeseries', createLayout(0, 27, 6, 7)),
      makeWidget('Email Address by Domain', 'contacts_by_domain', 'bar', createLayout(6, 27, 6, 7)),
    )
  } else {
    widgets.push(
      makeWidget('Total Revenue', 'analytics_total_revenue', 'kpi', createLayout(0, 0, 3, 4)),
      makeWidget('Open Rate', 'marketing_open_rate', 'kpi', createLayout(3, 0, 3, 4)),
      makeWidget('Active Subscribers', 'analytics_active_subscribers', 'kpi', createLayout(6, 0, 3, 4)),
      makeWidget('Total Contacts', 'contacts_total', 'kpi', createLayout(9, 0, 3, 4)),
      makeSetupWidget(createLayout(0, 4, 4, 8)),
      makeWidget('Sends Over Time', 'analytics_sends_over_time', 'timeseries', createLayout(4, 4, 8, 8)),
      makeWidget('Top Campaigns', 'marketing_top_campaigns', 'table', createLayout(4, 12, 5, 7)),
      makeWidget('Contact Growth', 'contacts_growth', 'timeseries', createLayout(0, 19, 7, 7)),
      makeWidget('Campaign Revenue', 'marketing_campaign_revenue', 'bar', createLayout(7, 19, 5, 7)),
      makeWidget('Email Volume', 'marketing_email_volume', 'timeseries', createLayout(0, 26, 6, 7)),
      makeWidget('Subscriber Summary', 'contacts_subscriber_summary', 'table', createLayout(6, 26, 6, 7)),
    )
  }

  if (account.subscriptions.includes('service')) {
    // Start after commerce email row (y=27, h=7 → row ends at y=34)
    widgets.push(
      makeWidget('Open Tickets', 'service_open_tickets', 'kpi', createLayout(0, 34, 3, 4)),
      makeWidget('Unresolved Tickets', 'service_unresolved_tickets', 'kpi', createLayout(3, 34, 3, 4)),
      makeWidget('Ticket Volume', 'service_ticket_volume', 'timeseries', createLayout(6, 34, 6, 7)),
      makeWidget('Tickets by Channel', 'service_tickets_by_channel', 'bar', createLayout(0, 38, 6, 7)),
    )
  }

  return widgets
}

function buildSeedDashboards(account: Account): Dashboard[] {
  const createdAt = nowIso()
  const baseDashboards: Dashboard[] = [
    {
      id: createDashboardId(account.id, 'home'),
      accountId: account.id,
      kind: 'system',
      name: 'Home',
      description: 'Your curated Maropost command center with quick business context.',
      icon: 'layout-dashboard',
      accent: 'primary',
      isDefault: true,
      favorite: true,
      widgets: buildHomeWidgets(account),
      filters: createDefaultFilters(),
      createdAt,
      updatedAt: createdAt,
    },
  ]

  if (account.subscriptions.includes('commerce')) {
    baseDashboards.push(
      {
        id: createDashboardId(account.id, 'commerce-overview'),
        accountId: account.id,
        kind: 'system',
        name: 'Commerce Overview',
        description: 'Revenue, order, and fulfillment context for merchants.',
        icon: 'shopping-cart',
        accent: 'success',
        isDefault: false,
        widgets: [
          makeWidget('Revenue', 'commerce_revenue', 'kpi', createLayout(0, 0, 4, 3)),
          makeWidget('Average Order Value', 'commerce_aov', 'kpi', createLayout(4, 0, 4, 3)),
          makeWidget('Orders', 'commerce_orders', 'kpi', createLayout(8, 0, 4, 3)),
          makeWidget('Revenue Over Time', 'commerce_revenue_over_time', 'timeseries', createLayout(0, 3, 8, 7)),
          makeWidget('Revenue by Channel', 'commerce_revenue_by_channel', 'bar', createLayout(8, 3, 4, 7)),
          makeWidget('Recent Orders', 'commerce_recent_orders', 'table', createLayout(0, 10, 12, 7)),
        ],
        filters: createDefaultFilters(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: createDashboardId(account.id, 'marketing-performance'),
        accountId: account.id,
        kind: 'system',
        name: 'Marketing Performance',
        description: 'Campaign and engagement signals for merchants and marketers.',
        icon: 'megaphone',
        accent: 'secondary',
        isDefault: false,
        widgets: [
          makeWidget('Open Rate', 'marketing_open_rate', 'kpi', createLayout(0, 0, 3, 3)),
          makeWidget('Click Rate', 'marketing_click_rate', 'kpi', createLayout(3, 0, 3, 3)),
          makeWidget('Campaign Sends', 'marketing_sends', 'kpi', createLayout(6, 0, 3, 3)),
          makeWidget('Deliverability Score', 'marketing_deliverability_score', 'kpi', createLayout(9, 0, 3, 3)),
          makeWidget('Total Campaign Revenue', 'marketing_total_campaign_revenue', 'timeseries', createLayout(0, 3, 7, 7)),
          makeWidget('Email Volume', 'marketing_email_volume', 'timeseries', createLayout(7, 3, 5, 7)),
          makeWidget('Recent Sent Campaigns', 'marketing_recent_campaigns', 'table', createLayout(0, 10, 12, 7)),
          makeWidget('Campaign Revenue by Folder', 'marketing_campaign_revenue', 'bar', createLayout(0, 17, 6, 7)),
          makeWidget('Open Rate Trend', 'marketing_open_rate_over_time', 'timeseries', createLayout(6, 17, 6, 7)),
        ],
        filters: createDefaultFilters(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: createDashboardId(account.id, 'retail'),
        accountId: account.id,
        kind: 'system',
        name: 'Retail',
        description: 'Lightspeed Retail (X-Series) point-of-sale overview.',
        icon: 'shopping-bag',
        accent: 'success',
        isDefault: false,
        widgets: [
          // Original 8 retail KPI widgets
          makeRetailKpi('Revenue', 'retail_revenue', createLayout(0, 0, 3, 5)),
          makeRetailKpi('Sale Count', 'retail_sale_count', createLayout(3, 0, 3, 5)),
          makeRetailKpi('Customer Count', 'retail_customer_count', createLayout(6, 0, 3, 5)),
          makeRetailKpi('Gross Profit', 'retail_gross_profit', createLayout(9, 0, 3, 5)),
          makeRetailKpi('Discounted', 'retail_discounted', createLayout(0, 5, 3, 5)),
          makeRetailKpi('Discounted (%)', 'retail_discounted_pct', createLayout(3, 5, 3, 5)),
          makeRetailKpi('Avg Sale Value', 'retail_avg_sale_value', createLayout(6, 5, 3, 5)),
          makeRetailKpi('Avg Items / Sale', 'retail_avg_items_per_sale', createLayout(9, 5, 3, 5)),
          // Merged from Retail Reports - daily KPIs
          makeRetailKpi('Sales Today', 'retail_sales_today', createLayout(0, 10, 3, 5)),
          makeRetailKpi('Average Basket', 'retail_avg_basket', createLayout(3, 10, 3, 5)),
          makeRetailKpi('Returns Today', 'retail_returns_today', createLayout(6, 10, 3, 5)),
          // Merged from Retail Reports - breakdowns
          makeWidget('Sales by Location', 'retail_sales_by_location', 'bar', createLayout(0, 15, 6, 7)),
          makeWidget('Top SKUs', 'retail_top_skus', 'table', createLayout(6, 15, 6, 7)),
          makeWidget('Top Associates', 'retail_top_associates', 'table', createLayout(0, 22, 12, 7)),
        ],
        filters: createDefaultFilters(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: createDashboardId(account.id, 'merchandise'),
        accountId: account.id,
        kind: 'system',
        name: 'Merchandise',
        description: 'AI-powered discovery, search, and recommendation analytics.',
        icon: 'wand-sparkles',
        accent: 'info',
        isDefault: false,
        widgets: [
          makeWidget('Total Revenue', 'merch_total_revenue', 'kpi', createLayout(0, 0, 3, 4)),
          makeWidget('MerchCloud-driven Revenue', 'merch_cloud_revenue', 'kpi', createLayout(3, 0, 3, 4)),
          makeWidget('MerchCloud Share', 'merch_cloud_share', 'kpi', createLayout(6, 0, 3, 4)),
          makeWidget('Avg. Order Value', 'merch_aov', 'kpi', createLayout(9, 0, 3, 4)),
          makeWidget('Revenue Trend', 'merch_revenue_trend', 'timeseries', createLayout(0, 4, 8, 7)),
          makeWidget('MerchCloud Contribution', 'merch_contribution', 'bar', createLayout(8, 4, 4, 7)),
        ],
        filters: createDefaultFilters(),
        createdAt,
        updatedAt: createdAt,
      },
    )
  } else {
    baseDashboards.push(
      {
        id: createDashboardId(account.id, 'marketing-performance'),
        accountId: account.id,
        kind: 'system',
        name: 'Marketing Performance',
        description: 'Engagement and campaign health for growth teams.',
        icon: 'megaphone',
        accent: 'secondary',
        isDefault: false,
        widgets: [
          makeWidget('Open Rate', 'marketing_open_rate', 'kpi', createLayout(0, 0, 3, 3)),
          makeWidget('Click Rate', 'marketing_click_rate', 'kpi', createLayout(3, 0, 3, 3)),
          makeWidget('Campaign Sends', 'marketing_sends', 'kpi', createLayout(6, 0, 3, 3)),
          makeWidget('Deliverability Score', 'marketing_deliverability_score', 'kpi', createLayout(9, 0, 3, 3)),
          makeWidget('Total Campaign Revenue', 'marketing_total_campaign_revenue', 'timeseries', createLayout(0, 3, 7, 7)),
          makeWidget('Email Volume', 'marketing_email_volume', 'timeseries', createLayout(7, 3, 5, 7)),
          makeWidget('Recent Sent Campaigns', 'marketing_recent_campaigns', 'table', createLayout(0, 10, 12, 7)),
          makeWidget('Campaign Revenue by Folder', 'marketing_campaign_revenue', 'bar', createLayout(0, 17, 6, 7)),
          makeWidget('Open Rate Trend', 'marketing_open_rate_over_time', 'timeseries', createLayout(6, 17, 6, 7)),
        ],
        filters: createDefaultFilters(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: createDashboardId(account.id, 'campaign-analytics'),
        accountId: account.id,
        kind: 'system',
        name: 'Campaign Analytics',
        description: 'A campaign-centric summary that links into analytics reporting.',
        icon: 'bar-chart-2',
        accent: 'info',
        isDefault: false,
        widgets: [
          makeWidget('Total Revenue', 'analytics_total_revenue', 'kpi', createLayout(0, 0, 4, 3)),
          makeWidget('Active Subscribers', 'analytics_active_subscribers', 'kpi', createLayout(4, 0, 4, 3)),
          makeWidget('Campaign Sends', 'marketing_sends', 'kpi', createLayout(8, 0, 4, 3)),
          makeWidget('Sends Over Time', 'analytics_sends_over_time', 'timeseries', createLayout(0, 3, 8, 7)),
          makeWidget('Top Campaigns', 'marketing_top_campaigns', 'table', createLayout(8, 3, 4, 7)),
          makeWidget('Contact Growth', 'contacts_growth', 'timeseries', createLayout(0, 10, 12, 7)),
        ],
        filters: createDefaultFilters(),
        createdAt,
        updatedAt: createdAt,
      },
    )
  }

  if (account.subscriptions.includes('service')) {
    baseDashboards.push({
      id: createDashboardId(account.id, 'service-overview'),
      accountId: account.id,
      kind: 'system',
      name: 'Service Overview',
      description: 'Ticket backlog, channel distribution, and support health.',
      icon: 'headset',
      accent: 'warning',
      isDefault: false,
      widgets: [
        makeWidget('New Tickets', 'service_new_tickets', 'kpi', createLayout(0, 0, 3, 3)),
        makeWidget('Open Tickets', 'service_open_tickets', 'kpi', createLayout(3, 0, 3, 3)),
        makeWidget('Pending & On-Hold', 'service_pending_tickets', 'kpi', createLayout(6, 0, 3, 3)),
        makeWidget('Unresolved Tickets', 'service_unresolved_tickets', 'kpi', createLayout(9, 0, 3, 3)),
        makeWidget('Ticket Volume', 'service_ticket_volume', 'timeseries', createLayout(0, 3, 8, 7)),
        makeWidget('Resolution Rate', 'service_resolution_rate', 'kpi', createLayout(8, 3, 4, 3)),
        makeWidget('Tickets by Channel', 'service_tickets_by_channel', 'bar', createLayout(0, 10, 6, 7)),
        makeWidget('Tickets by Type', 'service_tickets_by_type', 'bar', createLayout(6, 10, 6, 7)),
        makeWidget('Recent Tickets', 'service_recent_tickets', 'table', createLayout(0, 17, 12, 7)),
      ],
      filters: createDefaultFilters(),
      createdAt,
      updatedAt: createdAt,
    })
  }

  baseDashboards.push({
    id: createDashboardId(account.id, 'contacts-audience'),
    accountId: account.id,
    kind: 'system',
    name: 'Contacts & Audience',
    description: 'Audience composition, subscriber health, and growth insights.',
    icon: 'users',
    accent: 'info',
    isDefault: false,
    widgets: [
      makeWidget('Total Contacts', 'contacts_total', 'kpi', createLayout(0, 0, 3, 3)),
      makeWidget('Subscribed Contacts', 'contacts_subscribed', 'kpi', createLayout(3, 0, 3, 3)),
      makeWidget('Contact Growth', 'contacts_growth', 'timeseries', createLayout(6, 0, 6, 7)),
      makeWidget('Email Address by Domain', 'contacts_by_domain', 'bar', createLayout(0, 7, 6, 7)),
      makeWidget('Subscriber Summary', 'contacts_subscriber_summary', 'table', createLayout(6, 7, 6, 7)),
      makeWidget('Top Segments', 'contacts_top_segments', 'table', createLayout(0, 14, 12, 7)),
    ],
    filters: createDefaultFilters(),
    createdAt,
    updatedAt: createdAt,
  })

  return baseDashboards
}

function readPersistedState(): PersistedDashboardStateV3 {
  if (typeof window === 'undefined') {
    return { version: 3, accounts: {} }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AnyPersistedDashboardState
      if (parsed?.version === 3) return normalizePersistedState(parsed)
      if (parsed?.version === 2) return migrateV2(parsed)
      if (parsed?.version === 1) return migrateV1(parsed)
    }

    // Migrate from legacy v1 storage key if present.
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY_V1)
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as AnyPersistedDashboardState
      if (legacyParsed?.version === 1) return migrateV1(legacyParsed)
    }

    return { version: 3, accounts: {} }
  } catch {
    return { version: 3, accounts: {} }
  }
}

function normalizePersistedState(state: PersistedDashboardStateV3): PersistedDashboardStateV3 {
  return {
    version: 3,
    accounts: Object.fromEntries(
      Object.entries(state.accounts).map(([accountId, payload]) => [
        accountId,
        { dashboards: payload.dashboards.map(normalizePersistedDashboard) },
      ]),
    ),
  }
}

function migrateV2(state: PersistedDashboardStateV2): PersistedDashboardStateV3 {
  const migrated: PersistedDashboardStateV3 = {
    version: 3,
    accounts: {},
  }

  for (const [accountId, payload] of Object.entries(state.accounts)) {
    migrated.accounts[accountId] = {
      dashboards: payload.dashboards.map((dashboard) => ({
        ...dashboard,
        filters: normalizeDashboardFilters(dashboard.filters),
      })),
    }
  }

  return migrated
}

function migrateV1(state: PersistedDashboardStateV1): PersistedDashboardStateV3 {
  const migrated = migrateV2({ version: 2, accounts: state.accounts })

  for (const payload of Object.values(migrated.accounts)) {
    payload.dashboards = payload.dashboards.map((dashboard) => ({
      ...dashboard,
      accent: dashboard.accent ?? 'primary',
      favorite: dashboard.favorite ?? dashboard.isDefault,
      lastViewedAt: dashboard.lastViewedAt,
    }))
  }

  return migrated
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

function persistState(accounts: Record<string, Dashboard[]>) {
  if (typeof window === 'undefined') return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      const payload: PersistedDashboardStateV3 = {
        version: 3,
        accounts: Object.fromEntries(
          Object.entries(accounts).map(([accountId, dashboards]) => [
            accountId,
            { dashboards: dashboards.map(normalizePersistedDashboard) },
          ]),
        ),
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore storage failures
    }
  }, PERSIST_DEBOUNCE_MS)
}

function mergeSeededDashboards(seedDashboards: Dashboard[], persistedDashboards: Dashboard[] | undefined): Dashboard[] {
  if (!persistedDashboards?.length) return seedDashboards

  const normalizedPersisted = persistedDashboards.map(normalizePersistedDashboard)
  const persistedById = new Map(normalizedPersisted.map((dashboard) => [dashboard.id, dashboard]))
  const merged = seedDashboards.map((dashboard) => {
    const persisted = persistedById.get(dashboard.id)
    if (!persisted) return dashboard
    return {
      ...deepClone(dashboard),
      ...deepClone(persisted),
      id: dashboard.id,
      accountId: dashboard.accountId,
      kind: 'system' as const,
    }
  })

  const customDashboards = normalizedPersisted.filter((dashboard) => dashboard.kind === 'custom')
  merged.push(...deepClone(customDashboards))

  const firstMerged = merged[0]
  if (firstMerged && !merged.some((dashboard) => dashboard.isDefault)) {
    firstMerged.isDefault = true
  }

  return merged
}

function getNextLayout(type: DashboardWidgetType, widgets: DashboardWidget[]): DashboardLayout {
  const currentMaxY = widgets.reduce((max, widget) => Math.max(max, widget.layout.y + widget.layout.h), 0)
  const preset = getDefaultPreset(type)
  return {
    x: 0,
    y: currentMaxY,
    w: preset.w,
    h: preset.h,
    minW: preset.minW,
    minH: preset.minH,
  }
}

function getAccountById(accountId: string, accounts: Account[]): Account | undefined {
  return accounts.find((account) => account.id === accountId)
}

function isDraftSupportedForAccount(
  account: Account | undefined,
  draft: DashboardWidgetDraft,
  metric: ReturnType<typeof getMetricDescriptor>,
): boolean {
  if (!account || !metric) return false
  if (metric.dataSource !== draft.dataSource) return false
  if (!metric.supportedWidgetTypes.includes(draft.type)) return false
  return isDashboardSourceAvailable(metric.dataSource, account)
}

export const useDashboardsStore = defineStore('dashboards', () => {
  const accountsStore = useAccountsStore()
  const dashboardsByAccount = ref<Record<string, Dashboard[]>>({})
  const widgetEditorDraft = ref<DashboardWidgetDraft | null>(null)

  const persistedState = ref(readPersistedState())

  function writeState() {
    persistState(dashboardsByAccount.value)
  }

  function ensureAccountDashboards(accountId: string) {
    if (dashboardsByAccount.value[accountId]) return
    const account = getAccountById(accountId, accountsStore.accounts)
    if (!account) return

    const seeded = buildSeedDashboards(account)
    const persisted = persistedState.value.accounts[accountId]?.dashboards
    dashboardsByAccount.value[accountId] = mergeSeededDashboards(seeded, persisted)
    writeState()
  }

  function getDashboardsForAccount(accountId: string): Dashboard[] {
    ensureAccountDashboards(accountId)
    return dashboardsByAccount.value[accountId] ?? []
  }

  function getDashboardById(accountId: string, dashboardId: string | undefined): Dashboard | undefined {
    const dashboards = getDashboardsForAccount(accountId)
    if (!dashboardId) {
      return dashboards.find((dashboard) => dashboard.isDefault) ?? dashboards[0]
    }
    return dashboards.find((dashboard) => dashboard.id === dashboardId)
  }

  function getDefaultDashboard(accountId: string): Dashboard | undefined {
    return getDashboardById(accountId, undefined)
  }

  function createDashboard(accountId: string, name: string, options?: {
    description?: string
    icon?: string
    accent?: DashboardAccent
  }): Dashboard | undefined {
    const dashboards = getDashboardsForAccount(accountId)
    if (!dashboards.length) return undefined

    const timestamp = nowIso()
    const dashboard: Dashboard = {
      id: createDashboardId(accountId, `custom-${Math.random().toString(36).slice(2, 8)}`),
      accountId,
      kind: 'custom',
      name,
      description: options?.description ?? 'A user-managed dashboard tailored to your workflow.',
      icon: options?.icon ?? 'grid-2x2-plus',
      accent: options?.accent ?? 'primary',
      isDefault: false,
      favorite: false,
      widgets: [],
      filters: createDefaultFilters(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    dashboards.push(dashboard)
    writeState()
    return dashboard
  }

  function renameDashboard(accountId: string, dashboardId: string, name: string) {
    updateDashboard(accountId, dashboardId, { name })
  }

  function updateDashboard(
    accountId: string,
    dashboardId: string,
    patch: Partial<Pick<Dashboard, 'name' | 'description' | 'icon' | 'accent'>>,
  ) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    if (patch.name !== undefined) {
      const trimmed = patch.name.trim()
      if (!trimmed) return
      dashboard.name = trimmed.slice(0, 60)
    }
    if (patch.description !== undefined) {
      dashboard.description = patch.description.slice(0, 240)
    }
    if (patch.icon !== undefined) {
      dashboard.icon = patch.icon
    }
    if (patch.accent !== undefined) {
      dashboard.accent = patch.accent
    }
    dashboard.updatedAt = nowIso()
    writeState()
  }

  function duplicateDashboard(accountId: string, dashboardId: string): Dashboard | undefined {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return undefined

    const duplicate = deepClone(dashboard)
    duplicate.id = createDashboardId(accountId, `custom-${Math.random().toString(36).slice(2, 8)}`)
    duplicate.kind = 'custom'
    duplicate.name = `${dashboard.name} Copy`
    duplicate.isDefault = false
    duplicate.favorite = false
    duplicate.lastViewedAt = undefined
    duplicate.createdAt = nowIso()
    duplicate.updatedAt = duplicate.createdAt
    duplicate.widgets = duplicate.widgets.map((widget) => ({ ...widget, id: createWidgetId() }))

    getDashboardsForAccount(accountId).push(duplicate)
    writeState()
    return duplicate
  }

  function deleteDashboard(accountId: string, dashboardId: string) {
    const dashboards = getDashboardsForAccount(accountId)
    const dashboard = dashboards.find((entry) => entry.id === dashboardId)
    if (!dashboard || dashboard.kind === 'system') return

    const wasDefault = dashboard.isDefault
    dashboardsByAccount.value[accountId] = dashboards.filter((entry) => entry.id !== dashboardId)

    if (wasDefault) {
      const next = dashboardsByAccount.value[accountId][0]
      if (next) next.isDefault = true
    }

    writeState()
  }

  function setDefaultDashboard(accountId: string, dashboardId: string) {
    getDashboardsForAccount(accountId).forEach((dashboard) => {
      dashboard.isDefault = dashboard.id === dashboardId
    })
    writeState()
  }

  function toggleFavorite(accountId: string, dashboardId: string) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    dashboard.favorite = !dashboard.favorite
    dashboard.updatedAt = nowIso()
    writeState()
  }

  function markVisited(accountId: string, dashboardId: string) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    dashboard.lastViewedAt = nowIso()
    writeState()
  }

  function bulkDelete(accountId: string, ids: string[]) {
    const idSet = new Set(ids)
    const dashboards = getDashboardsForAccount(accountId)
    let defaultRemoved = false

    const remaining = dashboards.filter((dashboard) => {
      if (!idSet.has(dashboard.id)) return true
      if (dashboard.kind === 'system') return true
      if (dashboard.isDefault) defaultRemoved = true
      return false
    })

    dashboardsByAccount.value[accountId] = remaining

    const firstRemaining = remaining[0]
    if (defaultRemoved && firstRemaining) {
      firstRemaining.isDefault = true
    }

    writeState()
  }

  function bulkDuplicate(accountId: string, ids: string[]): Dashboard[] {
    const created: Dashboard[] = []
    ids.forEach((id) => {
      const duplicate = duplicateDashboard(accountId, id)
      if (duplicate) created.push(duplicate)
    })
    return created
  }

  function resetSystemDashboard(accountId: string, dashboardId: string) {
    const account = getAccountById(accountId, accountsStore.accounts)
    if (!account) return

    const seededDashboard = buildSeedDashboards(account).find((dashboard) => dashboard.id === dashboardId)
    const dashboards = getDashboardsForAccount(accountId)
    const index = dashboards.findIndex((dashboard) => dashboard.id === dashboardId)
    if (!seededDashboard || index === -1) return

    const existing = dashboards[index]
    if (!existing) return
    dashboards[index] = {
      ...seededDashboard,
      isDefault: existing.isDefault,
      favorite: existing.favorite,
    }
    writeState()
  }

  function updateDashboardFilters(
    accountId: string,
    dashboardId: string,
    filters: Dashboard['filters'],
  ) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    dashboard.filters = normalizeDashboardFilters(filters)
    dashboard.updatedAt = nowIso()
    writeState()
  }

  function addWidget(accountId: string, draft: DashboardWidgetDraft): DashboardWidget | undefined {
    const dashboard = getDashboardById(accountId, draft.dashboardId)
    if (!dashboard || dashboard.widgets.length >= MAX_WIDGETS_PER_DASHBOARD) return undefined

    const account = getAccountById(accountId, accountsStore.accounts)
    const metric = getMetricDescriptor(draft.metricId)
    if (!metric || !isDraftSupportedForAccount(account, draft, metric)) return undefined

    const widget: DashboardWidget = {
      id: createWidgetId(),
      type: draft.type,
      title: draft.title,
      subtitle: draft.subtitle,
      dataSource: draft.dataSource,
      metricId: draft.metricId,
      dimension: draft.dimension,
      chartVariant: draft.chartVariant,
      layout: {
        ...getNextLayout(draft.type, dashboard.widgets),
        ...draft.layout,
      },
      filters: draft.filters,
      drilldown: draft.drilldown ?? metric.drilldown,
      aiProvenance: draft.aiProvenance,
      lastRefreshedAt: nowIso(),
    }

    dashboard.widgets.push(widget)
    dashboard.updatedAt = nowIso()
    writeState()
    return widget
  }

  function refreshWidget(accountId: string, dashboardId: string, widgetId: string) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    const widget = dashboard.widgets.find((entry) => entry.id === widgetId)
    if (!widget) return
    widget.lastRefreshedAt = nowIso()
    dashboard.updatedAt = nowIso()
    writeState()
  }

  function updateWidget(accountId: string, draft: DashboardWidgetDraft) {
    if (!draft.widgetId) return
    const dashboard = getDashboardById(accountId, draft.dashboardId)
    const account = getAccountById(accountId, accountsStore.accounts)
    const metric = getMetricDescriptor(draft.metricId)
    if (!dashboard || !metric || !isDraftSupportedForAccount(account, draft, metric)) return
    const widget = dashboard.widgets.find((entry) => entry.id === draft.widgetId)
    if (!widget) return

    widget.type = draft.type
    widget.title = draft.title
    widget.subtitle = draft.subtitle
    widget.dataSource = draft.dataSource
    widget.metricId = draft.metricId
    widget.dimension = draft.dimension
    widget.chartVariant = draft.chartVariant
    widget.filters = draft.filters
    widget.drilldown = draft.drilldown ?? metric.drilldown
    widget.aiProvenance = draft.aiProvenance
    widget.layout = {
      ...widget.layout,
      ...draft.layout,
    }
    dashboard.updatedAt = nowIso()
    writeState()
  }

  function removeWidget(accountId: string, dashboardId: string, widgetId: string) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    dashboard.widgets = dashboard.widgets.filter((widget) => widget.id !== widgetId)
    dashboard.updatedAt = nowIso()
    writeState()
  }

  function resizeWidget(
    accountId: string,
    dashboardId: string,
    widgetId: string,
    size: WidgetSize,
  ) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    const widget = dashboard.widgets.find((entry) => entry.id === widgetId)
    if (!widget) return
    const preset = getPreset(widget.type, size)
    widget.layout = {
      ...widget.layout,
      w: preset.w,
      h: preset.h,
      minW: preset.minW,
      minH: preset.minH,
    }
    dashboard.updatedAt = nowIso()
    writeState()
  }

  function updateLayout(
    accountId: string,
    dashboardId: string,
    layout: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  ) {
    const dashboard = getDashboardById(accountId, dashboardId)
    if (!dashboard) return
    const layoutById = new Map(layout.map((entry) => [entry.i, entry]))

    dashboard.widgets = dashboard.widgets.map((widget) => {
      const nextLayout = layoutById.get(widget.id)
      if (!nextLayout) return widget
      return {
        ...widget,
        layout: {
          ...widget.layout,
          x: nextLayout.x,
          y: nextLayout.y,
          w: nextLayout.w,
          h: nextLayout.h,
        },
      }
    })

    dashboard.updatedAt = nowIso()
    writeState()
  }

  function openWidgetEditor(draft: DashboardWidgetDraft) {
    widgetEditorDraft.value = deepClone(draft)
  }

  function closeWidgetEditor() {
    widgetEditorDraft.value = null
  }

  function openWidgetEditorForWidget(accountId: string, dashboardId: string, widgetId: string) {
    const dashboard = getDashboardById(accountId, dashboardId)
    const widget = dashboard?.widgets.find((entry) => entry.id === widgetId)
    if (!dashboard || !widget) return

    openWidgetEditor({
      dashboardId,
      widgetId: widget.id,
      type: widget.type,
      title: widget.title,
      subtitle: widget.subtitle,
      dataSource: widget.dataSource,
      metricId: widget.metricId,
      dimension: widget.dimension,
      chartVariant: widget.chartVariant,
      filters: widget.filters,
      drilldown: widget.drilldown,
      layout: widget.layout,
      aiProvenance: widget.aiProvenance,
    })
  }

  function buildAiWidgetDraft(accountId: string, dashboardId: string, prompt: string): DashboardWidgetDraft | null {
    const account = getAccountById(accountId, accountsStore.accounts)
    if (!account) return null

    const availableMetrics = getAvailableMetrics(account)
    const normalizedPrompt = prompt.toLowerCase()

    const scored = availableMetrics
      .map((metric) => ({
        metric,
        score: metric.aiKeywords.reduce(
          (total, keyword) => total + (normalizedPrompt.includes(keyword.toLowerCase()) ? keyword.length : 0),
          0,
        ),
      }))
      .filter((entry) => entry.score > 0 && isDashboardSourceAvailable(entry.metric.dataSource, account))
      .sort((left, right) => right.score - left.score)

    const bestMatch = scored[0]?.metric
    if (!bestMatch) return null

    let type: DashboardWidgetType = bestMatch.defaultWidgetType
    if (bestMatch.supportedWidgetTypes.includes('table') && /(table|list|recent|top)/.test(normalizedPrompt)) {
      type = 'table'
    } else if (bestMatch.supportedWidgetTypes.includes('bar') && /(by|channel|segment|status)/.test(normalizedPrompt)) {
      type = 'bar'
    } else if (bestMatch.supportedWidgetTypes.includes('timeseries') && /(trend|over time|last|history)/.test(normalizedPrompt)) {
      type = 'timeseries'
    } else if (bestMatch.supportedWidgetTypes.includes('kpi') && /(kpi|summary|headline)/.test(normalizedPrompt)) {
      type = 'kpi'
    }

    return {
      dashboardId,
      type,
      title: bestMatch.defaultTitle,
      dataSource: bestMatch.dataSource,
      metricId: bestMatch.id,
      drilldown: bestMatch.drilldown,
      aiProvenance: {
        prompt,
        summary: `Da Vinci mapped your prompt to ${bestMatch.label} as a ${type} widget.`,
      },
      lastRefreshedAt: nowIso(),
    }
  }

  const dashboards = computed(() => dashboardsByAccount.value)

  return {
    dashboards,
    widgetEditorDraft,
    ensureAccountDashboards,
    getDashboardsForAccount,
    getDashboardById,
    getDefaultDashboard,
    createDashboard,
    renameDashboard,
    updateDashboard,
    duplicateDashboard,
    deleteDashboard,
    setDefaultDashboard,
    toggleFavorite,
    markVisited,
    bulkDelete,
    bulkDuplicate,
    resetSystemDashboard,
    updateDashboardFilters,
    addWidget,
    updateWidget,
    removeWidget,
    refreshWidget,
    resizeWidget,
    updateLayout,
    openWidgetEditor,
    closeWidgetEditor,
    openWidgetEditorForWidget,
    buildAiWidgetDraft,
  }
})
