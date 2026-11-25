import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assistantProfile } from '../../src/chatbot/assistantProfiles.ts'
import { NEW_CONVERSATION, assistantProduct, assistantReply, productsFor } from '../../src/chatbot/storeAssistant.ts'
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

// ── The range added after the first review: immunity, protein, omega-3, vitamins, greens ──

/** What a message is answered with: the reply's words, and the names on its product cards. */
function suggestion(message: string, context = ctx()): { text: string; names: string[] } {
  const reply = chat([message], context).replies[0]!
  return { text: reply.text, names: reply.kind === 'products' ? named(reply.productIds) : [] }
}
const inCollection = (collection: string) => products.filter((p) => p.collections.includes(collection)).map((p) => p.name)

test('a shopper who keeps catching colds is shown the Immunity products', () => {
  for (const message of [
    'I keep catching colds', 'something for my immune system', 'I always get sick in winter', 'Do you have vitamin C?', 'zinc',
    'Do you have anything for a cold?', 'What helps with a cold?', 'I have a cold', 'Something for the winter', 'winter',
  ]) {
    const { text, names } = suggestion(message)
    assert.match(text, /^For immune support, /, message)
    assert.deepEqual(names.sort(), inCollection('Immunity').sort(), message)
  }
  // A cold drink, cold hands, or delivery and opening hours in winter, is not a cold.
  for (const message of ['Can I mix it with cold water?', 'Can I have it with a cold drink?', 'I had cold coffee with it, is that ok?', 'I always have cold hands and feet']) {
    assert.deepEqual(suggestion(message).names, [], message)
  }
  for (const message of ['Does delivery take longer in winter?', 'Do you ship over the winter holidays?', 'Are you open over the winter holidays?']) {
    assert.equal(chat([message]).replies[0]!.kind, 'answer', message)
  }
})

test('protein after the gym is Plant Protein, not hydration', () => {
  const { text, names } = suggestion('protein after the gym')
  assert.equal(text, 'For muscle and strength, these are the ones we make for it:')
  assert.equal(names[0], 'Plant Protein')
  assert.ok(!names.includes('Vitaheal Electrolytes'))
  assert.ok(suggestion('creatine').names.includes('Creatine'))
  assert.match(suggestion('I want to build muscle').text, /^For muscle and strength, /)
  // Training said on its own is still hydration; running and lifting ask for both.
  assert.deepEqual(suggestion('I get cramps when I train').names, ['Vitaheal Electrolytes'])
  assert.match(suggestion('I run marathons and lift weights').text, /^For hydration and training and muscle and strength, /)
  // "Strength" alone may be a dose, not a need.
  assert.deepEqual(suggestion('What strength is Magnesium?').names, [])
})

test('omega 3 is Omega-3, for heart and brain', () => {
  for (const message of ['omega 3', 'Do you have omega-3?', 'something for my heart', 'fish oil']) {
    assert.deepEqual(suggestion(message), { text: 'For heart and brain, this is the one we make for it:', names: ['Omega-3'] }, message)
  }
})

test('a multivitamin is Daily Multi first, with the other vitamins', () => {
  const { text, names } = suggestion('do you have a multivitamin?')
  assert.match(text, /^For everyday vitamins, /)
  assert.deepEqual(names, ['Daily Multi', 'Vitamin D3 + K2', 'Vitamin C + Zinc'])
})

test('greens are Daily Greens', () => {
  for (const message of ['greens powder', 'I don’t eat enough vegetables']) {
    assert.deepEqual(suggestion(message), { text: 'For greens and fibre, this is the one we make for it:', names: ['Daily Greens'] }, message)
  }
})

test('a shopper who is always tired is shown Magnesium too, whose own words are "less tiredness"', () => {
  const { text, names } = suggestion('I am always tired in the afternoon')
  assert.match(text, /^For steady energy, /)
  assert.ok(names.includes('Magnesium'), names.join(', '))
})

test('the new products’ words don’t answer questions about something else', () => {
  // A request's words ("something", "buy") name no need, whatever a product's own words say: it gets a question back.
  for (const message of [
    'what should I buy?', 'Can you suggest something to buy?', 'What would you recommend I buy?', 'I’m looking for something to buy',
    'Which one should I buy?', 'What’s the best product to buy?',
  ]) {
    assert.match(suggestion(message).text, /^Tell me what you would like help with/, message)
  }
  // Balance first, and not Vitamin D3 + K2 "for the dark months".
  assert.deepEqual(suggestion('something for women').names, ['Balance', 'Balance Refill'])
  // A request still reads the words it names besides asking.
  assert.deepEqual(suggestion('I’m looking for something vegan').names, ['Omega-3'])
})

test('the help line, and the question back to a request, name protein and immune support among the suggestions', () => {
  assert.match(chat(['Hi']).replies[0]!.text, /suggest a product for sleep, focus, hydration, protein, immune support, skin or healthy ageing/)
  assert.match(chat(['What do you recommend?']).replies[0]!.text, /better sleep, focus, hydration, protein, immune support, skin or healthy ageing/)
})

// ── Refills ──────────────────────────────────────────────────────────────────

/** The products as the store hands them to the chat: with their choices ("Can", "Refill bag"). */
const onTheStore = vitahealProducts().map((p) => assistantProduct(p, `/products/${p.detail!.url}`))
const onTheStoreNamed = (ids: number[]) => ids.map((id) => onTheStore.find((p) => p.id === id)!.name)
/** The products that come in a refill, newest first, as the store's Newest sort has them. */
const REFILLED = 'Creatine, Daily Greens, Plant Protein, Balance Refill, Collagen+, Daily NAD+, Clear Focus and Unwind'

test('asked about refills, the assistant names the products that come in one, with at most three cards', () => {
  const store = ctx({ products: onTheStore })
  const all = chat(['do you sell refills?'], store).replies[0]!
  assert.equal(all.text, `Yes. ${REFILLED} come in a refill. Choose the refill on a product’s page:`)
  // The newest first: the three powders.
  assert.deepEqual(all.kind === 'products' ? onTheStoreNamed(all.productIds) : [], ['Creatine', 'Daily Greens', 'Plant Protein'])
  // "Which" asks which, not whether.
  assert.equal(chat(['Which products come in refill bags?'], store).replies[0]!.text, `${REFILLED} come in a refill. Choose the refill on a product’s page:`)

  const protein = chat(['is there a refill bag for the protein?'], store).replies[0]!
  assert.equal(protein.text, 'Yes. Plant Protein comes in a refill bag as well as the can. Choose Refill bag on its page:')
  assert.deepEqual(protein.kind === 'products' ? onTheStoreNamed(protein.productIds) : [], ['Plant Protein'])

  assert.equal(chat(['Is there a refill for Unwind?'], store).replies[0]!.text, 'Yes. Unwind comes in a bag as well as the can. Choose Bag on its page:')
  assert.equal(chat(['refill for balance'], store).replies[0]!.text, 'Yes. Balance Refill is the refill for Balance:')
  // Two products named: both, though one name has more words than the other.
  const two = chat(['Do you have refills for Clear Focus and Unwind?'], store).replies[0]!
  assert.equal(two.text, 'Yes. These come in a refill:')
  assert.deepEqual(two.kind === 'products' ? onTheStoreNamed(two.productIds).sort() : [], ['Clear Focus', 'Unwind'])
  // A "No" says which do, with no cards the shopper did not ask about.
  const none = chat(['Is there a refill for the electrolytes?'], store).replies[0]!
  assert.equal(none.kind, 'text')
  assert.equal(none.text, `No, Vitaheal Electrolytes doesn’t come in a refill. ${REFILLED} do.`)
})

test('any other question about a refill is the store’s pages’ to answer, never a "Yes"', () => {
  const store = ctx({ products: onTheStore })
  for (const message of [
    'Are the refill bags recyclable?', 'Is the refill bag compostable?', 'Are your refills plastic free?', 'The refill bags, are they recyclable?',
    'How do I refill the can?', 'How long does a refill bag last?', 'Why are refills cheaper?',
  ]) {
    assert.equal(chat([message], store).replies[0]!.kind, 'answer', message)
  }
})

test('a sold-out refill is said to be sold out', () => {
  const soldOut = onTheStore.map((p) => (p.name === 'Plant Protein' ? { ...p, options: p.options!.map((o) => ({ ...o, soldOut: ['Refill bag'] })) } : p))
  assert.equal(chat(['is there a refill bag for the protein?'], ctx({ products: soldOut })).replies[0]!.text, 'Plant Protein comes in a refill bag, but it’s sold out right now.')
})

test('returning or subscribing to a refill is the store’s pages’ to answer, and only the wellness store answers refills', () => {
  const store = ctx({ products: onTheStore })
  assert.equal(chat(['Can I return a refill bag?'], store).replies[0]!.kind, 'answer')
  assert.equal(chat(['do you sell refills?'], ctx({ products: onTheStore, shoppingEnabled: false })).replies[0]!.kind, 'answer')
  assert.ok(assistantProfile('wellness').refills)
  assert.equal(assistantProfile('supplements').refills, undefined)
})

test('a health question gets "ask your doctor", never a product', () => {
  for (const message of ['Can I take this while pregnant?', 'Is Clear Focus safe with my blood pressure medication?', 'Will Unwind cure my insomnia?', 'Can my child take it?']) {
    const reply = chat([message]).replies[0]!
    assert.equal(reply.kind, 'text', message)
    assert.match(reply.text, /doctor or pharmacist/, message)
  }
})

test('a condition or a medicine named with a need gets "ask your doctor", never the product for the need', () => {
  for (const message of [
    'I have a heart condition', 'I have a heart murmur', 'I take blood thinners, is omega-3 ok?', 'I take warfarin, is Vitamin D3 + K2 ok?',
    'I’m immunocompromised', 'I have kidney problems, can I take creatine?', 'I had a heart attack last year', 'I’m on chemo, what helps my immune system?',
  ]) {
    const reply = chat([message]).replies[0]!
    assert.equal(reply.kind, 'text', message)
    assert.match(reply.text, /^I can’t give medical advice/, message)
  }
  // The need on its own still finds its product, and "terms and conditions" is no condition.
  assert.deepEqual(suggestion('Something for my heart').names, ['Omega-3'])
  assert.deepEqual(suggestion('I keep catching colds').names.sort(), inCollection('Immunity').sort())
  assert.doesNotMatch(chat(['What are your terms and conditions?']).replies[0]!.text, /medical advice/)
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
  assert.match(text('Do you ship to Norway?'), /Norway, Denmark/)
  assert.match(text('Is shipping free?'), /shipping is free on orders over 549 kr/)
  assert.match(text('How long does delivery take?'), /3 to 7 working days/)
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
