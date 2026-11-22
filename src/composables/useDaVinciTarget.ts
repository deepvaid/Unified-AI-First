import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountsStore } from '@/stores/useAccounts'
import { useDashboardsStore } from '@/stores/useDashboards'

/**
 * Which account and dashboard Da Vinci is working on. One resolution for the drawer, the
 * draft cards and the chat chart, so "Add widget" always lands where the merchant expects.
 *
 * Dashboard precedence: the dashboard on screen → the host's explicit target (`hint`) → the
 * one they were last on. Never the account default by accident — that is what the store's
 * `getDashboardById(id, undefined)` silently returns, so every lookup here has a real id.
 */
export function useDaVinciTarget(hint?: {
  accountId?: MaybeRefOrGetter<string | undefined>
  dashboardId?: MaybeRefOrGetter<string | undefined>
}) {
  const route = useRoute()
  const accountsStore = useAccountsStore()
  const dashboardsStore = useDashboardsStore()

  const param = (name: string) => {
    const value = route.params[name]
    return (Array.isArray(value) ? value[0] : value) || undefined
  }

  const isDashboardRoute = computed(() => route.name === 'Dashboard' || route.name === 'DashboardDetail')
  const routeAccountId = computed(() => param('accountId'))

  const account = computed(() => {
    if (!routeAccountId.value) return accountsStore.activeAccount
    return accountsStore.accounts.find((entry) => entry.id === routeAccountId.value) ?? accountsStore.activeAccount
  })

  const accountId = computed(() => routeAccountId.value ?? toValue(hint?.accountId) ?? account.value?.id ?? null)

  const dashboard = computed(() => {
    const id = accountId.value
    if (!id) return null
    // The home route has no dashboardId param: the store resolves that to the account's default.
    if (isDashboardRoute.value) {
      const viewed = dashboardsStore.getDashboardById(id, param('dashboardId'))
      if (viewed) return viewed
    }
    const hinted = toValue(hint?.dashboardId)
    if (hinted) {
      const target = dashboardsStore.getDashboardById(id, hinted)
      if (target) return target
    }
    return dashboardsStore.getLastViewedDashboard(id) ?? null
  })

  return { isDashboardRoute, account, accountId, dashboard }
}
