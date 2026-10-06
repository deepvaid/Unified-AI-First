import { test } from 'node:test'
import assert from 'node:assert/strict'
import { money } from '../../src/maropay/money.ts'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { TRANSACTION_TABS, inTab, transactionCsvRow } from '../../src/maropay/transactions.ts'
import { refundPayment } from '../../src/services/maropay/mockAdapter.ts'
import { context, env } from './fixtures.ts'

test('every payment status sits in exactly one tab besides All; cancelled ones only in All', () => {
  const statuses = ['processing', 'authorised', 'captured', 'partially_refunded', 'refunded', 'failed', 'voided', 'disputed'] as const
  const state = buildScenario('m10', context())
  const sample = state.payments[0]!
  for (const status of statuses) {
    const payment = { ...sample, status }
    const tabs = TRANSACTION_TABS.filter((t) => t.key !== 'all' && inTab(payment, t.key)).map((t) => t.key)
    assert.equal(inTab(payment, 'all'), true)
    assert.equal(tabs.length, status === 'voided' ? 0 : 1, `${status} → ${tabs.join(', ')}`)
  }
})

test('the CSV row reconciles a partial refund: amount − refunded − fee = net', () => {
  const state = buildScenario('m10', context())
  const payment = state.payments.find((p) => p.status === 'captured' && p.provider === 'maropay')!
  assert.ok(refundPayment(state, payment.id, money(2500, 'USD'), 'Damaged item', 'k1', env()).ok)
  const row = transactionCsvRow(payment, 'Atlas Outfitters', null)
  assert.equal(row.Status, 'Partially refunded')
  assert.equal(row.Refunded, '25.00')
  const [amount, refunded, fee, net] = [row.Amount, row.Refunded, row.Fee, row.Net].map(Number)
  assert.equal(Math.round((amount! - refunded! - fee!) * 100), Math.round(net! * 100))
})

test('payments an earlier provider took export without guessed fees', () => {
  const state = buildScenario('m06', context())
  const paypal = state.payments.find((p) => p.provider === 'paypal')!
  const row = transactionCsvRow(paypal, 'Atlas Outfitters', null)
  assert.equal(row.Provider, 'PayPal')
  assert.equal(row.Fee, '')
  assert.equal(row.Net, '')
})
