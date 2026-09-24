import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { deriveBalances, paymentsFor } from '../../src/maropay/readiness.ts'
import { money } from '../../src/maropay/money.ts'
import { activateStore, confirmCheckoutSession, createCheckoutSession, markImpactReviewed, validateCheckout } from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, BETA, NOW, channelFacts, context, env } from './fixtures.ts'

test('M07: one business, two stores — filters and balances stay accurate', () => {
  const state = buildScenario('m07', context())
  const atlasBefore = paymentsFor(state, { channelId: ATLAS }).length
  assert.equal(paymentsFor(state, { channelId: BETA }).length, 0)
  validateCheckout(state, BETA, env())
  markImpactReviewed(state, BETA, env())
  activateStore(state, BETA, channelFacts(BETA), env())
  const session = createCheckoutSession(state, { channelId: BETA, methodId: 'card', flow: 'success', amount: money(5000, 'USD'), customer: { name: 'B', email: 'b@x.com' }, lineItem: { product: 'P', sku: 'S', price: '50.00' } }, env())
  assert.ok(session.ok)
  confirmCheckoutSession(state, session.ok ? session.value.id : '', env())
  assert.equal(paymentsFor(state, { channelId: BETA }).length, 1)
  assert.equal(paymentsFor(state, { channelId: ATLAS }).length, atlasBefore)
  // Both stores share one business balance.
  assert.equal(deriveBalances(state, NOW).length, 1)
})

test('two Maropost accounts never see each other’s records', () => {
  const a = buildScenario('m10', context('2000290'))
  const b = buildScenario('m10', context('2000297'))
  assert.ok(a.payments.every((p) => p.accountId === '2000290'))
  assert.ok(b.payments.every((p) => p.accountId === '2000297'))
  const mixed = { ...a, payments: [...a.payments, ...b.payments] }
  assert.equal(paymentsFor(mixed).length, a.payments.length, 'foreign-account payments are filtered out')
})

test('an account without Maropost web stores gets a verified business but nothing to activate', () => {
  const state = buildScenario('m10', { ...context('2000295'), channels: [] })
  assert.equal(state.account?.verification, 'verified')
  assert.equal(state.bindings.length, 0)
  assert.equal(state.payments.length, 0)
})
