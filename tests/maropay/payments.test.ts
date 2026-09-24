import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { deriveBalances, paymentBreakdown, refundableRemaining } from '../../src/maropay/readiness.ts'
import { orderPaymentStatusLabel } from '../../src/maropay/model.ts'
import type { PaymentStatus } from '../../src/maropay/model.ts'
import { money } from '../../src/maropay/money.ts'
import { readRecords, refundPayment, settleRefund } from '../../src/services/maropay/mockAdapter.ts'
import { NOW, context, env } from './fixtures.ts'

function liveWithLatest() {
  const state = buildScenario('m10', context())
  const latest = state.payments.find((p) => p.orderId === 1)!
  return { state, latest }
}

test('M10: a partial refund reduces what is left and debits the balance once', () => {
  const { state, latest } = liveWithLatest()
  const before = deriveBalances(state, NOW)[0]!
  const result = refundPayment(state, latest.id, money(2500, 'USD'), 'Damaged item', 'key-1', env())
  assert.ok(result.ok)
  assert.equal(latest.status, 'partially_refunded')
  assert.equal(refundableRemaining(latest).amount, 118_000 - 2500)
  const after = deriveBalances(state, NOW)[0]!
  assert.equal(after.available.amount + after.pending.amount, before.available.amount + before.pending.amount - 2500)
  // Fees are not returned on refund.
  const breakdown = paymentBreakdown(latest, null)
  assert.equal(breakdown.net.amount, 118_000 - latest.fee.amount - 2500)
})

test('refunds can’t exceed what’s left, and a full refund closes the payment', () => {
  const { state, latest } = liveWithLatest()
  refundPayment(state, latest.id, money(100_000, 'USD'), '', 'k1', env())
  const over = refundPayment(state, latest.id, money(20_000, 'USD'), '', 'k2', env())
  assert.equal(over.ok, false)
  assert.equal(!over.ok && over.error.code, 'refund_exceeds_remaining')
  assert.ok(refundPayment(state, latest.id, money(18_000, 'USD'), '', 'k3', env()).ok)
  assert.equal(latest.status, 'refunded')
  assert.equal(refundPayment(state, latest.id, money(1, 'USD'), '', 'k4', env()).ok, false)
})

test('the same idempotency key never refunds twice — even after a timeout', () => {
  const { state, latest } = liveWithLatest()
  const e = env()
  e.failures.timeoutNext = true
  const first = refundPayment(state, latest.id, money(5000, 'USD'), '', 'same-key', e)
  assert.equal(!first.ok && first.error.code, 'network_timeout')
  assert.equal(latest.refunds.length, 0, 'a timeout changes nothing')
  const retry = refundPayment(state, latest.id, money(5000, 'USD'), '', 'same-key', e)
  const again = refundPayment(state, latest.id, money(5000, 'USD'), '', 'same-key', e)
  assert.ok(retry.ok && again.ok)
  assert.equal(retry.ok && again.ok && retry.value.refund.id === again.value.refund.id, true)
  assert.equal(latest.refunds.length, 1)
  assert.equal(state.movements.filter((m) => m.kind === 'refund' && m.paymentId === latest.id).length, 1)
})

test('an armed timeout fails the next read once, and the retry loads', () => {
  const e = env()
  assert.ok(readRecords(e).ok)
  e.failures.timeoutNext = true
  const first = readRecords(e)
  assert.equal(!first.ok && first.error.code, 'network_timeout')
  assert.equal(!first.ok && first.error.retryable, true)
  assert.ok(readRecords(e).ok, 'one-shot: the retry goes through')
})

test('insufficient balance is refused; a failed refund leaves the payment untouched; pending refunds can bounce back', () => {
  const { state, latest } = liveWithLatest()
  const e = env()
  e.failures.refundOutcome = 'insufficient_balance'
  const refused = refundPayment(state, latest.id, money(1000, 'USD'), '', 'a', e)
  assert.equal(!refused.ok && refused.error.code, 'insufficient_balance')
  e.failures.refundOutcome = 'fail'
  const failed = refundPayment(state, latest.id, money(1000, 'USD'), '', 'b', e)
  assert.ok(failed.ok && failed.value.refund.status === 'failed')
  assert.equal(latest.status, 'captured')
  assert.equal(refundableRemaining(latest).amount, 118_000)
  e.failures.refundOutcome = 'pending'
  const pending = refundPayment(state, latest.id, money(1000, 'USD'), '', 'c', e)
  assert.ok(pending.ok)
  assert.equal(refundableRemaining(latest).amount, 117_000, 'a pending refund is already committed')
  const balance = deriveBalances(state, NOW)[0]!
  settleRefund(state, latest.id, pending.ok ? pending.value.refund.id : '', 'failed', env())
  const restored = deriveBalances(state, NOW)[0]!
  assert.equal(restored.available.amount, balance.available.amount + 1000)
  assert.equal(refundableRemaining(latest).amount, 118_000)
})

test('M06: refunding an earlier PayPal payment stays with PayPal and never touches the Maropay balance', () => {
  const state = buildScenario('m06', context())
  const old = state.payments.find((p) => p.status === 'captured')!
  assert.equal(old.provider, 'paypal')
  const result = refundPayment(state, old.id, money(1000, 'USD'), '', 'pp-1', env())
  assert.ok(result.ok)
  assert.equal(result.ok && result.value.refund.provider, 'paypal')
  assert.equal(state.movements.length, 0)
  assert.match(old.timeline[old.timeline.length - 1]!.text, /PayPal \(original provider\)/)
})

test('disputed payments can’t be refunded', () => {
  const state = buildScenario('m11', context())
  const disputed = state.payments.find((p) => p.status === 'disputed')!
  const result = refundPayment(state, disputed.id, money(100, 'USD'), '', 'd', env())
  assert.equal(result.ok, false)
})

test('order labels match the payment status chip keys', () => {
  const statuses: PaymentStatus[] = ['processing', 'authorised', 'captured', 'partially_refunded', 'refunded', 'failed', 'voided', 'disputed']
  const chipKeys = ['pending', 'authorised', 'paid', 'partially refunded', 'refunded', 'failed', 'voided', 'disputed']
  assert.deepEqual(statuses.map((s) => orderPaymentStatusLabel(s).toLowerCase()), chipKeys)
})
