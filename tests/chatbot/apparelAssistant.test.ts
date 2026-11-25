import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ASSISTANT_PROFILES, assistantProfile } from '../../src/chatbot/assistantProfiles.ts'
import { measurementsIn, priceLimit, productsNamed, sizeForMeasurements, sizesIn } from '../../src/chatbot/clothingAnswers.ts'
import { NEW_CONVERSATION, assistantProduct, assistantReply } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext, AssistantOrder, AssistantReply, AssistantState } from '../../src/chatbot/storeAssistant.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { productHandle } from '../../src/storefront/handles.ts'
import { NORTHFOLD_CHATBOT } from '../../src/storefront/northfoldDemo.ts'

// The Northfold assistant (the apparel profile), tested against the store's real
// seed: its products with their fit notes, fabrics and care, its five size
// charts, and the knowledge base its chatbot ships with.

const snap = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-19')
const products = snap.products.map((p) => assistantProduct(p, `/products/${productHandle(p)}`))
const byName = (name: string) => products.find((p) => p.name === name)!
const named = (ids: number[]) => ids.map((id) => products.find((p) => p.id === id)!.name)
const entries = NORTHFOLD_CHATBOT.knowledgeSources!.flatMap((s) => (s.entries ?? []).map((e) => ({ ...e, source: s.name })))

const MAYA = 'maya.chen@example.com'
const order = (over: Partial<AssistantOrder> = {}): AssistantOrder => ({
  id: 900012, number: '#20012', email: MAYA, date: '2026-11-18', status: 'Processing', fulfillment: 'Not Ready',
  tracking: null, items: [{ name: 'Linen Overshirt', qty: 1 }], total: '$78.40', ...over,
})
const usDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

const ctx = (over: Partial<AssistantContext> = {}): AssistantContext => ({
  email: null, orders: [order()], subscriptions: [], products, entries,
  shoppingEnabled: true, trackingEnabled: true, demo: true,
  promotion: 'Fall layers: 20% off outerwear with code LAYERS20',
  profile: 'apparel', sizeCharts: snap.sizeCharts, formatDay: usDay, ...over,
})

function chat(messages: string[], context = ctx(), state: AssistantState = NEW_CONVERSATION) {
  let turn = assistantReply(messages[0]!, context, state)
  for (const message of messages.slice(1)) turn = assistantReply(message, context, turn.state)
  return turn
}
const first = (message: string, context = ctx()): AssistantReply => chat([message], context).replies[0]!
const said = (message: string, context = ctx()): string => chat([message], context).replies.map((r) => r.text).join(' ')

// ── The profile ──────────────────────────────────────────────────────────────

test('Northfold’s chatbot is on the apparel profile, and auto parts has a profile of its own', () => {
  assert.equal(snap.chatbot.assistantProfile, 'apparel')
  assert.equal(ASSISTANT_PROFILES.apparel?.id, 'apparel')
  assert.equal(assistantProfile('apparel').subscriptions, false)
  assert.equal(assistantProfile('auto-parts').id, 'auto-parts')
  assert.match(said('Hi'), /^Hi! I can look up your order, help you find your size/)
})

// ── Size and fit ─────────────────────────────────────────────────────────────

test('a size question on a named piece answers with its fit note, asks for a size, and links its size guide', () => {
  const turn = chat(['What size should I get in the merino sweater?'])
  const reply = turn.replies[0]!
  assert.equal(reply.kind, 'text')
  assert.match(reply.text, /^Merino Crewneck Sweater: Regular fit, true to size\. Model is 5'9" and wears S\. Tell me the size you usually wear, or your bust and waist in inches/)
  assert.ok(reply.kind === 'text' && reply.link?.href === '/products/merino-crewneck-sweater-3007?sizeGuide=1')
  assert.ok(reply.kind === 'text' && reply.topic === 'Sizing')
  assert.equal(turn.state.productId, 3007)
})

test('“does it run large” is answered from the fit note', () => {
  assert.match(said('does the car coat run large'), /^No, it runs true to size\. Wool-Blend Car Coat: Relaxed fit, cut to wear over a sweater\./)
  assert.match(said('Does the poplin shirt run big?'), /^Yes, it’s cut large on purpose\. Poplin Relaxed Shirt:/)
})

test('a size recommendation comes from the piece’s own size chart', () => {
  const merino = said('bust 36, waist 30: which size in the merino sweater?')
  assert.match(merino, /^With bust 36 in and waist 30 in, M is your size in the Merino Crewneck Sweater\. M is bust 36–37 in, waist 29–30 in, hip 39–40 in\./)
  // Between two rows takes the larger; the larger measurement wins.
  assert.match(said('my bust is 35.5 and waist 27, merino sweater'), /take M in the Merino Crewneck Sweater: your bust is in M/)
  // Men’s tops by chest, in inches or centimetres.
  assert.match(said('I have a 40 inch chest, what size oxford shirt?'), /M is your size in the Oxford Button-Down Shirt\. M is chest 38–40 in, neck 15\.5–16 in, sleeve 34 in\./)
  assert.match(said('chest 102 cm, oxford shirt'), /M is your size in the Oxford Button-Down Shirt/)
  // Outerwear has women’s and men’s columns: each piece reads its own.
  assert.match(said('bust 38 for the car coat'), /L is your size in the Wool-Blend Car Coat\. L is bust 38–40 in, sleeve 31\.5 in\./)
  assert.match(said('chest 39, field jacket'), /M is your size in the Waxed Cotton Field Jacket\. M is chest 38–40 in, sleeve 34 in\./)
  // Trousers by waist; the inseam is the same in every size, so it cannot pick one.
  assert.match(said('waist 33 in the slim chino'), /32 is your size in the Slim Chino\. 32 is waist 32–33 in, hip 39–40 in, inseam 32 in\./)
  assert.match(said('chest 50, oxford shirt'), /above our largest size in the Oxford Button-Down Shirt\. XL is chest 44–46 in/)
})

test('a measurement without a unit is read in the unit that fits the chart', () => {
  // Neck 39 and waist 58 are centimetres: in inches they would be past every size.
  assert.match(said('My neck is 39, which size in the Oxford shirt?'), /M is your size in the Oxford Button-Down Shirt/)
  assert.match(said('My neck is 39, which size in the Oxford shirt?'), /neck 39 cm/)
  assert.match(said('My waist is 58, what size in the wide leg trousers?'), /XS is your size in the Wide-Leg Pleated Trouser/)
  // A value in the chart's own range stays in its unit; one that fits neither unit is past the sizes.
  assert.match(said('chest 39, field jacket'), /chest 39 in/)
  assert.match(said('chest 300, oxford shirt'), /above our largest size/)
})

test('a US size or a waist size names the row it means', () => {
  assert.match(said('I’m a size 8, will the merino sweater fit?'), /\bM\b.* Merino Crewneck Sweater/)
  assert.doesNotMatch(said('I’m a size 8, will the merino sweater fit?'), /Tell me the size you usually wear/)
  assert.match(said('I usually wear a 32 in your chinos'), /32 should be right in the Slim Chino|32.*Slim Chino/)
  assert.doesNotMatch(said('I usually wear a 32 in your chinos'), /Tell me the size you usually wear/)
})

test('a chest measurement moves the answer to the named piece whose chart has a chest, and says why first', () => {
  // "Merino sweater" names the women's crewneck best, but a chest is a men's measurement:
  // the men's merino piece answers, after saying how the crewneck is sized, and the follow-up is about it.
  const turn = chat(['what size merino sweater for 38 inch chest'])
  assert.equal(turn.replies[0]!.text, 'The Merino Crewneck Sweater is sized by bust, waist and hip. For a 38 in chest, the men’s Merino Quarter-Zip in M fits: chest 38–40 in, neck 15.5–16 in, sleeve 34 in. Regular fit. Model is 6\'0" and wears M.')
  assert.equal(turn.state.productId, 3017)
  // On the crewneck's own page, the same.
  assert.match(said('What size merino sweater for a 38 inch chest?', ctx({ currentProductId: 3007 })), /^The Merino Crewneck Sweater is sized by bust, waist and hip\. For a 38 in chest, the men’s Merino Quarter-Zip in M fits: /)
  assert.match(chat(['what size merino sweater for 38 inch chest', 'can I wash the merino']).replies[0]!.text, /Merino Quarter-Zip/)
  // A bust still answers on the women's piece; on its own page a chest it cannot read asks again.
  assert.match(said('bust 36 merino sweater'), /M is your size in the Merino Crewneck Sweater/)
  assert.match(said('I have a 38 inch chest', ctx({ currentProductId: 3007 })), /^Merino Crewneck Sweater: .*your bust and waist in inches/)
})

test('the size chart the merchant edits is the one the assistant reads', () => {
  const charts = structuredClone(snap.sizeCharts)
  charts.find((c) => c.id === 'nf-chart-womens-tops')!.rows.find((r) => r.size === 'S')!.values[0] = '33-34'
  assert.match(said('bust 35 for the merino sweater', ctx({ sizeCharts: charts })), /M is your size in the Merino Crewneck Sweater\. M is bust 36–37 in/)
  assert.match(said('bust 35 for the merino sweater'), /S is your size in the Merino Crewneck Sweater\. S is bust 34–35 in/)
})

test('a usual size and “between two sizes” follow the fit note, then the kind of piece', () => {
  assert.match(said('I’m usually a medium. Will the Merino Crewneck fit?'), /^Your usual M should be right in the Merino Crewneck Sweater\. M is bust 36–37 in/)
  assert.match(said('I’m usually a medium, poplin shirt?'), /^The Poplin Relaxed Shirt is cut loose on purpose: your usual M gives the relaxed look, or take S for a closer fit\./)
  // The follow-up needs no name: the chat remembers the piece.
  assert.match(chat(['What size should I get in the merino sweater?', 'between M and L']).replies[0]!.text, /^Between M and L, take L, so there’s room to layer underneath\. L is bust 38–40 in/)
  assert.match(said('between M and L in the oxford shirt'), /^Between M and L, take L, as its fit note says\./)
  assert.match(said('between S and M in the organic cotton tee'), /^Between S and M, take S for the fit it’s cut for, or M if you like more room\./)
  assert.match(said('between 30 and 32 for the slim chino'), /^Between 30 and 32, take 32: it’s a slim fit\./)
})

test('height and weight alone get an honest answer, not a guess', () => {
  const alone = said('I’m 5’6 and 140 lb')
  assert.match(alone, /can’t tell your size from height and weight alone/)
  assert.doesNotMatch(alone, /\b(XS|S|M|L|XL) is your size/)
  // On a product page it is about that piece.
  assert.match(said('I’m 5\'6 and 140 lb, what size?', ctx({ currentProductId: 3009 })), /alone.*Wool-Blend Car Coat: Relaxed fit.*bust and sleeve in inches/)
})

test('“Which size should I get?” off a product page gives the store’s sizing advice and asks which piece', () => {
  const turn = chat(['Which size should I get?'])
  assert.equal(turn.replies[0]!.kind, 'answer')
  assert.match(turn.replies[0]!.text, /Between sizes\? Take the larger size for knitwear and outerwear/)
  assert.match(turn.replies[1]!.text, /^Which piece is it for\?/)
  // On a product page, that product.
  assert.match(said('Which size should I get?', ctx({ currentProductId: 3015 })), /^Linen Overshirt: Relaxed fit\. Model is 6'1" and wears M\./)
  // One size: its dimensions.
  assert.equal(said('what size is the scarf?'), `Lambswool Scarf: One size: 72 x 12 in, plus fringe.`)
})

// ── Fabric and care ──────────────────────────────────────────────────────────

test('fabric and care come from the pieces themselves', () => {
  assert.equal(said('How do I wash merino?'), 'Merino Crewneck Sweater and Merino Quarter-Zip: Hand wash cold or use a wool cycle. Dry flat. Ribbed Merino Beanie: Hand wash cold. Dry flat.')
  assert.equal(said('can I wash the car coat'), 'No. Wool-Blend Car Coat: Dry clean only.')
  assert.equal(said('Can I wash the merino sweater?'), 'Yes, by hand or on a wool cycle. Merino Crewneck Sweater: Hand wash cold or use a wool cycle. Dry flat.')
  // "How should I wash it?" asks how, not whether: its care, with no yes or no.
  assert.equal(said('How should I wash the linen overshirt?'), 'Linen Overshirt: Machine wash cold. Line dry. Warm iron if needed.')
  assert.equal(said('What should I wash the merino sweater with?'), 'Merino Crewneck Sweater: Hand wash cold or use a wool cycle. Dry flat.')
  assert.match(said('How do I clean the waxed jacket?'), /^Waxed Cotton Field Jacket: Do not wash\. Wipe clean/)
  assert.match(said('is the linen see-through'), /^Linen Overshirt: 55% linen, 45% cotton twill\. A washed linen and cotton overshirt, heavy enough to wear open over a tee/)
  const reply = first('How do I wash merino?')
  assert.ok(reply.kind === 'text' && reply.link?.href === '/page/fabric-and-care' && reply.topic === 'Fabric and care')
  // No piece and no fabric few enough share: the store’s care page answers.
  assert.equal(first('How should I wash cotton?').kind, 'answer')
})

// ── No health answers ────────────────────────────────────────────────────────

test('an allergy to a fibre gets the pieces made without it and the fabric list, never medical advice', () => {
  const turn = chat(['I’m allergic to wool'])
  const cards = turn.replies.find((r) => r.kind === 'products')
  assert.ok(cards && cards.kind === 'products')
  assert.equal(cards.text, 'These are made without any wool:')
  for (const id of cards.productIds) assert.doesNotMatch(products.find((p) => p.id === id)!.material!, /wool|merino/i)
  assert.ok(cards.productIds.includes(3008), 'the cotton cable sweater, knitted without the itch')
  const note = turn.replies[turn.replies.length - 1]!
  assert.ok(note.kind === 'text' && note.link?.href === '/page/fabric-and-care')
  assert.doesNotMatch(turn.replies.map((r) => r.text).join(' '), /doctor|pharmacist|medical|medication|supplement/i)

  // On a wool piece’s page it says so first.
  assert.equal(said('I have a wool allergy, is this ok?', ctx({ currentProductId: 3007 })).split(' These')[0], 'Merino Crewneck Sweater: 100% extra-fine merino wool. It has wool in it.')
  assert.match(said('anything without silk for her?'), /^These are made without any silk:/)
})

test('the wellness store’s health answer never fires on a clothing store', () => {
  for (const message of ['Can I take this while pregnant?', 'I’m on medication', 'Is it safe for my child?', 'I am allergic to wool, what can I wear?']) {
    assert.doesNotMatch(said(message), /doctor or pharmacist|supplement/, message)
  }
  // A skin question gets what each piece is made of, with no claim about health.
  const skin = first('I have eczema, what fabric is best?')
  assert.ok(skin.kind === 'text' && skin.link?.href === '/page/fabric-and-care')
  assert.match(skin.text, /what each piece is made of/)
  assert.doesNotMatch(skin.text, /hypoallergenic|soothing|good for (your )?skin|gentle on/i)
  // A skin or health condition named with a fibre, or a health word on its own, gets the caution, not picks.
  for (const message of ['I have a wool allergy and eczema, which sweater should I take?', 'Can I wear the linen shirt while pregnant?', 'Is the waxed jacket toxic?']) {
    const turn = chat([message])
    assert.ok(!turn.replies.some((r) => r.kind === 'products'), message)
    assert.match(turn.replies.map((r) => r.text).join(' '), /can’t give medical or health advice/, message)
  }
})

// ── Orders, returns and offers ───────────────────────────────────────────────

test('orders are looked up as on every store, with the store’s own dates', () => {
  const reply = first('Where is my order?', ctx({ email: MAYA }))
  assert.ok(reply.kind === 'order' && reply.order.number === '#20012')
  assert.match(reply.text, /^Order #20012, placed Nov 18, 2026: Linen Overshirt, \$78\.40\. We are packing it/)
  assert.match(chat(['Where is my order?', MAYA, '123456']).replies[0]!.text, /^Order #20012/)
})

test('a store without subscriptions says so, and “next delivery” means the order', () => {
  const plans = first('Can I skip my subscription?')
  assert.equal(plans.text, 'We don’t sell subscriptions. Every order you place is listed in your account.')
  assert.ok(plans.kind === 'text' && plans.link?.href === '/account')
  assert.equal(first('When is my next delivery?', ctx({ email: MAYA })).kind, 'order')
  assert.match(first('When is my next delivery?').text, /Which email did you order with\?/)
})

test('returns and sizes swaps are the store’s pages’ to answer, even with “sale” or “size” in them', () => {
  const returns = first('How do returns work?')
  assert.ok(returns.kind === 'answer' && returns.link?.href === '/policies/refund-policy')
  assert.match(returns.text, /free within 30 days of delivery, sale styles included/)
  assert.match(first('Can I return something from the sale?').text, /sale styles included/)
  assert.match(first('Can I exchange for a different size?').text, /order the size you want and return the first one/)
})

test('“What’s on sale?” shows the reduced pieces and the code that runs', () => {
  const turn = chat(['What’s on sale?'])
  assert.ok(turn.replies[0]!.kind === 'products')
  assert.deepEqual(named(turn.replies[0]!.kind === 'products' ? turn.replies[0]!.productIds : []), ['Washed Silk Blouse', 'Cotton Cable Sweater'])
  assert.equal(turn.replies[1]!.text, 'There’s also a code running. Fall layers: 20% off outerwear with code LAYERS20. Type it in your cart or at checkout.')
  assert.equal(chat(['What’s on sale?'], ctx({ promotion: '' })).replies.length, 1)
  assert.match(first('Do you have a discount code?').text, /^Yes\. Fall layers: 20% off outerwear with code LAYERS20/)
})

// ── Suggestions ──────────────────────────────────────────────────────────────

test('suggestions keep to what, who for and how much', () => {
  const coat = first('a warm coat under $250')
  assert.ok(coat.kind === 'products')
  assert.match(coat.text, /^A coat or jacket for cold days under \$250\. Here’s what I’d pick:$/)
  for (const id of coat.productIds) {
    const p = products.find((x) => x.id === id)!
    assert.ok(p.price! <= 250 && p.collections.includes('Outerwear'), p.name)
  }
  assert.ok(!coat.productIds.includes(3009), 'the $268 car coat is over the limit')

  const gift = first('gift for him')
  assert.ok(gift.kind === 'products')
  assert.match(gift.text, /^A gift for him\./)
  for (const id of gift.productIds) assert.ok(products.find((x) => x.id === id)!.collections.includes('Men'))
  assert.ok(gift.productIds.includes(3013), 'the lambswool scarf')

  const cheap = first('anything under $50?')
  assert.ok(cheap.kind === 'products' && cheap.productIds.every((id) => products.find((x) => x.id === id)!.price! <= 50))
  assert.match(first('a coat under $40').text, /^Nothing under \$40 fits that\. These come closest:/)
  assert.match(first('anything under $20?').text, /^Nothing under \$20 right now\. These come closest:/)
  assert.match(first('What do you recommend?').text, /warm coat, knitwear, something for work or a gift/)
})

// ── The chatbot’s own seed ───────────────────────────────────────────────────

test('every quick prompt of the Northfold chatbot gets a real answer', () => {
  const prompts = NORTHFOLD_CHATBOT.quickPrompts!.map((p) => p.text)
  assert.deepEqual(prompts, ['Where is my order?', 'Which size should I get?', 'How do returns work?', 'How do I wash merino?', 'What’s on sale?'])
  const kinds = prompts.map((prompt) => chat([prompt], ctx({ email: MAYA })).replies[0]!.kind)
  assert.deepEqual(kinds, ['order', 'answer', 'answer', 'text', 'products'])
  for (const prompt of prompts) assert.equal(chat([prompt], ctx({ email: MAYA })).offerPrompts, false, prompt)
})

test('no apparel answer names a health claim or another brand', () => {
  const messages = ['Hi', 'What size should I get in the merino sweater?', 'I’m allergic to wool', 'I have sensitive skin', 'How do I wash merino?', 'gift for her', 'a warm coat under $250', 'asdf']
  for (const message of messages) {
    const text = said(message)
    assert.doesNotMatch(text, /\b(cure|treat|heal|therapeutic|hypoallergenic|doctor|pharmacist)\b/i, message)
    assert.doesNotMatch(text, /maropost|bkm|vitaheal/i, message)
  }
})

// ── The rules underneath ─────────────────────────────────────────────────────

test('the rules read pieces, sizes, measurements and prices the way shoppers write them', () => {
  assert.deepEqual(productsNamed('does the car coat run large', products).map((p) => p.name), ['Wool-Blend Car Coat'])
  assert.deepEqual(productsNamed('the cardigan', products).map((p) => p.name), ['Lambswool Cardigan'])
  assert.deepEqual(productsNamed('do the chinos run small', products).map((p) => p.name), ['Slim Chino'])
  assert.deepEqual(productsNamed('does it have a relaxed fit', products), [])
  assert.deepEqual(sizesIn('between M and L'), ['M', 'L'])
  assert.deepEqual(sizesIn('I’m usually a medium'), ['M'])
  assert.deepEqual(sizesIn('should I get small or medium?'), ['S', 'M'])
  assert.deepEqual(sizesIn('I usually wear a size 8'), ['8'])
  assert.deepEqual(sizesIn('I’m 5’6 and 140 lb'), [])
  assert.deepEqual(sizesIn('does delivery take between 10 and 14 days?'), [])
  assert.deepEqual(measurementsIn('bust 36, waist 30 and hips 40'), [
    { what: 'bust', value: 36, unit: null }, { what: 'waist', value: 30, unit: null }, { what: 'hip', value: 40, unit: null },
  ])
  assert.deepEqual(measurementsIn('a 40-inch chest'), [{ what: 'chest', value: 40, unit: 'in' }])
  assert.deepEqual(priceLimit('a warm coat under $250'), { max: 250, phrase: 'under $250' })
  const chart = snap.sizeCharts.find((c) => c.id === 'nf-chart-mens-trousers')!
  assert.equal(sizeForMeasurements(chart, [{ what: 'inseam', value: 30, unit: null }]), null)
  assert.equal(byName('Slim Chino').sizeChartId, 'nf-chart-mens-trousers')
})
