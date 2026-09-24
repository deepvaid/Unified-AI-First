import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { money } from '../../src/maropay/money.ts'
import type { ShopperFlow } from '../../src/maropay/model.ts'
import {
  applyProcessorEvent, capturePayment, completeCheckoutAction, confirmCheckoutSession, createCheckoutSession, deactivateStore,
  setCaptureMode, voidPayment,
} from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, NOW, context, env } from './fixtures.ts'

function checkout(flow: ShopperFlow, scenario: 'm10' | 'm05' = 'm10', methodId = 'card') {
  const state = buildScenario(scenario, context())
  const session = createCheckoutSession(state, {
    channelId: ATLAS, methodId, flow, amount: money(4999, 'USD'),
    customer: { name: 'Ava Brown', email: 'ava@email.com' }, lineItem: { product: 'Tee', sku: 'SKU-1', price: '49.99' },
  }, env())
  assert.ok(session.ok)
  return { state, sessionId: session.ok ? session.value.id : '' }
}

test('successful checkout captures once and creates exactly one order — repeat clicks change nothing', () => {
  const { state, sessionId } = checkout('success')
  const first = confirmCheckoutSession(state, sessionId, env())
  const second = confirmCheckoutSession(state, sessionId, env())
  assert.ok(first.ok && second.ok)
  const payment = first.ok ? first.value.payment! : null
  assert.equal(payment?.status, 'captured')
  assert.ok(first.ok && first.value.createdOrder, 'first confirm creates the order')
  assert.equal(second.ok && second.value.createdOrder, null, 'second confirm does not')
  assert.equal(state.payments.filter((p) => p.flow === 'success').length, 1)
  assert.equal(state.movements.filter((m) => m.paymentId === payment?.id).length, 1)
})

test('declined and abandoned payments never create an order', () => {
  for (const [flow, outcome] of [['declined', null], ['auth_required', 'abandoned'], ['redirect', 'abandoned']] as const) {
    const { state, sessionId } = checkout(flow)
    const step = confirmCheckoutSession(state, sessionId, env())
    const final = outcome ? completeCheckoutAction(state, sessionId, outcome, env()) : step
    assert.ok(final.ok)
    assert.equal(final.ok && final.value.payment?.status, 'failed', flow)
    assert.equal(final.ok && final.value.session.order, null, `${flow} has no order`)
  }
})

test('authentication and redirects complete into a captured payment', () => {
  for (const flow of ['auth_required', 'redirect'] as const) {
    const { state, sessionId } = checkout(flow)
    const waiting = confirmCheckoutSession(state, sessionId, env())
    assert.equal(waiting.ok && waiting.value.payment, null, `${flow} waits for the shopper`)
    const done = completeCheckoutAction(state, sessionId, 'completed', env())
    assert.equal(done.ok && done.value.payment?.status, 'captured')
    assert.ok(done.ok && done.value.createdOrder)
  }
})

test('M13: a delayed payment is pending, then confirmed once; duplicates and late failures are ignored', () => {
  const state = buildScenario('m13', context())
  const pending = state.payments.find((p) => p.status === 'processing')!
  assert.ok(pending.orderId, 'the order exists while payment is pending')
  const confirm = applyProcessorEvent(state, { id: 'evt-1', paymentId: pending.id, kind: 'captured' }, env())
  assert.ok(confirm.ok && confirm.value.applied)
  assert.equal(pending.status, 'captured')
  const duplicate = applyProcessorEvent(state, { id: 'evt-1', paymentId: pending.id, kind: 'captured' }, env())
  assert.equal(duplicate.ok && duplicate.value.reason, 'duplicate')
  const late = applyProcessorEvent(state, { id: 'evt-2', paymentId: pending.id, kind: 'failed' }, env())
  assert.equal(late.ok && late.value.reason, 'stale_state')
  assert.equal(pending.status, 'captured')
  assert.equal(pending.captures.length, 1)
  assert.equal(state.movements.filter((m) => m.paymentId === pending.id).length, 1, 'no duplicate charge')
})

test('a delayed payment that fails is marked failed, not paid', () => {
  const state = buildScenario('m13', context())
  const pending = state.payments.find((p) => p.status === 'processing')!
  applyProcessorEvent(state, { id: 'evt-f', paymentId: pending.id, kind: 'failed' }, env())
  assert.equal(pending.status, 'failed')
  assert.equal(state.movements.filter((m) => m.paymentId === pending.id).length, 0)
})

test('manual capture: authorise now, capture or cancel later', () => {
  const state = buildScenario('m10', context())
  setCaptureMode(state, ATLAS, 'manual', env())
  const session = createCheckoutSession(state, { channelId: ATLAS, methodId: 'card', flow: 'success', amount: money(2000, 'USD'), customer: { name: 'A', email: 'a@x.com' }, lineItem: { product: 'P', sku: 'S', price: '20.00' } }, env())
  const step = session.ok ? confirmCheckoutSession(state, session.value.id, env()) : null
  const payment = step?.ok ? step.value.payment! : null
  assert.equal(payment?.status, 'authorised')
  assert.ok(capturePayment(state, payment!.id, 'cap-1', env()).ok)
  assert.ok(capturePayment(state, payment!.id, 'cap-1', env()).ok, 'same key is a no-op')
  assert.equal(payment!.captures.length, 1)
  assert.equal(voidPayment(state, payment!.id, env()).ok, false, 'a captured payment can’t be cancelled')
})

test('an expired authorisation can’t be captured', () => {
  const state = buildScenario('m10', context())
  setCaptureMode(state, ATLAS, 'manual', env())
  const session = createCheckoutSession(state, { channelId: ATLAS, methodId: 'card', flow: 'success', amount: money(2000, 'USD'), customer: { name: 'A', email: 'a@x.com' }, lineItem: { product: 'P', sku: 'S', price: '20.00' } }, env())
  const step = session.ok ? confirmCheckoutSession(state, session.value.id, env()) : null
  const payment = step?.ok ? step.value.payment! : null
  const result = capturePayment(state, payment!.id, 'late', env(NOW + 8 * 86_400_000))
  assert.equal(!result.ok && result.error.code, 'deadline_passed')
})

test('checkout is refused when the store isn’t live or the method isn’t offered', () => {
  const state = buildScenario('m14', context())
  deactivateStore(state, ATLAS, env())
  const refused = createCheckoutSession(state, { channelId: ATLAS, methodId: 'card', flow: 'success', amount: money(100, 'USD'), customer: { name: 'A', email: 'a@x.com' }, lineItem: { product: 'P', sku: 'S', price: '1.00' } }, env())
  assert.equal(!refused.ok && refused.error.code, 'store_not_live')
  assert.match(!refused.ok ? refused.error.message : '', /PayPal/)
  const live = buildScenario('m10', context())
  const noKlarna = createCheckoutSession(live, { channelId: ATLAS, methodId: 'klarna', flow: 'success', amount: money(100, 'USD'), customer: { name: 'A', email: 'a@x.com' }, lineItem: { product: 'P', sku: 'S', price: '1.00' } }, env())
  assert.equal(!noKlarna.ok && noKlarna.error.code, 'method_unavailable')
})
