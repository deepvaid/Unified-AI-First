import { getAvailableMetrics } from '../../src/stores/dashboards/metricCatalog.ts'
import type { RouteContext } from '../../src/davinci/promptRouting.ts'

// Only `subscriptions` matters to the metric catalog.
const account = (subscriptions: string[]) => ({ id: 'test', subscriptions }) as never

/** Every cloud — commerce, retail, merchandising, marketing, analytics, service. */
export const ALL_METRICS = getAvailableMetrics(account(['commerce', 'retail', 'marketing', 'analytics', 'service', 'davinci']))
export const SERVICE_ONLY_METRICS = getAvailableMetrics(account(['service']))
export const MARKETING_ONLY_METRICS = getAvailableMetrics(account(['marketing', 'analytics']))

export function ctx(overrides: Partial<RouteContext> = {}): RouteContext {
  return { onDashboard: true, hasDashboard: true, metrics: ALL_METRICS, dashboardRange: 'last_30_days', ...overrides }
}
