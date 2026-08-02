/**
 * PROTOTYPE FIXTURE DATA — Dashboard Lab Option 2 (Chart Lab only).
 *
 * Every widget on Option 2 maps to a REAL metric from the dashboard's
 * Add-widget library (src/stores/dashboards/widgetLibrary.ts) / metric catalog
 * (src/stores/dashboards/metricCatalog.ts). Values mirror the live stores where
 * those are deterministic (open rate, campaigns, contacts by domain, POS
 * locations, product names); commerce order figures are Math.random-seeded in
 * production, so they are frozen here. Deterministic — no Math.random/new Date.
 */
import { C, type KpiFixture } from './chartLabData'

// ---- Row 1 · KPI strip -----------------------------------------------------
// commerce_revenue · commerce_orders · commerce_aov · marketing_open_rate

export const CAT_KPIS: KpiFixture[] = [
  { key: 'commerce_revenue', label: 'Revenue', icon: 'dollar-sign', value: '$17,718', deltaPct: 733.3, deltaLabel: '+733.3%', caption: 'vs prev 30d' },
  { key: 'commerce_orders', label: 'Orders', icon: 'shopping-cart', value: '47', deltaPct: 840, deltaLabel: '+840%', caption: 'vs prev 30d' },
  { key: 'commerce_aov', label: 'Average Order Value', icon: 'receipt', value: '$377', deltaPct: 4.2, deltaLabel: '+4.2%', caption: 'vs prev 30d' },
  { key: 'marketing_open_rate', label: 'Open Rate', icon: 'mail-open', value: '54.6%', deltaPct: 3.4, deltaLabel: '+3.4 pp', caption: 'vs prev 30d' },
]

// ---- Row 2 · commerce_revenue_over_time -------------------------------------

export const REVENUE_OVER_TIME = {
  labels: Array.from({ length: 30 }, (_, i) => `07-${String(i + 1).padStart(2, '0')}`),
  values: Array.from({ length: 30 }, (_, i) => Math.round(470 + 265 * Math.sin(i * 0.55) + i * 8)),
}

// ---- Row 2 · service_open_tickets + service_resolution_rate ------------------

export const SERVICE_SNAPSHOT = {
  title: 'Service Snapshot',
  stats: [
    // More open tickets is bad → negative tone despite the upward arrow.
    { label: 'Open Tickets', value: '12', deltaLabel: '+2 this week', tone: 'neg' as const, up: true },
    { label: 'Resolution Rate', value: '87.5%', deltaLabel: '+1.8 pp', tone: 'pos' as const, up: true },
  ],
  quote: '“Shipping tickets doubled after the Flash Sale — a delivery-delay macro could resolve 6 of the 9 instantly.”',
  caption: 'Da Vinci insight based on the last 14 days.',
}

// ---- Row 3 · commerce_revenue_by_channel ------------------------------------
// Real channel taxonomy from the catalog; values sum to the Revenue KPI.

export const CHANNEL_BARS = [
  { key: 'online', name: 'Online Store', value: 8940, color: C.navy },
  { key: 'marketplace', name: 'Marketplace', value: 3712, color: C.sky },
  { key: 'instagram', name: 'Instagram Shop', value: 2858, color: C.indigo },
  { key: 'pos', name: 'POS', value: 2208, color: C.teal },
]

// ---- Row 3 · marketing_email_volume ------------------------------------------
// Real shape: last sent campaigns, Sent + Delivered (≈ sent × 0.97).

export const EMAIL_VOLUME = [
  { key: 'v1', name: 'Feb 10 · Product Launch', sent: 1234, delivered: 1197 },
  { key: 'v2', name: 'Feb 14 · Valentine’s Day', sent: 4201, delivered: 4075 },
  { key: 'v3', name: 'Feb 20 · Winter Clearance', sent: 32891, delivered: 31904 },
  { key: 'v4', name: 'Feb 25 · VIP Early Access', sent: 312, delivered: 303 },
  { key: 'v5', name: 'Feb 28 · New Arrivals', sent: 44891, delivered: 43544 },
]

// ---- Row 3 · contacts_by_domain ----------------------------------------------
// Real deterministic split from the contacts store.

export const DOMAIN_ROWS = [
  { key: 'example', name: 'example.com', value: 20, color: C.navy },
  { key: 'gmail', name: 'gmail.com', value: 10, color: C.teal },
  { key: 'outlook', name: 'outlook.com', value: 10, color: C.sky },
  { key: 'company', name: 'company.io', value: 10, color: C.indigo },
  { key: 'mail', name: 'mail.com', value: 10, color: C.amber },
]

// ---- Row 4 · marketing_open_rate_over_time ------------------------------------
// Open rate per last 7 sent campaigns (short labels for the chips).

export const OPEN_RATE_TREND = {
  labels: ['Jan', 'Val', 'Spring', 'Nike', 'Flash', 'Cyber', 'Guide'],
  values: [37.4, 32.4, 41.2, 44.2, 69.6, 47.4, 41.8],
  max: 80,
  activeIndex: 4, // Flash Sale — the peak
  headline: { value: '44.9%', deltaLabel: '+2.1 pp', deltaPositive: true, caption: 'avg across the last 7 sends' },
}

// ---- Row 4 · service_tickets_by_type -------------------------------------------

export const TICKETS_BY_TYPE = [
  { key: 'shipping', name: 'Shipping', count: 9, color: C.sky },
  { key: 'billing', name: 'Billing', count: 6, color: C.indigo },
  { key: 'product', name: 'Product', count: 5, color: C.amber },
  { key: 'returns', name: 'Returns', count: 4, color: C.coral },
]

// ---- Row 4 · marketing_deliverability_score ------------------------------------

export const DELIVERABILITY = {
  pct: 100,
  center: '10 / 10',
  centerCaption: 'score',
  line: '97% of sends delivered · rolling 30 days',
}

// ---- Row 5 · marketing_top_campaigns (table) ------------------------------------

export type PillTone = 'pos' | 'neg' | 'info' | 'warn'

export interface TableRowCampaign {
  name: string
  status: { label: string; tone: PillTone }
  openRate: string
  revenue: string
}

export const CAMPAIGNS_TABLE: TableRowCampaign[] = [
  { name: 'Flash Sale — 4 Hours Only', status: { label: 'Sent', tone: 'pos' }, openRate: '69.6%', revenue: '$134,521.75' },
  { name: 'Cyber Monday Flash Sale', status: { label: 'Sent', tone: 'pos' }, openRate: '47.4%', revenue: '$98,432.75' },
  { name: 'January Sale', status: { label: 'Sent', tone: 'pos' }, openRate: '37.4%', revenue: '$56,789.25' },
  { name: 'December Holiday Gift Guide', status: { label: 'Sent', tone: 'pos' }, openRate: '41.8%', revenue: '$45,234.50' },
  { name: 'Product Launch: Nike Air Max 270', status: { label: 'Sent', tone: 'pos' }, openRate: '44.2%', revenue: '$34,521.00' },
  { name: "Valentine's Day Gift Ideas", status: { label: 'Sent', tone: 'pos' }, openRate: '32.4%', revenue: '$29,871.00' },
]

// ---- Row 5 · commerce_recent_orders (table) --------------------------------------

export interface TableRowOrder {
  order: string
  customer: string
  total: string
  status: { label: string; tone: PillTone }
}

export const ORDERS_TABLE: TableRowOrder[] = [
  { order: '#10482', customer: 'Ava Thompson', total: '$214.90', status: { label: 'Paid', tone: 'pos' } },
  { order: '#10481', customer: 'Liam Chen', total: '$96.40', status: { label: 'Fulfilled', tone: 'info' } },
  { order: '#10480', customer: 'Sofia Reyes', total: '$412.75', status: { label: 'Paid', tone: 'pos' } },
  { order: '#10479', customer: 'Noah Patel', total: '$58.20', status: { label: 'Pending', tone: 'warn' } },
  { order: '#10478', customer: 'Emma Wilson', total: '$189.00', status: { label: 'Fulfilled', tone: 'info' } },
  { order: '#10477', customer: 'Oliver Brown', total: '$77.35', status: { label: 'Refunded', tone: 'neg' } },
]

// ---- Row 6 · marketing_live_activity ----------------------------------------------

export const ACTIVITY_ITEMS = [
  { id: 'a1', icon: 'send', eyebrow: 'Campaign', title: 'Flash Sale — 4 Hours Only sent to 8,912 contacts', meta: '2m ago' },
  { id: 'a2', icon: 'shopping-cart', eyebrow: 'Order', title: 'New order #10482 — $214.90 by Ava Thompson', meta: '9m ago' },
  { id: 'a3', icon: 'users', eyebrow: 'Segment', title: 'VIP Customers segment grew to 1,204 contacts', meta: '24m ago' },
  { id: 'a4', icon: 'zap', eyebrow: 'Automation', title: 'Welcome series enrolled 36 new contacts', meta: '1h ago' },
  { id: 'a5', icon: 'shopping-cart', eyebrow: 'Order', title: 'New order #10481 — $96.40 by Liam Chen', meta: '1h ago' },
]

// ---- Row 6 · retail_sales_by_location ----------------------------------------------

export const SALES_BY_LOCATION = [
  { key: 'newmarket', name: 'Newmarket, AKL', value: 8412, color: C.navy },
  { key: 'ponsonby', name: 'Ponsonby, AKL', value: 6220, color: C.indigo },
  { key: 'wellington', name: 'Wellington CBD', value: 4875, color: C.sky },
  { key: 'riccarton', name: 'Riccarton, CHC', value: 3644, color: C.teal },
]
