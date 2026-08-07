import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAnalyticsStore } from '@/stores/useAnalytics'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useFoldersStore } from '@/stores/useFolders'
import { useCommerceStore } from '@/stores/useCommerce'
import { useContactsStore } from '@/stores/useContacts'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { useRetailStore, STAFF_ROLE_LABELS } from '@/stores/useRetail'
import { useTicketsStore } from '@/stores/useTickets'
import {
  DOTTED_BLUES,
  DOTTED_PIE_BLUES,
  FUNNEL_GRADIENT_STOPS,
  STACK_BLUES,
  TREND_CURRENT,
  TREND_PREVIOUS,
} from '@/components/dashboards/dotted/dottedChartMath'
import type {
  DashboardFilterState,
  DashboardMetricUnit,
  DashboardWidget,
  DashboardWidgetData,
  DashboardTableColumn,
} from '@/stores/dashboards/types'

function formatNumber(value: number, unit: DashboardMetricUnit): string {
  if (unit === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value)
  }

  if (unit === 'percent') {
    return `${value.toFixed(1)}%`
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
  }).format(value)
}

/** Compact count for donut centres and their legends: 40K · 24.9K · 812. */
function formatCompactCount(value: number): string {
  if (value < 1000) return `${Math.round(value)}`
  const thousands = value / 1000
  return `${thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, '') : Math.round(thousands)}K`
}

interface DateWindow {
  currentStart: Date
  currentEnd: Date
  previousStart: Date
  previousEnd: Date
  days: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function parseDateInput(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY) + 1)
}

function getDateWindow(filters: DashboardFilterState): DateWindow {
  const today = startOfDay(new Date())
  let currentStart = addDays(today, -29)
  let currentEnd = today

  switch (filters.rangePreset) {
    case 'today':
      currentStart = today
      currentEnd = today
      break
    case 'yesterday':
      currentStart = addDays(today, -1)
      currentEnd = addDays(today, -1)
      break
    case 'last_7_days':
      currentStart = addDays(today, -6)
      currentEnd = today
      break
    case 'last_90_days':
      currentStart = addDays(today, -89)
      currentEnd = today
      break
    case 'month_to_date':
      currentStart = new Date(today.getFullYear(), today.getMonth(), 1)
      currentEnd = today
      break
    case 'quarter_to_date': {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
      currentStart = new Date(today.getFullYear(), quarterStartMonth, 1)
      currentEnd = today
      break
    }
    case 'year_to_date':
      currentStart = new Date(today.getFullYear(), 0, 1)
      currentEnd = today
      break
    case 'black_friday_cyber_monday': {
      const targetYear = today.getMonth() >= 10 ? today.getFullYear() : today.getFullYear() - 1
      currentStart = new Date(targetYear, 10, 28)
      currentEnd = new Date(targetYear, 11, 1)
      break
    }
    case 'custom':
      currentStart = parseDateInput(filters.startDate, currentStart)
      currentEnd = parseDateInput(filters.endDate, currentEnd)
      break
    case 'last_30_days':
    default:
      currentStart = addDays(today, -29)
      currentEnd = today
      break
  }

  if (currentStart > currentEnd) {
    const previous = currentStart
    currentStart = currentEnd
    currentEnd = previous
  }

  const days = daysBetween(currentStart, currentEnd)
  return {
    currentStart: startOfDay(currentStart),
    currentEnd: endOfDay(currentEnd),
    previousStart: startOfDay(addDays(currentStart, -days)),
    previousEnd: endOfDay(addDays(currentStart, -1)),
    days,
  }
}

function percentageDelta(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

function buildKpiData(value: number, previous: number, unit: DashboardMetricUnit, helperText: string): DashboardWidgetData {
  const delta = percentageDelta(value, previous)
  return {
    kind: 'kpi',
    unit,
    value,
    formattedValue: formatNumber(value, unit),
    delta,
    deltaLabel: delta == null ? 'New in range' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
    helperText,
  }
}

function buildSeriesData(labels: string[], data: number[], unit: DashboardMetricUnit, name: string): DashboardWidgetData {
  return {
    kind: 'series',
    unit,
    labels,
    series: [{ name, data }],
  }
}

function buildTableData(columns: DashboardTableColumn[], rows: Array<Record<string, string | number>>): DashboardWidgetData {
  return {
    kind: 'table',
    columns,
    rows,
  }
}

function sliceRecordsByWindow<T>(records: T[], dateGetter: (record: T) => Date, window: DateWindow): { current: T[]; previous: T[] } {
  return {
    current: records.filter((record) => {
      const date = dateGetter(record)
      return date >= window.currentStart && date <= window.currentEnd
    }),
    previous: records.filter((record) => {
      const date = dateGetter(record)
      return date >= window.previousStart && date <= window.previousEnd
    }),
  }
}

function pickPreviousValue(filters: DashboardFilterState, current: number, previous: number): number {
  if (filters.comparison === 'none') return current
  return previous
}

/** Per-day value buckets for the current and previous windows (both `days` long). */
function bucketDaily<T>(
  records: T[],
  dateGetter: (record: T) => Date,
  valueGetter: (record: T) => number,
  window: DateWindow,
): { cur: number[]; prev: number[] } {
  const cur = new Array<number>(window.days).fill(0)
  const prev = new Array<number>(window.days).fill(0)
  records.forEach((record) => {
    const date = dateGetter(record)
    if (Number.isNaN(date.getTime())) return
    if (date >= window.currentStart && date <= window.currentEnd) {
      const index = Math.floor((startOfDay(date).getTime() - window.currentStart.getTime()) / MS_PER_DAY)
      if (index >= 0 && index < window.days) cur[index] = (cur[index] ?? 0) + valueGetter(record)
    } else if (date >= window.previousStart && date <= window.previousEnd) {
      const index = Math.floor((startOfDay(date).getTime() - window.previousStart.getTime()) / MS_PER_DAY)
      if (index >= 0 && index < window.days) prev[index] = (prev[index] ?? 0) + valueGetter(record)
    }
  })
  return { cur, prev }
}

/** Deterministic series shaped like `template`, centered on `mid` (± spread/2). */
function wobbleSeries(template: number[], mid: number, spread: number): number[] {
  const mx = Math.max(...template)
  const mn = Math.min(...template)
  const d = mx - mn || 1
  return template.map((v) => mid * (1 - spread / 2 + spread * ((v - mn) / d)))
}

function signedPct(current: number, previous: number): { text: string; positive: boolean } {
  if (!previous) return { text: 'New in range', positive: current >= 0 }
  const delta = ((current - previous) / previous) * 100
  return { text: `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}%`, positive: delta >= 0 }
}

function comparisonVsLabels(filters: DashboardFilterState, days: number): { vsLabel: string; vsLabelLong: string } {
  switch (filters.comparison) {
    case 'none':
      return { vsLabel: '', vsLabelLong: 'no comparison' }
    case 'previous_year':
      return { vsLabel: 'vs same period last year', vsLabelLong: 'compared with the same period last year' }
    case 'custom':
      return { vsLabel: 'vs custom period', vsLabelLong: 'compared with the custom period' }
    case 'previous_period':
    default:
      return { vsLabel: `vs prev ${days} days`, vsLabelLong: `compared with the previous ${days} days` }
  }
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Five evenly spaced "Jul 3"-style labels across the current window. */
function windowAxisLabels(window: DateWindow): string[] {
  return [0, 0.25, 0.5, 0.75, 1].map((fraction) =>
    shortDate(new Date(window.currentStart.getTime() + fraction * (window.days - 1) * MS_PER_DAY)),
  )
}

/** One "Jul 3"-style label per day in the current window (hover tooltip). */
function windowPointLabels(window: DateWindow): string[] {
  return Array.from({ length: window.days }, (_, index) =>
    shortDate(new Date(window.currentStart.getTime() + index * MS_PER_DAY)),
  )
}

export function useWidgetData(
  widgetRef: MaybeRefOrGetter<DashboardWidget>,
  filtersRef: MaybeRefOrGetter<DashboardFilterState>,
) {
  const analytics = useAnalyticsStore()
  const campaigns = useCampaignsStore()
  const folders = useFoldersStore()
  const commerce = useCommerceStore()
  const contacts = useContactsStore()
  const merchandising = useMerchandisingStore()
  const retail = useRetailStore()
  const tickets = useTicketsStore()

  const data = computed<DashboardWidgetData>(() => {
    const widget = toValue(widgetRef)
    const filters = toValue(filtersRef)
    const dateWindow = getDateWindow(filters)
    const days = dateWindow.days

    switch (widget.metricId) {
      case 'commerce_revenue': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const currentRevenue = ranges.current.reduce((total, order) => total + parseFloat(order.total), 0)
        const previousRevenue = ranges.previous.reduce((total, order) => total + parseFloat(order.total), 0)
        const kpi = buildKpiData(currentRevenue, pickPreviousValue(filters, currentRevenue, previousRevenue), 'currency', 'Gross revenue in the selected period')
        const { cur } = bucketDaily(commerce.orders, (order) => new Date(order.date ?? ''), (order) => parseFloat(order.total), dateWindow)
        return { ...kpi, sparkline: cur } as DashboardWidgetData
      }
      case 'commerce_orders': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const kpi = buildKpiData(ranges.current.length, pickPreviousValue(filters, ranges.current.length, ranges.previous.length), 'count', 'Orders placed in the selected period')
        const { cur } = bucketDaily(commerce.orders, (order) => new Date(order.date ?? ''), () => 1, dateWindow)
        return { ...kpi, sparkline: cur } as DashboardWidgetData
      }
      case 'commerce_aov': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const current = ranges.current.length
          ? ranges.current.reduce((total, order) => total + parseFloat(order.total), 0) / ranges.current.length
          : 0
        const previous = ranges.previous.length
          ? ranges.previous.reduce((total, order) => total + parseFloat(order.total), 0) / ranges.previous.length
          : 0
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'currency', 'Average order value for the current period')
        const orderDate = (order: (typeof commerce.orders)[number]) => new Date(order.date ?? '')
        const revenueByDay = bucketDaily(commerce.orders, orderDate, (order) => parseFloat(order.total), dateWindow).cur
        const ordersByDay = bucketDaily(commerce.orders, orderDate, () => 1, dateWindow).cur
        return {
          ...kpi,
          sparkline: revenueByDay.map((revenue, index) => (ordersByDay[index] ? revenue / ordersByDay[index]! : 0)),
        } as DashboardWidgetData
      }
      case 'commerce_conversion_rate': {
        // TODO(mock): replace with real sessions/conversion data when a traffic source exists.
        return buildKpiData(2.6, pickPreviousValue(filters, 2.6, 2.42), 'percent', 'Sessions that converted to an order')
      }
      case 'commerce_revenue_over_time': {
        // One point per calendar day (the old per-order points made the x-axis lie).
        const orderDate = (order: (typeof commerce.orders)[number]) => new Date(order.date ?? '')
        const { cur, prev } = bucketDaily(commerce.orders, orderDate, (order) => parseFloat(order.total), dateWindow)
        const revenueSeries: DashboardWidgetData = {
          kind: 'series',
          unit: 'currency',
          labels: windowPointLabels(dateWindow),
          series: [
            { name: 'Revenue', data: cur },
            // Shopify-style dashed previous-period line (aligned day-by-day).
            ...(filters.comparison === 'none' ? [] : [{ name: 'Previous period', data: prev, isComparison: true }]),
          ],
        }
        return revenueSeries
      }
      case 'commerce_revenue_by_channel': {
        const channels = ['Online Store', 'Instagram Shop', 'Marketplace', 'POS']
        const totals = new Map<string, number>(channels.map((channel) => [channel, 0]))
        commerce.orders.forEach((order) => {
          const channel = channels[order.id % channels.length] ?? 'Online Store'
          totals.set(channel, (totals.get(channel) ?? 0) + parseFloat(order.total))
        })
        return buildSeriesData(channels, channels.map((channel) => totals.get(channel) ?? 0), 'currency', 'Revenue')
      }
      case 'commerce_recent_orders': {
        const rows = [...commerce.orders]
          .sort((left, right) => (right.date ?? '').localeCompare(left.date ?? ''))
          .slice(0, 6)
          .map((order) => ({
            order: order.orderNumber,
            customer: order.customer.name,
            total: `$${order.total}`,
            status: order.status ?? 'Unknown',
          }))
        return buildTableData(
          [
            { key: 'order', label: 'Order' },
            { key: 'customer', label: 'Customer' },
            { key: 'status', label: 'Status', cellType: 'status', statusType: 'order' },
            { key: 'total', label: 'Total', align: 'end' },
          ],
          rows,
        )
      }
      case 'marketing_open_rate': {
        const sentCampaigns = campaigns.campaigns.filter((campaign) => campaign.status === 'Sent')
        const current = sentCampaigns.length
          ? sentCampaigns.reduce((total, campaign) => total + (campaign.metrics.opens / Math.max(campaign.metrics.sent, 1)) * 100, 0) / sentCampaigns.length
          : 0
        const kpi = buildKpiData(current, current - 1.8, 'percent', 'Average open rate across sent campaigns')
        const perCampaign = [...sentCampaigns]
          .sort((a, b) => (a.sentDate ?? '').localeCompare(b.sentDate ?? ''))
          .map((campaign) => (campaign.metrics.opens / Math.max(campaign.metrics.sent, 1)) * 100)
        return { ...kpi, sparkline: perCampaign } as DashboardWidgetData
      }
      case 'marketing_click_rate': {
        const sentCampaigns = campaigns.campaigns.filter((campaign) => campaign.status === 'Sent')
        const current = sentCampaigns.length
          ? sentCampaigns.reduce((total, campaign) => total + (campaign.metrics.clicks / Math.max(campaign.metrics.opens, 1)) * 100, 0) / sentCampaigns.length
          : 0
        return buildKpiData(current, current - 1.2, 'percent', 'Average click-through rate across sent campaigns')
      }
      case 'marketing_sends': {
        const sentCampaigns = campaigns.campaigns.filter((campaign) => campaign.status === 'Sent')
        const current = sentCampaigns.reduce((total, campaign) => total + campaign.metrics.sent, 0)
        return buildKpiData(current, current * 0.92, 'count', 'Delivered campaign sends')
      }
      case 'marketing_open_rate_over_time': {
        const sentCampaigns = [...campaigns.campaigns]
          .filter((campaign) => campaign.status === 'Sent')
          .sort((left, right) => (left.sentDate ?? '').localeCompare(right.sentDate ?? ''))
          .slice(-7)
        const labels = sentCampaigns.map((campaign) => campaign.sentDate?.slice(5) ?? '--')
        const values = sentCampaigns.map((campaign) => (campaign.metrics.opens / Math.max(campaign.metrics.sent, 1)) * 100)
        return buildSeriesData(labels, values, 'percent', 'Open Rate')
      }
      case 'marketing_campaign_revenue': {
        const grouped = new Map<string, number>()
        campaigns.campaigns
          .filter((campaign) => campaign.status === 'Sent')
          .forEach((campaign) => {
            const folderName = folders.getFolder(campaign.folderId)?.name ?? 'Unfiled'
            grouped.set(folderName, (grouped.get(folderName) ?? 0) + campaign.metrics.revenue)
          })
        const labels = Array.from(grouped.keys())
        return buildSeriesData(labels, labels.map((label) => grouped.get(label) ?? 0), 'currency', 'Revenue')
      }
      case 'marketing_top_campaigns': {
        const rows = [...campaigns.campaigns]
          .filter((campaign) => campaign.status === 'Sent')
          .sort((left, right) => right.metrics.revenue - left.metrics.revenue)
          .slice(0, 6)
          .map((campaign) => ({
            campaign: campaign.name,
            status: campaign.status,
            openRate: `${((campaign.metrics.opens / Math.max(campaign.metrics.sent, 1)) * 100).toFixed(1)}%`,
            revenue: formatNumber(campaign.metrics.revenue, 'currency'),
          }))
        // dimension 'table' (shadcn Overview seed) opts into a real table with a
        // status chip; without it the campaign/revenue columns keep rendering as
        // the meter list on the older dashboards.
        const statusColumn: DashboardTableColumn = widget.dimension === 'table'
          ? { key: 'status', label: 'Status', cellType: 'status', statusType: 'campaign' }
          : { key: 'status', label: 'Status' }
        return buildTableData(
          [
            { key: 'campaign', label: 'Campaign' },
            statusColumn,
            { key: 'openRate', label: 'Open Rate', align: 'end' },
            { key: 'revenue', label: 'Revenue', align: 'end' },
          ],
          rows,
        )
      }
      case 'analytics_total_revenue':
        return buildKpiData(analytics.accountMetrics.totalRevenue, analytics.accountMetrics.totalRevenue * 0.89, 'currency', 'Attributed revenue from analytics')
      case 'analytics_total_orders':
        return buildKpiData(
          analytics.chartData.reduce((total, point) => total + point.orders, 0),
          analytics.chartData.reduce((total, point) => total + point.orders, 0) * 0.9,
          'count',
          'Orders summarized in analytics',
        )
      case 'analytics_active_subscribers':
        return buildKpiData(analytics.accountMetrics.activeSubscribers, analytics.accountMetrics.activeSubscribers * 0.96, 'count', 'Current active audience')
      case 'analytics_sends_over_time':
        return buildSeriesData(
          analytics.chartData.map((point) => point.date),
          analytics.chartData.map((point) => point.sends),
          'count',
          'Sends',
        )
      case 'contacts_total':
        return buildKpiData(contacts.contacts.length, contacts.contacts.length * 0.94, 'count', 'Total audience records')
      case 'contacts_subscribed': {
        const subscribed = contacts.contacts.filter((contact) => contact.status === 'Subscribed').length
        return buildKpiData(subscribed, subscribed * 0.93, 'count', 'Subscribed contacts in the audience')
      }
      case 'contacts_growth': {
        const sorted = [...contacts.contacts].sort((left, right) => (left.createdAt ?? '').localeCompare(right.createdAt ?? ''))
        const recent = sorted.slice(-7)
        return buildSeriesData(
          recent.map((contact) => (contact.createdAt ?? '').slice(5) || '--'),
          recent.map((_contact, index) => index + 1),
          'count',
          'Contacts',
        )
      }
      case 'contacts_top_segments': {
        const rows = [...contacts.segments]
          .sort((left, right) => right.count - left.count)
          .slice(0, 6)
          .map((segment) => ({
            segment: segment.name,
            count: formatNumber(segment.count, 'count'),
            type: segment.type,
            status: segment.status,
          }))
        return buildTableData(
          [
            { key: 'segment', label: 'Segment' },
            { key: 'count', label: 'Count', align: 'end' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status' },
          ],
          rows,
        )
      }
      case 'service_open_tickets': {
        const openTickets = tickets.tickets.filter((ticket) => ticket.status !== 'Resolved').length
        return buildKpiData(openTickets, openTickets * 1.08, 'count', 'Tickets still requiring action')
      }
      case 'service_resolution_rate': {
        const resolved = tickets.tickets.filter((ticket) => ticket.status === 'Resolved').length
        const rate = tickets.tickets.length ? (resolved / tickets.tickets.length) * 100 : 0
        return buildKpiData(rate, rate - 2.5, 'percent', 'Resolved tickets as a share of total tickets')
      }
      case 'service_ticket_volume': {
        const sorted = [...tickets.tickets].sort((left, right) => (left.createdAt ?? '').localeCompare(right.createdAt ?? '')).slice(-7)
        return buildSeriesData(
          sorted.map((ticket) => new Date(ticket.createdAt ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
          sorted.map((_ticket, index) => index + 1),
          'count',
          'Tickets',
        )
      }
      case 'service_recent_tickets': {
        const rows = [...tickets.tickets]
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
          .slice(0, 6)
          .map((ticket) => ({
            ticket: ticket.number,
            subject: ticket.subject,
            status: ticket.status,
            assignee: ticket.assignee,
          }))
        return buildTableData(
          [
            { key: 'ticket', label: 'Ticket' },
            { key: 'subject', label: 'Subject' },
            { key: 'status', label: 'Status' },
            { key: 'assignee', label: 'Assignee' },
          ],
          rows,
        )
      }
      case 'service_new_tickets': {
        const ranges = sliceRecordsByWindow(tickets.tickets, (t) => new Date(t.createdAt ?? ''), dateWindow)
        return buildKpiData(ranges.current.length, pickPreviousValue(filters, ranges.current.length, ranges.previous.length), 'count', 'Tickets created in the selected period')
      }
      case 'service_pending_tickets': {
        const pending = tickets.tickets.filter((t) => t.status === 'Awaiting Reply' || t.status === 'In Progress').length
        return buildKpiData(pending, pending * 1.1, 'count', 'Tickets waiting or on hold')
      }
      case 'service_unresolved_tickets': {
        const unresolved = tickets.tickets.filter((t) => t.status !== 'Resolved').length
        return buildKpiData(unresolved, unresolved * 1.05, 'count', 'All unresolved tickets')
      }
      case 'service_support_health': {
        const open = tickets.tickets.filter((t) => t.status === 'Open').length
        const unresolved = tickets.tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed')
        const kpi = buildKpiData(open, open * 1.08, 'count', 'Open tickets requiring action')
        if (!unresolved.length) return kpi
        const oldestMs = Math.min(...unresolved.map((t) => new Date(t.createdAt ?? '').getTime()).filter((ms) => !Number.isNaN(ms)))
        const oldestDays = Number.isFinite(oldestMs) ? Math.max(1, Math.round((Date.now() - oldestMs) / MS_PER_DAY)) : null
        return {
          ...kpi,
          secondaryStat: `${unresolved.length} unresolved${oldestDays != null ? ` · oldest ${oldestDays}d` : ''}`,
        } as DashboardWidgetData
      }
      case 'service_tickets_by_channel': {
        const channels = ['Email', 'Inbound call', 'Walk in']
        const counts = channels.map((_channel, i) => {
          const base = tickets.tickets.length
          return Math.round(base * ([0.55, 0.3, 0.15][i] ?? 0))
        })
        return buildSeriesData(channels, counts, 'count', 'Tickets')
      }
      case 'service_tickets_by_type': {
        const typeCounts = new Map<string, number>()
        tickets.tickets.forEach((t) => {
          typeCounts.set(t.category, (typeCounts.get(t.category) ?? 0) + 1)
        })
        const labels = Array.from(typeCounts.keys())
        return buildSeriesData(labels, labels.map((l) => typeCounts.get(l) ?? 0), 'count', 'Tickets')
      }
      case 'marketing_email_volume': {
        // Grouped-bar view (shadcn Overview) shows the last 8 sends so the
        // chart reads as a full comparison; the timeseries view keeps its 7.
        const isBars = widget.type === 'bar'
        const sentCampaigns = [...campaigns.campaigns]
          .filter((c) => c.status === 'Sent')
          .sort((a, b) => (a.sentDate ?? '').localeCompare(b.sentDate ?? ''))
          .slice(isBars ? -8 : -7)
        return {
          kind: 'series',
          unit: 'count',
          labels: sentCampaigns.map((c) => c.sentDate?.slice(5) ?? '--'),
          series: [
            { name: 'Sent', data: sentCampaigns.map((c) => c.metrics.sent) },
            { name: 'Delivered', data: sentCampaigns.map((c) => Math.round(c.metrics.sent * 0.97)) },
          ],
        }
      }
      case 'marketing_recent_campaigns': {
        const rows = [...campaigns.campaigns]
          .filter((c) => c.status === 'Sent')
          .sort((a, b) => (b.sentDate ?? '').localeCompare(a.sentDate ?? ''))
          .slice(0, 5)
          .map((c) => ({
            campaign: c.name,
            status: c.status,
            sent: formatNumber(c.metrics.sent, 'count'),
            delivered: formatNumber(Math.round(c.metrics.sent * 0.97), 'count'),
            opens: `${((c.metrics.opens / Math.max(c.metrics.sent, 1)) * 100).toFixed(0)}%`,
            clicks: `${((c.metrics.clicks / Math.max(c.metrics.opens, 1)) * 100).toFixed(0)}%`,
            revenue: formatNumber(c.metrics.revenue, 'currency'),
          }))
        return buildTableData(
          [
            { key: 'campaign', label: 'Campaign' },
            { key: 'status', label: 'Status' },
            { key: 'sent', label: 'Sent', align: 'end' },
            { key: 'delivered', label: 'Delivered', align: 'end' },
            { key: 'opens', label: 'Opens', align: 'end' },
            { key: 'clicks', label: 'Clicks', align: 'end' },
            { key: 'revenue', label: 'Revenue', align: 'end' },
          ],
          rows,
        )
      }
      case 'marketing_total_campaign_revenue': {
        const sentCampaigns = [...campaigns.campaigns]
          .filter((c) => c.status === 'Sent')
          .sort((a, b) => (a.sentDate ?? '').localeCompare(b.sentDate ?? ''))
          .slice(-7)
        const labels = sentCampaigns.map((c) => c.sentDate?.slice(5) ?? '--')
        const values = sentCampaigns.map((c) => c.metrics.revenue)
        return buildSeriesData(labels, values, 'currency', 'Revenue')
      }
      case 'marketing_deliverability_score': {
        // Sender reputation grade out of 10. A mailbox provider weighs bounce
        // history, complaint rate, and domain authentication alongside raw
        // delivery — restating the seeded 97% delivery rate would peg this at
        // 10/10 (a full ring, which reads as "no data" rather than "healthy").
        const score = 8
        if (widget.type === 'gauge') {
          return {
            kind: 'gauge',
            pct: score * 10,
            centerValue: `${score} / 10`,
            centerCaption: 'score',
            arc: 'three-quarter',
          }
        }
        return buildKpiData(score, score - 0.2, 'count', `${score} / 10 deliverability health`)
      }
      case 'contacts_by_domain': {
        const domainCounts = new Map<string, number>()
        contacts.contacts.forEach((c) => {
          const domain = c.email?.split('@')[1] ?? 'unknown'
          domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1)
        })
        const sorted = [...domainCounts.entries()].sort((a, b) => b[1] - a[1])
        if (widget.type === 'donut') {
          const top = sorted.slice(0, 5)
          return {
            kind: 'donut',
            variant: 'ring',
            segments: top.map(([domain, count]) => ({ label: domain, value: count, formattedValue: formatNumber(count, 'count') })),
            centerValue: formatNumber(contacts.contacts.length, 'count'),
            centerCaption: 'contacts',
          }
        }
        const bars = sorted.slice(0, 6)
        return buildSeriesData(bars.map(([d]) => d), bars.map(([, v]) => v), 'count', 'Contacts')
      }
      case 'contacts_subscriber_summary': {
        const subscribed = contacts.contacts.filter((c) => c.status === 'Subscribed').length
        const unsubscribed = contacts.contacts.filter((c) => c.status === 'Unsubscribed').length
        const net = subscribed - unsubscribed
        return buildTableData(
          [
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value', align: 'end' },
          ],
          [
            { metric: 'Unique Subscribers', value: formatNumber(subscribed, 'count') },
            { metric: 'Unique Unsubscribers', value: formatNumber(unsubscribed, 'count') },
            { metric: 'Net Growth/Attrition', value: (net >= 0 ? '+' : '') + formatNumber(net, 'count') },
          ],
        )
      }
      case 'marketing_live_activity': {
        return {
          kind: 'activity',
          items: [
            { id: 'a1', tag: 'email', icon: 'mail', eyebrow: 'Campaign sent · 2m ago', title: 'Spring Refresh — Segment A', meta: '12,408 recipients' },
            { id: 'a2', tag: 'order', icon: 'shopping-cart', eyebrow: 'Order placed · 6m ago', title: '#A-29481 · Maya Lin', meta: '$248.00' },
            { id: 'a3', tag: 'audience', icon: 'users', eyebrow: 'Segment updated · 14m ago', title: 'VIP repeat buyers', meta: '+312 contacts' },
            { id: 'a4', tag: 'automation', icon: 'zap', eyebrow: 'Automation triggered · 22m ago', title: 'Cart abandoned — Step 2', meta: '84 in flow' },
            { id: 'a5', tag: 'order', icon: 'shopping-cart', eyebrow: 'Order placed · 31m ago', title: '#A-29479 · Theo Park', meta: '$1,120.00' },
          ],
        }
      }
      case 'retail_revenue': {
        const ranges = sliceRecordsByWindow(commerce.orders, (o) => new Date(o.date ?? ''), dateWindow)
        const current = ranges.current.reduce((t, o) => t + parseFloat(o.total), 0) * 0.42
        const previous = ranges.previous.reduce((t, o) => t + parseFloat(o.total), 0) * 0.42
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'currency', 'Retail revenue from POS')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_sale_count': {
        const ranges = sliceRecordsByWindow(commerce.orders, (o) => new Date(o.date ?? ''), dateWindow)
        const current = Math.round(ranges.current.length * 1.6)
        const previous = Math.round(ranges.previous.length * 1.6)
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'count', 'Completed POS sales')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_customer_count': {
        const ranges = sliceRecordsByWindow(commerce.orders, (o) => new Date(o.date ?? ''), dateWindow)
        const uniqueCustomers = new Set(ranges.current.map((o) => o.customer.name)).size
        const previousUnique = new Set(ranges.previous.map((o) => o.customer.name)).size
        const current = Math.max(uniqueCustomers, 1) * 2
        const previous = Math.max(previousUnique, 1) * 2
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'count', 'Unique retail customers')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_gross_profit': {
        const ranges = sliceRecordsByWindow(commerce.orders, (o) => new Date(o.date ?? ''), dateWindow)
        const current = ranges.current.reduce((t, o) => t + parseFloat(o.total), 0) * 0.36 * 0.42
        const previous = ranges.previous.reduce((t, o) => t + parseFloat(o.total), 0) * 0.36 * 0.42
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'currency', 'Revenue minus COGS')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_discounted': {
        const ranges = sliceRecordsByWindow(commerce.orders, (o) => new Date(o.date ?? ''), dateWindow)
        const current = ranges.current.reduce((t, o) => t + parseFloat(o.total), 0) * 0.034
        const previous = ranges.previous.reduce((t, o) => t + parseFloat(o.total), 0) * 0.034
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'currency', 'Discount value applied')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_discounted_pct': {
        const current = 3.33
        const previous = 1.78
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'percent', 'Share of revenue lost to discounts')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_avg_sale_value': {
        const ranges = sliceRecordsByWindow(commerce.orders, (o) => new Date(o.date ?? ''), dateWindow)
        const totalCurrent = ranges.current.reduce((t, o) => t + parseFloat(o.total), 0) * 0.42
        const saleCountCurrent = Math.max(Math.round(ranges.current.length * 1.6), 1)
        const totalPrevious = ranges.previous.reduce((t, o) => t + parseFloat(o.total), 0) * 0.42
        const saleCountPrevious = Math.max(Math.round(ranges.previous.length * 1.6), 1)
        const current = totalCurrent / saleCountCurrent
        const previous = totalPrevious / saleCountPrevious
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'currency', 'Average basket value')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_avg_items_per_sale': {
        const current = 1.95
        const previous = 1.0
        const kpi = buildKpiData(current, pickPreviousValue(filters, current, previous), 'count', 'Average items per sale')
        return { ...kpi, location: 'Newmarket, AKL' } as DashboardWidgetData
      }
      case 'retail_sales_today': {
        const k = retail.kpis
        return buildKpiData(k.salesToday, pickPreviousValue(filters, k.salesToday, k.salesYesterday), 'currency', 'Sales today across all stores')
      }
      case 'retail_avg_basket': {
        const k = retail.kpis
        const previous = k.avgBasket / (1 + k.avgBasketTrend / 100)
        return buildKpiData(k.avgBasket, pickPreviousValue(filters, k.avgBasket, previous), 'currency', 'Average basket per transaction')
      }
      case 'retail_returns_today': {
        const k = retail.kpis
        return buildKpiData(k.returnsToday, pickPreviousValue(filters, k.returnsToday, Math.round(k.returnsToday * 0.85)), 'count', 'Refunds and partial refunds today')
      }
      case 'retail_sales_by_location': {
        const rows = retail.locationList
          .map((loc) => {
            const sales = commerce.posOrders.filter((o) => o.pos?.locationId === loc.id && o.status === 'Completed')
            return { label: loc.name, value: sales.reduce((s, o) => s + parseFloat(o.total), 0) }
          })
          .sort((a, b) => b.value - a.value)
        return buildSeriesData(rows.map((r) => r.label), rows.map((r) => r.value), 'currency', 'Revenue')
      }
      case 'retail_top_skus': {
        const tally = new Map<string, { count: number; revenue: number }>()
        commerce.posOrders.forEach((o) => {
          if (o.status !== 'Completed') return
          o.lineItems.forEach((li) => {
            const row = tally.get(li.sku) ?? { count: 0, revenue: 0 }
            row.count += li.qty
            row.revenue += li.qty * parseFloat(li.price)
            tally.set(li.sku, row)
          })
        })
        const rows = Array.from(tally.entries())
          .sort(([, a], [, b]) => b.revenue - a.revenue)
          .slice(0, 6)
          .map(([sku, v]) => ({ sku, units: formatNumber(v.count, 'count'), revenue: formatNumber(v.revenue, 'currency') }))
        return buildTableData(
          [
            { key: 'sku', label: 'SKU' },
            { key: 'units', label: 'Units', align: 'end' },
            { key: 'revenue', label: 'Revenue', align: 'end' },
          ],
          rows,
        )
      }
      case 'retail_top_associates': {
        const rows = retail.staffList
          .map((a) => {
            const sales = commerce.posOrders.filter((o) => o.pos?.staffId === a.id && o.status === 'Completed')
            return {
              staff: a.name,
              role: STAFF_ROLE_LABELS[a.role],
              transactions: sales.length,
              revenue: sales.reduce((s, o) => s + parseFloat(o.total), 0),
            }
          })
          .filter((r) => r.transactions > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((r) => ({
            staff: r.staff,
            role: r.role,
            transactions: formatNumber(r.transactions, 'count'),
            revenue: formatNumber(r.revenue, 'currency'),
          }))
        return buildTableData(
          [
            { key: 'staff', label: 'Staff' },
            { key: 'role', label: 'Role' },
            { key: 'transactions', label: 'Txns', align: 'end' },
            { key: 'revenue', label: 'Revenue', align: 'end' },
          ],
          rows,
        )
      }
      case 'merch_total_revenue': {
        const a = merchandising.analytics
        const previous = a.totalRevenue / (1 + a.totalRevenueTrend / 100)
        return buildKpiData(a.totalRevenue, pickPreviousValue(filters, a.totalRevenue, previous), 'currency', 'Storefront revenue across all channels')
      }
      case 'merch_cloud_revenue': {
        const a = merchandising.analytics
        const previous = a.merchCloudRevenue / (1 + a.merchCloudRevenueTrend / 100)
        return buildKpiData(a.merchCloudRevenue, pickPreviousValue(filters, a.merchCloudRevenue, previous), 'currency', 'Revenue from MerchCloud-driven sessions')
      }
      case 'merch_cloud_share': {
        const a = merchandising.analytics
        const previous = a.merchCloudShare - a.merchCloudShareTrend
        return buildKpiData(a.merchCloudShare, pickPreviousValue(filters, a.merchCloudShare, previous), 'percent', 'MerchCloud share of total revenue')
      }
      case 'merch_aov': {
        const a = merchandising.analytics
        const previous = a.avgOrderValue / (1 + a.avgOrderValueTrend / 100)
        return buildKpiData(a.avgOrderValue, pickPreviousValue(filters, a.avgOrderValue, previous), 'currency', 'Average order value')
      }
      case 'merch_revenue_trend': {
        const trend = merchandising.analytics.revenueTrend.slice(-days)
        const labels = trend.map((p) => p.date.slice(5))
        return {
          kind: 'series',
          unit: 'currency',
          labels,
          series: [
            { name: 'Total revenue', data: trend.map((p) => p.total) },
            { name: 'MerchCloud-driven', data: trend.map((p) => p.merchCloud) },
          ],
        }
      }
      case 'merch_contribution': {
        const data = merchandising.analytics.contribution
        return buildSeriesData(data.map((d) => d.label), data.map((d) => d.value), 'currency', 'Revenue')
      }
      case 'demo_channel_trend': {
        // Deterministic multi-series demo (6 channels) — exercises all palette colors + a legend.
        const points = Math.min(Math.max(days, 6), 12)
        const labels = Array.from({ length: points }, (_, i) => `W${i + 1}`)
        const channels = [
          { name: 'Direct', base: 8200, amp: 900, phase: 0 },
          { name: 'Email', base: 6400, amp: 1200, phase: 1 },
          { name: 'Paid Search', base: 5200, amp: 800, phase: 2 },
          { name: 'Social', base: 3800, amp: 1400, phase: 3 },
          { name: 'Organic', base: 4600, amp: 700, phase: 4 },
          { name: 'Referral', base: 2400, amp: 600, phase: 5 },
        ]
        const channelSeries = channels.map((c) => ({
          name: c.name,
          data: labels.map((_, i) => Math.round(c.base + c.amp * Math.sin((i + c.phase) * 0.6) + i * 60)),
        }))
        // "Compare" view (widget.type === 'bar'): one total bar per channel,
        // summed from the same generated points so both views always agree.
        if (widget.type === 'bar') {
          return {
            kind: 'series',
            unit: 'currency',
            labels: channelSeries.map((s) => s.name),
            series: [{ name: 'Revenue', data: channelSeries.map((s) => s.data.reduce((total, value) => total + value, 0)) }],
          }
        }
        return {
          kind: 'series',
          unit: 'currency',
          labels,
          series: channelSeries,
        }
      }
      case 'demo_channel_mix': {
        // Single-series 6-slice donut — every slice recolors with the palette.
        const mix = [
          { label: 'Direct', value: 31 },
          { label: 'Email', value: 24 },
          { label: 'Paid Search', value: 17 },
          { label: 'Social', value: 12 },
          { label: 'Organic', value: 10 },
          { label: 'Referral', value: 6 },
        ]
        return {
          kind: 'series',
          unit: 'percent',
          labels: mix.map((m) => m.label),
          series: [{ name: 'Share', data: mix.map((m) => m.value) }],
        }
      }
      case 'overview_metric_explorer': {
        // Composite KPI-strip + chart payload. Always daily buckets (grain is
        // intentionally ignored, like the standalone KPI widgets).
        const orderDate = (order: (typeof commerce.orders)[number]) => new Date(order.date ?? '')
        const revenue = bucketDaily(commerce.orders, orderDate, (order) => parseFloat(order.total), dateWindow)
        const orderCounts = bucketDaily(commerce.orders, orderDate, () => 1, dateWindow)
        const compareOff = filters.comparison === 'none'

        const revTotal = revenue.cur.reduce((a, b) => a + b, 0)
        const revPrevTotal = revenue.prev.reduce((a, b) => a + b, 0)
        const orderTotal = orderCounts.cur.reduce((a, b) => a + b, 0)
        const orderPrevTotal = orderCounts.prev.reduce((a, b) => a + b, 0)
        const aov = orderTotal ? revTotal / orderTotal : 0
        const aovPrev = orderPrevTotal ? revPrevTotal / orderPrevTotal : 0
        const aovSeries = (rev: number[], counts: number[], fallback: number) =>
          rev.map((value, index) => ((counts[index] ?? 0) > 0 ? value / (counts[index] ?? 1) : fallback))
        // TODO(mock): conversion pair mirrors commerce_conversion_rate until a traffic source exists.
        const conv = 2.6
        const convPrev = 2.42

        const deltaOf = (current: number, previous: number) => {
          if (compareOff) return { text: '', positive: true }
          return signedPct(current, previous)
        }
        const convDelta = compareOff
          ? { text: '', positive: true }
          : { text: `${conv >= convPrev ? '+' : '−'}${Math.abs(conv - convPrev).toFixed(1)} pp`, positive: conv >= convPrev }

        return {
          kind: 'metric_explorer',
          ...comparisonVsLabels(filters, days),
          xLabels: windowAxisLabels(dateWindow),
          pointLabels: windowPointLabels(dateWindow),
          metrics: [
            {
              key: 'revenue', label: 'Revenue', sub: 'Daily net revenue', unit: 'currency',
              value: revTotal, formattedValue: formatNumber(revTotal, 'currency'),
              ...(() => { const d = deltaOf(revTotal, revPrevTotal); return { delta: d.text, deltaPositive: d.positive } })(),
              cur: revenue.cur, prev: revenue.prev, zeroBased: true,
            },
            {
              key: 'orders', label: 'Orders', sub: 'Orders placed per day', unit: 'count',
              value: orderTotal, formattedValue: formatNumber(orderTotal, 'count'),
              ...(() => { const d = deltaOf(orderTotal, orderPrevTotal); return { delta: d.text, deltaPositive: d.positive } })(),
              cur: orderCounts.cur, prev: orderCounts.prev, zeroBased: true,
            },
            {
              key: 'aov', label: 'Average order value', sub: 'Average order value per day', unit: 'currency',
              value: aov, formattedValue: formatNumber(aov, 'currency'),
              ...(() => { const d = deltaOf(aov, aovPrev); return { delta: d.text, deltaPositive: d.positive } })(),
              cur: aovSeries(revenue.cur, orderCounts.cur, aov), prev: aovSeries(revenue.prev, orderCounts.prev, aovPrev), zeroBased: false,
            },
            {
              key: 'conv', label: 'Conversion rate', sub: 'Visit-to-order conversion', unit: 'percent',
              value: conv, formattedValue: `${conv.toFixed(1)}%`,
              delta: convDelta.text, deltaPositive: convDelta.positive,
              cur: wobbleSeries(revenue.cur, conv, 0.5), prev: wobbleSeries(revenue.prev, convPrev, 0.5), zeroBased: false,
            },
          ],
        }
      }
      case 'overview_campaign_funnel': {
        // TODO(mock): fixture stage counts until cross-cloud funnel data exists.
        const stages = [
          { label: 'Emails sent', value: 9840 },
          { label: 'Opened', value: 5370 },
          { label: 'Clicked through', value: 1150 },
          { label: 'Store sessions', value: 870 },
          { label: 'Added to cart', value: 248 },
          { label: 'Orders placed', value: 10 },
        ]
        const first = stages[0]?.value ?? 1
        return {
          kind: 'funnel',
          stages: stages.map((stage, index) => ({
            label: stage.label,
            formattedValue: formatNumber(stage.value, 'count'),
            share: index === 0 ? '100%' : `${((stage.value / first) * 100).toFixed(stage.value / first < 0.01 ? 2 : 1)}%`,
            pct: stage.value / first,
            accent: index === stages.length - 1,
          })),
          footerStats: [
            { label: 'Attributed revenue', value: '$4,450' },
            { label: 'Share of store revenue', value: '21.9%' },
            { label: 'Cart to order', value: '4.0%' },
          ],
          warning: 'Biggest drop-off: opened → clicked, 78.6% lost',
        }
      }
      case 'commerce_revenue_attribution': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const total = ranges.current.reduce((sum, order) => sum + parseFloat(order.total), 0)
        // TODO(mock): fixed channel ratios until attribution data exists (demo_channel_mix precedent).
        const channels: Array<[string, number]> = [
          ['Direct', 0.31], ['Email', 0.219], ['Paid search', 0.17],
          ['Social', 0.12], ['Organic', 0.10], ['Referral', 0.081],
        ]
        const sentCampaigns = campaigns.campaigns.filter((c) => c.status === 'Sent')
        const openRate = sentCampaigns.length
          ? sentCampaigns.reduce((sum, c) => sum + (c.metrics.opens / Math.max(c.metrics.sent, 1)) * 100, 0) / sentCampaigns.length
          : 0
        return {
          kind: 'donut',
          variant: 'ring',
          segments: channels.map(([label, share]) => ({
            label,
            value: total * share,
            formattedValue: `${formatNumber(total * share, 'currency')} · ${(share * 100).toFixed(share * 100 % 1 ? 1 : 0)}%`,
          })),
          centerValue: formatNumber(total, 'currency'),
          centerCaption: 'attributed',
          footerStats: [
            { label: 'Email open rate', value: `${openRate.toFixed(1)}%` },
            { label: 'Total contacts', value: formatNumber(contacts.contacts.length, 'count') },
          ],
        }
      }
      case 'commerce_orders_by_channel': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const channels = ['Online store', 'POS retail', 'Marketplace', 'Social shop']
        const counts = channels.map(() => 0)
        // Bucket by the order's actual sales channel — `id % channels.length`
        // produced a synthetic even split that hid the real mix.
        const channelIndex = (order: { salesChannel?: string }): number => {
          if (order.salesChannel === 'Online Store') return 0
          if (order.salesChannel === 'POS') return 1
          if (order.salesChannel === 'Instagram Shop') return 3
          return 2
        }
        ranges.current.forEach((order) => {
          const index = channelIndex(order)
          counts[index] = (counts[index] ?? 0) + 1
        })
        const revenue = ranges.current.reduce((sum, order) => sum + parseFloat(order.total), 0)
        const aov = ranges.current.length ? revenue / ranges.current.length : 0
        return {
          kind: 'donut',
          variant: 'pie',
          segments: channels.map((label, index) => ({
            label,
            value: counts[index] ?? 0,
            formattedValue: formatNumber(counts[index] ?? 0, 'count'),
          })),
          footerStats: [
            { label: 'Fastest growing', value: 'Marketplace' },
            { label: 'Average order value', value: formatNumber(aov, 'currency') },
          ],
        }
      }
      case 'commerce_new_vs_returning': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        // "Returning" = repeat buyer (more than one order on record) — the mock
        // orders all sit inside one window, so a strictly-before-window check
        // would always yield zero.
        const orderCounts = new Map<string, number>()
        commerce.orders.forEach((order) => {
          orderCounts.set(order.customer.name, (orderCounts.get(order.customer.name) ?? 0) + 1)
        })
        const returning = ranges.current.filter((order) => (orderCounts.get(order.customer.name) ?? 0) > 1).length
        const firstTime = ranges.current.length - returning
        const returningPct = ranges.current.length ? Math.round((returning / ranges.current.length) * 100) : 0
        return {
          kind: 'donut',
          variant: 'ring',
          segments: [
            { label: 'Returning customers', value: returning, formattedValue: `${formatNumber(returning, 'count')} orders` },
            { label: 'First-time buyers', value: firstTime, formattedValue: `${formatNumber(firstTime, 'count')} orders` },
          ],
          centerValue: `${returningPct}%`,
          centerCaption: 'returning',
        }
      }
      case 'commerce_customers_over_time': {
        // Buyers per day split by whether they had bought before. The mock
        // storefront books ~1 order/day, which would plot as a 0/1/2 staircase —
        // so the per-day *shape* comes from real daily revenue (the same
        // deterministic series Revenue over time draws) converted to a buyer
        // count, with the recurring share ramping across the window the way a
        // maturing store's does. Same window ⇒ same chart, no randomness.
        const orderDate = (order: (typeof commerce.orders)[number]) => new Date(order.date ?? '')
        const { cur } = bucketDaily(commerce.orders, orderDate, (order) => parseFloat(order.total), dateWindow)
        const REVENUE_PER_CUSTOMER = 24
        const firstTime: number[] = []
        const recurring: number[] = []
        cur.forEach((revenue, index) => {
          const customers = Math.max(4, Math.round(revenue / REVENUE_PER_CUSTOMER))
          const recurringShare = 0.3 + 0.14 * (index / Math.max(1, cur.length - 1))
          const repeat = Math.round(customers * recurringShare)
          recurring.push(repeat)
          firstTime.push(customers - repeat)
        })
        return {
          kind: 'series',
          unit: 'count',
          labels: windowPointLabels(dateWindow),
          // Stack order = series order: first-time buyers sit on the baseline.
          series: [
            { name: 'First time', data: firstTime },
            { name: 'Recurring', data: recurring },
          ],
        }
      }
      case 'commerce_sales_by_product': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const revenue = ranges.current.reduce((sum, order) => sum + parseFloat(order.total), 0)
        // TODO(mock): fixed product mix. The generated line items cycle evenly
        // through 40 SKUs, so a real top-5 tally would leave "Other" at ~80% of
        // the bar; the shares below keep the window's real revenue total.
        const MIX = [
          { name: 'Nike Air Max 270', share: 0.28 },
          { name: 'Sony WH-1000XM5', share: 0.21 },
          { name: 'Hydro Flask 32oz', share: 0.16 },
          { name: 'YETI Rambler 20oz', share: 0.12 },
          { name: 'Kindle Paperwhite', share: 0.09 },
          { name: 'Other products', share: 0.14 },
        ]
        const rows = MIX.map((entry) => ({ name: entry.name, value: Math.round(revenue * entry.share) }))
        const grandTotal = Math.max(1, rows.reduce((sum, row) => sum + row.value, 0))
        return {
          kind: 'stacked_bar',
          variant: 'bar',
          buckets: [{
            label: 'Selected period',
            segments: rows.map((row) => ({
              key: row.name,
              value: row.value,
              formattedValue: formatNumber(row.value, 'currency'),
            })),
          }],
          legend: rows.map((row) => ({
            key: row.name,
            label: row.name,
            total: formatNumber(row.value, 'currency'),
            pct: Math.round((row.value / grandTotal) * 100),
          })),
        }
      }
      case 'commerce_revenue_goal': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const revenue = ranges.current.reduce((sum, order) => sum + parseFloat(order.total), 0)
        // TODO(mock): $1,000/day goal until goals are configurable.
        const goal = days * 1000
        const pct = Math.min(100, Math.round((revenue / goal) * 100))
        const daysLeft = Math.max(1, Math.round(days * 0.15))
        return {
          kind: 'gauge',
          pct,
          centerValue: `${pct}%`,
          centerCaption: `of ${formatNumber(goal, 'currency')}`,
          footerStats: [
            { label: 'Pace per day', value: formatNumber(revenue / days, 'currency') },
            { label: 'Needed per day', value: formatNumber(Math.max(0, goal - revenue) / daysLeft, 'currency') },
          ],
        }
      }
      case 'overview_tabs': {
        const orderRows = [...commerce.orders]
          .sort((left, right) => (right.date ?? '').localeCompare(left.date ?? ''))
          .slice(0, 5)
          .map((order) => ({
            order: order.orderNumber,
            customer: order.customer.name,
            status: order.status ?? 'Unknown',
            total: formatNumber(parseFloat(order.total), 'currency'),
          }))
        const sentCampaigns = [...campaigns.campaigns]
          .filter((c) => c.status === 'Sent')
          .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
          .slice(0, 4)
        const maxRevenue = Math.max(...sentCampaigns.map((c) => c.metrics.revenue), 1)
        return {
          kind: 'tabs',
          orders: orderRows,
          activity: [
            { id: 'a1', tag: 'email', icon: 'send', eyebrow: '2m ago', title: 'Spring Refresh — Segment A sent', meta: '2,400 recipients' },
            { id: 'a2', tag: 'order', icon: 'shopping-bag', eyebrow: '6m ago', title: 'Order #A-29481 placed by Maya Lin', meta: '$248.00 · paid' },
            { id: 'a3', tag: 'audience', icon: 'users', eyebrow: '14m ago', title: 'Segment ‘VIP repeat buyers’ updated', meta: '+312 contacts' },
            { id: 'a4', tag: 'automation', icon: 'zap', eyebrow: '22m ago', title: 'Automation ‘Cart abandoned — Step 2’ triggered', meta: '84 contacts in flow' },
            { id: 'a5', tag: 'order', icon: 'shopping-bag', eyebrow: '31m ago', title: 'Order #A-29479 placed by Theo Park', meta: '$96.40 · paid' },
          ],
          campaigns: sentCampaigns.map((c) => ({
            name: c.name,
            revenue: formatNumber(c.metrics.revenue, 'currency'),
            pct: Math.round((c.metrics.revenue / maxRevenue) * 100),
            meta: `${((c.metrics.opens / Math.max(c.metrics.sent, 1)) * 100).toFixed(1)}% open rate · ${formatNumber(c.metrics.sent, 'count')} sent`,
          })),
          campaignsCaption: `Last ${days} days · by attributed revenue`,
        }
      }
      case 'commerce_best_sellers': {
        const tally = new Map<string, { units: number; revenue: number }>()
        commerce.posOrders.forEach((order) => {
          if (order.status !== 'Completed') return
          order.lineItems.forEach((li) => {
            const key = li.product || li.sku
            const row = tally.get(key) ?? { units: 0, revenue: 0 }
            row.units += li.qty
            row.revenue += li.qty * parseFloat(li.price)
            tally.set(key, row)
          })
        })
        const top = Array.from(tally.entries())
          .sort(([, a], [, b]) => b.revenue - a.revenue)
          .slice(0, 4)
        const max = Math.max(...top.map(([, v]) => v.revenue), 1)
        return {
          kind: 'bar_list',
          rows: top.map(([name, v]) => ({
            label: name,
            value: formatNumber(v.revenue, 'currency'),
            pct: Math.round((v.revenue / max) * 100),
            meta: `${formatNumber(v.units, 'count')} units`,
          })),
        }
      }
      case 'retail_today_breakdown': {
        const k = retail.kpis
        const delta = signedPct(k.salesToday, k.salesYesterday)
        const rows = retail.locationList
          .map((loc) => {
            const sales = commerce.posOrders.filter((o) => o.pos?.locationId === loc.id && o.status === 'Completed')
            return { label: loc.name, value: sales.reduce((sum, o) => sum + parseFloat(o.total), 0) }
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
        const max = Math.max(...rows.map((r) => r.value), 1)
        return {
          kind: 'bar_list',
          headline: { value: formatNumber(k.salesToday, 'currency'), delta: delta.text, deltaPositive: delta.positive },
          rows: rows.map((row) => ({
            label: row.label,
            value: formatNumber(row.value, 'currency'),
            pct: Math.round((row.value / max) * 100),
          })),
        }
      }
      case 'commerce_fulfillment_queue': {
        // Queue statuses → MpStatusChip fulfillment map entries.
        const chipStatus: Record<string, string> = {
          Picked: 'Picking',
          Packed: 'Packed',
          'Label Created': 'Ready to ship',
          Shipped: 'Shipped',
        }
        const counts = new Map<string, number>()
        commerce.fulfillments.forEach((item) => {
          counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
        })
        return {
          kind: 'breakdown',
          rows: Array.from(counts.entries()).map(([status, count]) => ({
            label: status,
            value: formatNumber(count, 'count'),
            chip: { status: chipStatus[status] ?? status, type: 'fulfillment' },
          })),
          linkLabel: 'Open fulfillment',
        }
      }
      case 'service_tickets_breakdown': {
        const open = tickets.tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed')
        const awaiting = tickets.tickets.filter((t) => t.status === 'Awaiting Reply').length
        const slaCutoff = Date.now() - 48 * 60 * 60 * 1000
        const breaching = open.filter((t) => new Date(t.createdAt ?? '').getTime() < slaCutoff).length
        const resolved = tickets.tickets.filter((t) => t.status === 'Resolved').length
        return {
          kind: 'breakdown',
          headline: { value: formatNumber(open.length, 'count'), caption: 'open tickets' },
          rows: [
            { label: 'Awaiting your reply', value: formatNumber(awaiting, 'count') },
            // Red only when there is actually something breaching — a red zero is noise.
            { label: 'Breaching SLA', value: formatNumber(breaching, 'count'), tone: breaching > 0 ? 'alert' : 'default' },
            { label: 'Resolved today', value: formatNumber(resolved, 'count') },
          ],
          linkLabel: 'Open ticket queue',
        }
      }
      case 'marketing_deliverability_breakdown': {
        const sentCampaigns = campaigns.campaigns.filter((c) => c.status === 'Sent')
        const totalSent = sentCampaigns.reduce((sum, c) => sum + c.metrics.sent, 0)
        const delivered = totalSent ? 97 + (totalSent % 13) / 10 : 98.2
        return {
          kind: 'breakdown',
          headline: { value: `${delivered.toFixed(1)}%`, caption: 'delivered' },
          progress: { pct: delivered, tone: 'green' },
          rows: [
            { label: 'Bounce rate', value: `${(100 - delivered - 0.6).toFixed(1)}%` },
            // TODO(mock): fixture complaint/unsub rates until send telemetry exists.
            { label: 'Spam complaints', value: '0.04%' },
            { label: 'Unsubscribes', value: '0.31%' },
          ],
          warning: 'DKIM not verified on 1 sending domain',
        }
      }
      case 'marketing_journeys_in_flight': {
        const rows = [...campaigns.journeys]
          .filter((journey) => journey.status !== 'Draft')
          .map((journey) => ({
            journey,
            inFlight: Math.max(0, journey.enrolled - journey.completed),
            conversion: journey.enrolled ? (journey.completed / journey.enrolled) * 100 : 0,
          }))
          .sort((a, b) => b.inFlight - a.inFlight)
          .slice(0, 4)
        return {
          kind: 'breakdown',
          rows: rows.map(({ journey, inFlight, conversion }) => ({
            label: journey.name.split(' — ')[0] ?? journey.name,
            meta: journey.status === 'Paused'
              ? 'Paused · needs review'
              : `${journey.trigger} · ${conversion.toFixed(1)}% conversion`,
            value: formatNumber(inFlight, 'count'),
            tone: journey.status === 'Paused' ? 'warning' : 'success',
          })),
          linkLabel: 'View all journeys',
        }
      }
      case 'commerce_channel_weekly': {
        const WEEKS = 6
        const dayMs = 86400000
        const todayStart = new Date(new Date().toDateString()).getTime()
        // Three legends off the structured channel identity: own storefront,
        // marketplaces (Amazon/eBay/Instagram), and register sales.
        const SERIES = [
          { key: 'online', label: 'Online store', channelType: 'web_store' },
          { key: 'marketplace', label: 'Marketplace', channelType: 'marketplace' },
          { key: 'instore', label: 'In store', channelType: 'offline_store' },
        ] as const
        const buckets = Array.from({ length: WEEKS }, (_, index) => ({
          label: new Date(todayStart - (WEEKS - 1 - index) * 7 * dayMs - 6 * dayMs)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          totals: SERIES.map(() => 0),
        }))
        commerce.orders.forEach((order) => {
          const time = new Date(order.date ?? '').getTime()
          if (Number.isNaN(time)) return
          const weekIndex = Math.floor((todayStart - time) / (7 * dayMs))
          if (weekIndex < 0 || weekIndex >= WEEKS) return
          const seriesIndex = SERIES.findIndex((series) => series.channelType === order.channelType)
          if (seriesIndex < 0) return
          const bucket = buckets[WEEKS - 1 - weekIndex]!
          bucket.totals[seriesIndex] = (bucket.totals[seriesIndex] ?? 0) + Math.max(0, parseFloat(order.total))
        })
        const seriesTotals = SERIES.map((_, index) =>
          buckets.reduce((sum, bucket) => sum + (bucket.totals[index] ?? 0), 0),
        )
        const grandTotal = seriesTotals.reduce((sum, value) => sum + value, 0)
        return {
          kind: 'stacked_bar',
          buckets: buckets.map((bucket) => ({
            label: bucket.label,
            segments: SERIES.map((series, index) => ({
              key: series.key,
              value: bucket.totals[index] ?? 0,
              formattedValue: formatNumber(bucket.totals[index] ?? 0, 'currency'),
            })),
          })),
          legend: SERIES.map((series, index) => ({
            key: series.key,
            label: series.label,
            total: formatNumber(seriesTotals[index] ?? 0, 'currency'),
            pct: grandTotal ? Math.round(((seriesTotals[index] ?? 0) / grandTotal) * 100) : 0,
          })),
        }
      }
      case 'analytics_sessions_by_device': {
        // TODO(mock): closed-form until a traffic source exists. Deterministic
        // by construction — the only input is the window length.
        const total = 1340 * days
        const DEVICES = [
          { label: 'Mobile', share: 0.62, delta: 5.2 },
          { label: 'Desktop', share: 0.29, delta: -2.1 },
          { label: 'Tablet', share: 0.06, delta: 1.4 },
          { label: 'Other', share: 0.03, delta: 8.3 },
        ]
        return {
          kind: 'donut',
          variant: 'ring',
          segments: DEVICES.map((device) => {
            const value = Math.round(total * device.share)
            return {
              label: device.label,
              value,
              formattedValue: formatCompactCount(value),
              delta: `${device.delta >= 0 ? '↗' : '↘'} ${Math.abs(device.delta).toFixed(1)}%`,
              deltaPositive: device.delta >= 0,
            }
          }),
          centerValue: formatCompactCount(total),
          centerCaption: 'sessions',
        }
      }
      case 'analytics_sessions_by_country': {
        // TODO(mock): closed-form until a traffic source exists — a fixed sine
        // per market so the stack has real shape and never moves between runs.
        const WEEKS = 6
        const MARKETS = [
          { name: 'United States', base: 4200, amp: 620, phase: 0 },
          { name: 'Canada', base: 2400, amp: 380, phase: 1.4 },
          { name: 'United Kingdom', base: 1700, amp: 300, phase: 2.6 },
          { name: 'France', base: 900, amp: 210, phase: 3.9 },
        ]
        const labels = Array.from({ length: WEEKS }, (_, index) =>
          shortDate(new Date(dateWindow.currentEnd.getTime() - (WEEKS - 1 - index) * 7 * MS_PER_DAY)),
        )
        return {
          kind: 'series',
          unit: 'count',
          labels,
          series: MARKETS.map((market) => ({
            name: market.name,
            data: labels.map((_, index) =>
              Math.round(market.base + market.amp * Math.sin((index + market.phase) * 0.7) + index * 55),
            ),
          })),
        }
      }
      case 'design_palette': {
        const groups = [
          { title: 'Trend lines', caption: 'Store performance — current / previous', shades: [TREND_CURRENT, TREND_PREVIOUS] },
          { title: 'Stacked bars', caption: 'Revenue by channel', shades: [...STACK_BLUES] },
          { title: 'Ring & donut ramp', caption: 'Revenue attribution', shades: [...DOTTED_BLUES] },
          { title: 'Pie ramp', caption: 'Orders by sales channel', shades: [...DOTTED_PIE_BLUES] },
          { title: 'Funnel gradient', caption: 'Campaign to purchase', shades: FUNNEL_GRADIENT_STOPS.map((stop) => stop.color) },
        ]
        const total = groups.reduce((sum, group) => sum + group.shades.length, 0)
        return {
          kind: 'palette',
          groups,
          footnote: `${total} shades across ${groups.length} chart families`,
        }
      }
      case 'overview_attention': {
        const now = Date.now()
        const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString()
        return {
          kind: 'attention',
          items: [
            {
              id: 'att-payments',
              severity: 'critical',
              title: '3 payments failed in the last 24h',
              context: 'Retry or contact the customers before the orders auto-cancel.',
              occurredAt: hoursAgo(2),
              actionLabel: 'Review',
              dataSource: 'commerce',
              routeName: 'SalesOrders',
              icon: 'credit-card',
            },
            {
              id: 'att-stock',
              severity: 'warning',
              title: 'Low stock: 2 of your top 10 sellers',
              context: 'Trail Runner XT and Canvas Tote are below their reorder point.',
              occurredAt: hoursAgo(5),
              actionLabel: 'View products',
              dataSource: 'commerce',
              routeName: 'ProductsList',
              icon: 'package',
            },
            {
              id: 'att-approval',
              severity: 'info',
              title: 'Campaign ‘Spring Refresh’ pending approval',
              context: 'Scheduled to send tomorrow at 9:00 AM once approved.',
              occurredAt: hoursAgo(26),
              actionLabel: 'Approve',
              dataSource: 'marketing',
              routeName: 'EmailCampaigns',
              icon: 'mail',
            },
            {
              id: 'att-dns',
              severity: 'warning',
              title: 'Sending domain DNS not verified',
              context: 'Unverified DKIM records hurt deliverability on every send.',
              occurredAt: hoursAgo(72),
              actionLabel: 'Fix',
              dataSource: 'marketing',
              routeName: 'CampaignReports',
              icon: 'shield-alert',
            },
          ],
        }
      }
      case 'davinci_insights': {
        return {
          kind: 'insights',
          items: [
            {
              id: 'ins-carts',
              observation: 'Cart abandonment is up 14% on mobile since Tuesday',
              stat: '312 carts, $8.4k est. value',
              actionLabel: 'Investigate',
              routeName: 'OrdersReport',
            },
            {
              id: 'ins-subject',
              observation: 'Campaigns with question-style subject lines opened 9% more this month',
              stat: '6 of your last 20 sends, avg 31.2% open rate',
              actionLabel: 'View campaigns',
              routeName: 'CampaignReports',
            },
            {
              id: 'ins-vip',
              observation: 'Your VIP repeat buyers segment grew twice as fast as the overall list',
              stat: '+312 contacts in 30 days',
              actionLabel: 'View segment',
              routeName: 'Segments',
            },
          ],
        }
      }
      default:
        return buildKpiData(0, 0, 'count', 'No data available for this widget')
    }
  })

  return {
    data,
    loading: computed(() => false),
  }
}
