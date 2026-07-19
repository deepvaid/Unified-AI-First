import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountsStore } from '@/stores/useAccounts'
import { useDashboardsStore } from '@/stores/useDashboards'
import { usePlgStore } from '@/stores/usePlg'

// Compact live-workspace context for the Gemini brain — the grounding block the
// Amboras audit called out (docs/davinci-amboras-audit-2026-07.md, P0-3). Plain
// short lines (never JSON, never user-authored text); the server caps it at
// 1500 chars and appends it to the system instruction.

/** "SalesOrders" → "Sales Orders" */
function humanizeRouteName(name: unknown): string {
  if (typeof name !== 'string' || !name) return 'the app'
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

export function useDaVinciContext() {
  const route = useRoute()
  const accountsStore = useAccountsStore()
  const dashboardsStore = useDashboardsStore()
  const plg = usePlgStore()

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

    const accountId = String(route.params.accountId ?? account.id)
    const dashboardId = route.params.dashboardId ? String(route.params.dashboardId) : undefined
    const dashboard =
      (route.name === 'Dashboard' || route.name === 'DashboardDetail')
        ? (dashboardsStore.getDashboardById(accountId, dashboardId) ?? dashboardsStore.getDefaultDashboard(accountId))
        : null
    if (dashboard) {
      lines.push(`Viewing dashboard: "${dashboard.name}" with ${dashboard.widgets.length} widgets`)
    }

    return lines.join('\n')
  })

  return { contextBlock }
}
