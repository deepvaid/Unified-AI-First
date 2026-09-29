import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyIntent, isExplainQuestion, routePrompt, visualAsk, wantsVisual } from '../../src/davinci/promptRouting.ts'
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
  // A bare metric phrase may carry filler, a range, a number, or "by <measure>" — nothing else.
  ['show my open rate', 'marketing_open_rate'],
  ['top 5 campaigns', 'marketing_top_campaigns'],
  ['orders last 30 days', 'commerce_orders'],
  ['Top campaigns by revenue', 'marketing_top_campaigns'],
  ['top products by revenue', 'commerce_best_sellers'],
  // A cadence word beside a chart ask is still a chart ask.
  ['Show sends per month', 'analytics_sends_over_time'],
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
  // Names in quotes are not part of the request: a journey called "Weekly Sales Report" is not a weekly chart.
  'Review my data journey "Weekly Sales Report" and suggest improvements to timing and copy.',
  'Review my storefront theme "Black Friday Chart" and suggest improvements to layout and colors.',
  'Review my journey "Sales by Channel" and suggest improvements.',
  // A cadence word beside an errand is not a chart.
  'Send a weekly digest to subscribers',
  // Questions and asks for ideas are not briefs for the campaign wizard or the product card.
  'What time should I send my campaign?',
  'Which day is best to send a newsletter?',
  "When's a good time to send my newsletter?",
  'Do I need a campaign for Black Friday?',
  'I need ideas for a campaign',
  'need a subject line for my newsletter',
  "Don't send the newsletter",
  "Why can't I add a product?",
  'Where do I add a new product?',
  "my new product isn't showing",
  'new product ideas',
  // A sentence that merely contains a metric is a conversation, not "show me that metric".
  'boost sales',
  'grow revenue',
  'increase orders',
  'sales strategy',
  'sales advice',
  'get more customers',
  'sales are slow',
  'sales down',
  'low sales',
  'my customers are angry',
  'thanks for the orders',
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
  // Cadence and "by <dimension>" words don't turn an action into a chart.
  ['Send a weekly newsletter to VIP customers', 'campaign'],
  ['Send a monthly newsletter', 'campaign'],
  ['Create a weekly email campaign', 'campaign'],
  ['Send a newsletter by region', 'campaign'],
  ['Build a segment by country', 'segment'],
  ['Create a welcome series by segment', 'journey'],
  // An audience that mentions a negation is still a brief.
  ["Create a campaign to customers who haven't ordered in 60 days", 'campaign'],
  ['Make a campaign for lapsed buyers', 'campaign'],
  ['Add a new product', 'product'],
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

test('visualAsk: an explicit chart ask, a breakdown alone, or nothing', () => {
  assert.equal(visualAsk('Show revenue as a line chart'), 'chart')
  assert.equal(visualAsk('Add revenue to my dashboard'), 'chart')
  assert.equal(visualAsk('Show revenue over time'), 'chart')
  assert.equal(visualAsk('Revenue by channel'), 'breakdown')
  assert.equal(visualAsk('Show sends per month'), 'breakdown')
  assert.equal(visualAsk('Send a weekly digest to subscribers'), 'none')
  assert.equal(visualAsk('Review my data journey "Weekly Sales Report"'), 'none')
  // A prompt that is little more than a quote keeps it — there is nothing else to route on.
  assert.equal(visualAsk('Show "revenue by channel"'), 'breakdown')
})

test('a breakdown ask yields to an action intent, but not to a status ask or a read-only segment ask', () => {
  assert.deepEqual(lane('Build a segment by country'), { lane: 'intent', intent: 'segment' })
  assert.equal(lane("What's revenue by channel?").lane, 'widget')
  assert.equal(lane('Show contacts by segment').lane, 'widget')
})

test('a generic "chart" of a KPI-only metric says it drafted a tile', () => {
  for (const prompt of ['Make a chart of orders', 'Show me a graph of my orders over time', 'Plot my orders by week']) {
    const decision = lane(prompt)
    assert.equal(decision.lane, 'widget', prompt)
    if (decision.lane === 'widget') assert.match(decision.resolution.note ?? '', /only be shown as a KPI tile.*instead of a chart/, prompt)
  }
})
