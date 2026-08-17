// Fixtures + chart math for the "Dashboard Overview v2 – dotted" widget set,
// ported verbatim from the Claude Design export
// (`Dashboard Overview v2 - dotted.dc.html`). Read-only demo data — the
// production dashboard stays on useWidgetData.

// Values shared with the canonical dotted family are imported rather than
// re-typed — they were byte-identical copies and drifted apart once already
// (see SCN_DOTTED_BLUES below, which is genuinely a different ramp).
import { BAR_GRADIENT, BAR_GRADIENT_GREEN, niceMax, valueToY } from '@/components/dashboards/dotted/dottedChartMath'

export { BAR_GRADIENT, BAR_GRADIENT_GREEN, valueToY }

export type DottedRange = '7d' | '30d' | '90d'
export type DottedMetric = 'revenue' | 'orders' | 'aov' | 'conv'

export interface DottedSeries {
  cur: number[]
  prev: number[]
  orders: number
  ordersPrev: number
  conv: number
  convPrev: number
  /** The 5 evenly spaced axis ticks. */
  x: string[]
  /** One label per data point, for the hover tooltip. */
  pointLabels: string[]
  vs: string
  vsLong: string
}

/**
 * One "Jul 3"-style label per data point, counting back from the fixture's
 * fixed end date (1 Aug 2026) — `spanDays / count` days apart.
 */
function pointLabelsFor(count: number, spanDays: number): string[] {
  const step = spanDays / count
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(2026, 7, 1)
    date.setDate(date.getDate() - Math.round((count - 1 - index) * step))
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
}

export const SERIES: Record<DottedRange, DottedSeries> = {
  '7d': {
    cur: [640, 980, 720, 830, 1100, 760, 890],
    prev: [520, 600, 700, 640, 720, 690, 640],
    orders: 15, ordersPrev: 13, conv: 2.9, convPrev: 2.5,
    x: ['Jul 26', 'Jul 28', 'Jul 29', 'Jul 31', 'Aug 1'],
    pointLabels: pointLabelsFor(7, 7),
    vs: 'vs prev 7 days', vsLong: 'compared with the previous 7 days',
  },
  '30d': {
    cur: [420, 510, 380, 640, 720, 560, 480, 900, 760, 540, 610, 830, 470, 520, 690, 1150, 880, 620, 540, 700, 460, 590, 810, 760, 520, 640, 980, 720, 830, 1100],
    prev: [390, 420, 350, 500, 560, 470, 410, 620, 580, 460, 500, 610, 400, 430, 520, 700, 640, 520, 470, 560, 410, 480, 590, 560, 450, 510, 660, 540, 600, 700],
    orders: 47, ordersPrev: 41, conv: 2.6, convPrev: 2.2,
    x: ['Jul 3', 'Jul 10', 'Jul 17', 'Jul 24', 'Aug 1'],
    pointLabels: pointLabelsFor(30, 30),
    vs: 'vs prev 30 days', vsLong: 'compared with the previous 30 days',
  },
  '90d': {
    cur: [1620, 1880, 1740, 2100, 2260, 1980, 1820, 2420, 2180, 1960, 2040, 2380, 1780, 1900, 2160, 2640, 2380, 2040, 1920, 2200, 1840, 2020, 2320, 2260, 1960, 2100, 2480, 2220, 2360, 2600],
    prev: [1500, 1620, 1480, 1780, 1900, 1720, 1600, 2000, 1880, 1700, 1760, 1980, 1560, 1640, 1820, 2140, 2000, 1780, 1700, 1880, 1620, 1740, 1920, 1880, 1700, 1800, 2020, 1900, 1960, 2080],
    orders: 158, ordersPrev: 129, conv: 2.4, convPrev: 2.3,
    x: ['May 4', 'May 25', 'Jun 15', 'Jul 6', 'Aug 1'],
    pointLabels: pointLabelsFor(30, 90),
    vs: 'vs prev 90 days', vsLong: 'compared with the previous 90 days',
  },
}

export interface KpiCell {
  key: DottedMetric
  label: string
  value: string
  delta: string
  deltaColor: string
}

export const CHART_W = 720
export const CHART_H = 200

export function sum(a: number[]): number { return a.reduce((x, y) => x + y, 0) }
export function money(n: number): string { return '$' + Math.round(n).toLocaleString('en-US') }
export function pct(cur: number, prev: number): string {
  const d = ((cur - prev) / prev) * 100
  return (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + '%'
}
function short(n: number): string {
  return n >= 1000 ? '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k' : '$' + Math.round(n)
}
function scaleTo(arr: number[], total: number): number[] {
  const f = total / sum(arr)
  return arr.map((v) => v * f)
}
function wobble(arr: number[], mid: number, spread: number): number[] {
  const mx = Math.max(...arr)
  const mn = Math.min(...arr)
  const d = mx - mn || 1
  return arr.map((v) => mid * (1 - spread / 2 + spread * ((v - mn) / d)))
}

interface MetricDef {
  label: string
  sub: string
  zero: boolean
  snap?: number
  fmt: (v: number) => string
  cur: (s: DottedSeries) => number[]
  prev: (s: DottedSeries) => number[]
}

export const METRICS: Record<DottedMetric, MetricDef> = {
  revenue: {
    label: 'Revenue', sub: 'Daily net revenue', zero: true,
    fmt: short, cur: (s) => s.cur, prev: (s) => s.prev,
  },
  orders: {
    label: 'Orders', sub: 'Orders placed per day', zero: true, snap: 2,
    fmt: (v) => String(Math.round(v)),
    cur: (s) => scaleTo(s.cur, s.orders), prev: (s) => scaleTo(s.prev, s.ordersPrev),
  },
  aov: {
    label: 'Average order value', sub: 'Average order value per day', zero: false,
    fmt: (v) => '$' + Math.round(v),
    cur: (s) => wobble(s.cur, sum(s.cur) / s.orders, 0.34),
    prev: (s) => wobble(s.prev, sum(s.prev) / s.ordersPrev, 0.34),
  },
  conv: {
    label: 'Conversion rate', sub: 'Visit-to-order conversion', zero: false,
    fmt: (v) => v.toFixed(1) + '%',
    cur: (s) => wobble(s.cur, s.conv, 0.5), prev: (s) => wobble(s.prev, s.convPrev, 0.5),
  },
}

export function bounds(vals: number[], zeroBased: boolean): [number, number] {
  const mx = Math.max(...vals)
  const mn = Math.min(...vals)
  // 10% headroom above the max so the cardinal curve's rounded peaks never
  // reach the plot top (they'd be sheared flat by the clipPath).
  if (zeroBased) return [0, niceMax(mx * 1.1)]
  const pad = (mx - mn) * 0.45 || mx * 0.1
  return [Math.max(0, mn - pad), mx + pad * 0.4]
}

/** Y position on the 200-tall canvas for a value within [min, max]. */

/**
 * Flowing cardinal (Catmull-Rom) path on the 720×200 design canvas — the rounded
 * curve shadcn's `type="natural"` produces. Any small overshoot is clipped to
 * the plot box by the chart's clipPath.
 */
export function linePath(vals: number[], max: number, min = 0): string {
  const n = vals.length
  if (n < 2 || max === min) return ''
  const stepX = CHART_W / (n - 1)
  const y = (i: number) => valueToY(vals[Math.min(n - 1, Math.max(0, i))] ?? 0, max, min)

  let d = `M 0.0 ${y(0).toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const x1 = (i + 1) * stepX
    const c1y = y(i) + (y(i + 1) - y(i - 1)) / 6
    const c2y = y(i + 1) - (y(i + 2) - y(i)) / 6
    d += ` C ${(i * stepX + stepX / 3).toFixed(1)} ${c1y.toFixed(1)}, ${(x1 - stepX / 3).toFixed(1)} ${c2y.toFixed(1)}, ${x1.toFixed(1)} ${y(i + 1).toFixed(1)}`
  }
  return d
}

// ---------------------------------------------------------------------------
// Palette — the mockup is light-only; chart hexes stay literal by design.
// ---------------------------------------------------------------------------

export const SCN_DOTTED_BLUES = ['#0092D4', '#26A6E0', '#4FBCEA', '#7ACFF1', '#A6E0F7', '#CDEDFB'] as const

// ---------------------------------------------------------------------------
// Static widget fixtures (copied from the mockup markup)
// ---------------------------------------------------------------------------

export interface AttentionItem {
  icon: string
  tone: 'error' | 'warning' | 'accent'
  title: string
  context: string
  ago: string
  actionLabel: string
}

export const ATTENTION_ITEMS: AttentionItem[] = [
  { icon: 'credit-card', tone: 'error', title: '3 payments failed in the last 24h', context: 'Retry or contact the customers before the orders auto-cancel', ago: '2h ago', actionLabel: 'Review' },
  { icon: 'package', tone: 'warning', title: 'Low stock on 2 of your top 10 sellers', context: 'Trail Runner XT and Canvas Tote are below their reorder point', ago: '5h ago', actionLabel: 'View products' },
  { icon: 'mail', tone: 'accent', title: 'Campaign ‘Spring Refresh’ is waiting on approval', context: 'Scheduled to send tomorrow at 9:00 AM once approved', ago: '1d ago', actionLabel: 'Approve' },
  { icon: 'shield-alert', tone: 'warning', title: 'Sending domain DNS not verified', context: 'Unverified DKIM records hurt deliverability on every send', ago: '3d ago', actionLabel: 'Fix' },
]

export const ATTENTION_SUMMARY = '2 payments failing · low stock · 1 approval · DNS unverified'

export interface LegendRow { label: string; value: string; color: string }
export interface DonutSegment { color: string; dash: string; offset: number }

// "Where revenue comes from" — r=54 ring segments (circumference ≈ 339.3).
export const CHANNEL_SEGMENTS: DonutSegment[] = [
  { color: '#0092D4', dash: '103.2 236.1', offset: 0 },
  { color: '#26A6E0', dash: '72.3 267', offset: -105.2 },
  { color: '#4FBCEA', dash: '55.7 283.6', offset: -179.5 },
  { color: '#7ACFF1', dash: '38.7 300.6', offset: -237.2 },
  { color: '#A6E0F7', dash: '31.9 307.4', offset: -277.9 },
  { color: '#CDEDFB', dash: '25.5 313.8', offset: -311.8 },
]

export const CHANNEL_LEGEND: LegendRow[] = [
  { label: 'Direct', value: '$6,300 · 31%', color: '#0092D4' },
  { label: 'Email', value: '$4,450 · 21.9%', color: '#26A6E0' },
  { label: 'Paid search', value: '$3,450 · 17%', color: '#4FBCEA' },
  { label: 'Social', value: '$2,440 · 12%', color: '#7ACFF1' },
  { label: 'Organic', value: '$2,040 · 10%', color: '#A6E0F7' },
  { label: 'Referral', value: '$1,650 · 8.1%', color: '#CDEDFB' },
]

export interface FunnelStage { label: string; value: string; share: string; accent?: boolean }

export const FUNNEL_STAGES: FunnelStage[] = [
  { label: 'Emails sent', value: '9,840', share: '100%' },
  { label: 'Opened', value: '5,370', share: '54.6%' },
  { label: 'Clicked through', value: '1,150', share: '11.7%' },
  { label: 'Store sessions', value: '870', share: '8.8%' },
  { label: 'Added to cart', value: '248', share: '2.5%' },
  { label: 'Orders placed', value: '10', share: '0.10%', accent: true },
]

export const FUNNEL_PATH =
  'M0 10 C100 10 100 37 200 37 C300 37 300 80.5 400 80.5 C500 80.5 500 86 600 86 ' +
  'C700 86 700 104.5 800 104.5 C900 104.5 900 123.4 1000 123.4 L1200 123.4 L1200 136.6 ' +
  'L1000 136.6 C900 136.6 900 155.5 800 155.5 C700 155.5 700 174 600 174 C500 174 500 179.5 400 179.5 ' +
  'C300 179.5 300 223 200 223 C100 223 100 250 0 250 Z'

export const FUNNEL_GRADIENT_STOPS = [
  { offset: '0%', color: '#5B5BF0' },
  { offset: '28%', color: '#2E9FD4' },
  { offset: '52%', color: '#1FBF9C' },
  { offset: '76%', color: '#2BC1C8' },
  { offset: '100%', color: '#4EC3F0' },
]

export const FUNNEL_FOOTER = [
  { label: 'Attributed revenue', value: '$4,450' },
  { label: 'Share of store revenue', value: '21.9%' },
  { label: 'Cart to order', value: '4.0%' },
]

// "Orders by sales channel" — pie wedge paths from the mockup (viewBox 120).
export const SALES_PIE_WEDGES = [
  { d: 'M60 60 L60 4 A56 56 0 1 1 49.51 115.01 Z', color: '#0092D4' },
  { d: 'M60 60 L49.51 115.01 A56 56 0 0 1 5.76 46.07 Z', color: '#4FBCEA' },
  { d: 'M60 60 L5.76 46.07 A56 56 0 0 1 39.39 7.93 Z', color: '#8FD6F3' },
  { d: 'M60 60 L39.39 7.93 A56 56 0 0 1 60 4 Z', color: '#CDEDFB' },
]

export const SALES_CHANNEL_LEGEND: LegendRow[] = [
  { label: 'Online store', value: '25', color: '#0092D4' },
  { label: 'POS retail', value: '12', color: '#4FBCEA' },
  { label: 'Marketplace', value: '7', color: '#8FD6F3' },
  { label: 'Social shop', value: '3', color: '#CDEDFB' },
]

// "New vs returning" — r=54 ring segments.
export const NVR_SEGMENTS: DonutSegment[] = [
  { color: '#0092D4', dash: '208.9 130.4', offset: 0 },
  { color: '#A6E0F7', dash: '126.4 212.9', offset: -212.9 },
]

export const NVR_LEGEND: LegendRow[] = [
  { label: 'Returning customers', value: '29 orders', color: '#0092D4' },
  { label: 'First-time buyers', value: '18 orders', color: '#A6E0F7' },
]

export interface OrderRow { order: string; customer: string; status: string; total: string }

export const RECENT_ORDERS: OrderRow[] = [
  { order: '#10000', customer: 'James Anderson', status: 'Processing', total: '$739.93' },
  { order: 'POS-12048', customer: 'Hannah Cole', status: 'Completed', total: '$124.30' },
  { order: 'POS-12047', customer: 'Walk-in customer', status: 'Completed', total: '$38.50' },
  { order: 'POS-12042', customer: 'Aria Singh', status: 'Pending', total: '$227.70' },
  { order: 'POS-12037', customer: 'Olivia Walker', status: 'Completed', total: '$81.40' },
]

export interface ActivityRow { icon: string; cloud: 'marketing' | 'commerce' | 'contacts'; title: string; meta: string; ago: string }

export const LIVE_ACTIVITY: ActivityRow[] = [
  { icon: 'send', cloud: 'marketing', title: 'Spring Refresh — Segment A sent', meta: '2,400 recipients', ago: '2m ago' },
  { icon: 'shopping-bag', cloud: 'commerce', title: 'Order #A-29481 placed by Maya Lin', meta: '$248.00 · paid', ago: '6m ago' },
  { icon: 'users', cloud: 'contacts', title: 'Segment ‘VIP repeat buyers’ updated', meta: '+312 contacts', ago: '14m ago' },
  { icon: 'zap', cloud: 'marketing', title: 'Automation ‘Cart abandoned — Step 2’ triggered', meta: '84 contacts in flow', ago: '22m ago' },
  { icon: 'shopping-bag', cloud: 'commerce', title: 'Order #A-29479 placed by Theo Park', meta: '$96.40 · paid', ago: '31m ago' },
]

export interface CampaignRow { name: string; revenue: string; pct: number; meta: string }

export const TOP_CAMPAIGNS: CampaignRow[] = [
  { name: 'Flash sale — 4 hours only, 40% off sitewide', revenue: '$2,150', pct: 100, meta: '69.6% open rate · 2,480 sent' },
  { name: 'Winter clearance — final markdowns', revenue: '$1,180', pct: 55, meta: '47.4% open rate · 2,900 sent' },
  { name: 'New arrivals — trail season picks', revenue: '$680', pct: 32, meta: '37.4% open rate · 2,240 sent' },
  { name: 'Restock alert — Trail Runner XT', revenue: '$440', pct: 20, meta: '41.8% open rate · 2,220 sent' },
]

export interface InsightRow { title: string; meta: string; actionLabel: string; highlighted?: boolean }

export const DV_INSIGHTS: InsightRow[] = [
  { title: 'Cart abandonment is up 14% on mobile since Tuesday', meta: '312 carts · $8.4k estimated value', actionLabel: 'Investigate', highlighted: true },
  { title: 'Question-style subject lines opened 9% more this month', meta: '6 of your last 20 sends · avg 31.2% open rate', actionLabel: 'View campaigns' },
  { title: 'VIP repeat buyers grew twice as fast as your overall list', meta: '+312 contacts in 30 days', actionLabel: 'View segment' },
]

export const FULFILLMENT_QUEUE = [
  { status: 'Unapproved', count: 6 },
  { status: 'Not ready', count: 12 },
  { status: 'Ready for fulfillment', count: 9 },
  { status: 'Shipped', count: 41 },
  { status: 'Return requested', count: 3 },
]

export const SERVICE_TICKETS = {
  open: 18,
  rows: [
    { label: 'Awaiting your reply', value: 7, alert: false },
    { label: 'Breaching SLA', value: 2, alert: true },
    { label: 'Resolved today', value: 24, alert: false },
  ],
}

export const DELIVERABILITY = {
  delivered: 98.2,
  rows: [
    { label: 'Bounce rate', value: '1.2%' },
    { label: 'Spam complaints', value: '0.04%' },
    { label: 'Unsubscribes', value: '0.31%' },
  ],
  warning: 'DKIM not verified on 1 sending domain',
}

export interface BarListRow { label: string; value: string; pct: number; meta?: string }

export const BEST_SELLERS: BarListRow[] = [
  { label: 'Trail Runner XT', value: '$6,480', pct: 100, meta: '54 units · 4 left in stock' },
  { label: 'Alpine Shell Jacket', value: '$4,180', pct: 65, meta: '19 units · 96 in stock' },
  { label: 'Canvas Tote', value: '$2,240', pct: 35, meta: '56 units · 7 left in stock' },
  { label: 'Merino crew socks, 3-pack', value: '$1,104', pct: 17, meta: '46 units · 210 in stock' },
]

export const RETAIL_LOCATIONS: BarListRow[] = [
  { label: 'Melbourne CBD', value: '$236', pct: 38 },
  { label: 'Chadstone', value: '$180', pct: 29 },
  { label: 'Click & collect', value: '$120', pct: 19 },
  { label: 'Brisbane', value: '$84', pct: 14 },
]

export interface JourneyRow { name: string; meta: string; count: string; tone: 'success' | 'warning' }

export const JOURNEYS: JourneyRow[] = [
  { name: 'Welcome series', meta: '5 steps · 22.4% conversion', count: '2,140', tone: 'success' },
  { name: 'Win-back — 90 days', meta: '3 steps · 6.1% conversion', count: '612', tone: 'success' },
  { name: 'Post-purchase review', meta: '2 steps · 11.8% conversion', count: '318', tone: 'success' },
  { name: 'Cart abandoned', meta: 'Paused at step 2 · needs review', count: '84', tone: 'warning' },
]
