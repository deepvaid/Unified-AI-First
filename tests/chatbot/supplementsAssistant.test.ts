import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ASSISTANT_PROFILES, assistantProfile } from '../../src/chatbot/assistantProfiles.ts'
import { NEW_CONVERSATION, assistantProduct, assistantReply, productsFor } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext, AssistantState, AssistantSubscription } from '../../src/chatbot/storeAssistant.ts'
import { DAYBLOOM_CHATBOT } from '../../src/storefront/daybloomDemo.ts'
import { DAYBLOOM_BLUEPRINT } from '../../src/storefront/demoStores/daybloom.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { productHandle, toHandle } from '../../src/storefront/handles.ts'

// The Daybloom assistant (the supplements profile), tested against the store's real
// seed: its ten products, the pages it links, and the knowledge base its chatbot
// ships with. What every wellness store's assistant does (orders, the medical
// caution, store questions) is tested on Vitaheal in storeAssistant.test.ts.

const snap = snapshotFor(DAYBLOOM_BLUEPRINT.homeChannel, 'daybloom', '2026-11-24')
const products = snap.products.map((p) => assistantProduct(p, `/products/${productHandle(p)}`))
const entries = DAYBLOOM_CHATBOT.knowledgeSources!.flatMap((s) => (s.entries ?? []).map((e) => ({ ...e, source: s.name })))
const usDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const HANNAH = 'hannah.whitfield@example.com'
const subscription = (over: Partial<AssistantSubscription> = {}): AssistantSubscription => ({
  id: 'sub-1101', number: 'S-1101', email: HANNAH, product: 'Magnesium Glycinate', plan: 'Subscribe and save plan',
  status: 'Active', nextChargeOn: '2026-12-17', price: '$23.20', canSkip: true, ...over,
})
const ctx = (over: Partial<AssistantContext> = {}): AssistantContext => ({
  email: null, orders: [], subscriptions: [subscription()], products, entries,
  shoppingEnabled: true, trackingEnabled: true, demo: true, profile: 'supplements', formatDay: usDay, ...over,
})
function chat(messages: string[], context = ctx(), state: AssistantState = NEW_CONVERSATION) {
  let turn = assistantReply(messages[0]!, context, state)
  for (const message of messages.slice(1)) turn = assistantReply(message, context, turn.state)
  return turn
}
const said = (message: string, context = ctx()): string => chat([message], context).replies.map((r) => r.text).join(' ')
const suggested = (message: string): string[] => productsFor(message, products, 'supplements').productIds.map((id) => products.find((p) => p.id === id)!.name)

test('Daybloom’s chatbot is on the supplements profile: the wellness answers, with its own goals and pages', () => {
  assert.equal(snap.chatbot.assistantProfile, 'supplements')
  const profile = assistantProfile('supplements')
  assert.equal(profile, ASSISTANT_PROFILES.supplements)
  assert.equal(profile.caution, assistantProfile('wellness').caution, 'the same careful answer to a medical question')
  assert.notEqual(profile.subscriptions, false, 'it sells subscriptions')
  assert.deepEqual(profile.needs.map((need) => need.label), [
    'better sleep', 'feeling calmer', 'steady energy', 'skin, hair and joints', 'hydration', 'gut health', 'immune support', 'heart and brain',
  ])
  // Every page it points to is one the store serves.
  const served = new Set([
    ...snap.content.map((e) => `/${e.kind === 'policy' ? 'policies' : 'page'}/${e.handle}`),
    ...snap.collections.map((c) => `/collections/${toHandle(c.title)}`),
  ])
  for (const link of [profile.noPromotion.link, profile.noSubscription.link]) assert.ok(served.has(link.href), link.href)
})

test('each goal finds the products the store makes for it', () => {
  assert.deepEqual(suggested('I can’t sleep').sort(), ['Magnesium Glycinate', 'Sleep Gummies', 'Sleep Well Bundle'])
  assert.equal(suggested('I feel stressed in the evenings')[0], 'Magnesium Glycinate')
  assert.deepEqual(suggested('I am tired every afternoon'), ['Daily Greens', 'Electrolyte Mix'])
  assert.equal(suggested('I get cramps after the gym')[0], 'Electrolyte Mix')
  assert.equal(suggested('something for bloating and digestion')[0], 'Probiotic 20 Billion')
  assert.equal(suggested('what helps my immune system in winter?')[0], 'Vitamin D3 + K2')
  assert.equal(suggested('something for my skin and joints')[0], 'Collagen Peptides')
  assert.equal(suggested('do you have fish oil for heart health?')[0], 'Omega-3 Fish Oil')
})

test('a need is answered with product cards and names the goal, never a cure', () => {
  const reply = chat(['Help me sleep better']).replies[0]!
  assert.equal(reply.kind, 'products')
  assert.match(reply.text, /^For better sleep, /)
  assert.doesNotMatch(reply.text, /cure|treat|heal/i)
  // Asked without a need, it names this store's goals.
  assert.match(said('What do you recommend?'), /better sleep, steady energy, gut health or immune support/)
})

test('a medical question gets the careful answer, not a product', () => {
  const reply = chat(['Is the fish oil safe with my blood pressure medication?']).replies[0]!
  assert.equal(reply.kind, 'text')
  assert.match(reply.text, /^I can’t give medical advice/)
})

test('a subscriber hears when the next delivery is, what it costs and on which plan', () => {
  const turn = chat(['When is my next delivery?', HANNAH, '123456'])
  assert.equal(turn.replies[0]!.kind, 'subscriptions')
  assert.equal(turn.replies[0]!.text, 'Your next Magnesium Glycinate delivery is on Dec 17, 2026, $23.20 with your Subscribe and save plan.')
})

test('someone without a subscription is pointed to the products they can subscribe to', () => {
  const turn = chat(['When is my next delivery?', 'nobody@example.com', '123456'])
  const reply = turn.replies[0]!
  assert.equal(reply.text, 'I can’t find a subscription for nobody@example.com. You can start one from any product in our Subscribe and save collection.')
  assert.deepEqual(reply.kind === 'text' ? reply.link : undefined, { label: 'See the products', href: '/collections/subscribe-and-save' })
})

test('how subscriptions work, and whether there is a code, are answered in the store’s own numbers', () => {
  assert.match(said('How does Subscribe and save work?'), /20% on a monthly delivery, 15% every 2 months and 10% every 3 months/)
  assert.match(said('How do subscriptions work?'), /renews at the interval you chose until you cancel/)
  // No campaign running: the standing saving, and where it is explained.
  const none = chat(['Do you have a discount code?']).replies[0]!
  assert.equal(none.text, 'There is no discount code running right now. Subscribe and save takes up to 20% off every delivery, all year.')
  assert.deepEqual(none.kind === 'text' ? none.link : undefined, { label: 'How it works', href: '/page/subscribe-and-save' })
  // With one running, it gives the code.
  assert.match(said('Do you have a discount code?', ctx({ promotion: 'Sleep week: 15% off the Sleep range with code SLEEP15' })), /SLEEP15/)
})

test('store questions find the page that answers them, not the nearest one', () => {
  assert.match(said('How long does delivery take?'), /delivery takes 3 to 5 business days/)
  assert.match(said('Can I return an opened product?'), /30-day money-back guarantee/)
  assert.match(said('Are your products vegan?'), /vegan, except Collagen Peptides/)
  assert.match(said('Is there gluten in it?'), /free from gluten, dairy, soy/)
  assert.match(said('Is it third-party tested?'), /tested by an independent lab/)
  assert.match(said('Do you ship to Canada?'), /United States, Canada, the United Kingdom, Australia and New Zealand/)
})

test('the chats seeded for the admin read as the assistant answers today', () => {
  const chats = snap.chatbot.config.knowledgeSources!.flatMap((s) => s.entries ?? [])
  // What the seeded transcripts quote is still in the knowledge base, word for word.
  assert.ok(chats.some((e) => e.text.startsWith('Every product has a 30-day money-back guarantee. If it is not right for you, write to hello@daybloom.example within 30 days of receiving it and we refund it, opened or not.')))
  assert.equal(said('How does Subscribe and save work?'), chats.find((e) => e.title === 'How Subscribe and save works')!.text)
  const sleep = chat(['I keep waking up at night. What do you recommend?']).replies[0]!
  assert.equal(sleep.text, 'For better sleep, these are the ones we make for it:')
  assert.deepEqual(sleep.kind === 'products' ? sleep.productIds.map((id) => products.find((p) => p.id === id)!.name) : [], ['Sleep Well Bundle', 'Magnesium Glycinate', 'Sleep Gummies'])
})
