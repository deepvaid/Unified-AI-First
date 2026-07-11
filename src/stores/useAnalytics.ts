import { defineStore } from 'pinia'
import { ref } from 'vue'

// --- Shared date-range presets (legacy "Select Date Range" parity) ---
export type DateRangePreset = 'Last 7 days' | 'Last 30 days' | 'Last 90 days' | 'This month' | 'This year'

export const dateRangePresets: DateRangePreset[] = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This month', 'This year']

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

export type CustomReportType = 'SMS Message' | 'Deliverability' | 'Campaign Based' | 'SMS Report'
export type CustomReportScheduleMode = 'Once' | 'Recurring'

export interface CustomReport {
  id: number
  name: string
  source: 'Commerce' | 'Marketing' | 'Contacts' | 'Service'
  visualization: 'Bar' | 'Line' | 'Area' | 'Table' | 'Pie' | 'Funnel'
  metric: string
  dimension: string
  schedule: 'None' | 'Daily' | 'Weekly' | 'Monthly'
  owner: string
  lastRun: string
  status: 'Ready' | 'Running' | 'Scheduled'
  // --- Wizard parity fields (legacy Custom Reports create flow) ---
  reportType?: CustomReportType
  scheduleMode?: CustomReportScheduleMode
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
    { id: 1, name: 'Q3 Revenue by Region',        source: 'Commerce',  visualization: 'Bar',    metric: 'Revenue',            dimension: 'Region',              schedule: 'Weekly',  owner: 'Priya Shah',   lastRun: '2026-07-06', status: 'Ready' },
    { id: 2, name: 'Email Engagement Cohorts',    source: 'Marketing', visualization: 'Line',   metric: 'Open Rate',          dimension: 'Signup Month',        schedule: 'Monthly', owner: 'Dan Rivera',   lastRun: '2026-07-01', status: 'Ready' },
    { id: 3, name: 'Abandoned Cart Funnel',       source: 'Commerce',  visualization: 'Funnel', metric: 'Sessions',           dimension: 'Checkout Step',       schedule: 'Daily',   owner: 'Priya Shah',   lastRun: '2026-07-08', status: 'Scheduled' },
    { id: 4, name: 'LTV by Acquisition Channel',  source: 'Contacts',  visualization: 'Table',  metric: 'Lifetime Value',     dimension: 'Acquisition Channel', schedule: 'None',    owner: 'Mia Chen',     lastRun: '2026-06-28', status: 'Ready' },
    { id: 5, name: 'Subscriber Growth MoM',       source: 'Contacts',  visualization: 'Area',   metric: 'Active Subscribers', dimension: 'Month',               schedule: 'Monthly', owner: 'Dan Rivera',   lastRun: '2026-07-01', status: 'Ready' },
    { id: 6, name: 'Support Volume by Channel',   source: 'Service',   visualization: 'Pie',    metric: 'Tickets',            dimension: 'Channel',             schedule: 'Weekly',  owner: 'Sam Okoye',    lastRun: '2026-07-05', status: 'Ready' },
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
