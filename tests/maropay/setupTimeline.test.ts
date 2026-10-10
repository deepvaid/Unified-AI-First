import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { emptyState } from '../../src/maropay/model.ts'
import { setupTimeline } from '../../src/maropay/setupTimeline.ts'
import { ATLAS, BETA, NOW, channelFacts, context } from './fixtures.ts'

const states = (key: Parameters<typeof buildScenario>[0]) => setupTimeline(buildScenario(key, context()), NOW, channelFacts)!.steps.map((s) => s.state)

test('one store to go: four done steps, the stores step current, the next store named with its gateway', () => {
  const t = setupTimeline(buildScenario('m07', context()), NOW, channelFacts)!
  assert.equal(t.headline, 'You’re verified. One store to go.')
  assert.match(t.detail, /^Maropay is taking payments on Atlas Outfitters\. Beta Sales Channel keeps using Stripe until you finish its checklist\.$/, 'the second store never set payments up, so it runs on the default Stripe')
  assert.deepEqual(t.steps.map((s) => [s.key, s.state]), [['submitted', 'done'], ['verified', 'done'], ['payments', 'done'], ['payouts', 'done'], ['stores', 'current']])
  assert.equal(t.steps[4]!.meta, '1 of 2')
  assert.match(t.steps[3]!.caption, /^Daily to Mercury Bank •••• 4417, 2 business days after each payment$/)
  assert.deepEqual([t.live, t.linked], [1, 2])
  const [atlas, beta] = t.stores
  assert.deepEqual([atlas!.channelId, atlas!.state, !!atlas!.since], [ATLAS, 'live', true])
  assert.deepEqual([beta!.channelId, beta!.state, beta!.gateway, beta!.total], [BETA, 'needs_setup', 'Stripe', 7])
  assert.ok(beta!.done < beta!.total)
})

test('all set, under review, needs information, declined, paused payouts — each reads from the account', () => {
  const all = setupTimeline(buildScenario('m10', context()), NOW, channelFacts)!
  assert.equal(all.headline, 'All set — your store is on Maropay.')
  assert.deepEqual(states('m10'), ['done', 'done', 'done', 'done', 'done'])
  assert.ok(all.stores[0]!.paymentsThisMonth >= 0)

  const review = buildScenario('m06', context())
  review.account!.verification = 'under_review'
  review.account!.verifiedAt = null
  const r = setupTimeline(review, NOW, channelFacts)!
  assert.equal(r.headline, 'Submitted — now under review.')
  assert.deepEqual(r.steps.map((s) => s.state), ['done', 'current', 'waiting', 'waiting', 'waiting'])

  const info = setupTimeline(buildScenario('m03', context()), NOW, channelFacts)!
  assert.equal(info.headline, 'One thing to fix before review continues.')
  assert.equal(info.steps[1]!.state, 'blocked')
  assert.match(info.steps[1]!.caption, /^Waiting on you: /)

  const declined = setupTimeline(buildScenario('m04', context()), NOW, channelFacts)!
  assert.equal(declined.headline, 'This business wasn’t approved.')
  assert.deepEqual(declined.steps.slice(1).map((s) => s.state), ['blocked', 'waiting', 'waiting', 'waiting'])

  const paused = setupTimeline(buildScenario('m08', context()), NOW, channelFacts)!
  assert.equal(paused.steps[3]!.state, 'blocked')
  assert.equal(paused.steps[3]!.title, 'Payouts paused', 'a dated task past its deadline pauses payouts; the bank itself is fine')

  const first = setupTimeline(buildScenario('m15', context()), NOW, channelFacts)!
  assert.equal(first.headline, 'You’re verified. Activate your first store.')
  assert.equal(first.detail, 'Atlas Outfitters keeps using Stripe until you finish its checklist.')

  assert.equal(setupTimeline(emptyState('2000290', NOW), NOW, channelFacts), null, 'no account, no timeline')
})
