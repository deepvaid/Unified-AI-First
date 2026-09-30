import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getMetricDescriptor } from '../../src/stores/dashboards/metricCatalog.ts'
import {
  draftForMetric,
  draftFromResolution,
  namesOnlyMetric,
  optionFor,
  optionsForMetric,
  parseWidgetRequest,
  resolveWidgetRequest,
  timeBasisLabel,
} from '../../src/davinci/widgetRequest.ts'
import { ALL_METRICS, MARKETING_ONLY_METRICS, SERVICE_ONLY_METRICS } from './fixtures.ts'

type Row = [prompt: string, metricId: string, type: string, variant: string | undefined, note: RegExp | null]

const rows: Row[] = [
  // The reported bugs: the requested chart type was ignored.
  ['Add a line chart of orders for the last 30 days', 'commerce_orders', 'kpi', undefined, /only be shown as a KPI tile.*instead of a line chart/],
  ['Show top products as a pie chart', 'commerce_best_sellers', 'bar_list', undefined, /only be shown as a ranked list.*instead of a pie chart/],
  ['Show me revenue by week as a bar chart', 'commerce_revenue_over_time', 'timeseries', 'area', /line chart or an area chart.*drafted an area chart instead of a bar chart.*weekly buckets aren't available/],
  ['Revenue by channel for last 90 days', 'commerce_revenue_by_channel', 'bar', 'vertical', /date range \(Last 30 days\), not last 90 days/],
  ['Create a revenue by channel widget', 'commerce_revenue_by_channel', 'bar', 'vertical', null],
  // Honoured exactly.
  ['Show open rate trend for last 30 days', 'marketing_open_rate_over_time', 'timeseries', 'area', /per send/],
  ['Show open rate as a line chart', 'marketing_open_rate_over_time', 'timeseries', 'line', null],
  ['Add a recent orders table', 'commerce_recent_orders', 'table', undefined, null],
  ['Show contacts by domain as a donut', 'contacts_by_domain', 'donut', undefined, null],
  ['Add a deliverability gauge', 'marketing_deliverability_score', 'gauge', undefined, null],
  ['Make a chart of email volume', 'marketing_email_volume', 'timeseries', 'area', null],
  ['Show audience growth chart', 'contacts_growth', 'timeseries', 'area', null],
  ['Show RFM heatmap', 'analytics_rfm_engagement', 'heatmap', undefined, null],
  ['orders', 'commerce_orders', 'kpi', undefined, null],
  ['Show revenue as a line chart', 'commerce_revenue_over_time', 'timeseries', 'line', null],
  ['Show sales over time', 'commerce_revenue_over_time', 'timeseries', 'area', null],
  ['Show email volume as a column chart', 'marketing_email_volume', 'bar', 'vertical', null],
  ['Show a scatter plot of orders', 'commerce_orders', 'kpi', undefined, /Scatter plots aren't available/],
  ['Show sessions by country as a pie chart', 'analytics_sessions_by_country', 'bar', 'stacked-column', /instead of a pie chart/],
  ['Revenue by day of week', 'commerce_revenue_heatmap', 'heatmap', undefined, null],
  ['Show retail revenue', 'retail_revenue', 'kpi', undefined, null],
  // A generic "chart" is only honoured by a chart: a KPI tile is not one, and the merchant is told.
  ['Make a chart of orders', 'commerce_orders', 'kpi', undefined, /only be shown as a KPI tile.*instead of a chart/],
  ['Plot my orders by week', 'commerce_orders', 'kpi', undefined, /instead of a chart/],
  ['Show a chart of my conversion rate', 'commerce_conversion_rate', 'kpi', undefined, /instead of a chart/],
  // …but a generic "widget" is satisfied by anything.
  ['Add an orders widget', 'commerce_orders', 'kpi', undefined, null],
  // The KPI has a trend sparkline — the note must not claim the metric "isn't tracked over time".
  ['Show orders over time', 'commerce_orders', 'kpi', undefined, /no over-time chart for Orders/],
  ['Show top campaigns as a table', 'marketing_top_campaigns', 'table', undefined, null],
  ['Show campaign revenue by folder', 'marketing_campaign_revenue', 'bar', 'vertical', null],
  ['Show ticket volume over time', 'service_ticket_volume', 'timeseries', 'area', null],
  ['Show revenue as a table', 'commerce_revenue', 'kpi', undefined, /instead of a table/],
  ['Da Vinci, show orders', 'commerce_orders', 'kpi', undefined, null],
]

for (const [prompt, metricId, type, variant, note] of rows) {
  test(`resolves "${prompt}"`, () => {
    const res = resolveWidgetRequest(prompt, ALL_METRICS, { dashboardRange: 'last_30_days' })
    assert.ok(res, 'expected a resolution')
    assert.equal(res.metric.id, metricId)
    assert.equal(res.type, type)
    assert.equal(res.chartVariant, variant)
    if (note) assert.match(res.note ?? '', note)
    else assert.equal(res.note, undefined, `unexpected note: ${res.note}`)
  })
}

test('a 90-day request on a 90-day dashboard needs no range note', () => {
  const res = resolveWidgetRequest('Revenue by channel for last 90 days', ALL_METRICS, { dashboardRange: 'last_90_days' })
  assert.equal(res?.note, undefined)
})

test('prompts with no metric evidence resolve to nothing', () => {
  for (const prompt of ['hello there', 'Add a products table', 'Show me something interesting', 'Show pie chart']) {
    assert.equal(resolveWidgetRequest(prompt, ALL_METRICS), null, prompt)
  }
})

test('service-only accounts only reach service and contact metrics', () => {
  assert.equal(resolveWidgetRequest('Show ticket volume over time', SERVICE_ONLY_METRICS)?.metric.id, 'service_ticket_volume')
  assert.equal(resolveWidgetRequest('Show open rate trend', SERVICE_ONLY_METRICS), null)
  assert.equal(resolveWidgetRequest('Add a recent orders table', SERVICE_ONLY_METRICS), null)
})

test('marketing-only accounts never get commerce metrics', () => {
  assert.equal(resolveWidgetRequest('Show revenue by channel', MARKETING_ONLY_METRICS)?.metric.dataSource, 'marketing')
})

test('retail and merchandising metrics need their own word', () => {
  assert.equal(resolveWidgetRequest('Show revenue', ALL_METRICS)?.metric.id, 'commerce_revenue')
  assert.equal(resolveWidgetRequest('Show merch cloud revenue', ALL_METRICS)?.metric.id, 'merch_cloud_revenue')
})

test('parsing: range, family, dimension, grain', () => {
  const req = parseWidgetRequest('Show me revenue by week as a bar chart for the last 90 days')
  assert.equal(req.family, 'bar')
  assert.equal(req.grain, 'week')
  assert.equal(req.timeShape, true)
  assert.equal(req.range?.preset, 'last_90_days')
  assert.equal(req.range?.phrase, 'last 90 days')
  assert.equal(parseWidgetRequest('Revenue by day of the week').dimension, 'day of week')
  assert.equal(parseWidgetRequest('sales by channel').dimension, 'channel')
})

test('options are exactly what each metric can be drawn as', () => {
  const keys = (id: string) => optionsForMetric(getMetricDescriptor(id as never)!).map((o) => o.key)
  assert.deepEqual(keys('commerce_orders'), ['kpi'])
  assert.deepEqual(keys('contacts_by_domain'), ['column', 'bar', 'donut'])
  assert.deepEqual(keys('marketing_email_volume'), ['line', 'area', 'column', 'bar'])
  assert.deepEqual(keys('marketing_deliverability_score'), ['kpi', 'gauge'])
  assert.deepEqual(keys('commerce_customers_over_time'), ['stacked-area', 'line', 'area'])
  assert.deepEqual(keys('analytics_sessions_by_country'), ['stacked-column', 'column', 'bar'])
})

test('optionFor names what actually renders', () => {
  assert.equal(optionFor('timeseries', undefined).key, 'area')
  assert.equal(optionFor('timeseries', 'line').key, 'line')
  assert.equal(optionFor('bar', undefined).key, 'column')
  assert.equal(optionFor('bar', 'horizontal').key, 'bar')
  assert.equal(optionFor('bar_list').label, 'Ranked list')
})

test('every metric default is one of its own options, so a fresh draft can always be added', () => {
  for (const metric of ALL_METRICS) {
    assert.ok(metric.supportedWidgetTypes.includes(metric.defaultWidgetType), metric.id)
    const res = resolveWidgetRequest(metric.aiKeywords[0]!, ALL_METRICS)
    if (res) assert.ok(res.metric.supportedWidgetTypes.includes(res.type), `${metric.id} → ${res.metric.id}:${res.type}`)
  }
})

test('draftFromResolution carries an explicit variant and a truthful summary', () => {
  const res = resolveWidgetRequest('Show open rate as a line chart', ALL_METRICS)!
  const draft = draftFromResolution(res, 'dash-1', 'Show open rate as a line chart')
  assert.equal(draft.dashboardId, 'dash-1')
  assert.equal(draft.chartVariant, 'line')
  assert.match(draft.aiProvenance!.summary, /Open Rate Trend as a line chart/)
})

test('time-basis labels say what the widget spans', () => {
  const get = (id: string) => getMetricDescriptor(id as never)!
  assert.equal(timeBasisLabel(get('marketing_open_rate_over_time'), 'last_30_days'), 'Latest sends')
  assert.equal(timeBasisLabel(get('commerce_recent_orders'), 'last_30_days'), 'Most recent')
  assert.equal(timeBasisLabel(get('commerce_best_sellers'), 'last_30_days'), 'All time')
  assert.equal(timeBasisLabel(get('commerce_revenue_over_time'), 'last_7_days'), 'Last 7 days')
})

test('draftForMetric saves what a card shows, in the metric\'s own default look', () => {
  const draft = draftForMetric(getMetricDescriptor('commerce_revenue_over_time')!, 'dash-1', 'Saved from the revenue card')
  assert.equal(draft.type, 'timeseries')
  assert.equal(draft.chartVariant, 'area')
  assert.equal(draft.metricId, 'commerce_revenue_over_time')
  assert.equal(draft.title, 'Revenue Over Time')
  assert.equal(draft.aiProvenance?.summary, 'Saved from the revenue card')
})

test('namesOnlyMetric: the prompt is the metric\'s name and nothing else', () => {
  const names = (prompt: string) => {
    const resolution = resolveWidgetRequest(prompt, ALL_METRICS, { dashboardRange: 'last_30_days' })
    assert.ok(resolution, prompt)
    return namesOnlyMetric(resolution, ALL_METRICS)
  }
  for (const yes of ['orders', 'show my open rate', 'top 5 campaigns', 'orders last 30 days', 'Top campaigns by revenue', 'the ticket volume, please']) {
    assert.equal(names(yes), true, yes)
  }
  for (const no of ['boost sales', 'sales are slow', 'thanks for the orders', 'increase orders', 'get more customers', 'low sales', 'sales by slow']) {
    assert.equal(names(no), false, no)
  }
})
