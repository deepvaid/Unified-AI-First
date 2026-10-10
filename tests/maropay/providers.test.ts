import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildScenario } from '../../src/maropay/scenarios.ts'
import { emptyState } from '../../src/maropay/model.ts'
import { money } from '../../src/maropay/money.ts'
import {
  activeConnections, cardGateway, defaultStoreProviders, ensureStoreProviders, lineupFor, platformFeeFor, platformFeeLine, providerSubtitle, storeProvidersFor,
} from '../../src/maropay/providers.ts'
import { parseState } from '../../src/maropay/model.ts'
import { activationChecklist, migrationImpact, storeCheckoutNote } from '../../src/maropay/readiness.ts'
import { storefrontOffer } from '../../src/maropay/storefront.ts'
import {
  activateStore, connectProvider, deactivateStore, markImpactReviewed, removeProvider, reorderLineup, setMethodEnabled, setProviderStatus, updateManualMethod, validateCheckout,
} from '../../src/services/maropay/mockAdapter.ts'
import { ATLAS, NOW, channelFacts, context, env } from './fixtures.ts'

const PRICE = money(9995, 'USD')

test('the illustrative platform fee follows Shopify’s rule: other providers pay it, Maropay and manual methods never, PayPal only until Maropay takes cards', () => {
  const viaStripe = { cardProcessor: 'stripe' as const }
  const viaMaropay = { cardProcessor: 'maropay' as const }
  assert.equal(platformFeeFor('maropay', viaStripe), null)
  assert.equal(platformFeeFor('bank_deposit', viaStripe), null)
  assert.equal(platformFeeFor('cod', viaMaropay), null)
  for (const kind of ['stripe', 'eway', 'afterpay', 'zip'] as const) {
    assert.deepEqual(platformFeeFor(kind, viaStripe), { bps: 100, label: '1%' }, kind)
    assert.deepEqual(platformFeeFor(kind, viaMaropay), { bps: 100, label: '1%' }, `${kind} keeps paying beside Maropay`)
  }
  assert.deepEqual(platformFeeFor('paypal', viaStripe), { bps: 100, label: '1%' })
  assert.equal(platformFeeFor('paypal', viaMaropay), null)
  assert.equal(platformFeeLine('stripe', viaStripe), '1% Maropost platform fee')
  assert.equal(platformFeeLine('paypal', viaMaropay), '0% Maropost platform fee')
  assert.equal(platformFeeLine('bank_deposit', viaStripe), 'No Maropost platform fee')
  assert.equal(platformFeeLine('maropay', viaStripe), 'No Maropost platform fee')
})

test('a store with no record has Stripe by default, and reading never writes', () => {
  const state = emptyState('2000290', NOW)
  const setup = storeProvidersFor(state, ATLAS)
  assert.deepEqual(setup, defaultStoreProviders(ATLAS))
  assert.equal(setup.cardProcessor, 'stripe')
  assert.deepEqual(state.storeProviders, [], 'a read leaves nothing behind')
  const ensured = ensureStoreProviders(state, ATLAS)
  assert.equal(state.storeProviders.length, 1)
  assert.equal(ensureStoreProviders(state, ATLAS), ensured, 'the second call finds the first record')
  assert.equal(cardGateway(setup)?.kind, 'stripe')
})

test('M18: an Australian store on eWay, Afterpay, Zip and two manual methods offers them all, in A$', () => {
  const state = buildScenario('m18', context())
  assert.equal(state.account?.currency, 'AUD')
  assert.ok(state.payments.length > 0)
  assert.ok(state.payments.every((p) => p.provider === 'eway' && p.amount.currency === 'AUD' && p.legacy === true))
  assert.equal(state.movements.length, 0, 'eWay’s history never touches the Maropay balance')
  const setup = storeProvidersFor(state, ATLAS)
  assert.equal(setup.cardProcessor, 'eway')
  assert.equal(platformFeeLine('eway', setup), '1% Maropost platform fee')
  assert.equal(platformFeeLine('cod', setup), 'No Maropost platform fee')
  const offer = storefrontOffer(state, ATLAS, money(68_064, 'AUD'))
  assert.deepEqual(offer.methods.map((m) => [m.id, m.providerId]),
    [['card', 'eway'], ['afterpay_clearpay', 'afterpay'], ['zip', 'zip'], ['bank_deposit', 'bank_deposit'], ['cod', 'cod']])
  assert.deepEqual(offer.payIn4.labels, ['Afterpay', 'Zip'])
  assert.equal(offer.methods.find((m) => m.id === 'zip')?.caption, '4 interest-free payments of A$170.16')
  const bank = offer.methods.find((m) => m.id === 'bank_deposit')!
  assert.equal(bank.label, 'Direct bank transfer')
  assert.match(bank.description ?? '', /bank transfer/)
  assert.match(bank.instructions ?? '', /order number/)
  assert.deepEqual(offer.acceptedMarks, ['Visa', 'Mastercard', 'Amex', 'Afterpay', 'Zip', 'Bank deposit', 'Cash on delivery'])
  assert.equal(storeCheckoutNote('needs_setup', setup), 'Checkout uses eWay for cards · Afterpay, Zip, Bank deposit, Cash on delivery')
  assert.equal(activationChecklist(state, state.bindings[0]!, channelFacts(ATLAS), NOW).ok, true)
})

test('coexistence: Maropay takes cards from the gateway, or sits beside it and adds only what it lacks', () => {
  const state = buildScenario('m15', context())
  const binding = state.bindings[0]!
  const nothingToAdd = activateStore(state, ATLAS, channelFacts(ATLAS), env(), { takeCards: false })
  assert.equal(!nothingToAdd.ok && nothingToAdd.error.code, 'invalid_input', 'with only cards and wallets on, keeping Stripe for cards leaves Maropay nothing')
  assert.ok(setMethodEnabled(state, ATLAS, 'paypal', true, env()).ok)
  // A method change resets the test checkout and the review, as always.
  validateCheckout(state, ATLAS, env())
  markImpactReviewed(state, ATLAS, env())
  const beside = migrationImpact(state, binding, 'Atlas Outfitters', 'existing')!
  assert.ok(beside.rows.every((r) => r.change === 'stays'))
  assert.deepEqual(beside.coexisting, ['Stripe', 'Bank deposit'])
  assert.match(beside.transfers[0]!, /Maropay adds PayPal beside Stripe/)
  assert.ok(activateStore(state, ATLAS, channelFacts(ATLAS), env(), { takeCards: false }).ok)
  assert.equal(storeProvidersFor(state, ATLAS).cardProcessor, 'stripe')
  assert.match(state.history[0]!.text, /beside Stripe — Stripe keeps cards; Maropay adds PayPal/)
  assert.equal(storeCheckoutNote('live', storeProvidersFor(state, ATLAS)), 'Checkout uses Stripe for cards · Maropay, Bank deposit')
  assert.ok(deactivateStore(state, ATLAS, env()).ok)
  assert.equal(storeProvidersFor(state, ATLAS).cardProcessor, 'stripe')

  const taken = buildScenario('m15', context())
  const moving = migrationImpact(taken, taken.bindings[0]!, 'Atlas Outfitters')!
  assert.deepEqual(moving.rows.map((r) => [r.label, r.change]), [['Cards', 'same'], ['Apple Pay', 'same'], ['Google Pay', 'same']])
  assert.deepEqual(moving.coexisting, ['Bank deposit'])
  assert.ok(moving.staysWithPrevious.some((line) => line.startsWith('Bank deposit stays as it is')))
  assert.match(activationChecklist(taken, taken.bindings[0]!, channelFacts(ATLAS), NOW).items.find((i) => i.key === 'impact_reviewed')!.detail, /^Activation impact reviewed/)
  assert.ok(activateStore(taken, ATLAS, channelFacts(ATLAS), env()).ok)
  assert.equal(storeProvidersFor(taken, ATLAS).cardProcessor, 'maropay')
  assert.match(taken.history[0]!.text, /takes cards from Stripe/)
  assert.equal(storeCheckoutNote('live', storeProvidersFor(taken, ATLAS)), 'Checkout uses Maropay for cards · Bank deposit')
  assert.equal(providerSubtitle(cardGateway(storeProvidersFor(taken, ATLAS))!, storeProvidersFor(taken, ATLAS)), 'Nothing at checkout — cards and wallets go through Maropay')
  assert.ok(deactivateStore(taken, ATLAS, env()).ok)
  assert.equal(storeProvidersFor(taken, ATLAS).cardProcessor, 'stripe', 'cards go back to Stripe')
})

test('the merchant adds, connects, switches off and removes their own providers — owner only', () => {
  const state = buildScenario('m10', context())
  assert.equal(connectProvider(state, ATLAS, 'zip', env(NOW, 'finance')).ok, false)
  assert.ok(connectProvider(state, ATLAS, 'zip', env()).ok)
  const duplicate = connectProvider(state, ATLAS, 'zip', env())
  assert.equal(!duplicate.ok && duplicate.error.code, 'invalid_input')
  let setup = storeProvidersFor(state, ATLAS)
  assert.equal(setup.connections.find((c) => c.kind === 'zip')?.status, 'setup_incomplete')
  assert.ok(!storefrontOffer(state, ATLAS, PRICE).methods.some((m) => m.id === 'zip'), 'not offered until it is connected')
  assert.ok(setProviderStatus(state, ATLAS, 'zip', 'active', env()).ok)
  assert.match(state.history[0]!.text, /^Connected Zip/)
  assert.ok(storefrontOffer(state, ATLAS, PRICE).methods.some((m) => m.id === 'zip' && m.providerId === 'zip'))
  assert.ok(connectProvider(state, ATLAS, 'cod', env()).ok)
  assert.ok(storefrontOffer(state, ATLAS, PRICE).methods.some((m) => m.id === 'cod'), 'a manual method is on at once')
  assert.equal(providerSubtitle(storeProvidersFor(state, ATLAS).connections.find((c) => c.kind === 'cod')!, storeProvidersFor(state, ATLAS)), 'Shown at checkout as “Cash on delivery” · No Maropost platform fee')
  assert.ok(removeProvider(state, ATLAS, 'zip', env()).ok)
  setup = storeProvidersFor(state, ATLAS)
  assert.ok(!setup.connections.some((c) => c.kind === 'zip'))
  assert.equal(removeProvider(state, ATLAS, 'zip', env()).ok, false)
})

test('switching the card gateway off before Maropay leaves the store without a card processor, honestly', () => {
  const state = buildScenario('m05', context())
  assert.ok(setProviderStatus(state, ATLAS, 'stripe', 'inactive', env()).ok)
  const setup = storeProvidersFor(state, ATLAS)
  assert.equal(setup.cardProcessor, null)
  assert.equal(cardGateway(setup), null)
  const offer = storefrontOffer(state, ATLAS, PRICE)
  assert.deepEqual(offer.methods.map((m) => m.id), ['bank_deposit'])
  assert.equal(offer.cardsVia, null)
  assert.equal(offer.providerLabel, null)
  assert.equal(storeCheckoutNote('needs_setup', setup), 'Checkout uses Bank deposit — no card processor')
  assert.ok(setProviderStatus(state, ATLAS, 'stripe', 'active', env()).ok)
  assert.equal(storeProvidersFor(state, ATLAS).cardProcessor, 'stripe', 'switching it back on makes it the card processor again')
})

test('a manual method’s wording reaches the shopper, and needs a name', () => {
  const state = buildScenario('m10', context())
  const noName = updateManualMethod(state, ATLAS, 'bank_deposit', { displayName: '  ' }, env())
  assert.equal(!noName.ok && noName.error.code, 'invalid_input')
  assert.equal(updateManualMethod(state, ATLAS, 'stripe', { displayName: 'Cards' }, env()).ok, false, 'only manual methods have wording')
  const before = state.history.length
  assert.ok(updateManualMethod(state, ATLAS, 'bank_deposit', { displayName: 'Bank transfer (EFT)', checkoutDescription: 'We ship once it clears.', paymentInstructions: 'BSB 062-000 · Account 1234 5678' }, env()).ok)
  assert.equal(state.history.length, before + 1)
  const bank = storefrontOffer(state, ATLAS, PRICE).methods.find((m) => m.id === 'bank_deposit')!
  assert.deepEqual([bank.label, bank.caption, bank.instructions], ['Bank transfer (EFT)', 'We ship once it clears.', 'BSB 062-000 · Account 1234 5678'])
  assert.ok(updateManualMethod(state, ATLAS, 'bank_deposit', { displayName: 'Bank transfer (EFT)' }, env()).ok)
  assert.equal(state.history.length, before + 1, 'no change, no history line')
})

test('the checkout lineup: whoever takes cards leads, manual methods close, Maropay joins once live, and a saved order survives', () => {
  const m18 = buildScenario('m18', context())
  assert.deepEqual(lineupFor(storeProvidersFor(m18, ATLAS), { maropay: false }), ['eway', 'afterpay', 'zip', 'bank_deposit', 'cod'])
  assert.deepEqual(lineupFor(storeProvidersFor(m18, ATLAS), { maropay: true }), ['eway', 'afterpay', 'zip', 'maropay', 'bank_deposit', 'cod'], 'not yet taking cards, Maropay slots in after the other online providers')
  assert.deepEqual(lineupFor(storeProvidersFor(m18, ATLAS), { maropay: true, processor: 'maropay' }), ['maropay', 'eway', 'afterpay', 'zip', 'bank_deposit', 'cod'])

  const state = buildScenario('m10', context())
  assert.deepEqual(lineupFor(storeProvidersFor(state, ATLAS), { maropay: true }), ['maropay', 'paypal', 'bank_deposit'])
  assert.equal(reorderLineup(state, ATLAS, ['paypal', 'maropay', 'bank_deposit'], env(NOW, 'finance')).ok, false, 'owner only')
  const twice = reorderLineup(state, ATLAS, ['paypal', 'paypal', 'bank_deposit'], env())
  assert.equal(!twice.ok && twice.error.code, 'invalid_input')
  const stranger = reorderLineup(state, ATLAS, ['paypal', 'maropay', 'zip'], env())
  assert.equal(!stranger.ok && stranger.error.code, 'invalid_input')
  const before = state.history.length
  assert.ok(reorderLineup(state, ATLAS, ['maropay', 'paypal', 'bank_deposit'], env()).ok)
  assert.equal(state.history.length, before, 'the same order is not a change')
  assert.ok(reorderLineup(state, ATLAS, ['bank_deposit', 'maropay', 'paypal'], env()).ok)
  assert.match(state.history[0]!.text, /^Checkout order: Bank deposit, Maropay, PayPal$/)
  assert.deepEqual(storefrontOffer(state, ATLAS, PRICE).methods.map((m) => m.providerId), ['bank_deposit', 'maropay', 'maropay', 'maropay', 'paypal'])
  // A newcomer slots in by the rule; a removed provider drops out; a reload keeps the order.
  assert.ok(connectProvider(state, ATLAS, 'cod', env()).ok)
  assert.deepEqual(lineupFor(storeProvidersFor(state, ATLAS), { maropay: true }), ['bank_deposit', 'maropay', 'paypal', 'cod'])
  assert.ok(removeProvider(state, ATLAS, 'paypal', env()).ok)
  assert.deepEqual(lineupFor(storeProvidersFor(state, ATLAS), { maropay: true }), ['bank_deposit', 'maropay', 'cod'])
  const reloaded = parseState(JSON.stringify(state), state.accountId, NOW)!
  assert.deepEqual(storeProvidersFor(reloaded, ATLAS).lineup, ['bank_deposit', 'maropay', 'paypal'])
  assert.ok(deactivateStore(state, ATLAS, env()).ok)
  assert.deepEqual(lineupFor(storeProvidersFor(state, ATLAS), { maropay: false }), ['bank_deposit', 'cod'], 'stopped: Maropay leaves the lineup; the saved order waits')
})

test('every live scenario keeps one of the merchant’s own providers beside Maropay', () => {
  for (const key of ['m07', 'm08', 'm09', 'm10', 'm11', 'm12', 'm13', 'm14', 'm16', 'm17'] as const) {
    const state = buildScenario(key, context())
    assert.equal(state.bindings.find((b) => b.channelId === ATLAS)?.activation, 'live', key)
    assert.ok(activeConnections(storeProvidersFor(state, ATLAS)).length > 0, `${key} has a provider beside Maropay`)
    assert.equal(storeProvidersFor(state, ATLAS).cardProcessor, 'maropay', `${key}: Maropay takes cards`)
  }
})
