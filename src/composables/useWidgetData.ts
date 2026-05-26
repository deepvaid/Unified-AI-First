import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAnalyticsStore } from '@/stores/useAnalytics'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useCommerceStore } from '@/stores/useCommerce'
import { useContactsStore } from '@/stores/useContacts'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { useRetailStore, ASSOCIATE_ROLE_LABELS } from '@/stores/useRetail'
import { useTicketsStore } from '@/stores/useTickets'
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

export function useWidgetData(
  widgetRef: MaybeRefOrGetter<DashboardWidget>,
  filtersRef: MaybeRefOrGetter<DashboardFilterState>,
) {
  const analytics = useAnalyticsStore()
  const campaigns = useCampaignsStore()
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
        return buildKpiData(currentRevenue, pickPreviousValue(filters, currentRevenue, previousRevenue), 'currency', 'Gross revenue in the selected period')
      }
      case 'commerce_orders': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        return buildKpiData(ranges.current.length, pickPreviousValue(filters, ranges.current.length, ranges.previous.length), 'count', 'Orders placed in the selected period')
      }
      case 'commerce_aov': {
        const ranges = sliceRecordsByWindow(commerce.orders, (order) => new Date(order.date ?? ''), dateWindow)
        const current = ranges.current.length
          ? ranges.current.reduce((total, order) => total + parseFloat(order.total), 0) / ranges.current.length
          : 0
        const previous = ranges.previous.length
          ? ranges.previous.reduce((total, order) => total + parseFloat(order.total), 0) / ranges.previous.length
          : 0
        return buildKpiData(current, pickPreviousValue(filters, current, previous), 'currency', 'Average order value for the current period')
      }
      case 'commerce_revenue_over_time': {
        const sorted = [...commerce.orders].sort((left, right) => (left.date ?? '').localeCompare(right.date ?? '')).slice(-days)
        const labels = sorted.map((order) => (order.date ?? '').slice(5) || '--')
        const values = sorted.map((order) => parseFloat(order.total))
        return buildSeriesData(labels, values, 'currency', 'Revenue')
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
            { key: 'total', label: 'Total', align: 'end' },
            { key: 'status', label: 'Status' },
          ],
          rows,
        )
      }
      case 'marketing_open_rate': {
        const sentCampaigns = campaigns.campaigns.filter((campaign) => campaign.status === 'Sent')
        const current = sentCampaigns.length
          ? sentCampaigns.reduce((total, campaign) => total + (campaign.metrics.opens / Math.max(campaign.metrics.sent, 1)) * 100, 0) / sentCampaigns.length
          : 0
        return buildKpiData(current, current - 1.8, 'percent', 'Average open rate across sent campaigns')
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
            grouped.set(campaign.folder, (grouped.get(campaign.folder) ?? 0) + campaign.metrics.revenue)
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
            revenue: `$${campaign.metrics.revenue.toLocaleString()}`,
          }))
        return buildTableData(
          [
            { key: 'campaign', label: 'Campaign' },
            { key: 'status', label: 'Status' },
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
            count: segment.count.toLocaleString(),
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
        const sentCampaigns = [...campaigns.campaigns]
          .filter((c) => c.status === 'Sent')
          .sort((a, b) => (a.sentDate ?? '').localeCompare(b.sentDate ?? ''))
          .slice(-7)
        const labels = sentCampaigns.map((c) => c.sentDate?.slice(5) ?? '--')
        const sentData = sentCampaigns.map((c) => c.metrics.sent)
        const deliveredData = sentCampaigns.map((c) => Math.round(c.metrics.sent * 0.97))
        return {
          kind: 'series',
          unit: 'count',
          labels,
          series: [
            { name: 'Sent', data: sentData },
            { name: 'Delivered', data: deliveredData },
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
            sent: c.metrics.sent.toLocaleString(),
            delivered: Math.round(c.metrics.sent * 0.97).toLocaleString(),
            opens: `${((c.metrics.opens / Math.max(c.metrics.sent, 1)) * 100).toFixed(0)}%`,
            clicks: `${((c.metrics.clicks / Math.max(c.metrics.opens, 1)) * 100).toFixed(0)}%`,
            revenue: `$${c.metrics.revenue.toLocaleString()}`,
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
        const sentCampaigns = campaigns.campaigns.filter((c) => c.status === 'Sent')
        const totalSent = sentCampaigns.reduce((t, c) => t + c.metrics.sent, 0)
        const totalDelivered = sentCampaigns.reduce((t, c) => t + Math.round(c.metrics.sent * 0.97), 0)
        const score = totalSent ? Math.round((totalDelivered / totalSent) * 10) : 10
        return buildKpiData(score, score - 0.2, 'count', `${score} / 10 deliverability health`)
      }
      case 'contacts_by_domain': {
        const domainCounts = new Map<string, number>()
        contacts.contacts.forEach((c) => {
          const domain = c.email?.split('@')[1] ?? 'unknown'
          domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1)
        })
        const sorted = [...domainCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
        return buildSeriesData(sorted.map(([d]) => d), sorted.map(([, v]) => v), 'count', 'Contacts')
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
            { metric: 'Unique Subscribers', value: subscribed.toLocaleString() },
            { metric: 'Unique Unsubscribers', value: unsubscribed.toLocaleString() },
            { metric: 'Net Growth/Attrition', value: (net >= 0 ? '+' : '') + net.toLocaleString() },
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
            const txns = retail.transactionList.filter((t) => t.locationId === loc.id && t.status === 'completed')
            return { label: loc.name, value: txns.reduce((s, t) => s + t.total, 0) }
          })
          .sort((a, b) => b.value - a.value)
        return buildSeriesData(rows.map((r) => r.label), rows.map((r) => r.value), 'currency', 'Revenue')
      }
      case 'retail_top_skus': {
        const tally = new Map<string, { count: number; revenue: number }>()
        const skus = ['TEE-001-BLK-M', 'JEAN-512-DRK-32', 'SNEAK-A1-WHT-10', 'CAP-001-NVY', 'BAG-LTH-BLK'] as const
        retail.transactionList.forEach((t) => {
          if (t.status !== 'completed') return
          const sku = skus[Number(t.id.slice(-1)) % skus.length]!
          const row = tally.get(sku) ?? { count: 0, revenue: 0 }
          row.count += t.itemCount
          row.revenue += t.total
          tally.set(sku, row)
        })
        const rows = Array.from(tally.entries())
          .map(([sku, v]) => ({ sku, units: v.count.toLocaleString(), revenue: `$${v.revenue.toLocaleString()}` }))
          .sort((a, b) => Number(b.revenue.replace(/[^0-9.-]/g, '')) - Number(a.revenue.replace(/[^0-9.-]/g, '')))
          .slice(0, 6)
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
        const rows = retail.associateList
          .map((a) => {
            const txns = retail.transactionList.filter((t) => t.associateId === a.id && t.status === 'completed')
            return {
              associate: a.name,
              role: ASSOCIATE_ROLE_LABELS[a.role],
              transactions: txns.length,
              revenue: txns.reduce((s, t) => s + t.total, 0),
            }
          })
          .filter((r) => r.transactions > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((r) => ({
            associate: r.associate,
            role: r.role,
            transactions: r.transactions.toLocaleString(),
            revenue: `$${r.revenue.toLocaleString()}`,
          }))
        return buildTableData(
          [
            { key: 'associate', label: 'Associate' },
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
      default:
        return buildKpiData(0, 0, 'count', 'No data available for this widget')
    }
  })

  return {
    data,
    loading: computed(() => false),
  }
}
