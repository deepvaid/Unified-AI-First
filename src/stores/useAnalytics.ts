import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  return { accountMetrics, chartData, salesChannels, rfmAnalyzed, rfmSegments, customReports }
})
