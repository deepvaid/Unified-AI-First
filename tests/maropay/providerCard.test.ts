import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { emptyState } from '../../src/maropay/model.ts'
import type { MaropayAccountState, MaropayActingRole } from '../../src/maropay/model.ts'
import { canForStore } from '../../src/maropay/model.ts'
import { deriveMaropayCard } from '../../src/maropay/providerCard.ts'
import type { MaropayCardState } from '../../src/maropay/providerCard.ts'
import { deactivateStore, linkStore } from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, BETA, NOW, channelFacts, context, env } from './fixtures.ts'

function card(state: MaropayAccountState, channelId = ATLAS, role: MaropayActingRole = 'owner') {
  return deriveMaropayCard({
    state, channelId, channel: channelFacts(channelId), now: NOW,
    can: (action) => canForStore(role, action, channelId, role === 'store_ops' ? [channelId] : null),
    factsFor: channelFacts,
  })
}

const EXPECTED: Array<[string, MaropayCardState]> = [
  ['m01', 'not_set_up'], ['m02', 'setup_in_progress'], ['m03', 'action_required'], ['m04', 'declined'],
  ['m05', 'needs_setup'], ['m06', 'needs_setup'], ['m07', 'live'], ['m08', 'live'], ['m10', 'live'],
  ['m14', 'live'], ['m15', 'ready_to_activate'], ['m16', 'live'], ['m17', 'live'], ['m18', 'ready_to_activate'],
]

test('every scenario lands the card in one state, read from the overview and the store', () => {
  for (const [key, expected] of EXPECTED) assert.equal(card(buildScenario(key as never, context())).state, expected, key)
  assert.equal(card(emptyState('2000290', NOW)).state, 'not_set_up')
})

test('the sell: the fact strip, marks and the three calls to action', () => {
  const model = card(buildScenario('m01', context()))
  assert.equal(model.recommended, true)
  assert.equal(model.chip, null)
  assert.equal(model.headline, 'Payments that live next to your orders.')
  assert.deepEqual(model.factStrip, [{ label: 'Platform fee', value: 'None' }, { label: 'Cards & wallets', value: '2.9% + 30¢' }, { label: 'PayPal', value: '3.49% + 49¢' }])
  assert.deepEqual(model.marks, ['maropay', 'visa', 'mastercard', 'amex', 'applePay', 'googlePay'])
  assert.ok(model.moreCount >= 4, 'PayPal, Klarna, Afterpay, Affirm, ACH… count as more')
  assert.deepEqual([model.primary?.label, model.primary?.kind, model.primary?.target?.name], ['Set up Maropay', 'route', 'MaropaySetup'])
  assert.deepEqual([model.secondary?.label, model.secondary?.target?.name, model.secondary?.target?.hash], ['Compare with Stripe', 'MaropayOverview', '#maropay-rates'], 'a store that never set payments up runs on Stripe')
  assert.deepEqual([model.quiet?.label, model.quiet?.href], ['Learn more', '/main-landing/maropay/'])
  assert.match(model.footnote ?? '', /^Illustrative rates/)
  const storeOps = card(buildScenario('m01', context()), ATLAS, 'store_ops')
  assert.equal(storeOps.primary?.disabledReason, 'Only owners and finance users can set up Maropay')
  const ready = card(buildScenario('m15', context()))
  assert.deepEqual(ready.factStrip.map((f) => f.label), ['Takes', 'Rates', 'Platform fee'], 'a store that is ready reads what it will take')
})

test('under review and action required read the overview’s own words', () => {
  const action = card(buildScenario('m03', context()))
  assert.equal(action.state, 'action_required')
  assert.equal(action.chip, 'Action required')
  assert.equal(action.primary?.label, 'Provide information')
  assert.equal(action.primary?.target?.name, 'MaropaySetup')
  // A freshly submitted account: our payments partner's move, nothing for the merchant to press.
  const m06 = buildScenario('m06', context())
  m06.account!.verification = 'under_review'
  m06.account!.verifiedAt = null
  const review = card(m06)
  assert.equal(review.state, 'under_review')
  assert.equal(review.chip, 'Under review')
  assert.equal(review.primary, null)
  assert.equal(review.secondary?.label, 'Open Maropay')
})

test('verified: unlinked, needs setup with progress, ready to activate with the owner gate', () => {
  const m06 = buildScenario('m06', context())
  const unlinked = card(m06, BETA)
  assert.equal(unlinked.state, 'unlinked')
  assert.deepEqual([unlinked.primary?.label, unlinked.primary?.kind], ['Link store', 'link'])
  assert.equal(card(m06, BETA, 'store_ops').primary?.disabledReason, 'Only the business owner can link stores.')
  assert.ok(linkStore(m06, BETA, env()).ok)
  const needs = card(m06, BETA)
  assert.equal(needs.state, 'needs_setup')
  assert.ok(needs.progress && needs.progress.total === 7 && needs.progress.done < needs.progress.total)
  assert.equal(needs.primary?.target?.name, 'StorePaymentsMaropay')
  assert.equal(card(m06).detail, 'Checkout uses PayPal until you activate Maropay.')
  const ready = card(buildScenario('m15', context()))
  assert.equal(ready.state, 'ready_to_activate')
  assert.deepEqual([ready.primary?.label, ready.primary?.kind, ready.primary?.disabledReason], ['Activate Maropay', 'activate', null])
  assert.equal(ready.secondary?.label, 'Review setup')
  assert.equal(card(buildScenario('m15', context()), ATLAS, 'finance').primary?.disabledReason, 'Only the business owner can activate Maropay.')
})

test('live: manage and stop, the routing line, the label/value facts, and a nag when payouts need attention', () => {
  const live = card(buildScenario('m10', context()))
  assert.equal(live.state, 'live')
  assert.equal(live.recommended, false)
  assert.equal(live.chip, 'Live')
  assert.match(live.detail ?? '', /^Live since .+ · Checkout uses Maropay for cards · PayPal, Bank deposit$/)
  assert.equal(live.secondary?.label, 'Manage')
  assert.deepEqual(live.menu, ['open_in_maropay', 'stop'])
  assert.equal(live.openInMaropay?.name, 'MaropayStorePayments')
  assert.deepEqual(live.factStrip.slice(0, 2), [{ label: 'Takes', value: 'Cards, Apple Pay and Google Pay' }, { label: 'Rates', value: '2.9% + 30¢ · No platform fee' }])
  assert.match(live.factStrip[2]?.value ?? '', /^Daily to Mercury Bank •••• 4417$/)
  assert.equal(live.nag, null)
  assert.deepEqual(card(buildScenario('m10', context()), ATLAS, 'finance').menu, ['open_in_maropay'], 'finance can’t stop a store')
  const paused = card(buildScenario('m08', context()))
  assert.equal(paused.nag?.tone, 'warning')
  assert.equal(paused.nag?.title, 'Payments are active. Payouts need attention')
  assert.equal(paused.nag?.action?.label, 'Fix payouts')
})

test('stopped: says where checkouts went and offers the way back', () => {
  const state = buildScenario('m14', context())
  assert.ok(deactivateStore(state, ATLAS, env()).ok)
  const stopped = card(state)
  assert.equal(stopped.state, 'stopped')
  assert.match(stopped.headline, /^Maropay was stopped on Atlas Outfitters on /)
  assert.match(stopped.detail ?? '', /^New checkouts use PayPal and Bank deposit\./)
  assert.equal(stopped.primary?.label, 'Review and activate again')
})

test('declined and unavailable sell nothing', () => {
  const declined = card(buildScenario('m04', context()))
  assert.equal(declined.state, 'declined')
  assert.equal(declined.recommended, false)
  assert.equal(declined.primary, null)
  assert.equal(declined.chip, 'Declined')
  const m02 = buildScenario('m02', context())
  m02.account!.eligibility = 'unsupported'
  const unavailable = card(m02)
  assert.equal(unavailable.state, 'unavailable')
  assert.equal(unavailable.primary, null)
  assert.match(unavailable.detail ?? '', /Atlas Outfitters keeps its current payment setup\.$/)
})
