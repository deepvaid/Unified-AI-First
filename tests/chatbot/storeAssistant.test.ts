import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NEW_CONVERSATION, assistantReply, productsFor } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext, AssistantOrder, AssistantProduct, AssistantState, AssistantSubscription } from '../../src/chatbot/storeAssistant.ts'
import { VITAHEAL_CHATBOT, VITAHEAL_CONVERSATIONS, vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

// The assistant is tested against the demo store's real seed: its products and
// the knowledge base its chatbot ships with.

const products: AssistantProduct[] = vitahealProducts().map((p) => ({
  id: p.id, name: p.name, subtitle: p.detail!.subtitle, description: p.detail!.description, collections: p.collections,
}))
const named = (ids: number[]) => ids.map((id) => products.find((p) => p.id === id)!.name)

const entries = VITAHEAL_CHATBOT.knowledgeSources!.flatMap((s) => (s.entries ?? []).map((e) => ({ ...e, source: s.name })))

const LINNEA = 'linnea.berg@example.com'
const order = (over: Partial<AssistantOrder> = {}): AssistantOrder => ({
  id: 900007, number: '#20007', email: LINNEA, date: '2026-11-18', status: 'Processing', fulfillment: 'Not Ready',
  tracking: null, items: [{ name: 'Vitaheal Electrolytes', qty: 1 }], total: '585,90 kr', ...over,
})
const subscription = (over: Partial<AssistantSubscription> = {}): AssistantSubscription => ({
  id: 'sub-1009', number: 'S-1009', email: LINNEA, product: 'Vitaheal Electrolytes', plan: '3-month supply',
  status: 'Active', nextChargeOn: '2027-02-18', price: '585,90 kr', canSkip: true, ...over,
})

const ctx = (over: Partial<AssistantContext> = {}): AssistantContext => ({
  email: null, orders: [order()], subscriptions: [subscription()], products, entries,
  shoppingEnabled: true, trackingEnabled: true, demo: true, ...over,
})

/** A whole conversation: each message is answered with the state the last one left. */
function chat(messages: string[], context = ctx(), state: AssistantState = NEW_CONVERSATION) {
  let turn = assistantReply(messages[0]!, context, state)
  for (const message of messages.slice(1)) turn = assistantReply(message, context, turn.state)
  return turn
}

// ── A product for a wellness need ────────────────────────────────────────────

test('each wellness need finds the product made for it, first', () => {
  const first = (message: string) => named(productsFor(message, products).productIds)[0]
  assert.equal(first('I can’t sleep'), 'Unwind')
  assert.equal(first('I feel stressed in the evenings'), 'Unwind')
  assert.equal(first('I need more focus at work'), 'Clear Focus')
  assert.equal(first('I get cramps when I train'), 'Vitaheal Electrolytes')
  assert.equal(first('something for my skin'), 'Collagen+')
  assert.equal(first('I want to age well'), 'Daily NAD+')
  assert.equal(first('my partner says I snore'), 'Nasal Strips')
})

test('a need is answered with product cards, at most three, and says what they are for', () => {
  const turn = chat(['Help me sleep better'])
  const reply = turn.replies[0]!
  assert.equal(reply.kind, 'products')
  assert.ok(reply.kind === 'products' && reply.productIds.length >= 1 && reply.productIds.length <= 3)
  assert.match(reply.text, /^For better sleep, /)
  assert.doesNotMatch(reply.text, /cure|treat|heal/i)
})

test('a product the merchant adds can be suggested, because matching reads the product itself', () => {
  const added: AssistantProduct = { id: 3001, name: 'Deep Rest', subtitle: 'Sleep through the night', description: 'A capsule for the evening.', collections: ['Sleep'] }
  assert.ok(named0(productsFor('I can’t sleep', [...products, added]).productIds, [...products, added]).includes('Deep Rest'))
})
function named0(ids: number[], list: AssistantProduct[]) { return ids.map((id) => list.find((p) => p.id === id)!.name) }

test('asking for a suggestion without a need gets a question back, not a guess', () => {
  const reply = chat(['What do you recommend?']).replies[0]!
  assert.equal(reply.kind, 'text')
  assert.match(reply.text, /sleep, focus, hydration/)
})

test('with shopping turned off there are no suggestions', () => {
  assert.notEqual(chat(['I can’t sleep'], ctx({ shoppingEnabled: false })).replies[0]!.kind, 'products')
})

test('a health question gets "ask your doctor", never a product', () => {
  for (const message of ['Can I take this while pregnant?', 'Is Clear Focus safe with my blood pressure medication?', 'Will Unwind cure my insomnia?', 'Can my child take it?']) {
    const reply = chat([message]).replies[0]!
    assert.equal(reply.kind, 'text', message)
    assert.match(reply.text, /doctor or pharmacist/, message)
  }
})

// ── Orders ───────────────────────────────────────────────────────────────────

test('a signed-in shopper asking about their order gets their latest order', () => {
  const older = order({ id: 900001, number: '#20001', date: '2026-11-17' })
  const reply = chat(['Where is my order?'], ctx({ email: LINNEA, orders: [older, order()] })).replies[0]!
  assert.ok(reply.kind === 'order' && reply.order.number === '#20007')
  assert.match(reply.text, /^Order #20007, placed 18 Nov 2026: Vitaheal Electrolytes, 585,90 kr\. We are packing it/)
  assert.match(reply.text, /You have 2 orders with us; this is the latest\.$/)
})

test('an unknown shopper is asked for an email, then a code, and is then signed in and answered', () => {
  const asked = chat(['Where is my order?'])
  assert.match(asked.replies[0]!.text, /Which email did you order with\?/)
  assert.equal(asked.state.pending?.step, 'email')

  const coded = assistantReply(`it is ${LINNEA}`, ctx(), asked.state)
  assert.match(coded.replies[0]!.text, /6-digit code to linnea\.berg@example\.com.*any 6 digits work/)
  assert.equal(coded.state.pending?.step, 'code')
  assert.equal(coded.signedIn, undefined)

  const wrong = assistantReply('1234', ctx(), coded.state)
  assert.match(wrong.replies[0]!.text, /6 digits/)
  assert.equal(wrong.state.pending?.step, 'code')

  const done = assistantReply('482913', ctx(), wrong.state)
  assert.equal(done.signedIn, LINNEA)
  assert.equal(done.state.email, LINNEA)
  assert.equal(done.state.pending, null)
  assert.equal(done.replies[0]!.kind, 'order')

  // Once they have said who they are, the next question needs no code.
  assert.equal(assistantReply('when is my next delivery?', ctx(), done.state).replies[0]!.kind, 'subscriptions')
})

test('the shopper signed in on the store now wins over an email confirmed earlier in the chat', () => {
  const asNobody = chat(['Where is my order?', 'nobody@example.com', '111111'])
  assert.equal(asNobody.state.email, 'nobody@example.com')
  const afterCheckout = assistantReply('Where is my order?', ctx({ email: LINNEA }), asNobody.state)
  assert.ok(afterCheckout.replies[0]!.kind === 'order' && afterCheckout.replies[0]!.order.email === LINNEA)
})

test('a store that is not a demo does not mention the demo code', () => {
  const coded = chat(['Where is my order?', LINNEA], ctx({ demo: false }))
  assert.doesNotMatch(coded.replies[0]!.text, /demo/)
})

test('an order number with its email is enough, with no code', () => {
  const direct = chat([`Where is order #20007? My email is ${LINNEA}`])
  assert.ok(direct.replies[0]!.kind === 'order' && direct.signedIn === undefined)

  const twoSteps = chat(['Track order 20007', LINNEA])
  assert.equal(twoSteps.replies[0]!.kind, 'order')
  assert.equal(twoSteps.state.pending, null)
})

test('an order that does not exist is said plainly, with a way to reach the store', () => {
  const none = chat(['Where is my order?', 'nobody@example.com', '111111'])
  assert.equal(none.replies[0]!.kind, 'text')
  assert.match(none.replies[0]!.text, /can’t find an order for nobody@example\.com/)
  const wrongNumber = chat(['order #99999', LINNEA])
  assert.match(wrongNumber.replies[0]!.text, /can’t find order #99999/)
})

test('a shipped, a cancelled and a refunded order each say so', () => {
  const said = (over: Partial<AssistantOrder>) => chat(['where is my order'], ctx({ email: LINNEA, orders: [order(over)] })).replies[0]!.text
  assert.match(said({ fulfillment: 'Shipped', tracking: '1Z999' }), /It has shipped, tracking number 1Z999\.$/)
  assert.match(said({ status: 'Cancelled' }), /It was cancelled/)
  assert.match(said({ status: 'Refunded' }), /It has been refunded\.$/)
  assert.match(said({ items: [{ name: 'Unwind', qty: 2 }] }), /2 × Unwind/)
})

test('another question while an email is awaited drops the wait and is answered', () => {
  const turn = chat(['Where is my order?', 'Help me sleep better'])
  assert.equal(turn.replies[0]!.kind, 'products')
  assert.equal(turn.state.pending, null)
})

// ── Subscriptions ────────────────────────────────────────────────────────────

test('the next delivery is the subscription’s real date, with its price and plan', () => {
  const reply = chat(['When is my next delivery?'], ctx({ email: LINNEA })).replies[0]!
  assert.ok(reply.kind === 'subscriptions' && reply.subscriptions.length === 1)
  assert.equal(reply.text, 'Your next Vitaheal Electrolytes delivery is on 18 Feb 2027, 585,90 kr with your 3-month supply.')
})

test('asking to skip, pause or cancel says where that happens', () => {
  const said = (message: string) => chat([message], ctx({ email: LINNEA })).replies[0]!.text
  assert.match(said('I want to skip my next delivery'), /You can skip it right here\.$/)
  assert.match(said('How do I cancel my subscription?'), /pause, change plan or cancel on your account page\.$/)
  assert.match(said('pause my subscription please'), /account page/)
})

test('a paused, a failed and a missing subscription each get their own answer', () => {
  const said = (subscriptions: AssistantSubscription[]) => chat(['when does my subscription renew?'], ctx({ email: LINNEA, subscriptions })).replies[0]!
  assert.match(said([subscription({ status: 'Paused' })]).text, /is paused/)
  assert.match(said([subscription({ status: 'Payment failed', nextChargeOn: '2026-11-17' })]).text, /couldn’t take the last payment/)
  const none = said([])
  assert.equal(none.kind, 'text')
  assert.match(none.text, /can’t find a subscription/)
})

test('the subscription that needs attention comes first', () => {
  const reply = chat(['my subscription'], ctx({ email: LINNEA, subscriptions: [subscription(), subscription({ id: 'sub-2', number: 'S-2', status: 'Payment failed', product: 'Unwind' })] })).replies[0]!
  assert.ok(reply.kind === 'subscriptions' && reply.subscriptions[0]!.product === 'Unwind')
  assert.match(reply.text, /You have 2 subscriptions/)
})

test('a subscription question needs the code, even with an email in the message', () => {
  const turn = chat(['When is my next delivery?', LINNEA])
  assert.equal(turn.state.pending?.step, 'code')
})

test('with order tracking turned off, the shopper is pointed to the store instead', () => {
  const reply = chat(['Where is my order?'], ctx({ trackingEnabled: false, email: LINNEA })).replies[0]!
  assert.equal(reply.kind, 'text')
  assert.match(reply.text, /can’t look up orders/)
})

// ── The store's own pages ────────────────────────────────────────────────────

test('store questions are answered from the knowledge base, with the page they come from', () => {
  const returns = chat(['What is your return policy?']).replies[0]!
  assert.ok(returns.kind === 'answer' && returns.source === 'Store policies')
  assert.match(returns.text, /within 14 days/)
  assert.ok(returns.kind === 'answer' && returns.link?.href === '/policies/refund-policy')

  const text = (message: string) => chat([message]).replies[0]!.text
  assert.match(text('Do you ship to Canada?'), /United States, Canada/)
  assert.match(text('Is shipping free?'), /shipping is free on orders over \$50/)
  assert.match(text('How long does delivery take?'), /3 to 7 business days/)
  assert.match(text('Is Unwind covered by a guarantee?'), /30 days/)
})

test('how subscriptions work is a store question, not a look-up of the shopper’s own', () => {
  for (const message of ['How do subscriptions work?', 'Can I cancel anytime?', 'Do you offer a subscription?']) {
    const turn = chat([message])
    assert.equal(turn.replies[0]!.kind, 'answer', message)
    assert.match(turn.replies[0]!.text, /skip a delivery, pause or cancel/, message)
    assert.equal(turn.state.pending, null)
  }
})

// ── Small talk and the unknown ───────────────────────────────────────────────

test('a greeting and an unknown question both say what the assistant can do', () => {
  const hello = chat(['Hi there'])
  assert.match(hello.replies[0]!.text, /^Hi! I can look up your order/)
  assert.equal(hello.offerPrompts, true)
  const unknown = chat(['asdf qwerty'])
  assert.match(unknown.replies[0]!.text, /^I’m not sure about that one\./)
  assert.equal(unknown.offerPrompts, true)
  assert.match(chat(['Thanks!']).replies[0]!.text, /You’re welcome/)
})

test('a question about a discount is answered with the store’s running campaign, or says there is none', () => {
  const running = chat(['Do you have a discount code?'], ctx({ promotion: 'Winter wellness week: 15% off everything with code WINTER15' })).replies[0]!
  assert.equal(running.text, 'Yes. Winter wellness week: 15% off everything with code WINTER15. Type the code in your cart or at checkout.')
  assert.ok(running.kind === 'text' && running.link?.href === '/cart-page')
  const none = chat(['any offers right now?']).replies[0]!
  assert.match(none.text, /no discount code running/)
  // An order or a policy question that mentions neither is not mistaken for one.
  assert.equal(chat(['Where is my order?'], ctx({ email: LINNEA, promotion: 'x' })).replies[0]!.kind, 'order')
  assert.equal(chat(['What is your return policy?'], ctx({ promotion: 'x' })).replies[0]!.kind, 'answer')
})

test('asking for a person points to the contact page', () => {
  const reply = chat(['Can I talk to a human?']).replies[0]!
  assert.ok(reply.kind === 'text' && reply.link?.href === '/page/contact')
})

// ── The demo chatbot's seed ──────────────────────────────────────────────────

test('every quick prompt of the demo chatbot gets a real answer', () => {
  const prompts = VITAHEAL_CHATBOT.quickPrompts!.map((p) => p.text)
  assert.equal(prompts.length, 5)
  const kinds = prompts.map((prompt) => chat([prompt], ctx({ email: LINNEA })).replies[0]!.kind)
  assert.deepEqual(kinds, ['order', 'subscriptions', 'products', 'products', 'answer'])
})

test('the demo chatbot’s knowledge and earlier chats point at real store pages and name no other brand', () => {
  for (const source of VITAHEAL_CHATBOT.knowledgeSources!) {
    assert.equal(source.items, source.entries!.length, `${source.name} counts its entries`)
    for (const entry of source.entries!) assert.match(entry.url!, /^\/(page|policies)\/[a-z-]+$/)
  }
  assert.doesNotMatch(JSON.stringify([VITAHEAL_CHATBOT, VITAHEAL_CONVERSATIONS]), /bkm|maropost/i)
})
