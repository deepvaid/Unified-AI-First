import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { money } from '../../src/maropay/money.ts'
import { cardErrors, flowForMethod, paidWithText, payButtonText, resolveShopperMethods, storefrontOffer } from '../../src/maropay/storefront.ts'
import { activateStore, deactivateStore, markImpactReviewed, setMethodEnabled, setProviderStatus, simulateMethodApproval, updateCheckoutOptions, validateCheckout } from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, NOW, channelFacts, context, env } from './fixtures.ts'

const PRICE = money(9995, 'USD')

test('a live store offers Maropay’s ready methods beside the merchant’s own providers, cards under the Maropay name', () => {
  const state = buildScenario('m10', context())
  const offer = storefrontOffer(state, ATLAS, PRICE)
  assert.equal(offer.live, true)
  assert.equal(offer.cardsVia, 'maropay')
  assert.equal(offer.providerLabel, 'Maropay')
  assert.deepEqual(offer.methods.map((m) => m.label), ['Maropay', 'Apple Pay', 'Google Pay', 'PayPal', 'Direct bank transfer'])
  assert.deepEqual(offer.methods.map((m) => m.providerId), ['maropay', 'maropay', 'maropay', 'paypal', 'bank_deposit'], 'PayPal Checkout and bank deposit are the merchant’s own')
  assert.deepEqual(offer.providers.map((p) => p.id), ['maropay', 'paypal', 'bank_deposit'])
  assert.equal(offer.defaultMethodId, 'card')
  assert.deepEqual(offer.express.map((m) => m.id), ['apple_pay', 'google_pay', 'paypal'])
  assert.deepEqual(offer.acceptedMarks, ['Maropay', 'Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay', 'PayPal', 'Bank deposit'])
  assert.deepEqual(offer.payIn4.labels, [])
  assert.equal(payButtonText(offer.methods[0]!, offer.payButton, PRICE), 'Pay $99.95')
})

test('one order and one default across providers reach the shopper, with the express switch and button label', () => {
  const state = buildScenario('m10', context())
  assert.ok(updateCheckoutOptions(state, ATLAS, { methodOrder: ['google_pay', 'card'], defaultMethodId: 'google_pay', expressWallets: false, payButtonLabel: 'place_order' }, env()).ok)
  let offer = storefrontOffer(state, ATLAS, PRICE)
  assert.deepEqual(offer.methods.map((m) => m.id), ['google_pay', 'card', 'apple_pay', 'paypal', 'bank_deposit'], 'unlisted methods follow the ladder: cards, wallets, buy now pay later, bank, manual')
  assert.equal(offer.defaultMethodId, 'google_pay')
  assert.deepEqual(offer.express, [])
  assert.equal(payButtonText(offer.methods[1]!, offer.payButton, PRICE), 'Place order')
  // The merchant can put their own methods first too.
  assert.ok(updateCheckoutOptions(state, ATLAS, { methodOrder: ['bank_deposit', 'paypal'], defaultMethodId: 'bank_deposit' }, env()).ok)
  offer = storefrontOffer(state, ATLAS, PRICE)
  assert.deepEqual(offer.methods.map((m) => m.id), ['bank_deposit', 'paypal', 'card', 'apple_pay', 'google_pay'])
  assert.equal(offer.defaultMethodId, 'bank_deposit')
  const notOnStore = updateCheckoutOptions(state, ATLAS, { methodOrder: ['zip'] }, env())
  assert.equal(!notOnStore.ok && notOnStore.error.code, 'invalid_input')
  // A default that is no longer offered falls back to the first method.
  assert.ok(updateCheckoutOptions(state, ATLAS, { methodOrder: [], defaultMethodId: 'google_pay' }, env()).ok)
  setMethodEnabled(state, ATLAS, 'google_pay', false, env())
  assert.equal(storefrontOffer(state, ATLAS, PRICE).defaultMethodId, 'card')
})

test('the merchant’s own PayPal wins over PayPal through Maropay, and PayPal appears once either way', () => {
  const state = buildScenario('m10', context())
  assert.ok(setMethodEnabled(state, ATLAS, 'paypal', true, env()).ok, 'PayPal doesn’t need cards')
  let offer = storefrontOffer(state, ATLAS, PRICE)
  const own = offer.methods.filter((m) => m.id === 'paypal')
  assert.equal(own.length, 1)
  assert.equal(own[0]!.providerId, 'paypal')
  assert.ok(offer.express.some((m) => m.id === 'paypal'))
  assert.equal(flowForMethod(own[0]!), 'redirect')
  assert.equal(payButtonText(own[0]!, 'pay', PRICE), 'Pay with PayPal')
  // Switch the merchant's own PayPal off and Maropay's version takes its place.
  assert.ok(setProviderStatus(state, ATLAS, 'paypal', 'inactive', env()).ok)
  offer = storefrontOffer(state, ATLAS, PRICE)
  assert.deepEqual(offer.methods.filter((m) => m.id === 'paypal').map((m) => m.providerId), ['maropay'])
})

test('approved buy now, pay later methods show instalments on the product page', () => {
  const state = buildScenario('m10', context())
  setMethodEnabled(state, ATLAS, 'klarna', true, env())
  assert.deepEqual(storefrontOffer(state, ATLAS, PRICE).payIn4.labels, [], 'not before approval')
  simulateMethodApproval(state, 'klarna', true, env())
  setMethodEnabled(state, ATLAS, 'afterpay_clearpay', true, env())
  setMethodEnabled(state, ATLAS, 'affirm', true, env())
  const offer = storefrontOffer(state, ATLAS, PRICE)
  assert.deepEqual(offer.payIn4.labels, ['Klarna', 'Afterpay'])
  assert.deepEqual(offer.payIn4.amount, money(2499, 'USD'), 'rounded up so four payments cover the price')
  assert.deepEqual(offer.monthly, { labels: ['Affirm'], amount: money(833, 'USD') })
  const klarna = offer.methods.find((m) => m.id === 'klarna')!
  assert.equal(klarna.caption, '4 interest-free payments of $24.99')
  assert.equal(flowForMethod(klarna), 'redirect')
  assert.equal(payButtonText(klarna, 'pay', PRICE), 'Continue to Klarna')
})

test('test card numbers pick the outcome on any processor; wallets pay, bank debits confirm later, manual methods place the order', () => {
  const card = { category: 'cards' as const, redirects: false, delayed: false }
  assert.equal(flowForMethod(card, '4242 4242 4242 4242'), 'success')
  assert.equal(flowForMethod(card, '4000002500003155'), 'auth_required')
  assert.equal(flowForMethod(card, '4000 0000 0000 0002'), 'declined')
  assert.equal(flowForMethod(card, '5555 5555 5555 4444'), 'success')
  assert.equal(flowForMethod({ category: 'wallets', redirects: false, delayed: false }), 'success')
  assert.equal(flowForMethod({ category: 'local', redirects: false, delayed: true }), 'delayed')
  assert.equal(flowForMethod({ category: 'manual', redirects: false, delayed: false }), 'manual')
  assert.equal(payButtonText({ id: 'bank_deposit', label: 'Direct bank transfer', redirects: false, category: 'manual' }, 'pay', PRICE), 'Place order')
})

test('the card form checks number, expiry and security code', () => {
  assert.deepEqual(cardErrors({ number: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' }, NOW), {})
  const errors = cardErrors({ number: '4242', expiry: '13/30', cvc: '1' }, NOW)
  assert.deepEqual(Object.keys(errors).sort(), ['cvc', 'expiry', 'number'])
  assert.equal(cardErrors({ number: '4242424242424242', expiry: '08/26', cvc: '123' }, NOW).expiry, 'This card has expired.')
  assert.equal(cardErrors({ number: '4242424242424242', expiry: '09/26', cvc: '123' }, NOW).expiry, undefined, 'valid to the end of its month')
})

test('a Stripe merchant’s store takes cards and wallets through Stripe before Maropay is live', () => {
  const offer = storefrontOffer(buildScenario('m05', context()), ATLAS, PRICE)
  assert.equal(offer.live, false)
  assert.equal(offer.cardsVia, 'stripe')
  assert.equal(offer.providerLabel, 'Stripe')
  assert.deepEqual(offer.methods.map((m) => [m.id, m.providerId]), [['card', 'stripe'], ['apple_pay', 'stripe'], ['google_pay', 'stripe'], ['bank_deposit', 'bank_deposit']])
  assert.equal(offer.methods[0]!.label, 'Credit or debit card', 'only Maropay’s cards carry the Maropay name')
  assert.deepEqual(offer.express.map((m) => m.id), ['apple_pay', 'google_pay'])
  assert.deepEqual(offer.acceptedMarks, ['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay', 'Bank deposit'])
  // A store that never touched payments keeps its long-standing Stripe checkout — with or without a Maropay record.
  const fresh = storefrontOffer(buildScenario('m01', context()), ATLAS, PRICE)
  assert.deepEqual([fresh.providerLabel, fresh.methods.map((m) => m.id)], ['Stripe', ['card', 'apple_pay', 'google_pay']])
  assert.equal(storefrontOffer(buildScenario('m01', context()), 'no-such-store', PRICE).providerLabel, 'Stripe')
})

test('stopping Maropay hands cards back to the merchant’s own gateway; nothing goes dead', () => {
  const state = buildScenario('m14', context())
  assert.equal(storefrontOffer(state, ATLAS, PRICE).cardsVia, 'maropay')
  assert.ok(deactivateStore(state, ATLAS, env()).ok)
  const offer = storefrontOffer(state, ATLAS, PRICE)
  assert.equal(offer.live, false)
  assert.equal(offer.providerLabel, 'PayPal')
  assert.deepEqual(offer.methods.map((m) => [m.id, m.providerId]), [['card', 'paypal'], ['paypal', 'paypal'], ['bank_deposit', 'bank_deposit']])
  assert.ok(!offer.acceptedMarks.includes('Maropay'))
})

test('the admin preview adds Maropay as if live and keeps the other providers as they are', () => {
  const state = buildScenario('m15', context())
  const binding = state.bindings[0]!
  assert.equal(binding.activation, 'inactive')
  const real = storefrontOffer(state, ATLAS, PRICE)
  assert.deepEqual(real.methods.map((m) => m.providerId), ['stripe', 'stripe', 'stripe', 'bank_deposit'], 'the real storefront still runs on Stripe')
  const preview = storefrontOffer(state, ATLAS, PRICE, { asIfLive: true })
  assert.equal(preview.live, false)
  assert.equal(preview.providerLabel, 'Maropay')
  assert.deepEqual(preview.methods.map((m) => [m.id, m.providerId]), [['card', 'maropay'], ['apple_pay', 'maropay'], ['google_pay', 'maropay'], ['bank_deposit', 'bank_deposit']])
  assert.ok(!preview.methods.some((m) => m.id === 'klarna'), 'a method awaiting approval never reaches shoppers')
  // The dialog's other choice: Stripe keeps cards and Maropay adds only what Stripe lacks.
  const keep = storefrontOffer(state, ATLAS, PRICE, { asIfLive: true, cardsVia: 'existing' })
  assert.deepEqual(keep.methods.map((m) => m.providerId), ['stripe', 'stripe', 'stripe', 'bank_deposit'])
  assert.ok(setMethodEnabled(state, ATLAS, 'paypal', true, env()).ok)
  assert.deepEqual(storefrontOffer(state, ATLAS, PRICE, { asIfLive: true, cardsVia: 'existing' }).methods.map((m) => [m.id, m.providerId]),
    [['card', 'stripe'], ['apple_pay', 'stripe'], ['google_pay', 'stripe'], ['paypal', 'maropay'], ['bank_deposit', 'bank_deposit']])
  assert.deepEqual(resolveShopperMethods(state, 'no-such-store', { asIfLive: true }).map((m) => m.providerId), ['stripe', 'stripe', 'stripe'], 'no binding, nothing of Maropay’s to preview')
})

test('activation moves cards to Maropay by default, or keeps the gateway for cards', () => {
  const taken = buildScenario('m15', context())
  assert.ok(activateStore(taken, ATLAS, channelFacts(ATLAS), env()).ok)
  assert.deepEqual(storefrontOffer(taken, ATLAS, PRICE).methods.map((m) => [m.id, m.providerId]), [['card', 'maropay'], ['apple_pay', 'maropay'], ['google_pay', 'maropay'], ['bank_deposit', 'bank_deposit']])
  const kept = buildScenario('m15', context())
  assert.ok(setMethodEnabled(kept, ATLAS, 'paypal', true, env()).ok)
  validateCheckout(kept, ATLAS, env())
  markImpactReviewed(kept, ATLAS, env())
  assert.ok(activateStore(kept, ATLAS, channelFacts(ATLAS), env(), { takeCards: false }).ok)
  const offer = storefrontOffer(kept, ATLAS, PRICE)
  assert.equal(offer.live, true)
  assert.equal(offer.cardsVia, 'stripe')
  assert.deepEqual(offer.methods.map((m) => [m.id, m.providerId]), [['card', 'stripe'], ['apple_pay', 'stripe'], ['google_pay', 'stripe'], ['paypal', 'maropay'], ['bank_deposit', 'bank_deposit']])
})

test('checkout options: owner only, validated across providers, logged — and they keep the activation checks', () => {
  const state = buildScenario('m15', context())
  const binding = state.bindings[0]!
  assert.equal(binding.checkoutValidation.status, 'passed')
  assert.equal(updateCheckoutOptions(state, ATLAS, { expressWallets: false }, env(NOW, 'finance')).ok, false)
  const notOn = updateCheckoutOptions(state, ATLAS, { defaultMethodId: 'affirm' }, env())
  assert.equal(!notOn.ok && notOn.error.code, 'invalid_input')
  assert.equal(updateCheckoutOptions(state, ATLAS, { methodOrder: ['card', 'card'] }, env()).ok, false)
  assert.equal(updateCheckoutOptions(state, ATLAS, { payButtonLabel: 'buy' as never }, env()).ok, false)
  assert.ok(updateCheckoutOptions(state, ATLAS, { defaultMethodId: 'bank_deposit' }, env()).ok, 'the merchant’s own methods can be arranged too')
  const before = state.history.length
  assert.ok(updateCheckoutOptions(state, ATLAS, { defaultMethodId: 'apple_pay', payButtonLabel: 'complete_purchase' }, env()).ok)
  assert.equal(state.history.length, before + 1)
  assert.match(state.history[0]!.text, /Apple Pay selected by default/)
  assert.equal(binding.checkoutValidation.status, 'passed', 'presentation changes keep the test checkout')
  assert.ok(binding.impactReviewedAt)
  assert.ok(updateCheckoutOptions(state, ATLAS, { defaultMethodId: 'apple_pay' }, env()).ok)
  assert.equal(state.history.length, before + 1, 'no change, no history line')
})

test('paid-with reads the brand the shopper chose; only Maropay’s cards carry the Maropay name', () => {
  assert.equal(paidWithText({ provider: 'maropay', methodId: 'card', methodLabel: 'Visa •••• 4242', status: 'captured' }), 'Maropay · Visa •••• 4242')
  assert.equal(paidWithText({ provider: 'stripe', methodId: 'card', methodLabel: 'Visa •••• 4242', status: 'captured' }), 'Visa •••• 4242')
  assert.equal(paidWithText({ provider: 'paypal', methodId: 'paypal', methodLabel: 'PayPal', status: 'captured' }), 'PayPal')
  assert.equal(paidWithText({ provider: 'bank_deposit', methodId: 'bank_deposit', methodLabel: 'Direct bank transfer', status: 'processing' }), 'Direct bank transfer — awaiting payment')
  assert.equal(paidWithText({ provider: 'bank_deposit', methodId: 'bank_deposit', methodLabel: 'Direct bank transfer', status: 'captured' }), 'Direct bank transfer')
})
