import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountsStore } from '@/stores/useAccounts'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useCommerceStore } from '@/stores/useCommerce'
import { useContactsStore } from '@/stores/useContacts'
import { useDashboardsStore } from '@/stores/useDashboards'
import { useDaVinciSetupStore } from '@/stores/useDaVinciSetup'
import { useOnboardingStore } from '@/stores/useOnboarding'
import { usePlgStore } from '@/stores/usePlg'

// Compact live-workspace context for the Gemini brain — the grounding block the
// Amboras audit called out (docs/davinci-amboras-audit-2026-07.md, P0-3), extended
// with a store snapshot by the 2026-09 copilot audit (F2): until then the model
// knew the page, account and plan but nothing about the merchant's store, so every
// business question got generic best-practice. Plain short lines (never JSON, never
// user-authored text); the server caps the block and appends it to the system
// instruction, so keep the snapshot tight — headline numbers, top three of a list.

/** "SalesOrders" → "Sales Orders" */
function humanizeRouteName(name: unknown): string {
  if (typeof name !== 'string' || !name) return 'the app'
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

const DAY = 86_400_000
const LOW_STOCK_THRESHOLD = 20 // mirrors useCommerce's stockStatus() chip rule

const money = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const count = (value: number) => value.toLocaleString('en-US')
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : 'n/a')

export function useDaVinciContext() {
  const route = useRoute()
  const accountsStore = useAccountsStore()
  const dashboardsStore = useDashboardsStore()
  const commerce = useCommerceStore()
  const contacts = useContactsStore()
  const campaigns = useCampaignsStore()
  const plg = usePlgStore()
  const guide = useOnboardingStore()
  const setup = useDaVinciSetupStore()

  /** The merchant's store, in a dozen lines the model may cite as fact. */
  const storeSnapshot = computed(() => {
    const lines: string[] = []
    const now = Date.now()
    const orderTime = (order: { date?: string }) => new Date(order.date ?? '').getTime()
    const ordersSince = (days: number, until = now + DAY) =>
      commerce.orders.filter((order) => {
        const ts = orderTime(order)
        return ts >= now - days * DAY && ts < until
      })
    const total = (orders: Array<{ total: string }>) => orders.reduce((sum, order) => sum + parseFloat(order.total), 0)

    const last7 = ordersSince(7)
    const prior7 = ordersSince(14, now - 7 * DAY)
    const last30 = ordersSince(30)
    lines.push(
      `Revenue: last 7 days ${money(total(last7))} across ${count(last7.length)} orders (prior 7 days ${money(total(prior7))}); last 30 days ${money(total(last30))} across ${count(last30.length)} orders`,
    )

    const awaitingFulfilment = commerce.orders.filter((order) =>
      ['Not Ready', 'Ready For Fulfillment', 'Unapproved'].includes(order.fulfillmentStatus),
    ).length
    const paymentIssues = commerce.orders.filter((order) =>
      ['Pending', 'Requires Action', 'Not Paid'].includes(order.paymentStatus),
    ).length
    const returns = commerce.orders.filter((order) => order.fulfillmentStatus === 'Return Requested').length
    lines.push(
      `Orders needing action: ${count(awaitingFulfilment)} awaiting fulfilment, ${count(paymentIssues)} with payment pending, ${count(returns)} return requests`,
    )

    const revenueByProduct = new Map<string, number>()
    for (const order of last30) {
      for (const item of order.lineItems ?? []) {
        revenueByProduct.set(item.product, (revenueByProduct.get(item.product) ?? 0) + item.qty * parseFloat(item.price))
      }
    }
    const topSellers = [...revenueByProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    if (topSellers.length) {
      lines.push(`Top sellers (30 days): ${topSellers.map(([name, revenue]) => `${name} ${money(revenue)}`).join(', ')}`)
    }

    const activeProducts = commerce.products.filter((product) => product.status !== 'Archived')
    const lowStock = activeProducts.filter((product) => product.inventory > 0 && product.inventory < LOW_STOCK_THRESHOLD)
    const outOfStock = activeProducts.filter((product) => product.inventory === 0)
    lines.push(
      `Catalog: ${count(activeProducts.length)} products; low stock (<${LOW_STOCK_THRESHOLD}): ${
        lowStock.length
          ? lowStock.slice(0, 3).map((product) => `${product.name} (${product.inventory})`).join(', ') +
            (lowStock.length > 3 ? ` +${lowStock.length - 3} more` : '')
          : 'none'
      }; out of stock: ${count(outOfStock.length)}`,
    )

    const subscribed = contacts.contacts.filter((contact) => contact.status === 'Subscribed').length
    const segmentNames = contacts.segments.slice(0, 3).map((segment) => `${segment.name} (${count(segment.count)})`)
    lines.push(
      `Contacts: ${count(contacts.contacts.length)} total, ${count(subscribed)} subscribed; ${count(contacts.segments.length)} segments incl. ${segmentNames.join(', ')}`,
    )

    const sentCampaigns = campaigns.campaigns
      .filter((campaign) => campaign.status === 'Sent' && campaign.sentDate)
      .sort((a, b) => (b.sentDate ?? '').localeCompare(a.sentDate ?? ''))
    const last = sentCampaigns[0]
    if (last) {
      const m = last.metrics
      lines.push(
        `Last campaign: "${last.name}" sent ${last.sentDate} to ${last.listName} — ${count(m.sent)} sent, open rate ${pct(m.opens, m.sent)}, click rate ${pct(m.clicks, m.sent)}, revenue ${money(m.revenue)}`,
      )
      if (sentCampaigns.length > 1) {
        const avgOpen =
          sentCampaigns.reduce((sum, c) => sum + (c.metrics.sent ? c.metrics.opens / c.metrics.sent : 0), 0) /
          sentCampaigns.length
        lines.push(`Campaign average open rate (${count(sentCampaigns.length)} sent): ${Math.round(avgOpen * 100)}%`)
      }
    }

    const activeJourneys = campaigns.journeys.filter((journey) => journey.status === 'Active')
    lines.push(
      `Journeys: ${count(activeJourneys.length)} active of ${count(campaigns.journeys.length)}${
        activeJourneys.length ? ` (${activeJourneys.slice(0, 3).map((journey) => journey.name).join(', ')})` : ''
      }`,
    )

    lines.push(`Sending domain: ${guide.completed['sending-domain'] ? 'verified' : 'NOT verified (emails may land in spam)'}`)
    return lines
  })

  const contextBlock = computed(() => {
    const account = accountsStore.activeAccount
    const lines: string[] = []

    lines.push(`Current page: ${humanizeRouteName(route.name)}`)
    lines.push(`Account: ${account.name}`)
    lines.push(`Subscribed clouds: ${account.subscriptions.join(', ')}`)

    if (plg.isTrial) {
      lines.push(
        plg.isExpired
          ? 'Plan: free trial — EXPIRED (upgrade required to keep building)'
          : `Plan: free trial — ${plg.daysLeft} day${plg.daysLeft === 1 ? '' : 's'} left`,
      )
    } else {
      const tiers = Object.entries(plg.active.tiers)
        .filter(([, tier]) => tier)
        .map(([cloud, tier]) => `${cloud} ${tier}`)
      if (tiers.length) lines.push(`Plan: paid — ${tiers.join(', ')}`)
    }

    // Guided-setup grounding — lets Gemini anchor open questions to where the
    // merchant is in onboarding (PLG-journey accounts with work left only).
    if (plg.hasExplicitState && !guide.allResolved) {
      const next = guide.taskById(guide.nextTaskId)
      const goalPart = guide.goal ? `goal = ${guide.goal}; ` : ''
      const nextPart = next ? `; next task: "${next.title}" (about ${next.minutes} min)` : ''
      lines.push(`Setup guide: ${goalPart}${guide.doneCount} of ${guide.totalCount} tasks done${nextPart}`)
      const session = setup.activeSession
      if (session && session.stage !== 'complete') {
        const current = guide.taskById(session.currentTaskId)
        lines.push(
          `Da Vinci guided setup session: stage ${session.stage}${current ? `, guiding "${current.title}"` : ''}`,
        )
      }
    }

    const accountId = String(route.params.accountId ?? account.id)
    const dashboardId = route.params.dashboardId ? String(route.params.dashboardId) : undefined
    const dashboard =
      (route.name === 'Dashboard' || route.name === 'DashboardDetail')
        ? (dashboardsStore.getDashboardById(accountId, dashboardId) ?? dashboardsStore.getDefaultDashboard(accountId))
        : null
    if (dashboard) {
      lines.push(`Viewing dashboard: "${dashboard.name}" with ${dashboard.widgets.length} widgets`)
    }

    lines.push('Store snapshot (live, cite freely):')
    lines.push(...storeSnapshot.value.map((line) => `- ${line}`))

    return lines.join('\n')
  })

  return { contextBlock }
}
