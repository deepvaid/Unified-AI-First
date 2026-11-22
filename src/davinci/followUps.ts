// Suggestions Da Vinci offers: the landing chips and the pills under a result.
//
// Every suggestion is checked against the router before it is offered — a chip must never
// send a prompt that then lands somewhere else ("Segment by region" used to return an
// unrelated canned segment; "Compare to YoY" did nothing). Pure — see tests/davinci/followUps.test.ts.

import type { DashboardWidgetDraft } from '../stores/dashboards/types.ts'
import { routePrompt, type RouteContext } from './promptRouting.ts'
import { optionFor, optionsForMetric } from './widgetRequest.ts'

export interface Suggestion {
  text: string
  icon: string
}

// Candidate pools, most useful first. Anything the account can't draw drops out at routing time.
const LANDING_ON_DASHBOARD = [
  'Show campaign revenue by folder',
  'Show revenue by channel',
  'Top campaigns by revenue',
  'Show ticket volume over time',
  'Show contact growth trend',
]

const LANDING_ELSEWHERE = [
  'Show open rate trend',
  'Create a revenue by channel widget',
  'Add a recent orders table',
  'Show ticket volume over time',
  'Add a top campaigns table',
  'Show contact growth trend',
]

const RELATED_BY_SOURCE: Record<string, string[]> = {
  commerce: ['Show revenue over time', 'Show revenue by channel', 'Add a best sellers widget'],
  marketing: ['Show open rate trend', 'Add a top campaigns table', 'Show email volume as a column chart'],
  contacts: ['Show contact growth trend', 'Show contacts by domain as a donut'],
  service: ['Show ticket volume over time', 'Show tickets by type as a column chart'],
  analytics: ['Show sessions by device as a donut', 'Show RFM heatmap'],
}

const article = (noun: string) => (/^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`)

/** The metric a prompt would draft, or null when it wouldn't reach the widget lane. */
function widgetTarget(prompt: string, ctx: RouteContext) {
  const decision = routePrompt(prompt, ctx)
  return decision.lane === 'widget' ? decision.resolution : null
}

/** Chips for the empty state: drawable right now, on this account. */
export function landingPrompts(ctx: RouteContext): string[] {
  const pool = ctx.onDashboard ? LANDING_ON_DASHBOARD : LANDING_ELSEWHERE
  return pool.filter((prompt) => widgetTarget(prompt, ctx)).slice(0, ctx.onDashboard ? 3 : 4)
}

/** After a widget draft: the other views of the same metric, then related metrics. */
export function draftFollowUps(draft: DashboardWidgetDraft, ctx: RouteContext): Suggestion[] {
  const metric = ctx.metrics.find((m) => m.id === draft.metricId)
  if (!metric) return []
  const current = optionFor(draft.type, draft.chartVariant).key

  const otherViews: Suggestion[] = []
  for (const option of optionsForMetric(metric)) {
    if (option.key === current) continue
    const text = `Show ${metric.defaultTitle.toLowerCase()} as ${article(option.noun)}`
    const resolved = widgetTarget(text, ctx)
    // Only offer a view the router will really draw as asked.
    if (resolved?.metric.id === metric.id && resolved.option.key === option.key) otherViews.push({ text, icon: option.icon })
  }

  const related: Suggestion[] = (RELATED_BY_SOURCE[metric.dataSource] ?? [])
    .filter((text) => {
      const resolved = widgetTarget(text, ctx)
      return !!resolved && resolved.metric.id !== metric.id
    })
    .map((text) => ({ text, icon: 'sparkles' }))

  return [...otherViews.slice(0, 2), ...related].slice(0, 3)
}

/** After the revenue card: longer-range views of the same money. */
export function revenueFollowUps(ctx: RouteContext): Suggestion[] {
  return ['Show revenue over time', 'Show revenue by channel']
    .filter((text) => !!widgetTarget(text, ctx))
    .map((text) => ({ text, icon: 'trending-up' }))
}
