import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAROPAY_SCENARIOS, buildScenario, isMaropayScenarioKey, linkedOrderRefs } from '../../src/maropay/scenarios.ts'
import { deriveOverviewInstruction } from '../../src/maropay/readiness.ts'
import { parseState, storageKey } from '../../src/maropay/model.ts'
import { ATLAS, NOW, context, orders } from './fixtures.ts'

const EXPECTED_HEADLINE: Record<string, string> = {
  m01: 'not_started', m02: 'finish_setup', m03: 'provide_info', m04: 'declined', m05: 'set_up_store',
  m06: 'set_up_store', m07: 'activate_more', m08: 'payouts_attention', m09: 'payouts_attention', m10: 'active',
  m11: 'active', m12: 'active', m13: 'active', m14: 'active', m15: 'ready_to_activate',
  m16: 'provide_info', m17: 'provide_info',
}

test('all seventeen scenarios are listed and recognised', () => {
  assert.equal(MAROPAY_SCENARIOS.length, 17)
  assert.ok(MAROPAY_SCENARIOS.every((s) => isMaropayScenarioKey(s.key)))
  assert.equal(isMaropayScenarioKey('m18'), false)
})

for (const scenario of MAROPAY_SCENARIOS) {
  test(`${scenario.key}: builds, reconciles and round-trips through storage`, () => {
    const ctx = context()
    const state = buildScenario(scenario.key, ctx)
    assert.equal(state.scenarioKey, scenario.key)
    assert.equal(deriveOverviewInstruction(state, NOW).key, EXPECTED_HEADLINE[scenario.key])

    // Every payout is explained by its balance movements.
    for (const payout of state.payouts) {
      const net = state.movements.filter((m) => payout.movementIds.includes(m.id)).reduce((total, m) => total + m.net.amount, 0)
      assert.equal(net, payout.amount.amount, `${payout.id} reconciles`)
    }
    // Every payment tied to an order matches that order's total and belongs to this account.
    const byId = new Map(ctx.orders.map((o) => [o.id, o]))
    for (const p of state.payments) {
      assert.equal(p.accountId, ctx.accountId)
      const session = state.sessions.find((s) => s.paymentId === p.id)
      if (p.orderId === null) continue
      const total = session?.order?.total ?? byId.get(p.orderId)?.total
      assert.ok(total, `${p.id} links to a recoverable order`)
      assert.equal((p.amount.amount / 100).toFixed(2), total)
    }
    // Only Maropay payments move the Maropay balance.
    for (const m of state.movements) {
      const p = state.payments.find((x) => x.id === m.paymentId)
      assert.equal(p?.provider, 'maropay')
    }
    const restored = parseState(JSON.stringify(state), ctx.accountId, NOW)
    assert.deepEqual(restored, state)
  })
}

test('linked history uses the store’s twelve most recent orders', () => {
  assert.deepEqual(linkedOrderRefs(orders(), ATLAS).map((o) => o.id), [1, 3, 4, 6, 8, 10, 12, 13, 15, 17, 19, 21])
})

test('M02 resumes where the merchant stopped', () => {
  const state = buildScenario('m02', context())
  const restored = parseState(JSON.stringify(state), '2000290', NOW)!
  assert.equal(restored.onboarding.lastStep, 'verify')
  assert.deepEqual(restored.onboarding.completedSteps, ['business', 'terms'])
  assert.equal(restored.account?.setup, 'in_progress')
})

test('stored state from another account, another version or garbage is ignored', () => {
  const state = buildScenario('m10', context())
  assert.equal(parseState(JSON.stringify(state), '2000291', NOW), null)
  assert.equal(parseState(JSON.stringify({ ...state, version: 2 }), '2000290', NOW), null)
  assert.equal(parseState('{not json', '2000290', NOW), null)
  assert.equal(storageKey('2000290'), 'mp.maropay.v1:2000290')
})

test('M05 keeps the previous processor’s history out of Maropay balances and payouts', () => {
  const state = buildScenario('m05', context())
  assert.ok(state.payments.length > 0)
  assert.ok(state.payments.every((p) => p.provider === 'stripe-legacy'))
  assert.equal(state.movements.length, 0)
  assert.equal(state.payouts.length, 0)
  assert.equal(state.account?.reusedVerifiedDetails, true)
  assert.equal(state.bindings[0]?.captureMode, 'manual')
})
