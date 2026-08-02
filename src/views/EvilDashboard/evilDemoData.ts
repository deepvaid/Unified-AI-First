/**
 * Deterministic Maropost-flavored fixtures for the evilcharts-style dashboard.
 * No Math.random / new Date — values are frozen so the page renders identically
 * on every load. Channel revenue mirrors the catalog fixtures used by the
 * shadcn dashboard (ChartLab catalogLabData).
 */

/** Peak Week — weekly contact signups, Organic vs Paid. W08 is the peak (445). */
export const SIGNUPS_WEEKLY = [
  { week: 'W01', organic: 120, paid: 75 },
  { week: 'W02', organic: 150, paid: 88 },
  { week: 'W03', organic: 118, paid: 72 },
  { week: 'W04', organic: 172, paid: 92 },
  { week: 'W05', organic: 132, paid: 78 },
  { week: 'W06', organic: 205, paid: 120 },
  { week: 'W07', organic: 158, paid: 96 },
  { week: 'W08', organic: 260, paid: 185 },
  { week: 'W09', organic: 190, paid: 112 },
  { week: 'W10', organic: 148, paid: 90 },
  { week: 'W11', organic: 186, paid: 104 },
  { week: 'W12', organic: 142, paid: 82 },
]

export const SIGNUPS_PEAK_INDEX = 7

/** Grid Bar Chart — orders per hour of day. Sums to exactly 2,219; peak 14:00. */
export const ORDERS_BY_HOUR = [42, 31, 18, 9, 7, 14, 28, 55, 92, 118, 141, 152, 148, 163, 208, 196, 172, 148, 121, 104, 92, 78, 51, 31]

export const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

/** Dotted line — email opens by device per month. Mobile always leads. */
export const OPENS_BY_DEVICE = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  desktop: [340, 870, 520, 620, 460, 780, 390, 930, 660, 540, 800, 290],
  mobile: [590, 1520, 910, 1150, 880, 1380, 720, 1660, 1160, 1020, 1490, 480],
}

/** Monochrome donut — revenue share by product category ($1.25M total). */
export const REVENUE_BY_CATEGORY = [
  { name: 'Apparel', value: 337500, pct: 27 },
  { name: 'Footwear', value: 262500, pct: 21 },
  { name: 'Accessories', value: 262500, pct: 21 },
  { name: 'Electronics', value: 162500, pct: 13 },
  { name: 'Beauty', value: 150000, pct: 12 },
  { name: 'Other', value: 75000, pct: 6 },
]

/** Gradient donut — revenue mix by sales channel (values mirror catalog fixtures). */
export const REVENUE_MIX = [
  { name: 'Online Store', value: 8940 },
  { name: 'Marketplace', value: 3712 },
  { name: 'Instagram Shop', value: 2858 },
  { name: 'POS', value: 2208 },
]

export const REVENUE_MIX_GRADIENTS: [string, string][] = [
  ['#A855F7', '#7C3AED'], // purple
  ['#6366F1', '#4F46E5'], // indigo
  ['#38BDF8', '#0284C7'], // sky
  ['#34D399', '#059669'], // green
]

/** Half gauge — sender score with rating bands. */
export interface ScoreBand {
  from: number
  to: number
  color: string
}

export const SENDER_SCORE = {
  value: 842,
  max: 1000,
  bands: [
    { from: 0, to: 450, color: '#D64550' },
    { from: 450, to: 650, color: '#E8A13B' },
    { from: 650, to: 820, color: '#8BC34A' },
    { from: 820, to: 1000, color: '#3E8E5A' },
  ] as ScoreBand[],
  status: 'Deliverability is excellent',
  updated: 'Updated 30 Jul 2026',
}

/** Activity rings — open engagement by mail client (% of ring), outermost first. */
export const ENGAGEMENT_RINGS: { name: string; pct: number; gradient: [string, string] }[] = [
  { name: 'Apple Mail', pct: 78, gradient: ['#34D399', '#0D9488'] },
  { name: 'Gmail', pct: 64, gradient: ['#F97316', '#B91C1C'] },
  { name: 'Outlook', pct: 52, gradient: ['#60A5FA', '#4F46E5'] },
  { name: 'Yahoo', pct: 38, gradient: ['#F472B6', '#A855F7'] },
  { name: 'Other', pct: 24, gradient: ['#FBBF24', '#F97316'] },
]

/** Region sales — monthly revenue (dollars) for the top 3 store regions. */
export interface RegionSeries {
  name: string
  color: string
  data: number[]
  total: number
  totalLabel: string
}

const AKL = [66, 67, 80, 55, 58, 90, 84, 72, 68, 66, 65, 62].map((v) => v * 1000)
const WLG = [28, 29, 60, 38, 72, 50, 48, 62, 64, 64, 63, 55].map((v) => v * 1000)
const CHC = [38, 42, 88, 92, 70, 90, 72, 68, 70, 42, 102, 80].map((v) => v * 1000)

function regionTotal(data: number[]): number {
  return data.reduce((a, b) => a + b, 0)
}

export const REGION_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const REGION_SALES: RegionSeries[] = [
  { name: 'Auckland', color: '#4A7CF7', data: AKL, total: regionTotal(AKL), totalLabel: `$${(regionTotal(AKL) / 1_000_000).toFixed(1)}M` },
  { name: 'Wellington', color: '#4BA8C4', data: WLG, total: regionTotal(WLG), totalLabel: `$${(regionTotal(WLG) / 1_000_000).toFixed(1)}M` },
  { name: 'Christchurch', color: '#6366F1', data: CHC, total: regionTotal(CHC), totalLabel: `$${(regionTotal(CHC) / 1_000_000).toFixed(1)}M` },
]
