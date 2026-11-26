import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromDecimal, toDecimal } from '../../src/maropay/money.ts'
import { VITAHEAL_CHANNEL_ID, VITAHEAL_PLANS, vitahealSubscriptions } from '../../src/storefront/vitahealDemo.ts'
import {
  CANCEL_REASONS, allowedActions, cancel, changePlan, chargeAmount, contractFromLine, contractOfOrder, contractsFor,
  dayLabel, nextContractNumber, pause, recordRenewal, reschedule, rescheduleError, resume, skipNext, statusCounts,
} from '../../src/subscriptions/contracts.ts'
import type { SubscriptionContract } from '../../src/subscriptions/contracts.ts'
import { linePlan } from '../../src/subscriptions/plans.ts'
import type { SubscriptionPlan } from '../../src/subscriptions/plans.ts'

const [THREE_MONTH, MONTHLY] = VITAHEAL_PLANS as [SubscriptionPlan, SubscriptionPlan]
const TODAY = '2026-11-18'

/** Electrolytes on the 3-month supply, bought today: the build prompt's S7 purchase. */
function bought(): SubscriptionContract {
  return contractFromLine({
    id: 'sub-2001',
    number: 'S-2001',
    channelId: VITAHEAL_CHANNEL_ID,
    customer: { name: 'Linnea Berg', email: 'linnea.berg@example.com' },
    productId: 2005,
    line: { product: 'Vitaheal Electrolytes', sku: 'VTH-ELE-LEM', qty: 1, price: '585.90', plan: linePlan(THREE_MONTH) },
    currency: 'SEK',
    paymentMethod: 'Visa •••• 4242',
    methodId: 'card',
    order: { id: 900003, number: '#20003' },
    date: TODAY,
  })
}

test('a checkout line on a plan starts an active subscription, charged again one interval later', () => {
  const contract = bought()
  assert.equal(contract.status, 'Active')
  assert.equal(contract.startedOn, TODAY)
  assert.equal(contract.nextChargeOn, '2027-02-18')
  assert.equal(contract.history.length, 1)
  assert.deepEqual(contract.history[0]!.order, { id: 900003, number: '#20003' })
  assert.equal(toDecimal(chargeAmount(contract)), '585.90')
  assert.equal(toDecimal(chargeAmount({ ...contract, qty: 2 })), '1171.80')
})

// ── The build prompt's acceptance cases (S8) ─────────────────────────────────

test('skipping moves the next charge by one interval and says so in the history', () => {
  const skipped = skipNext(bought(), TODAY, 'customer')
  assert.equal(skipped.nextChargeOn, '2027-05-18')
  assert.equal(skipped.status, 'Active')
  assert.equal(skipped.history[0]!.text, 'Skipped the delivery of 18 Feb 2027. Next charge 18 May 2027')
  assert.equal(skipped.history[0]!.actor, 'customer')
  assert.equal(skipNext(skipped, TODAY, 'merchant').nextChargeOn, '2027-08-18')
})

test('cancelling needs a reason, ends the charges and records who did it and why', () => {
  assert.equal(cancel(bought(), '  ', TODAY, 'customer').status, 'Active')
  const cancelled = cancel(bought(), CANCEL_REASONS[0], TODAY, 'customer')
  assert.equal(cancelled.status, 'Cancelled')
  assert.equal(cancelled.nextChargeOn, null)
  assert.equal(cancelled.cancelReason, 'Too expensive')
  assert.equal(cancelled.history[0]!.text, 'Cancelled. Reason: Too expensive')
  assert.deepEqual(allowedActions(cancelled), [])
  assert.equal(cancel(cancelled, 'Something else', TODAY, 'merchant'), cancelled)
})

test('a renewal records its order and moves the next charge on', () => {
  const renewed = recordRenewal(bought(), { id: 900010, number: '#20010' }, TODAY, 'merchant')
  // Charged early: the following charge keeps its place, one interval after the date that was due.
  assert.equal(renewed.nextChargeOn, '2027-05-18')
  assert.deepEqual(renewed.history[0]!.order, { id: 900010, number: '#20010' })
  assert.match(renewed.history[0]!.text, /^Renewal charged to Visa •••• 4242: order #20010\. Next charge 18 May 2027$/)
  assert.equal(contractOfOrder([renewed], 900010)?.id, 'sub-2001')
  assert.equal(contractOfOrder([renewed], 900003)?.id, 'sub-2001')
  assert.equal(contractOfOrder([renewed], 1), undefined)
})

// ── The other actions ────────────────────────────────────────────────────────

test('a failed payment that is retried becomes active again, counted from the day it was paid', () => {
  const failed: SubscriptionContract = { ...bought(), status: 'Payment failed', nextChargeOn: '2026-11-10' }
  assert.deepEqual(allowedActions(failed), ['retry', 'cancel'])
  const retried = recordRenewal(failed, { id: 900011, number: '#20011' }, TODAY, 'merchant')
  assert.equal(retried.status, 'Active')
  assert.equal(retried.nextChargeOn, '2027-02-18')
})

test('pausing keeps the charge date for later; resuming brings it back, or uses today when it has passed', () => {
  const paused = pause(bought(), TODAY, 'merchant')
  assert.equal(paused.status, 'Paused')
  assert.deepEqual(allowedActions(paused), ['resume', 'cancel'])
  assert.equal(skipNext(paused, TODAY, 'customer'), paused)
  assert.equal(recordRenewal(paused, { id: 1, number: '#1' }, TODAY, 'merchant'), paused)

  const soon = resume(paused, '2026-12-01', 'customer')
  assert.equal(soon.status, 'Active')
  assert.equal(soon.nextChargeOn, '2027-02-18')
  const late = resume(paused, '2027-03-05', 'customer')
  assert.equal(late.nextChargeOn, '2027-03-05')
  assert.equal(late.history[0]!.text, 'Resumed. Next charge 5 Mar 2027')
})

test('the next charge can be moved to a later day, never to today or the past', () => {
  assert.equal(rescheduleError('2026-11-19', TODAY), null)
  assert.equal(rescheduleError(TODAY, TODAY), 'Choose a date after today.')
  assert.equal(rescheduleError('2026-01-01', TODAY), 'Choose a date after today.')
  assert.equal(rescheduleError('', TODAY), 'Choose a date.')
  assert.equal(rescheduleError('2026-13-40', TODAY), 'Choose a date.')
  const moved = reschedule(bought(), '2027-03-01', TODAY, 'merchant')
  assert.equal(moved.nextChargeOn, '2027-03-01')
  assert.equal(moved.history[0]!.text, 'Next charge moved to 1 Mar 2027')
  assert.equal(reschedule(bought(), TODAY, TODAY, 'merchant').history.length, 1)
})

test('changing plan takes the new plan’s price for the product’s unit price', () => {
  const monthly = changePlan(bought(), MONTHLY, fromDecimal('279.00', 'SEK'), TODAY, 'customer')
  assert.equal(monthly.plan.id, MONTHLY.id)
  assert.equal(monthly.price, '223.20')
  assert.equal(monthly.nextChargeOn, '2027-02-18')
  assert.equal(monthly.history[0]!.text, 'Plan changed from 3-month supply to Monthly subscription (1 unit every month)')
  assert.equal(changePlan(monthly, MONTHLY, fromDecimal('279.00', 'SEK'), TODAY, 'customer'), monthly)
})

test('an action never changes the subscription it was given', () => {
  const contract = bought()
  const before = JSON.stringify(contract)
  skipNext(contract, TODAY, 'customer')
  pause(contract, TODAY, 'customer')
  cancel(contract, 'Too expensive', TODAY, 'customer')
  assert.equal(JSON.stringify(contract), before)
})

test('each status offers its own actions', () => {
  assert.deepEqual(allowedActions({ status: 'Active' }), ['skip', 'reschedule', 'pause', 'changePlan', 'charge', 'cancel'])
  assert.deepEqual(allowedActions({ status: 'Paused' }), ['resume', 'cancel'])
  assert.deepEqual(allowedActions({ status: 'Payment failed' }), ['retry', 'cancel'])
})

test('dates read day first', () => {
  assert.equal(dayLabel('2027-02-18'), '18 Feb 2027')
  assert.equal(dayLabel('2027-02-18T10:00:00Z'), '18 Feb 2027')
})

// ── The Vitaheal (demo) subscribers ──────────────────────────────────────────

test('the demo store has eight subscribers, with every status to show', () => {
  const seeded = vitahealSubscriptions(TODAY)
  assert.equal(seeded.length, 8)
  assert.deepEqual(statusCounts(seeded), { Active: 5, Paused: 1, Cancelled: 1, 'Payment failed': 1 })
  assert.equal(new Set(seeded.map((c) => c.number)).size, 8)
  assert.equal(nextContractNumber(seeded), 'S-1009')
  assert.equal(nextContractNumber([]), 'S-1001')
  for (const c of seeded) {
    assert.equal(c.channelId, VITAHEAL_CHANNEL_ID)
    assert.match(c.customer.email, /@example\.com$/)
    assert.equal(c.customer.address?.country, 'United States')
    assert.match(c.customer.address?.region ?? '', /^[A-Z]{2}$/, `${c.number} has a state`)
    assert.equal(c.currency, 'USD')
    assert.ok(c.history.length >= 1 && c.history.at(-1)!.text === 'Subscription started', `${c.number} starts its history`)
    assert.ok(c.history.every((e, i, all) => i === 0 || e.date <= all[i - 1]!.date), `${c.number} history is newest first`)
  }
})

test('their dates follow the day the store is opened', () => {
  for (const today of [TODAY, '2027-06-30', '2028-02-29']) {
    for (const c of vitahealSubscriptions(today)) {
      if (c.status === 'Active' || c.status === 'Paused') assert.ok(c.nextChargeOn! > today, `${c.number} is charged after ${today}`)
      if (c.status === 'Payment failed') assert.ok(c.nextChargeOn! <= today, `${c.number} failed on or before ${today}`)
      if (c.status === 'Cancelled') assert.equal(c.nextChargeOn, null)
      assert.ok(c.startedOn < today)
    }
  }
})

test('a seeded price is the plan’s price for the product: Electrolytes monthly is $22.39', () => {
  const jacob = vitahealSubscriptions(TODAY).find((c) => c.customer.name === 'Jacob Turner')!
  assert.equal(jacob.product, 'Vitaheal Electrolytes')
  assert.equal(jacob.price, '22.39')
  assert.equal(jacob.plan.name, 'Monthly subscription')
})

test('a shopper sees their own subscriptions in a store, whatever the case of the email', () => {
  const all = [...vitahealSubscriptions(TODAY), bought(), { ...bought(), id: 'sub-2002', number: 'S-2002', status: 'Cancelled' as const }]
  const mine = contractsFor(all, VITAHEAL_CHANNEL_ID, ' Linnea.Berg@Example.com ')
  assert.deepEqual(mine.map((c) => c.status), ['Active', 'Cancelled'])
  assert.equal(contractsFor(all, 'neelam-store', 'linnea.berg@example.com').length, 0)
  assert.equal(contractsFor(all, VITAHEAL_CHANNEL_ID, 'nobody@example.com').length, 0)
})
