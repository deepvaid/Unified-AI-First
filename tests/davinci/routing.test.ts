import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyIntent, isExplainQuestion, routePrompt, wantsVisual } from '../../src/davinci/promptRouting.ts'
import { ctx, SERVICE_ONLY_METRICS } from './fixtures.ts'

const lane = (prompt: string, overrides = {}) => routePrompt(prompt, ctx(overrides))

// ── Explicit chart asks land in the widget lane — even when a keyword intent also matches ──
const widgetPrompts: Array<[string, string]> = [
  ['Show open rate trend for last 30 days', 'marketing_open_rate_over_time'],
  ['Add a recent orders table', 'commerce_recent_orders'],
  ['Create a revenue by channel widget', 'commerce_revenue_by_channel'],
  ['Revenue by channel for last 90 days', 'commerce_revenue_by_channel'],
  ['Show me revenue by week as a bar chart', 'commerce_revenue_over_time'],
  ['Show revenue over time', 'commerce_revenue_over_time'],
  ["What's revenue by channel?", 'commerce_revenue_by_channel'],
  ['Add a line chart of orders for the last 30 days', 'commerce_orders'],
  ['Show top products as a pie chart', 'commerce_best_sellers'],
  ['Show contacts by domain as a donut', 'contacts_by_domain'],
  ['Add a deliverability gauge', 'marketing_deliverability_score'],
  ['Make a chart of email volume', 'marketing_email_volume'],
  ['Show audience growth chart', 'contacts_growth'],
  ['Show RFM heatmap', 'analytics_rfm_engagement'],
  ['Show ticket volume over time', 'service_ticket_volume'],
  ['Add a top campaigns table', 'marketing_top_campaigns'],
]
for (const [prompt, metricId] of widgetPrompts) {
  test(`widget lane: "${prompt}"`, () => {
    const decision = lane(prompt)
    assert.equal(decision.lane, 'widget')
    if (decision.lane === 'widget') assert.equal(decision.resolution.metric.id, metricId)
  })
}

test('widget lane also works off a dashboard route when a dashboard exists', () => {
  assert.equal(lane('Create a revenue by channel widget', { onDashboard: false }).lane, 'widget')
})

test('on a dashboard, a bare metric word is a request for that metric', () => {
  const decision = lane('orders')
  assert.equal(decision.lane, 'widget')
  assert.equal(lane('orders', { onDashboard: false }).lane, 'gemini')
})

// ── Status asks stay canned cards ──
for (const prompt of ["How's revenue this week?", 'how much did we make', 'revenue today', 'Show me revenue this week', 'How much did we make last week?']) {
  test(`revenue card: "${prompt}"`, () => {
    assert.deepEqual(lane(prompt), { lane: 'intent', intent: 'revenue' })
  })
}

// ── Questions and analysis go to the advisor ──
const advisorPrompts = [
  'Explain this chart',
  'Why is my open rate chart flat?',
  'Which KPI should I focus on?',
  'Summarize my dashboard',
  'What does this revenue chart show?',
  'How can I increase sales?',
  'Which audience should I target?',
  'What needs my attention this morning?',
  'Which of my products should I put on sale this week and why?',
  'Draft a sales email for Black Friday',
  'Draft an email announcing our new product',
  'My orders dropped this week',
  'How do I run a campaign?',
  "What's the best time to send a newsletter?",
  "What's my cart abandonment rate?",
  'How many lapsed customers do I have?',
  'Was my last campaign any good?',
  'How do I add a chart?',
  'I want to review my welcome journey',
  'Review my journey "Abandoned Cart Recovery" and suggest improvements to timing and copy.',
  'Help me build my new journey "Win-back flow" — suggest a trigger, the email sequence and timing.',
]
for (const prompt of advisorPrompts) {
  test(`advisor: "${prompt}"`, () => {
    assert.equal(lane(prompt).lane, 'gemini', JSON.stringify(lane(prompt)))
  })
}

// ── Action intents ──
const intentPrompts: Array<[string, string]> = [
  ["I want to win back customers who haven't bought in 90 days", 'journey'],
  ['Build a VIP segment', 'segment'],
  ['Build a VIP customer segment', 'segment'],
  ['Run a campaign to VIP customers', 'campaign'],
  ['Run a campaign', 'campaign'],
  ['Can you run a campaign to lapsed buyers?', 'campaign'],
  ['Draft a product description', 'product'],
  ['Which recommendation engine should I use on my home page?', 'engine'],
  ['Create a welcome series', 'journey'],
]
for (const [prompt, intent] of intentPrompts) {
  test(`intent ${intent}: "${prompt}"`, () => {
    assert.deepEqual(lane(prompt), { lane: 'intent', intent })
  })
}

// ── Hints and missing dashboards ──
test('a chart word with no matching metric gets the widget hint, not a made-up draft', () => {
  assert.deepEqual(lane('Show me a pie chart of unicorns'), { lane: 'widget-hint' })
  assert.deepEqual(lane('Add a products table'), { lane: 'widget-hint' })
})

test('with no dashboard to add to, chart prompts do not draft widgets', () => {
  const noDashboard = { hasDashboard: false }
  assert.deepEqual(lane('Show open rate trend', noDashboard), { lane: 'widget-hint' })
  assert.deepEqual(lane("How's revenue this week?", noDashboard), { lane: 'intent', intent: 'revenue' })
})

test('service-only accounts', () => {
  const service = { metrics: SERVICE_ONLY_METRICS }
  assert.equal(lane('Show ticket volume over time', service).lane, 'widget')
  assert.deepEqual(lane('Show open rate trend', service), { lane: 'widget-hint' })
})

// ── The pieces ──
test('classifyIntent: explain guard sits inside it, so answer() cannot fall back to a canned card', () => {
  assert.equal(classifyIntent('What does this revenue chart show?'), 'fallback')
  assert.equal(classifyIntent('How can I increase sales?'), 'fallback')
  assert.equal(classifyIntent('Which audience should I target?'), 'fallback')
  assert.equal(classifyIntent("How's revenue this week?"), 'revenue')
})

test('isExplainQuestion / wantsVisual', () => {
  assert.equal(isExplainQuestion('explain this chart'), true)
  assert.equal(isExplainQuestion('show me a chart of revenue'), false)
  assert.equal(wantsVisual('Show me revenue'), false)
  assert.equal(wantsVisual('Show me revenue over time'), true)
  assert.equal(wantsVisual('Revenue by channel'), true)
  assert.equal(wantsVisual('How do I add a chart?'), false)
})
