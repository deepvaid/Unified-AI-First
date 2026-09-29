import { test } from 'node:test'
import assert from 'node:assert/strict'
import { draftFollowUps, landingPrompts, revenueFollowUps } from '../../src/davinci/followUps.ts'
import { routePrompt } from '../../src/davinci/promptRouting.ts'
import { draftFromResolution, resolveWidgetRequest } from '../../src/davinci/widgetRequest.ts'
import { ALL_METRICS, ctx, MARKETING_ONLY_METRICS, SERVICE_ONLY_METRICS } from './fixtures.ts'

const drawn = (prompt: string, overrides = {}) => routePrompt(prompt, ctx(overrides)).lane === 'widget'

test('every landing chip is drawable on the account it is offered to', () => {
  for (const onDashboard of [true, false]) {
    for (const metrics of [ALL_METRICS, SERVICE_ONLY_METRICS, MARKETING_ONLY_METRICS]) {
      const c = ctx({ onDashboard, metrics })
      for (const prompt of landingPrompts(c)) assert.ok(drawn(prompt, { onDashboard, metrics }), prompt)
    }
  }
})

test('landing chips fit the account: no commerce prompts for service-only accounts', () => {
  const chips = landingPrompts(ctx({ onDashboard: false, metrics: SERVICE_ONLY_METRICS }))
  assert.deepEqual(chips, ['Show ticket volume over time', 'Show contact growth trend'])
  assert.equal(landingPrompts(ctx({ onDashboard: true })).length, 3)
  assert.equal(landingPrompts(ctx({ onDashboard: false })).length, 4)
})

test('follow-ups after a draft offer other views that the router draws exactly as asked', () => {
  const res = resolveWidgetRequest('Show open rate trend', ALL_METRICS)!
  const draft = { ...draftFromResolution(res, 'd1', 'Show open rate trend'), lastRefreshedAt: '' }
  const pills = draftFollowUps(draft, ctx())
  assert.equal(pills[0]?.text, 'Show open rate trend as a line chart')
  assert.ok(pills.length <= 3)
  for (const pill of pills) assert.ok(drawn(pill.text), pill.text)
})

test('a single-view metric offers related metrics, never a view it does not have', () => {
  const res = resolveWidgetRequest('Add a recent orders table', ALL_METRICS)!
  const draft = { ...draftFromResolution(res, 'd1', 'x'), lastRefreshedAt: '' }
  const pills = draftFollowUps(draft, ctx())
  assert.ok(pills.length > 0)
  assert.ok(pills.every((pill) => !/table|list/.test(pill.text) || pill.text !== 'Show recent orders as a table'))
  for (const pill of pills) assert.ok(drawn(pill.text), pill.text)
})

test('revenue follow-ups need Commerce', () => {
  assert.equal(revenueFollowUps(ctx()).length, 2)
  assert.deepEqual(revenueFollowUps(ctx({ metrics: SERVICE_ONLY_METRICS })), [])
})
