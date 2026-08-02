/**
 * PROTOTYPE FIXTURE DATA — Chart Lab only (never imported outside src/views/ChartLab/).
 *
 * Deterministic throughout (no Math.random / new Date). Values reuse the real
 * store magnitudes where those are deterministic (open rate 54.6%, contacts 60,
 * top campaigns, product names, channel names); everything else is synthesized
 * to read as the same account and is labeled as prototype data on the page.
 */

// ---- Palette -----------------------------------------------------------------

/** Category colours — stable across every widget. Blue-led + teal/sky + two warm accents. */
export const C = {
  navy: '#0A4FA8',
  teal: '#0E9E90',
  sky: '#0092D4',
  amber: '#E8A13B',
  indigo: '#4A63E4',
  coral: '#D96248',
  /** Periwinkle family for the "purple bars" reference widgets. */
  periwinkle: '#7C7CF0',
  periwinkleDeep: '#5B5BD6',
} as const

export interface Channel {
  key: string
  name: string
  color: string
  /** Ink that passes contrast on top of the colour. */
  labelInk: 'light' | 'dark'
}

export const CHANNELS: Channel[] = [
  { key: 'direct', name: 'Direct', color: C.navy, labelInk: 'light' },
  { key: 'email', name: 'Email', color: C.teal, labelInk: 'light' },
  { key: 'paid_search', name: 'Paid Search', color: C.sky, labelInk: 'light' },
  { key: 'social', name: 'Social', color: C.amber, labelInk: 'dark' },
  { key: 'organic', name: 'Organic', color: C.indigo, labelInk: 'light' },
  { key: 'referral', name: 'Referral', color: C.coral, labelInk: 'light' },
]

// ---- 1 · KPI strip -------------------------------------------------------------

export interface KpiFixture {
  key: string
  label: string
  icon: string
  value: string
  deltaPct: number
  deltaLabel: string
  caption: string
}

// Values mirror the live dashboard KPIs for account 2000290.
export const KPIS: KpiFixture[] = [
  { key: 'revenue', label: 'Revenue (30d)', icon: 'dollar-sign', value: '$17,718', deltaPct: 733.3, deltaLabel: '+733.3%', caption: 'vs prev 30d' },
  { key: 'orders', label: 'Orders (30d)', icon: 'shopping-cart', value: '47', deltaPct: 840, deltaLabel: '+840%', caption: 'vs prev 30d' },
  { key: 'open_rate', label: 'Avg. Open Rate', icon: 'mail-open', value: '54.6%', deltaPct: 3.4, deltaLabel: '+3.4 pp', caption: 'vs prev 30d' },
  { key: 'contacts', label: 'Active Contacts', icon: 'contact-round', value: '60', deltaPct: 6.4, deltaLabel: '+6.4%', caption: 'all time' },
]

// ---- 2 · Engagement hero line ---------------------------------------------------

export interface EngagementSeries {
  key: string
  name: string
  color: string
}

export const ENGAGEMENT_SERIES: EngagementSeries[] = [
  { key: 'opens', name: 'Opens', color: C.indigo },
  { key: 'clicks', name: 'Clicks', color: C.teal },
  { key: 'conversions', name: 'Conversions', color: C.amber },
]

export interface EngagementRange {
  key: 'weekly' | 'monthly'
  label: string
  categories: string[]
  opens: number[]
  clicks: number[]
  conversions: number[]
}

export const ENGAGEMENT_RANGES: EngagementRange[] = [
  {
    key: 'weekly',
    label: 'Weekly',
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    opens: [860, 1240, 1120, 1685, 1930, 1495, 2210],
    clicks: [340, 505, 452, 688, 803, 611, 942],
    conversions: [96, 148, 121, 205, 246, 172, 291],
  },
  {
    key: 'monthly',
    label: 'Monthly',
    categories: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
    opens: [5200, 6100, 5750, 6800, 7350, 6520, 7900, 8420, 7710, 8930, 9480, 10540],
    clicks: [1980, 2420, 2210, 2760, 3050, 2640, 3310, 3560, 3190, 3820, 4110, 4620],
    conversions: [540, 690, 610, 805, 900, 745, 985, 1080, 930, 1170, 1290, 1465],
  },
]

// ---- 3 · Snapshot + Da Vinci suggestion -----------------------------------------

export const SNAPSHOT = [
  { label: 'Weekly Revenue', value: '$6,870', deltaPct: 4.3, deltaLabel: '+4.3%' },
  { label: 'Weekly Orders', value: '24', deltaPct: 2.8, deltaLabel: '+2.8%' },
]

export const SMART_SUGGESTION = {
  quote: '“Flash Sale — 4 Hours Only has 18% higher ROI. Reallocate budget to boost performance and growth.”',
  caption: 'Da Vinci insight based on the last 14 days.',
}

// ---- 4 · Revenue by channel — stacked pill columns ------------------------------

export interface StackMonth {
  label: string
  /** Channel key → revenue $. Order follows CHANNELS. */
  values: number[]
  total: number
}

// Three months summing to the $17,718 revenue KPI.
const STACK_RAW: Array<{ label: string; values: number[] }> = [
  { label: 'May', values: [1829, 1416, 1003, 708, 590, 354] },
  { label: 'Jun', values: [1311, 1015, 719, 508, 423, 254] },
  { label: 'Jul', values: [2352, 1821, 1290, 911, 759, 455] },
]

export const STACK_MONTHS: StackMonth[] = STACK_RAW.map((m) => ({
  ...m,
  total: m.values.reduce((a, b) => a + b, 0),
}))

// ---- 5 · Traffic mix donut -------------------------------------------------------

export const SESSIONS_TOTAL = 12480

export interface MixRow {
  key: string
  name: string
  color: string
  pct: number
  sessions: number
}

const MIX_PCTS = [31, 24, 17, 12, 10, 6]

export const MIX_ROWS: MixRow[] = CHANNELS.map((c, i) => ({
  key: c.key,
  name: c.name,
  color: c.color,
  pct: MIX_PCTS[i] ?? 0,
  sessions: Math.round((SESSIONS_TOTAL * (MIX_PCTS[i] ?? 0)) / 100),
}))

// ---- 6 · Sessions by device ------------------------------------------------------

export const DEVICES = [
  { key: 'desktop', name: 'Desktop', pct: 28, sessions: 3494, deltaPct: 6.1, color: C.amber, labelInk: 'dark' as const },
  { key: 'tablet', name: 'Tablet', pct: 16, sessions: 1997, deltaPct: -2.4, color: C.sky, labelInk: 'light' as const },
  { key: 'mobile', name: 'Mobile', pct: 56, sessions: 6989, deltaPct: 9.8, color: C.periwinkle, labelInk: 'light' as const },
]

// ---- 7 · Monthly revenue vs goal -------------------------------------------------

export const GOAL_BARS = {
  months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  values: [3910, 5640, 4820, 5900, 4230, 7588],
  goal: 13000,
  headline: '$7,588',
  deltaLabel: '+12.6%',
  deltaPct: 12.6,
  caption: 'vs Jul last year',
}

// ---- 8 · Average order value — thermometer columns -------------------------------

export const AOV = {
  months: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  values: [342, 371, 389, 356, 402, 377],
  max: 480,
  activeIndex: 4, // Jun — the peak carries the value bubble
  headline: '$377',
  deltaLabel: '+4.2%',
  deltaPct: 4.2,
  caption: '47% of $800 goal met',
}

// ---- 9 · Open-rate goal gauge ----------------------------------------------------

export const GAUGE = {
  pct: 78, // 54.6 of the 70% goal
  centerCaption: 'of goal',
  line: '54.6% avg open rate · goal 70%',
}

// ---- 10 · Top products — paired horizontal bars ----------------------------------

export interface ProductRow {
  name: string
  orders: number
  revenue: number
}

// Names from the commerce store's product fixtures (shortened for display).
export const TOP_PRODUCTS: ProductRow[] = [
  { name: 'Nike Air Max 270', orders: 128, revenue: 19840 },
  { name: 'Sony WH-1000XM5', orders: 96, revenue: 15230 },
  { name: 'Dyson V15 Detect', orders: 71, revenue: 12480 },
  { name: 'Kindle Paperwhite 16GB', orders: 64, revenue: 8890 },
]

// ---- 11 · Top campaigns — progress rank list -------------------------------------

export interface CampaignRow {
  name: string
  revenue: number
  openRate: number
}

// Real deterministic top 6 by revenue from the campaigns store.
export const TOP_CAMPAIGNS: CampaignRow[] = [
  { name: 'Flash Sale — 4 Hours Only', revenue: 134521.75, openRate: 69.6 },
  { name: 'Cyber Monday Flash Sale', revenue: 98432.75, openRate: 47.4 },
  { name: 'January Sale', revenue: 56789.25, openRate: 37.4 },
  { name: 'December Holiday Gift Guide', revenue: 45234.5, openRate: 41.8 },
  { name: 'Product Launch: Nike Air Max 270', revenue: 34521, openRate: 44.2 },
  { name: "Valentine's Day Gift Ideas", revenue: 29871, openRate: 32.4 },
]

// ---- 12 · Audience quality — dot matrix ------------------------------------------

export const AUDIENCE_QUALITY = {
  score: 82,
  outOf: 100,
  groups: [
    { name: 'High intent', pct: 42, color: C.navy },
    { name: 'Engaged', pct: 28, color: C.sky },
    { name: 'Returning', pct: 17, color: C.coral },
    { name: 'New', pct: 23, color: C.teal },
  ],
}

// ---- Formatters ------------------------------------------------------------------

/** $134.5k / $8.2k / $640. */
export function formatCurrencyShort(value: number): string {
  if (value >= 100_000) return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (value >= 1_000) return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `$${Math.round(value)}`
}

/** $9,140. */
export function formatCurrencyFull(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

/** 12,480 → 12.5k. */
export function formatCountShort(value: number): string {
  if (value >= 1_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${Math.round(value)}`
}
