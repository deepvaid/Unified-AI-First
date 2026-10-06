import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { money } from '../../src/maropay/money.ts'
import { cardErrors, flowForMethod, orderedCheckoutMethods, payButtonText, storefrontOffer } from '../../src/maropay/storefront.ts'
import { deactivateStore, setMethodEnabled, simulateMethodApproval, updateCheckoutOptions } from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, NOW, context, env } from './fixtures.ts'

const PRICE = money(9995, 'USD')

function live() {
  const state = buildScenario('m10', context())
  return { state, binding: state.bindings.find((b) => b.channelId === ATLAS)! }
}

test('a live store offers its ready methods, with cards under the Maropay name', () => {
  const { state, binding } = live()
  const offer = storefrontOffer(state, binding, PRICE)
  assert.equal(offer.live, true)
  assert.equal(offer.providerLabel, 'Maropay')
  assert.deepEqual(offer.methods.map((m) => m.label), ['Maropay', 'Apple Pay', 'Google Pay'])
  assert.equal(offer.defaultMethodId, 'card')
  assert.deepEqual(offer.express.map((m) => m.id), ['apple_pay', 'google_pay'])
  assert.deepEqual(offer.acceptedMarks, ['Maropay', 'Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'])
  assert.deepEqual(offer.payIn4.labels, [])
  assert.equal(payButtonText(offer.methods[0]!, offer.payButton, PRICE), 'Pay $99.95')
})

test('the merchant’s order, default, express switch and button label reach the shopper', () => {
  const { state, binding } = live()
  assert.ok(updateCheckoutOptions(state, ATLAS, { methodOrder: ['google_pay', 'card'], defaultMethodId: 'google_pay', expressWallets: false, payButtonLabel: 'place_order' }, env()).ok)
  const offer = storefrontOffer(state, binding, PRICE)
  assert.deepEqual(offer.methods.map((m) => m.id), ['google_pay', 'card', 'apple_pay'], 'unlisted methods follow in catalogue order')
  assert.equal(offer.defaultMethodId, 'google_pay')
  assert.deepEqual(offer.express, [])
  assert.equal(payButtonText(offer.methods[1]!, offer.payButton, PRICE), 'Place order')
  // A default that is no longer offered falls back to the first method.
  setMethodEnabled(state, ATLAS, 'google_pay', false, env())
  assert.equal(storefrontOffer(state, binding, PRICE).defaultMethodId, 'card')
})

test('PayPal is a one-tap wallet that finishes on PayPal', () => {
  const { state, binding } = live()
  assert.ok(setMethodEnabled(state, ATLAS, 'paypal', true, env()).ok, 'PayPal doesn’t need cards')
  const offer = storefrontOffer(state, binding, PRICE)
  const paypal = offer.methods.find((m) => m.id === 'paypal')!
  assert.ok(offer.express.some((m) => m.id === 'paypal'))
  assert.equal(flowForMethod(paypal), 'redirect')
  assert.equal(payButtonText(paypal, 'pay', PRICE), 'Pay with PayPal')
})

test('approved buy now, pay later methods show instalments on the product page', () => {
  const { state, binding } = live()
  setMethodEnabled(state, ATLAS, 'klarna', true, env())
  assert.deepEqual(storefrontOffer(state, binding, PRICE).payIn4.labels, [], 'not before approval')
  simulateMethodApproval(state, 'klarna', true, env())
  setMethodEnabled(state, ATLAS, 'afterpay_clearpay', true, env())
  setMethodEnabled(state, ATLAS, 'affirm', true, env())
  const offer = storefrontOffer(state, binding, PRICE)
  assert.deepEqual(offer.payIn4.labels, ['Klarna', 'Afterpay'])
  assert.deepEqual(offer.payIn4.amount, money(2499, 'USD'), 'rounded up so four payments cover the price')
  assert.deepEqual(offer.monthly, { labels: ['Affirm'], amount: money(833, 'USD') })
  const klarna = offer.methods.find((m) => m.id === 'klarna')!
  assert.equal(klarna.caption, '4 interest-free payments of $24.99')
  assert.equal(flowForMethod(klarna), 'redirect')
  assert.equal(payButtonText(klarna, 'pay', PRICE), 'Continue to Klarna')
})

test('test card numbers pick the outcome; wallets pay and bank debits confirm later', () => {
  const card = { category: 'cards' as const, redirects: false, delayed: false }
  assert.equal(flowForMethod(card, '4242 4242 4242 4242'), 'success')
  assert.equal(flowForMethod(card, '4000002500003155'), 'auth_required')
  assert.equal(flowForMethod(card, '4000 0000 0000 0002'), 'declined')
  assert.equal(flowForMethod(card, '5555 5555 5555 4444'), 'success')
  assert.equal(flowForMethod({ category: 'wallets', redirects: false, delayed: false }), 'success')
  assert.equal(flowForMethod({ category: 'local', redirects: false, delayed: true }), 'delayed')
})

test('the card form checks number, expiry and security code', () => {
  assert.deepEqual(cardErrors({ number: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' }, NOW), {})
  const errors = cardErrors({ number: '4242', expiry: '13/30', cvc: '1' }, NOW)
  assert.deepEqual(Object.keys(errors).sort(), ['cvc', 'expiry', 'number'])
  assert.equal(cardErrors({ number: '4242424242424242', expiry: '08/26', cvc: '123' }, NOW).expiry, 'This card has expired.')
  assert.equal(cardErrors({ number: '4242424242424242', expiry: '09/26', cvc: '123' }, NOW).expiry, undefined, 'valid to the end of its month')
})

test('a store Maropay doesn’t take payments for offers nothing and names its provider', () => {
  const state = buildScenario('m14', context())
  deactivateStore(state, ATLAS, env())
  const offer = storefrontOffer(state, state.bindings[0]!, PRICE)
  assert.equal(offer.live, false)
  assert.equal(offer.providerLabel, 'PayPal')
  assert.deepEqual([offer.methods, offer.express, offer.acceptedMarks], [[], [], []])
  assert.equal(storefrontOffer(buildScenario('m01', context()), null, PRICE).providerLabel, 'Stripe', 'no Maropay record keeps Stripe')
})

test('the admin preview offers a store’s Maropay setup as if live, without pretending it is', () => {
  const state = buildScenario('m15', context())
  const binding = state.bindings[0]!
  assert.equal(binding.activation, 'inactive')
  assert.deepEqual(storefrontOffer(state, binding, PRICE).methods, [], 'the real storefront still offers nothing')
  const preview = storefrontOffer(state, binding, PRICE, { asIfLive: true })
  assert.equal(preview.live, false)
  assert.equal(preview.providerLabel, 'Maropay')
  assert.deepEqual(preview.methods.map((m) => m.id), orderedCheckoutMethods(state, binding).map((m) => m.id))
  assert.ok(preview.methods.some((m) => m.id === 'card'))
  assert.ok(!preview.methods.some((m) => m.id === 'klarna'), 'a method awaiting approval never reaches shoppers')
  assert.deepEqual(storefrontOffer(state, null, PRICE, { asIfLive: true }).methods, [], 'no binding, nothing to preview')
})

test('checkout options: owner only, validated, logged — and they keep the activation checks', () => {
  const state = buildScenario('m15', context())
  const binding = state.bindings[0]!
  assert.equal(binding.checkoutValidation.status, 'passed')
  assert.equal(updateCheckoutOptions(state, ATLAS, { expressWallets: false }, env(NOW, 'finance')).ok, false)
  const notOn = updateCheckoutOptions(state, ATLAS, { defaultMethodId: 'affirm' }, env())
  assert.equal(!notOn.ok && notOn.error.code, 'invalid_input')
  assert.equal(updateCheckoutOptions(state, ATLAS, { methodOrder: ['card', 'card'] }, env()).ok, false)
  assert.equal(updateCheckoutOptions(state, ATLAS, { payButtonLabel: 'buy' as never }, env()).ok, false)
  const before = state.history.length
  assert.ok(updateCheckoutOptions(state, ATLAS, { defaultMethodId: 'apple_pay', payButtonLabel: 'complete_purchase' }, env()).ok)
  assert.equal(state.history.length, before + 1)
  assert.match(state.history[0]!.text, /Apple Pay selected by default/)
  assert.equal(binding.checkoutValidation.status, 'passed', 'presentation changes keep the test checkout')
  assert.ok(binding.impactReviewedAt)
  assert.ok(updateCheckoutOptions(state, ATLAS, { defaultMethodId: 'apple_pay' }, env()).ok)
  assert.equal(state.history.length, before + 1, 'no change, no history line')
})
