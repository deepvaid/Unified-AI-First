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

  return {
    accountMetrics,
    chartData,
    salesChannels,
    rfmAnalyzed,
    rfmSegments,
    customReports,
    transactionalReports,
    websiteReports,
    testCampaignReports,
  }
})
