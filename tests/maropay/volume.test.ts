// The DST case below needs a zone with a change; node:test runs each file in its own process.
process.env.TZ = 'America/New_York'

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { money, sum, zero } from '../../src/maropay/money.ts'
import { localDateKey } from '../../src/maropay/model.ts'
import type { Payment } from '../../src/maropay/model.ts'
import { dayLabel, volumeDelta, volumeSeries } from '../../src/maropay/volume.ts'
import { applyProcessorEvent } from '../../src/services/maropay/mockAdapter.ts'
import { NOW, context, env } from './fixtures.ts'

const DAY = 86_400_000

function inWindow(payments: Payment[], now: number, days: number) {
  const first = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), new Date(now).getDate() - (days - 1)).getTime()
  return payments.filter((p) => p.provider === 'maropay').flatMap((p) => p.captures).filter((c) => Date.parse(c.at) >= first && Date.parse(c.at) <= now)
}

test('the delta compares this window with the one just before it, and has no figure without a base', () => {
  const state = buildScenario('m10', context())
  const d = volumeDelta(state.payments, NOW, 30, 'USD')
  assert.deepEqual(d.current, volumeSeries(state.payments, NOW, 30, 'USD').total)
  const firstDay = new Date(new Date(NOW).getFullYear(), new Date(NOW).getMonth(), new Date(NOW).getDate() - 29)
  assert.deepEqual(d.previous, volumeSeries(state.payments, firstDay.getTime() - 1, 30, 'USD').total, 'the previous window ends the day before this one starts')
  if (d.previous.amount > 0) assert.equal(d.pct, Math.round(((d.current.amount - d.previous.amount) / d.previous.amount) * 1000) / 10)
  const quiet = volumeDelta(state.payments, NOW, 7, 'EUR')
  assert.deepEqual([quiet.current.amount, quiet.previous.amount, quiet.pct], [0, 0, null])
})

test('gross volume sums every Maropay capture in the window — refunded payments still count', () => {
  const state = buildScenario('m10', context())
  const v = volumeSeries(state.payments, NOW, 30, 'USD')
  const captures = inWindow(state.payments, NOW, 30)
  assert.ok(captures.length > 0)
  assert.deepEqual(v.total, sum(captures.map((c) => c.amount), 'USD'))
  assert.equal(v.count, captures.length)
  assert.ok(state.payments.some((p) => p.status === 'refunded' && p.captures.length), 'm10 has a refunded payment that was captured')
})

test('the window is one day per key, oldest first, ending today, with quiet days at zero', () => {
  const v = volumeSeries([], NOW, 30, 'USD')
  assert.equal(v.days.length, 30)
  assert.equal(v.days.at(-1)!.day, localDateKey(NOW))
  assert.ok(v.days.every((d) => d.count === 0 && d.amount.amount === 0))
  assert.deepEqual(v.total, zero('USD'))
  assert.equal(dayLabel('2026-09-06'), 'Sep 6')
})

test('an earlier provider’s payments, uncaptured payments and other currencies are left out', () => {
  const m05 = buildScenario('m05', context())
  assert.ok(m05.payments.some((p) => p.provider !== 'maropay' && p.captures.length), 'm05 has Stripe history')
  assert.equal(volumeSeries(m05.payments, NOW, 30, 'USD').count, inWindow(m05.payments, NOW, 30).length)

  const m10 = buildScenario('m10', context())
  const base = volumeSeries(m10.payments, NOW, 30, 'USD')
  const template = m10.payments.find((p) => p.provider === 'maropay' && p.captures.length)!
  const at = new Date(NOW - DAY).toISOString()
  const extra: Payment[] = [
    { ...template, id: 'pay_auth', status: 'authorised', captures: [] },
    { ...template, id: 'pay_eur', amount: money(5000, 'EUR'), captures: [{ id: 'cap_eur', amount: money(5000, 'EUR'), at, idempotencyKey: 'k' }] },
  ]
  assert.deepEqual(volumeSeries([...m10.payments, ...extra], NOW, 30, 'USD'), base)
})

test('a delayed payment counts only once the bank confirms it, on the day it was captured', () => {
  const state = buildScenario('m13', context())
  const pending = state.payments.find((p) => p.status === 'processing')!
  const before = volumeSeries(state.payments, NOW, 30, 'USD')
  applyProcessorEvent(state, { id: 'evt-v', paymentId: pending.id, kind: 'captured' }, env())
  const after = volumeSeries(state.payments, NOW, 30, 'USD')
  assert.equal(after.count, before.count + 1)
  assert.equal(after.days.at(-1)!.count, before.days.at(-1)!.count + 1, 'captured today')
})

test('a window across a daylight-saving change has unique consecutive days', () => {
  const now = Date.parse('2026-11-15T12:00:00')
  const keys = volumeSeries([], now, 30, 'USD').days.map((d) => d.day)
  assert.equal(new Set(keys).size, 30)
  assert.ok(keys.includes('2026-11-01'))
  assert.equal(keys[0], '2026-10-17')
  assert.equal(keys.at(-1), '2026-11-15')
})
