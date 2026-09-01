import { defineStore } from 'pinia'
import { ref } from 'vue'

// --- Shared date-range presets (legacy "Select Date Range" parity) ---
export type DateRangePreset = 'Last 7 days' | 'Last 30 days' | 'Last 90 days' | 'This month' | 'This year'

export const dateRangePresets: DateRangePreset[] = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This month', 'This year']

/**
 * Active date-range selection: either a named preset, or a custom window with
 * ISO `from`/`to` bounds. Shared by every report view via MpDateRangeSelect so a
 * Custom range is available consistently across the app.
 */
export interface DateRangeValue {
  preset: DateRangePreset | 'Custom'
  from?: string
  to?: string
}

export const DEFAULT_DATE_RANGE: DateRangeValue = { preset: 'Last 30 days' }

/**
 * True when an ISO date string falls within the given preset window (relative to now).
 * Null/blank/invalid dates are excluded so undated rows drop out of date-filtered reports.
 */
export function isWithinPreset(date: string | null | undefined, preset: DateRangePreset): boolean {
  if (!date) return false
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  const daysAgo = (n: number) => {
    const from = new Date(now)
    from.setDate(now.getDate() - n)
    return d >= from && d <= now
  }
  switch (preset) {
    case 'Last 7 days':
      return daysAgo(7)
    case 'Last 30 days':
      return daysAgo(30)
    case 'Last 90 days':
      return daysAgo(90)
    case 'This month':
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    case 'This year':
      return d.getFullYear() === now.getFullYear()
  }
}

/**
 * True when an ISO date falls within the active DateRangeValue — a Custom window
 * (inclusive of both bounds; open-ended if one is missing) or a named preset.
 */
export function isWithinRange(date: string | null | undefined, value: DateRangeValue): boolean {
  if (value.preset !== 'Custom') return isWithinPreset(date, value.preset)
  if (!date) return false
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return false
  if (value.from) {
    const from = new Date(value.from)
    from.setHours(0, 0, 0, 0)
    if (d < from) return false
  }
  if (value.to) {
    const to = new Date(value.to)
    to.setHours(23, 59, 59, 999)
    if (d > to) return false
  }
  return true
}

const RANGE_LABEL_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function fmtBound(iso?: string): string {
  if (!iso) return '…'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '…' : RANGE_LABEL_FMT.format(d)
}

/** Human label for the active range — the preset name, or "1 Jul – 15 Jul 2026" for Custom. */
export function dateRangeLabel(value: DateRangeValue): string {
  if (value.preset !== 'Custom') return value.preset
  if (!value.from && !value.to) return 'Custom range'
  return `${fmtBound(value.from)} – ${fmtBound(value.to)}`
}

export interface SalesChannel {
  channel: string
  icon: string
  revenue: number
  orders: number
  share: number   // % of total revenue
  delta: number   // % change vs prior period
}

export interface RfmSegment {
  key: string
  name: string
  count: number
  share: number       // % of analyzed base
  avgValue: number    // avg monetary value
  recencyDays: number
  frequency: number
  action: string
  tone: 'success' | 'info' | 'warning' | 'error' | 'neutral'
}

// --- eRFM report (Engagement, Recency, Frequency, Monetary) ------------------
//
// Modelled on the real report at /accounts/:id/erfm_report. Two dates are
// compared: a base date and a later comparison date. Every section reads the
// same five groups and five engagement levels, which is why the aliases live in
// one mutable ref (the GROUPS drawer renames them and all five sections follow).

/** Stable API keys for the five groups. Order is the report's display order. */
export const ERFM_GROUP_KEYS = ['champions', 'loyal', 'recent', 'need_attention', 'inactive'] as const
export type ErfmGroupKey = (typeof ERFM_GROUP_KEYS)[number]

/** Maropost's shipped group names. The GROUPS drawer's Restore-defaults resets to these. */
export const ERFM_GROUP_DEFAULT_LABELS: Record<ErfmGroupKey, string> = {
  champions: 'Champions',
  loyal: 'Loyal',
  recent: 'Recent',
  need_attention: 'Need Attention',
  inactive: 'Inactive',
}

/** The engagement axis, most to least engaged. `Total` is a roll-up, not a level. */
export const ERFM_ENGAGEMENT_LEVELS = [
  'Most Engaged',
  'Highly Engaged',
  'Engaged',
  'Lightly Engaged',
  'Not Engaged',
] as const
export type ErfmEngagement = (typeof ERFM_ENGAGEMENT_LEVELS)[number]

/** Per-group average revenue, used to derive the matrix's revenue view from its contact counts. */
export const ERFM_REVENUE_PER_CONTACT: Record<ErfmGroupKey, number> = {
  champions: 420,
  loyal: 260,
  recent: 145,
  need_attention: 68,
  inactive: 12,
}

/** A contacts grid: one row per group, one column per engagement level. */
export type ErfmMatrix = Record<ErfmGroupKey, number[]>

export interface ErfmDistributionRow {
  group: ErfmGroupKey
  baseTotal: number
  comparisonTotal: number
}

/** One base-date group's outflow to each comparison-date group. */
export type ErfmTransitionMatrix = Record<ErfmGroupKey, Record<ErfmGroupKey, number>>

export interface ErfmPerformanceRow {
  group: ErfmGroupKey
  /** `'180+'` upstream — the column is deliberately `number | string`, see PARITY. */
  daysSincePurchase: number | string
  totalOrders: number
  placedOrderRevenue: number
  abandonedCarts: number
  siteVisits: number
  clickRate: number
}

export interface ErfmSettings {
  recency: { highestScoreDays: number | null; averageScoreDays: number | null; lowestScoreDays: number | null }
  frequency: { mostFrequent: number | null; averagelyFrequent: number | null }
  monetary: { highestSpender: number | null; averageSpender: number | null }
}

/** Upstream caps recency at 1000 days (`Recency days cannot exceed 1000`). */
export const ERFM_MAX_RECENCY_DAYS = 1000

/** Upstream allows a base date no earlier than 13 months before the comparison date. */
export const ERFM_MAX_HISTORY_MONTHS = 13

/** The five report types, named as the Custom Reports list surfaces them. */
export type CustomReportType =
  | 'Campaign Based'
  | 'SMS Report'
  | 'SMS Message'
  | 'Deliverability'
  | 'Growth & Attrition'

export type CustomReportScheduleMode = 'Once' | 'Recurring'

export interface CustomReport {
  id: number
  name: string
  reportType: CustomReportType
  /**
   * Surfaced in the list's Status column. It is the schedule mode, not an execution
   * state — a 'Once' report displays as "Scheduled". See docs/rebuild/custom-reports-list.
   */
  scheduleMode: CustomReportScheduleMode
  /** ISO datetime; the list renders it as "MMM DD, YYYY at HH:MM AM/PM". */
  updatedAt: string
  // Delivery details captured by the create wizard.
  recipientEmail?: string
  subject?: string
  message?: string
}

export interface TransactionalReport {
  id: number
  event: string
  type: 'Order' | 'Shipping' | 'Account' | 'Payment'
  triggerDate: string
  sent: number
  deliveryRate: number // percent
}

export interface WebsiteReport {
  id: number
  path: string
  category: 'Landing' | 'Product' | 'Checkout' | 'Content'
  views: number
  visitors: number
  avgTime: string
}

export interface TestCampaignReport {
  id: number
  scenario: string
  provider: 'Gmail' | 'Outlook' | 'Yahoo' | 'Apple Mail'
  scheduledDate: string
  placement: number // inbox placement percent
  spamScore: number
}

// --- Recurring Campaign Reports (/reports/recurring_campaign_report parity) ---

/** Shared count columns of the legacy campaign report tables. */
export interface ReportMetricCounts {
  sent: number
  delivered: number
  opens: number
  clicks: number
  bounces: number
  revenue: number
}

/** One actual send of a recurring campaign; the child row under a parent report. */
export interface RecurringOccurrence extends ReportMetricCounts {
  id: number
  campaignId: number
  /** ISO datetime of the send. */
  sentAt: string
}

export interface RecurringCampaignReport {
  id: number
  campaignId: number
  name: string
  occurrences: RecurringOccurrence[]
}

// --- A/B Campaign Reports (/ab_reports + /campaigns/:id/ab_report parity) ---

/** A percentage + raw count pair, the "<pct>% (<count>)" cells of the comparison table. */
export interface AbMetricCell {
  pct: number
  count: number
}

export interface AbVariantMetrics {
  delivered: AbMetricCell
  totalOpens: AbMetricCell
  uniqueOpens: AbMetricCell
  totalClicks: AbMetricCell
  uniqueClicks: AbMetricCell
  bounced: AbMetricCell
  softBounced: AbMetricCell
  hardBounced: AbMetricCell
  unsubscribed: AbMetricCell
  complaints: AbMetricCell
}

export interface AbVariantOverview {
  sendTime: string | null
  subject: string
  preHeader: string
  /** Name of the content record the variant points at (null while undecided). */
  contentName: string | null
  fromName: string
  /** Audience split share, e.g. 65 for the final remainder. */
  sizePct: number
  contactsCount: number
  conversions: number
  totalRevenue: number
  totalOrders: number
  totalItemsPurchased: number
  totalUniqueItemsPurchased: number
  conversionRate: number
  averageOrderValue: number
}

export interface AbReportVariant {
  id: number
  name: string
  kind: 'final' | 'A' | 'B'
  /** UAT caption under the final column: "Decided by TopChoice". */
  decidedBy?: string
  totalSent: number
  sentAt: string | null
  metrics: AbVariantMetrics
  overview: AbVariantOverview
}

export interface AbCampaignReport extends ReportMetricCounts {
  id: number
  campaignId: number
  name: string
  contacts: number
  sentAt: string | null
  updatedAt: string
  /** Rendered final-first, matching the UAT comparison layout. */
  variants: AbReportVariant[]
  details: {
    fromEmail: string
    replyTo: string
    language: string
    brand: string
    lists: string[]
    segments: string[]
    suppressLists: string[]
    suppressSecureLists: string[]
    suppressSegments: string[]
    suppressJourneys: string[]
    campaignTags: string[]
  }
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const accountMetrics = ref({
    deliverability: 99.4,
    monthlyEmailsSent: 1450200,
    monthlyLimit: 2000000,
    activeContacts: 450000,
    revenueAttributed: 1250400.50,
    totalRevenue: 1250400,
    activeSubscribers: 450000,
    avgOpenRate: 24.5,
    monthlySends: 1450000
  })

  // Mock robust chart data series
  const chartData = ref([
    { date: 'Jan', gets: 12000, revenue: 3000, orders: 120, subscribers: 450, sends: 12000 },
    { date: 'Feb', gets: 19000, revenue: 4500, orders: 180, subscribers: 600, sends: 19000 },
    { date: 'Mar', gets: 15000, revenue: 3200, orders: 130, subscribers: 480, sends: 15000 },
    { date: 'Apr', gets: 22000, revenue: 5000, orders: 200, subscribers: 700, sends: 22000 },
    { date: 'May', gets: 28000, revenue: 7500, orders: 300, subscribers: 950, sends: 28000 },
    { date: 'Jun', gets: 14000, revenue: 2000, orders: 80, subscribers: 350, sends: 14000 },
    { date: 'Jul', gets: 11000, revenue: 1500, orders: 60, subscribers: 280, sends: 11000 },
  ])

  // --- Sales Summary: revenue attributed by channel (sums to accountMetrics.totalRevenue) ---
  const salesChannels = ref<SalesChannel[]>([
    { channel: 'Email Marketing', icon: 'mail',          revenue: 512664, orders: 8421, share: 41.0, delta: 12.4 },
    { channel: 'Direct',          icon: 'globe',         revenue: 275088, orders: 5140, share: 22.0, delta: 4.1 },
    { channel: 'Organic Search',  icon: 'search',        revenue: 187560, orders: 3980, share: 15.0, delta: 8.7 },
    { channel: 'Paid Social',     icon: 'megaphone',     revenue: 137544, orders: 2610, share: 11.0, delta: -3.2 },
    { channel: 'Referral',        icon: 'users',         revenue: 87528,  orders: 1740, share: 7.0,  delta: 1.9 },
    { channel: 'Affiliate',       icon: 'link',          revenue: 50016,  orders: 980,  share: 4.0,  delta: 15.3 },
  ])

  // --- eRFM: recency / frequency / monetary segmentation ---
  const rfmAnalyzed = ref(48250)
  const rfmSegments = ref<RfmSegment[]>([
    { key: 'champions',   name: 'Champions',           count: 6142, share: 12.7, avgValue: 842, recencyDays: 8,   frequency: 14, action: 'Reward & upsell',        tone: 'success' },
    { key: 'loyal',       name: 'Loyal Customers',     count: 8430, share: 17.5, avgValue: 517, recencyDays: 21,  frequency: 9,  action: 'Cross-sell, referrals',  tone: 'success' },
    { key: 'potential',   name: 'Potential Loyalists', count: 7215, share: 15.0, avgValue: 321, recencyDays: 18,  frequency: 4,  action: 'Membership offers',      tone: 'info' },
    { key: 'new',         name: 'New Customers',       count: 4980, share: 10.3, avgValue: 118, recencyDays: 6,   frequency: 1,  action: 'Onboard & educate',      tone: 'info' },
    { key: 'promising',   name: 'Promising',           count: 3640, share: 7.5,  avgValue: 164, recencyDays: 30,  frequency: 2,  action: 'Build awareness',        tone: 'info' },
    { key: 'at-risk',     name: 'At Risk',             count: 6890, share: 14.3, avgValue: 455, recencyDays: 96,  frequency: 7,  action: 'Win-back campaign',      tone: 'warning' },
    { key: 'cant-lose',   name: "Can't Lose Them",     count: 2110, share: 4.4,  avgValue: 978, recencyDays: 142, frequency: 12, action: 'Reactivate urgently',    tone: 'error' },
    { key: 'hibernating', name: 'Hibernating',         count: 5320, share: 11.0, avgValue: 92,  recencyDays: 210, frequency: 2,  action: 'Re-engage or sunset',    tone: 'warning' },
    { key: 'lost',        name: 'Lost',                count: 3523, share: 7.3,  avgValue: 61,  recencyDays: 315, frequency: 1,  action: 'Low-cost reactivation',  tone: 'neutral' },
  ])

  // --- Custom Reports: saved report definitions ---
  const customReports = ref<CustomReport[]>([
    { id: 1, name: 'Q3 revenue by region', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2026-08-15T11:21:00' },
    { id: 2, name: 'Email engagement cohorts', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2026-08-06T06:17:00' },
    { id: 3, name: 'Abandoned cart funnel', reportType: 'Campaign Based', scheduleMode: 'Recurring', updatedAt: '2026-07-28T14:42:00' },
    { id: 4, name: 'LTV by acquisition channel', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2026-07-19T18:40:00' },
    { id: 5, name: 'Subscriber growth MoM', reportType: 'Growth & Attrition', scheduleMode: 'Once', updatedAt: '2026-07-10T07:01:00' },
    { id: 6, name: 'Support volume by channel', reportType: 'Campaign Based', scheduleMode: 'Recurring', updatedAt: '2026-07-01T15:17:00' },
    { id: 7, name: '116000 Recurring email campaign report - 7 Nov 2025', reportType: 'Campaign Based', scheduleMode: 'Recurring', updatedAt: '2026-06-22T12:23:00' },
    { id: 8, name: '116000 Recurring deliverability report - 7 Nov 2025', reportType: 'Deliverability', scheduleMode: 'Recurring', updatedAt: '2026-06-13T18:07:00' },
    { id: 9, name: '116000 Recurring growth & attrition report - 7 Nov 2025', reportType: 'Growth & Attrition', scheduleMode: 'Recurring', updatedAt: '2026-06-04T18:34:00' },
    { id: 10, name: '116000 Recurring SMS campaign report - 7 Nov 2025', reportType: 'SMS Report', scheduleMode: 'Recurring', updatedAt: '2026-05-26T02:48:00' },
    { id: 11, name: '116000 Recurring SMS message report - 7 Jan 2026', reportType: 'SMS Message', scheduleMode: 'Recurring', updatedAt: '2026-05-17T18:13:00' },
    { id: 12, name: '116000 Feb 4 custom report', reportType: 'Campaign Based', scheduleMode: 'Recurring', updatedAt: '2026-05-08T18:43:00' },
    { id: 13, name: 'Black Friday 2025 performance', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2026-04-29T03:39:00' },
    { id: 14, name: 'Black Friday 2025 performance copy', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2026-04-20T13:50:00' },
    { id: 15, name: 'Weekly newsletter deliverability', reportType: 'Deliverability', scheduleMode: 'Recurring', updatedAt: '2026-04-11T11:15:00' },
    { id: 16, name: 'Gmail inbox placement - rolling 30d', reportType: 'Deliverability', scheduleMode: 'Once', updatedAt: '2026-04-02T21:16:00' },
    { id: 17, name: 'Yahoo & AOL bounce watch', reportType: 'Deliverability', scheduleMode: 'Once', updatedAt: '2026-03-24T09:45:00' },
    { id: 18, name: 'Welcome series engagement', reportType: 'Campaign Based', scheduleMode: 'Recurring', updatedAt: '2026-03-15T23:42:00' },
    { id: 19, name: 'Win-back journey performance', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2026-03-06T05:43:00' },
    { id: 20, name: 'Transactional email health', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2026-02-25T21:06:00' },
    { id: 21, name: 'Master list growth - monthly', reportType: 'Growth & Attrition', scheduleMode: 'Recurring', updatedAt: '2026-02-16T00:50:00' },
    { id: 22, name: 'VIP list attrition', reportType: 'Growth & Attrition', scheduleMode: 'Once', updatedAt: '2026-02-07T20:56:00' },
    { id: 23, name: 'Newsletter unsubscribe trend', reportType: 'Growth & Attrition', scheduleMode: 'Once', updatedAt: '2026-01-29T15:20:00' },
    { id: 24, name: 'First-time contacts by list', reportType: 'Growth & Attrition', scheduleMode: 'Recurring', updatedAt: '2026-01-20T09:39:00' },
    { id: 25, name: 'Resubscribers - quarterly', reportType: 'Growth & Attrition', scheduleMode: 'Once', updatedAt: '2026-01-11T23:01:00' },
    { id: 26, name: 'SMS flash sale results', reportType: 'SMS Report', scheduleMode: 'Once', updatedAt: '2026-01-02T02:39:00' },
    { id: 27, name: 'SMS click-through by campaign', reportType: 'SMS Report', scheduleMode: 'Recurring', updatedAt: '2025-12-24T18:11:00' },
    { id: 28, name: 'SMS opt-out rate - weekly', reportType: 'SMS Report', scheduleMode: 'Once', updatedAt: '2025-12-15T01:01:00' },
    { id: 29, name: 'Inbound SMS keyword log', reportType: 'SMS Message', scheduleMode: 'Once', updatedAt: '2025-12-06T01:56:00' },
    { id: 30, name: 'Outbound SMS delivery failures', reportType: 'SMS Message', scheduleMode: 'Recurring', updatedAt: '2025-11-27T21:07:00' },
    { id: 31, name: 'Order confirmation open rate', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2025-11-18T20:56:00' },
    { id: 32, name: 'Shipping notification engagement', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2025-11-09T23:35:00' },
    { id: 33, name: 'Cart recovery revenue', reportType: 'Campaign Based', scheduleMode: 'Recurring', updatedAt: '2025-10-31T07:53:00' },
    { id: 34, name: 'Loyalty tier campaign results', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2025-10-22T18:53:00' },
    { id: 35, name: 'Wholesale segment engagement', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2025-10-13T14:23:00' },
    { id: 36, name: 'Store pickup reminder performance', reportType: 'SMS Report', scheduleMode: 'Recurring', updatedAt: '2025-10-04T10:48:00' },
    { id: 37, name: 'Birthday club campaign report', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2025-09-25T04:49:00' },
    { id: 38, name: 'Post-purchase survey sends', reportType: 'Campaign Based', scheduleMode: 'Once', updatedAt: '2025-09-16T09:35:00' },
    { id: 39, name: 'Press list deliverability check', reportType: 'Deliverability', scheduleMode: 'Recurring', updatedAt: '2025-09-07T14:29:00' },
    { id: 40, name: 'Trade account growth', reportType: 'Growth & Attrition', scheduleMode: 'Once', updatedAt: '2025-08-29T21:03:00' },
    { id: 41, name: 'At-risk segment attrition', reportType: 'Growth & Attrition', scheduleMode: 'Once', updatedAt: '2025-08-20T22:56:00' },
    { id: 42, name: 'Q4 planning - all channels', reportType: 'Campaign Based', scheduleMode: 'Recurring', updatedAt: '2025-08-11T17:41:00' },
  ])

  // --- Transactional email reports (stable seed; was Math.random() inline) ---
  const transactionalReports = ref<TransactionalReport[]>([
    { id: 1,  event: 'Order Confirmation',      type: 'Order',    triggerDate: '2026-07-10', sent: 4820, deliveryRate: 99.6 },
    { id: 2,  event: 'Shipping Notification',   type: 'Shipping', triggerDate: '2026-07-09', sent: 4210, deliveryRate: 99.2 },
    { id: 3,  event: 'Delivery Confirmation',   type: 'Shipping', triggerDate: '2026-07-08', sent: 3980, deliveryRate: 98.8 },
    { id: 4,  event: 'Password Reset',          type: 'Account',  triggerDate: '2026-07-07', sent: 1240, deliveryRate: 99.9 },
    { id: 5,  event: 'Account Welcome',         type: 'Account',  triggerDate: '2026-07-05', sent: 2310, deliveryRate: 99.4 },
    { id: 6,  event: 'Payment Receipt',         type: 'Payment',  triggerDate: '2026-07-02', sent: 4560, deliveryRate: 99.7 },
    { id: 7,  event: 'Refund Confirmation',     type: 'Payment',  triggerDate: '2026-06-28', sent: 640,  deliveryRate: 99.1 },
    { id: 8,  event: 'Order Cancellation',      type: 'Order',    triggerDate: '2026-06-25', sent: 410,  deliveryRate: 98.5 },
    { id: 9,  event: 'Back-in-Stock Alert',     type: 'Order',    triggerDate: '2026-06-22', sent: 3120, deliveryRate: 97.9 },
    { id: 10, event: 'Review Request',          type: 'Order',    triggerDate: '2026-06-18', sent: 2870, deliveryRate: 98.2 },
    { id: 11, event: 'Abandoned Cart Reminder', type: 'Order',    triggerDate: '2026-06-14', sent: 1950, deliveryRate: 98.9 },
    { id: 12, event: 'Subscription Renewal',    type: 'Payment',  triggerDate: '2026-06-10', sent: 1120, deliveryRate: 99.3 },
    { id: 13, event: 'Return Label Issued',     type: 'Shipping', triggerDate: '2026-06-06', sent: 540,  deliveryRate: 99.0 },
    { id: 14, event: 'Gift Card Delivery',      type: 'Account',  triggerDate: '2026-06-02', sent: 780,  deliveryRate: 99.8 },
    { id: 15, event: 'Two-Factor Code',         type: 'Account',  triggerDate: '2026-05-29', sent: 3410, deliveryRate: 99.9 },
  ])

  // --- Website page reports (stable seed; was Math.random() inline) ---
  const websiteReports = ref<WebsiteReport[]>([
    { id: 1,  path: '/',                              category: 'Landing',  views: 48210, visitors: 31200, avgTime: '2m 14s' },
    { id: 2,  path: '/products',                      category: 'Product',  views: 39840, visitors: 24100, avgTime: '1m 52s' },
    { id: 3,  path: '/products/nike-air-max-270',     category: 'Product',  views: 28730, visitors: 18900, avgTime: '2m 41s' },
    { id: 4,  path: '/collections/new-arrivals',      category: 'Product',  views: 21450, visitors: 15300, avgTime: '1m 38s' },
    { id: 5,  path: '/checkout',                      category: 'Checkout', views: 18920, visitors: 12800, avgTime: '3m 09s' },
    { id: 6,  path: '/cart',                          category: 'Checkout', views: 16540, visitors: 11200, avgTime: '1m 27s' },
    { id: 7,  path: '/pricing',                       category: 'Landing',  views: 14320, visitors: 9800,  avgTime: '2m 03s' },
    { id: 8,  path: '/blog/summer-style-guide',       category: 'Content',  views: 12870, visitors: 9100,  avgTime: '4m 12s' },
    { id: 9,  path: '/about',                         category: 'Content',  views: 9840,  visitors: 7200,  avgTime: '1m 09s' },
    { id: 10, path: '/products/sony-wh-1000xm5',      category: 'Product',  views: 8730,  visitors: 6400,  avgTime: '2m 55s' },
    { id: 11, path: '/support',                       category: 'Content',  views: 7210,  visitors: 5300,  avgTime: '2m 18s' },
    { id: 12, path: '/checkout/shipping',             category: 'Checkout', views: 6540,  visitors: 4900,  avgTime: '1m 44s' },
    { id: 13, path: '/blog/holiday-gift-guide',       category: 'Content',  views: 5890,  visitors: 4300,  avgTime: '3m 47s' },
    { id: 14, path: '/collections/sale',              category: 'Product',  views: 5120,  visitors: 3800,  avgTime: '1m 31s' },
    { id: 15, path: '/contact',                       category: 'Content',  views: 3980,  visitors: 2900,  avgTime: '0m 58s' },
  ])

  // --- Deliverability test-campaign reports (stable seed; was Math.random() inline) ---
  const testCampaignReports = ref<TestCampaignReport[]>([
    { id: 1,  scenario: 'Promotions Tab Placement',  provider: 'Gmail',      scheduledDate: '2026-07-10', placement: 94, spamScore: 0.4 },
    { id: 2,  scenario: 'Focused Inbox Check',        provider: 'Outlook',    scheduledDate: '2026-07-08', placement: 88, spamScore: 0.9 },
    { id: 3,  scenario: 'Bulk Folder Test',           provider: 'Yahoo',      scheduledDate: '2026-07-05', placement: 91, spamScore: 0.6 },
    { id: 4,  scenario: 'Primary Inbox Test',         provider: 'Apple Mail', scheduledDate: '2026-07-02', placement: 97, spamScore: 0.2 },
    { id: 5,  scenario: 'Spam Filter Stress Test',    provider: 'Gmail',      scheduledDate: '2026-06-27', placement: 82, spamScore: 1.4 },
    { id: 6,  scenario: 'Junk Rules Test',            provider: 'Outlook',    scheduledDate: '2026-06-22', placement: 85, spamScore: 1.1 },
    { id: 7,  scenario: 'Image-Heavy Layout',         provider: 'Yahoo',      scheduledDate: '2026-06-16', placement: 79, spamScore: 1.7 },
    { id: 8,  scenario: 'Link Reputation Test',       provider: 'Gmail',      scheduledDate: '2026-06-09', placement: 90, spamScore: 0.7 },
    { id: 9,  scenario: 'Authentication (DKIM/SPF)',  provider: 'Apple Mail', scheduledDate: '2026-06-03', placement: 96, spamScore: 0.3 },
    { id: 10, scenario: 'Plain-Text Fallback',        provider: 'Outlook',    scheduledDate: '2026-05-28', placement: 93, spamScore: 0.5 },
  ])

  // --- eRFM report ----------------------------------------------------------
  //
  // The three matrices below are internally consistent, which is what makes the
  // report's four sections agree with each other:
  //   · every `erfmTransitions` row sums to that group's BASE total
  //   · every column sums to that group's COMPARISON total, except `inactive`,
  //     which falls short by exactly the 2,130 contacts acquired between the two
  //     dates — new contacts enter as Inactive, so the surplus lands there
  // Change one number and all three have to be re-balanced together.

  const erfmBaseDate = ref('2026-06-02')
  const erfmComparisonDate = ref('2026-08-30')

  /** Contacts per group × engagement level at the base date. Total 46,120. */
  const erfmBaseMatrix = ref<ErfmMatrix>({
    //                Most  Highly Engaged Lightly    Not
    champions:      [1180,   900,    460,    140,     40],
    loyal:          [1060,  1520,   1040,    420,    110],
    recent:         [ 520,   980,   1880,   1240,    460],
    need_attention: [ 160,   480,   1280,   3120,   3010],
    inactive:       [  80,   220,    700,   3880,  21240],
  })

  /** Contacts per group × engagement level at the comparison date. Total 48,250. */
  const erfmComparisonMatrix = ref<ErfmMatrix>({
    //                Most  Highly Engaged Lightly    Not
    champions:      [1240,   860,    410,    120,     30],
    loyal:          [ 980,  1640,   1120,    380,     90],
    recent:         [ 620,  1180,   2240,   1460,    520],
    need_attention: [ 140,   420,   1180,   2980,   3240],
    inactive:       [  60,   180,    640,   4120,  22400],
  })

  /** Base-date group (row) → comparison-date group (column) movement. */
  const erfmTransitions = ref<ErfmTransitionMatrix>({
    champions:      { champions: 1980, loyal:  460, recent:  120, need_attention:  120, inactive:    40 },
    loyal:          { champions:  520, loyal: 2840, recent:  480, need_attention:  240, inactive:    70 },
    recent:         { champions:  140, loyal:  640, recent: 3720, need_attention:  480, inactive:   100 },
    need_attention: { champions:   20, loyal:  210, recent: 1240, need_attention: 5320, inactive:  1260 },
    inactive:       { champions:    0, loyal:   60, recent:  460, need_attention: 1800, inactive: 23800 },
  })

  const erfmPerformanceBase = ref<ErfmPerformanceRow[]>([
    { group: 'champions',      daysSincePurchase:  12.4, totalOrders: 8.6, placedOrderRevenue: 1842.5, abandonedCarts: 0.42, siteVisits: 14.2, clickRate: 38.4 },
    { group: 'loyal',          daysSincePurchase:  28.7, totalOrders: 4.9, placedOrderRevenue:  968.2, abandonedCarts: 0.61, siteVisits:  8.7, clickRate: 26.1 },
    { group: 'recent',         daysSincePurchase:  41.3, totalOrders: 1.8, placedOrderRevenue:  342.75, abandonedCarts: 0.38, siteVisits:  5.4, clickRate: 18.9 },
    { group: 'need_attention', daysSincePurchase:  96.5, totalOrders: 1.4, placedOrderRevenue:  214.6, abandonedCarts: 0.74, siteVisits:  2.1, clickRate:  9.2 },
    { group: 'inactive',       daysSincePurchase: '180+', totalOrders: 0.3, placedOrderRevenue:   48.9, abandonedCarts: 0.19, siteVisits:  0.4, clickRate:  2.6 },
  ])

  const erfmPerformanceComparison = ref<ErfmPerformanceRow[]>([
    { group: 'champions',      daysSincePurchase:   9.8, totalOrders: 9.4, placedOrderRevenue: 2104.8, abandonedCarts: 0.39, siteVisits: 16.1, clickRate: 41.2 },
    { group: 'loyal',          daysSincePurchase:  24.2, totalOrders: 5.4, placedOrderRevenue: 1086.4, abandonedCarts: 0.58, siteVisits:  9.8, clickRate: 28.6 },
    { group: 'recent',         daysSincePurchase:  36.9, totalOrders: 2.1, placedOrderRevenue:  388.3, abandonedCarts: 0.41, siteVisits:  6.2, clickRate: 20.4 },
    { group: 'need_attention', daysSincePurchase: 102.8, totalOrders: 1.2, placedOrderRevenue:  196.4, abandonedCarts: 0.79, siteVisits:  1.8, clickRate:  8.1 },
    { group: 'inactive',       daysSincePurchase: '180+', totalOrders: 0.2, placedOrderRevenue:   41.2, abandonedCarts: 0.16, siteVisits:  0.3, clickRate:  2.2 },
  ])

  /** Renameable group labels. Seeded with the shipped defaults. */
  const erfmGroupAliases = ref<Record<ErfmGroupKey, string>>({ ...ERFM_GROUP_DEFAULT_LABELS })

  const erfmSettings = ref<ErfmSettings>({
    recency: { highestScoreDays: 30, averageScoreDays: 90, lowestScoreDays: 180 },
    frequency: { mostFrequent: 6, averagelyFrequent: 3 },
    monetary: { highestSpender: 1000, averageSpender: 250 },
  })

  function saveErfmGroupAliases(next: Record<ErfmGroupKey, string>) {
    erfmGroupAliases.value = { ...next }
  }

  function saveErfmSettings(next: ErfmSettings) {
    erfmSettings.value = {
      recency: { ...next.recency },
      frequency: { ...next.frequency },
      monetary: { ...next.monetary },
    }
  }

  // --- Recurring Campaign Reports ---

  const recurringReports = ref<RecurringCampaignReport[]>([
    {
      id: 1, campaignId: 2, name: 'Weekly Digest — New Arrivals', occurrences: [
        { id: 1, campaignId: 1, sentAt: '2026-08-28T09:00:00', sent: 4231, delivered: 4198, opens: 1543, clicks: 512, bounces: 33, revenue: 4120.5 },
        { id: 2, campaignId: 2, sentAt: '2026-08-21T09:00:00', sent: 4188, delivered: 4150, opens: 1489, clicks: 476, bounces: 38, revenue: 3890.0 },
        { id: 3, campaignId: 3, sentAt: '2026-08-14T09:00:00', sent: 4102, delivered: 4079, opens: 1502, clicks: 495, bounces: 23, revenue: 4310.25 },
        { id: 4, campaignId: 4, sentAt: '2026-08-07T09:00:00', sent: 4055, delivered: 4021, opens: 1390, clicks: 421, bounces: 34, revenue: 3654.0 },
      ],
    },
    {
      id: 2, campaignId: 3, name: 'Daily Deals — Flash Offers', occurrences: [
        { id: 1, campaignId: 3, sentAt: '2026-08-31T06:00:00', sent: 18231, delivered: 18102, opens: 5231, clicks: 1876, bounces: 129, revenue: 12873.0 },
        { id: 2, campaignId: 5, sentAt: '2026-08-30T06:00:00', sent: 18194, delivered: 18001, opens: 4987, clicks: 1745, bounces: 193, revenue: 11240.5 },
        { id: 3, campaignId: 7, sentAt: '2026-08-29T06:00:00', sent: 18150, delivered: 18033, opens: 5102, clicks: 1811, bounces: 117, revenue: 11986.75 },
      ],
    },
    {
      id: 3, campaignId: 6, name: 'Monthly Loyalty Statement', occurrences: [
        { id: 1, campaignId: 6, sentAt: '2026-08-01T10:30:00', sent: 9821, delivered: 9754, opens: 4123, clicks: 987, bounces: 67, revenue: 0 },
        { id: 2, campaignId: 2, sentAt: '2026-07-01T10:30:00', sent: 9640, delivered: 9581, opens: 3980, clicks: 921, bounces: 59, revenue: 0 },
      ],
    },
    {
      id: 4, campaignId: 4, name: 'Back-in-Stock Alerts — Sneakers', occurrences: [
        { id: 1, campaignId: 4, sentAt: '2026-08-26T13:20:00', sent: 1245, delivered: 1238, opens: 812, clicks: 402, bounces: 7, revenue: 8231.0 },
        { id: 2, campaignId: 8, sentAt: '2026-08-19T13:20:00', sent: 1198, delivered: 1190, opens: 764, clicks: 371, bounces: 8, revenue: 7455.5 },
        { id: 3, campaignId: 9, sentAt: '2026-08-12T13:20:00', sent: 1152, delivered: 1149, opens: 745, clicks: 350, bounces: 3, revenue: 6980.0 },
      ],
    },
    {
      id: 5, campaignId: 9, name: 'Weekend Wine Club Reminder', occurrences: [
        { id: 1, campaignId: 1, sentAt: '2026-08-29T17:00:00', sent: 2310, delivered: 2287, opens: 934, clicks: 287, bounces: 23, revenue: 3120.0 },
      ],
    },
  ])

  // --- A/B Campaign Reports ---

  /** Builds the % + count pairs for a variant from a compact spec. */
  function abCells(base: number, spec: Record<keyof AbVariantMetrics, number>): AbVariantMetrics {
    const cell = (count: number): AbMetricCell => ({ count, pct: base === 0 ? 0 : Math.round((count / base) * 1000) / 10 })
    return {
      delivered: cell(spec.delivered), totalOpens: cell(spec.totalOpens), uniqueOpens: cell(spec.uniqueOpens),
      totalClicks: cell(spec.totalClicks), uniqueClicks: cell(spec.uniqueClicks), bounced: cell(spec.bounced),
      softBounced: cell(spec.softBounced), hardBounced: cell(spec.hardBounced), unsubscribed: cell(spec.unsubscribed),
      complaints: cell(spec.complaints),
    }
  }

  const abReports = ref<AbCampaignReport[]>([
    {
      id: 1, campaignId: 201, name: 'Spring Launch — Subject Line Test',
      contacts: 24800, sent: 24800, delivered: 24544, opens: 9812, clicks: 3120, bounces: 256, revenue: 41230.5,
      sentAt: '2026-08-26T20:35:00', updatedAt: '2026-08-26T02:23:00',
      variants: [
        {
          id: 1, name: 'Spring Launch | Final Campaign', kind: 'final', decidedBy: 'TopChoice',
          totalSent: 16120, sentAt: '2026-08-28T20:00:00',
          metrics: abCells(16120, { delivered: 15980, totalOpens: 6420, uniqueOpens: 5810, totalClicks: 2110, uniqueClicks: 1890, bounced: 140, softBounced: 96, hardBounced: 44, unsubscribed: 31, complaints: 2 }),
          overview: { sendTime: '2026-08-28T20:00:00', subject: 'The Spring drop is here 🌱', preHeader: 'First look inside', contentName: null, fromName: 'Maison Fleur', sizePct: 65, contactsCount: 16120, conversions: 812, totalRevenue: 27110.5, totalOrders: 812, totalItemsPurchased: 1420, totalUniqueItemsPurchased: 1180, conversionRate: 5.0, averageOrderValue: 33.4 },
        },
        {
          id: 2, name: 'Spring Launch - A', kind: 'A',
          totalSent: 4340, sentAt: '2026-08-26T20:30:00',
          metrics: abCells(4340, { delivered: 4297, totalOpens: 1810, uniqueOpens: 1622, totalClicks: 540, uniqueClicks: 488, bounced: 43, softBounced: 30, hardBounced: 13, unsubscribed: 9, complaints: 1 }),
          overview: { sendTime: '2026-08-26T20:30:00', subject: 'The Spring drop is here 🌱', preHeader: 'First look inside', contentName: 'Spring Launch Hero (Aug 2026)', fromName: 'Maison Fleur', sizePct: 17.5, contactsCount: 4340, conversions: 201, totalRevenue: 6890.0, totalOrders: 201, totalItemsPurchased: 350, totalUniqueItemsPurchased: 300, conversionRate: 4.6, averageOrderValue: 34.3 },
        },
        {
          id: 3, name: 'Spring Launch - B', kind: 'B',
          totalSent: 4340, sentAt: '2026-08-27T20:45:00',
          metrics: abCells(4340, { delivered: 4267, totalOpens: 1582, uniqueOpens: 1420, totalClicks: 470, uniqueClicks: 430, bounced: 73, softBounced: 51, hardBounced: 22, unsubscribed: 12, complaints: 0 }),
          overview: { sendTime: '2026-08-27T20:45:00', subject: 'Your spring wardrobe called', preHeader: 'New season, new arrivals', contentName: 'Spring Launch Hero (Aug 2026)', fromName: 'Maison Fleur', sizePct: 17.5, contactsCount: 4340, conversions: 188, totalRevenue: 7230.0, totalOrders: 188, totalItemsPurchased: 322, totalUniqueItemsPurchased: 280, conversionRate: 4.3, averageOrderValue: 38.5 },
        },
      ],
      details: {
        fromEmail: 'hello@maisonfleur.com', replyTo: 'care@maisonfleur.com', language: 'English', brand: 'Maison Fleur',
        lists: ['Newsletter Opt-in (24,800)'], segments: [], suppressLists: [], suppressSecureLists: [], suppressSegments: [], suppressJourneys: [], campaignTags: ['Promo_2026'],
      },
    },
    {
      id: 2, campaignId: 202, name: 'Loyalty Upgrade — CTA Copy Test',
      contacts: 8600, sent: 8600, delivered: 8531, opens: 3910, clicks: 1422, bounces: 69, revenue: 18740.0,
      sentAt: '2026-08-07T03:16:00', updatedAt: '2026-08-07T01:33:00',
      variants: [
        {
          id: 1, name: 'Loyalty Upgrade | Final Campaign', kind: 'final', decidedBy: 'TopChoice',
          totalSent: 5160, sentAt: '2026-08-07T03:16:00',
          metrics: abCells(5160, { delivered: 5122, totalOpens: 2410, uniqueOpens: 2189, totalClicks: 902, uniqueClicks: 816, bounced: 38, softBounced: 27, hardBounced: 11, unsubscribed: 14, complaints: 1 }),
          overview: { sendTime: '2026-08-07T03:16:00', subject: 'You unlocked Gold status', preHeader: 'Here is what changes', contentName: null, fromName: 'Peak Supply Co.', sizePct: 60, contactsCount: 5160, conversions: 402, totalRevenue: 11780.0, totalOrders: 402, totalItemsPurchased: 610, totalUniqueItemsPurchased: 555, conversionRate: 7.8, averageOrderValue: 29.3 },
        },
        {
          id: 2, name: 'Loyalty Upgrade - A', kind: 'A',
          totalSent: 1720, sentAt: '2026-08-05T03:00:00',
          metrics: abCells(1720, { delivered: 1706, totalOpens: 780, uniqueOpens: 702, totalClicks: 268, uniqueClicks: 241, bounced: 14, softBounced: 10, hardBounced: 4, unsubscribed: 4, complaints: 0 }),
          overview: { sendTime: '2026-08-05T03:00:00', subject: 'You unlocked Gold status', preHeader: 'Here is what changes', contentName: 'Loyalty Tier Announcement', fromName: 'Peak Supply Co.', sizePct: 20, contactsCount: 1720, conversions: 121, totalRevenue: 3480.0, totalOrders: 121, totalItemsPurchased: 180, totalUniqueItemsPurchased: 166, conversionRate: 7.0, averageOrderValue: 28.8 },
        },
        {
          id: 3, name: 'Loyalty Upgrade - B', kind: 'B',
          totalSent: 1720, sentAt: '2026-08-06T03:10:00',
          metrics: abCells(1720, { delivered: 1703, totalOpens: 720, uniqueOpens: 651, totalClicks: 252, uniqueClicks: 227, bounced: 17, softBounced: 12, hardBounced: 5, unsubscribed: 5, complaints: 0 }),
          overview: { sendTime: '2026-08-06T03:10:00', subject: 'Gold status: claim your perks', preHeader: 'Members-only pricing inside', contentName: 'Loyalty Tier Announcement', fromName: 'Peak Supply Co.', sizePct: 20, contactsCount: 1720, conversions: 108, totalRevenue: 3480.0, totalOrders: 108, totalItemsPurchased: 161, totalUniqueItemsPurchased: 149, conversionRate: 6.3, averageOrderValue: 32.2 },
        },
      ],
      details: {
        fromEmail: 'club@peaksupply.co', replyTo: 'support@peaksupply.co', language: 'English', brand: 'Peak Supply Co.',
        lists: ['Loyalty Members (8,600)'], segments: ['Gold Tier Candidates'], suppressLists: [], suppressSecureLists: [], suppressSegments: [], suppressJourneys: ['Win-back 90d'], campaignTags: ['Retention'],
      },
    },
    {
      id: 3, campaignId: 203, name: 'Holiday Preview — Hero Image Test',
      contacts: 45200, sent: 12040, delivered: 11907, opens: 4310, clicks: 1287, bounces: 133, revenue: 9840.25,
      sentAt: null, updatedAt: '2026-07-27T07:05:00',
      variants: [
        {
          id: 1, name: 'Holiday Preview | Final Campaign', kind: 'final', decidedBy: 'TopChoice',
          totalSent: 0, sentAt: null,
          metrics: abCells(0, { delivered: 0, totalOpens: 0, uniqueOpens: 0, totalClicks: 0, uniqueClicks: 0, bounced: 0, softBounced: 0, hardBounced: 0, unsubscribed: 0, complaints: 0 }),
          overview: { sendTime: null, subject: 'A first look at the holiday edit', preHeader: 'Before anyone else', contentName: null, fromName: 'North & Main', sizePct: 73.4, contactsCount: 33160, conversions: 0, totalRevenue: 0, totalOrders: 0, totalItemsPurchased: 0, totalUniqueItemsPurchased: 0, conversionRate: 0, averageOrderValue: 0 },
        },
        {
          id: 2, name: 'Holiday Preview - A', kind: 'A',
          totalSent: 6020, sentAt: '2026-07-25T09:00:00',
          metrics: abCells(6020, { delivered: 5961, totalOpens: 2210, uniqueOpens: 1998, totalClicks: 671, uniqueClicks: 602, bounced: 59, softBounced: 41, hardBounced: 18, unsubscribed: 11, complaints: 1 }),
          overview: { sendTime: '2026-07-25T09:00:00', subject: 'A first look at the holiday edit', preHeader: 'Before anyone else', contentName: 'Holiday Hero — Lifestyle', fromName: 'North & Main', sizePct: 13.3, contactsCount: 6020, conversions: 210, totalRevenue: 5120.25, totalOrders: 210, totalItemsPurchased: 340, totalUniqueItemsPurchased: 302, conversionRate: 3.5, averageOrderValue: 24.4 },
        },
        {
          id: 3, name: 'Holiday Preview - B', kind: 'B',
          totalSent: 6020, sentAt: '2026-07-26T09:00:00',
          metrics: abCells(6020, { delivered: 5946, totalOpens: 2100, uniqueOpens: 1876, totalClicks: 616, uniqueClicks: 549, bounced: 74, softBounced: 50, hardBounced: 24, unsubscribed: 13, complaints: 0 }),
          overview: { sendTime: '2026-07-26T09:00:00', subject: 'A first look at the holiday edit', preHeader: 'Before anyone else', contentName: 'Holiday Hero — Product Grid', fromName: 'North & Main', sizePct: 13.3, contactsCount: 6020, conversions: 195, totalRevenue: 4720.0, totalOrders: 195, totalItemsPurchased: 311, totalUniqueItemsPurchased: 270, conversionRate: 3.2, averageOrderValue: 24.2 },
        },
      ],
      details: {
        fromEmail: 'news@northandmain.com', replyTo: 'news@northandmain.com', language: 'English', brand: 'North & Main',
        lists: ['Master Subscriber List (45,200)'], segments: [], suppressLists: ['Do Not Contact'], suppressSecureLists: [], suppressSegments: [], suppressJourneys: [], campaignTags: ['Newsletter'],
      },
    },
    {
      id: 4, campaignId: 204, name: 'Re-Engagement — Incentive Test',
      contacts: 4200, sent: 4200, delivered: 4098, opens: 921, clicks: 240, bounces: 102, revenue: 2210.0,
      sentAt: '2026-06-30T08:50:00', updatedAt: '2026-06-30T08:50:00',
      variants: [
        {
          id: 1, name: 'Re-Engagement | Final Campaign', kind: 'final', decidedBy: 'TopChoice',
          totalSent: 2520, sentAt: '2026-06-30T08:50:00',
          metrics: abCells(2520, { delivered: 2451, totalOpens: 540, uniqueOpens: 489, totalClicks: 141, uniqueClicks: 128, bounced: 69, softBounced: 47, hardBounced: 22, unsubscribed: 30, complaints: 3 }),
          overview: { sendTime: '2026-06-30T08:50:00', subject: 'We saved you 15% — come back', preHeader: 'Your code inside', contentName: null, fromName: 'Bloom & Bee', sizePct: 60, contactsCount: 2520, conversions: 66, totalRevenue: 1390.0, totalOrders: 66, totalItemsPurchased: 92, totalUniqueItemsPurchased: 88, conversionRate: 2.6, averageOrderValue: 21.1 },
        },
        {
          id: 2, name: 'Re-Engagement - A', kind: 'A',
          totalSent: 840, sentAt: '2026-06-28T08:30:00',
          metrics: abCells(840, { delivered: 824, totalOpens: 201, uniqueOpens: 182, totalClicks: 52, uniqueClicks: 47, bounced: 16, softBounced: 11, hardBounced: 5, unsubscribed: 9, complaints: 1 }),
          overview: { sendTime: '2026-06-28T08:30:00', subject: 'We saved you 15% — come back', preHeader: 'Your code inside', contentName: 'Win-back — Discount', fromName: 'Bloom & Bee', sizePct: 20, contactsCount: 840, conversions: 21, totalRevenue: 410.0, totalOrders: 21, totalItemsPurchased: 30, totalUniqueItemsPurchased: 28, conversionRate: 2.5, averageOrderValue: 19.5 },
        },
        {
          id: 3, name: 'Re-Engagement - B', kind: 'B',
          totalSent: 840, sentAt: '2026-06-29T08:40:00',
          metrics: abCells(840, { delivered: 823, totalOpens: 180, uniqueOpens: 160, totalClicks: 47, uniqueClicks: 42, bounced: 17, softBounced: 12, hardBounced: 5, unsubscribed: 11, complaints: 1 }),
          overview: { sendTime: '2026-06-29T08:40:00', subject: 'Free shipping on your next order', preHeader: 'No code needed', contentName: 'Win-back — Free Shipping', fromName: 'Bloom & Bee', sizePct: 20, contactsCount: 840, conversions: 18, totalRevenue: 410.0, totalOrders: 18, totalItemsPurchased: 26, totalUniqueItemsPurchased: 25, conversionRate: 2.1, averageOrderValue: 22.8 },
        },
      ],
      details: {
        fromEmail: 'hello@bloomandbee.shop', replyTo: 'hello@bloomandbee.shop', language: 'English', brand: 'Bloom & Bee',
        lists: ['Lapsed 90 Days (4,200)'], segments: [], suppressLists: [], suppressSecureLists: [], suppressSegments: ['Recent Purchasers'], suppressJourneys: [], campaignTags: [],
      },
    },
  ])

  function setErfmDates(base: string, comparison: string) {
    erfmBaseDate.value = base
    erfmComparisonDate.value = comparison
  }

  return {
    accountMetrics,
    chartData,
    recurringReports,
    abReports,
    salesChannels,
    rfmAnalyzed,
    rfmSegments,
    customReports,
    transactionalReports,
    websiteReports,
    testCampaignReports,
    erfmBaseDate,
    erfmComparisonDate,
    erfmBaseMatrix,
    erfmComparisonMatrix,
    erfmTransitions,
    erfmPerformanceBase,
    erfmPerformanceComparison,
    erfmGroupAliases,
    erfmSettings,
    saveErfmGroupAliases,
    saveErfmSettings,
    setErfmDates,
  }
})
