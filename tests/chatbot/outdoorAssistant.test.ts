import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assistantProfile } from '../../src/chatbot/assistantProfiles.ts'
import { footAndHeadIn, outdoorStore, shoeSizesIn, temperatureIn, temperatureText } from '../../src/chatbot/clothingAnswers.ts'
import { NEW_CONVERSATION, assistantProduct, assistantReply } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext, AssistantReply, AssistantState, StoreProductFields } from '../../src/chatbot/storeAssistant.ts'
import type { SizeChart } from '../../src/storefront/demoStores/types.ts'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { AURORA_BLUEPRINT } from '../../src/storefront/demoStores/aurora.ts'
import { contextFor, snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { productHandle } from '../../src/storefront/handles.ts'
import { variantAvailable } from '../../src/storefront/variants.ts'

// The apparel assistant on an outdoor clothing and footwear store, tested on a
// catalogue of its own shaped like the Aurora (demo) contract: the same style for
// women and for men, named for each ("Women’s Canyon Hiking Boot", "Men’s Canyon Hiking
// Boot") and answered as one style, fit notes, fabrics and care in the seed's words,
// boots sized by foot length, socks by shoe size, a sun hat by head, and packs by
// their volume. Whether a piece keeps out the rain, how warm it is and how to layer
// all come from each piece's own fields; where they say nothing, it can't promise.

const CLOTHES = { womensTops: 'au-chart-womens-tops', mensTops: 'au-chart-mens-tops', womensPants: 'au-chart-womens-pants', mensPants: 'au-chart-mens-pants', boots: 'au-chart-boots', socks: 'au-chart-socks', hats: 'au-chart-hats' }
const chart = (id: string, name: string, columns: string[], rows: string[][]): SizeChart =>
  ({ id, channelId: 'outdoor-test', name, unit: 'in', columns, rows: rows.map(([size, ...values]) => ({ size: size!, values })), fitNote: '', howToMeasure: '' })
const CHARTS: SizeChart[] = [
  chart(CLOTHES.womensTops, 'Women’s tops', ['Bust', 'Waist', 'Hip'], [['XS', '32-33', '25-26', '35-36'], ['S', '34-35', '27-28', '37-38'], ['M', '36-37', '29-30', '39-40'], ['L', '38-40', '31-33', '41-43'], ['XL', '41-43', '34-36', '44-46']]),
  chart(CLOTHES.mensTops, 'Men’s tops', ['Chest', 'Waist', 'Sleeve'], [['S', '35-37', '29-31', '33'], ['M', '38-40', '32-34', '34'], ['L', '41-43', '35-37', '35'], ['XL', '44-46', '38-40', '36'], ['XXL', '47-49', '41-43', '37']]),
  chart(CLOTHES.womensPants, 'Women’s pants', ['Waist', 'Hip', 'Inseam'], [['XS', '25-26', '35-36', '30'], ['S', '27-28', '37-38', '30'], ['M', '29-30', '39-40', '30'], ['L', '31-33', '41-43', '30'], ['XL', '34-36', '44-46', '30']]),
  chart(CLOTHES.mensPants, 'Men’s pants', ['Waist', 'Hip', 'Inseam'], [['S', '29-31', '36-38', '32'], ['M', '32-34', '39-41', '32'], ['L', '35-37', '42-44', '32'], ['XL', '38-40', '45-47', '32'], ['XXL', '41-43', '48-50', '32']]),
  // One chart for both boots: a size is blank ("—") where that boot isn't made in it.
  chart(CLOTHES.boots, 'Boots', ['Women’s foot length', 'Men’s foot length'], [['6', '9.25', '—'], ['7', '9.5', '—'], ['8', '9.875', '10'], ['9', '10.25', '10.375'], ['10', '10.5', '10.75'], ['11', '—', '11.125'], ['12', '—', '11.5']]),
  chart(CLOTHES.socks, 'Socks', ['Women’s shoe size', 'Men’s shoe size'], [['S', '4-6.5', '—'], ['M', '7-9.5', '6-8.5'], ['L', '10-12', '9-12']]),
  chart(CLOTHES.hats, 'Hats', ['Head circumference'], [['S/M', '21.25-22.5'], ['L/XL', '22.75-24']]),
]

const DOWN = {
  material: 'Shell: 100% recycled nylon ripstop with a water-resistant finish. Fill: 650-fill responsibly sourced down.',
  care: 'Machine wash cold on a gentle cycle. Tumble dry low with two clean tennis balls to lift the down.',
  description: 'A packable down jacket for cold camps and winter walks. Warm to about 14°F (−10°C) over a base layer and a fleece. The shell sheds snow and a light shower, but it isn’t waterproof.',
  fitNote: 'Regular fit with room for a fleece underneath.',
}
const SHELL = {
  material: 'A waterproof, breathable 2.5-layer shell of 100% recycled nylon, with taped seams.',
  care: 'Machine wash cold, then tumble dry low to renew the water-repellent finish.',
  description: 'A light rain shell that packs into its own pocket, with pit zips to let the heat out on the climb.',
  fitNote: 'Regular fit with room for a fleece underneath.',
}
const MERINO = { material: '100% 18.5 micron merino wool, 200 gsm.', care: 'Machine wash cold on a wool cycle. Dry flat.', description: 'A next-to-skin base layer that stays warm when it’s damp and doesn’t hold odor.', fitNote: 'Close fit, to wear under other layers.' }
const BOOT = {
  material: 'Waterproof suede and mesh upper with a waterproof, breathable membrane. Rubber outsole.',
  care: 'Brush off dirt and let them dry away from direct heat.',
  description: 'A mid-height hiking boot with a grippy outsole, ready for the trail out of the box.',
  fitNote: 'True to size, with room for a hiking sock. Between sizes? Take the larger one.',
}

type Facts = { subtitle: string; description: string; fitNote: string; material: string; care: string; sizeChartId?: string; specs?: Array<{ label: string; value: string }> }
const piece = (id: number, name: string, price: number, collections: string[], facts: Facts): StoreProductFields =>
  ({ id, name, price: price.toFixed(2), collections, detail: { ...facts } })
const model = (fitNote: string, who: string) => `${fitNote} Model is ${who}.`

const CATALOGUE: StoreProductFields[] = [
  piece(6001, 'Women’s Summit Down Jacket', 249, ['Women', 'Jackets', 'Best sellers'], { subtitle: 'Women’s 650-fill down jacket', ...DOWN, fitNote: model(DOWN.fitNote, `5'8" and wears S`), sizeChartId: CLOTHES.womensTops }),
  piece(6002, 'Women’s Ridgeline Rain Shell', 179, ['Women', 'Jackets'], { subtitle: 'Women’s waterproof rain shell', ...SHELL, fitNote: model(SHELL.fitNote, `5'9" and wears S`), sizeChartId: CLOTHES.womensTops }),
  piece(6003, 'Alpine Fleece Pullover', 89, ['Women', 'Fleece & layers'], { subtitle: 'Women’s grid fleece quarter-zip', material: '100% recycled polyester grid fleece.', care: 'Machine wash cold. Tumble dry low.', description: 'A warm, breathable grid fleece to wear as a mid layer, or on its own on a cool morning.', fitNote: `Regular fit. Model is 5'9" and wears S.`, sizeChartId: CLOTHES.womensTops }),
  piece(6004, 'Women’s Trailhead Hiking Pants', 79, ['Women', 'Pants'], { subtitle: 'Women’s stretch hiking pants', material: '90% nylon, 10% elastane with a water-repellent finish.', care: 'Machine wash cold. Hang to dry.', description: 'Light, quick-drying hiking pants with zip pockets.', fitNote: `Regular fit, 30 in inseam. Model is 5'9" and wears S.`, sizeChartId: CLOTHES.womensPants }),
  piece(6005, 'Women’s Merino Base Layer Top', 69, ['Women', 'Fleece & layers'], { subtitle: 'Women’s merino base layer', ...MERINO, fitNote: model(MERINO.fitNote, `5'8" and wears S`), sizeChartId: CLOTHES.womensTops }),
  piece(6006, 'Women’s Canyon Hiking Boot', 159, ['Women', 'Footwear', 'Best sellers'], { subtitle: 'Women’s waterproof hiking boot', ...BOOT, sizeChartId: CLOTHES.boots }),
  piece(6007, 'Men’s Summit Down Jacket', 249, ['Men', 'Jackets', 'Best sellers'], { subtitle: 'Men’s 650-fill down jacket', ...DOWN, fitNote: model(DOWN.fitNote, `6'1" and wears M`), sizeChartId: CLOTHES.mensTops }),
  piece(6008, 'Men’s Ridgeline Rain Shell', 179, ['Men', 'Jackets'], { subtitle: 'Men’s waterproof rain shell', ...SHELL, fitNote: model(SHELL.fitNote, `6'0" and wears M`), sizeChartId: CLOTHES.mensTops }),
  piece(6009, 'Alpine Fleece Jacket', 95, ['Men', 'Fleece & layers'], { subtitle: 'Men’s full-zip fleece jacket', material: '100% recycled polyester fleece.', care: 'Machine wash cold. Tumble dry low.', description: 'A warm full-zip fleece to wear as a mid layer.', fitNote: `Regular fit. Model is 6'1" and wears M.`, sizeChartId: CLOTHES.mensTops }),
  piece(6010, 'Men’s Trailhead Hiking Pants', 85, ['Men', 'Pants'], { subtitle: 'Men’s zip-off hiking pants', material: '90% nylon, 10% elastane with a water-repellent finish.', care: 'Machine wash cold. Hang to dry.', description: 'Hiking pants whose legs zip off into shorts.', fitNote: `Regular fit, 32 in inseam. Model is 6'1" and wears M.`, sizeChartId: CLOTHES.mensPants }),
  piece(6011, 'Men’s Merino Base Layer Top', 69, ['Men', 'Fleece & layers'], { subtitle: 'Men’s merino base layer', ...MERINO, fitNote: model(MERINO.fitNote, `6'0" and wears M`), sizeChartId: CLOTHES.mensTops }),
  piece(6012, 'Men’s Canyon Hiking Boot', 159, ['Men', 'Footwear'], { subtitle: 'Men’s waterproof hiking boot', ...BOOT, sizeChartId: CLOTHES.boots }),
  piece(6013, 'Daybreak 24L Pack', 119, ['Women', 'Men', 'Packs & accessories', 'Best sellers'], { subtitle: '24-liter daypack', material: 'Recycled nylon ripstop with a water-resistant coating.', care: 'Spot clean with a damp cloth.', description: 'A daypack for day hikes, with a sleeve for a 3-liter hydration bladder and side bottle pockets.', fitNote: 'One size. Fits torsos 16–21 in.' }),
  piece(6014, 'Basecamp Pack', 189, ['Women', 'Men', 'Packs & accessories'], { subtitle: 'Backpacking pack', material: 'Recycled nylon with a water-resistant coating.', care: 'Spot clean with a damp cloth.', description: 'A pack for overnights and long weekends, with a padded hip belt and a sleeping bag compartment.', fitNote: 'One size, with an adjustable back for torsos 15–20 in.', specs: [{ label: 'Volume', value: '45 L' }] }),
  piece(6015, 'Trail Merino Socks, 3-pack', 29, ['Women', 'Men', 'Packs & accessories'], { subtitle: 'Three pairs of cushioned hiking socks', material: '64% merino wool, 34% nylon, 2% elastane.', care: 'Machine wash warm, inside out. Tumble dry low.', description: 'Cushioned merino hiking socks, three pairs.', fitNote: 'Sized by shoe size.', sizeChartId: CLOTHES.socks }),
  piece(6016, 'Peak Beanie', 25, ['Women', 'Men', 'Packs & accessories'], { subtitle: 'Ribbed merino beanie', material: '100% merino wool.', care: 'Hand wash cold. Dry flat.', description: 'A warm ribbed beanie.', fitNote: 'One size. The rib stretches to fit.' }),
  piece(6017, 'Alpine Trekking Poles', 79, ['Women', 'Men', 'Packs & accessories'], { subtitle: 'Folding aluminum poles, a pair', material: 'Aluminum shafts, cork grips.', care: 'Wipe dry after use.', description: 'Light folding poles for steep climbs and descents.', fitNote: 'Adjust from 41 to 53 in.' }),
  piece(6018, 'Night Trail Headlamp', 39, ['Women', 'Men', 'Packs & accessories', 'New arrivals'], { subtitle: '300-lumen rechargeable headlamp', material: 'Polycarbonate body, elastic strap.', care: 'Wipe clean.', description: 'A 300-lumen headlamp, water-resistant (IPX4) against rain and splashes.', fitNote: 'One size. The strap adjusts.' }),
  piece(6019, 'Insulated Trail Bottle, 24 oz', 32, ['Women', 'Men', 'Packs & accessories', 'Sale'], { subtitle: 'Double-wall steel bottle', material: 'Double-wall stainless steel.', care: 'Hand wash.', description: 'Keeps drinks cold for 24 hours and hot for 12.', fitNote: 'Holds 24 oz.' }),
  piece(6020, 'Packable Sun Hat', 35, ['Women', 'Men', 'Packs & accessories', 'Sale'], { subtitle: 'UPF 50+ wide-brim hat', material: 'Nylon with UPF 50+ sun protection.', care: 'Hand wash cold.', description: 'A wide-brim hat that folds into a pocket.', fitNote: 'Two sizes, by head circumference.', sizeChartId: CLOTHES.hats }),
]

const url = (p: StoreProductFields) => `/products/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}-${p.id}`
const products = CATALOGUE.map((p) => assistantProduct(p, url(p)))
const entries = [
  { title: 'Shipping and returns', text: 'Free shipping over $75. Returns are free within 30 days, sale items included.', source: 'FAQ', url: '/page/shipping-and-returns' },
  { title: 'Size guide', text: 'Between sizes? Take the larger size in jackets and boots, so there’s room for a layer or a hiking sock.', source: 'FAQ', url: '/page/size-guide' },
]
const ctx = (over: Partial<AssistantContext> = {}): AssistantContext => ({
  email: null, orders: [], subscriptions: [], products, entries, shoppingEnabled: true, trackingEnabled: true, demo: true,
  promotion: 'Trail season: 20% off jackets with code TRAIL20', profile: 'apparel', sizeCharts: CHARTS, ...over,
})

function chat(messages: string[], context = ctx(), state: AssistantState = NEW_CONVERSATION) {
  let turn = assistantReply(messages[0]!, context, state)
  for (const message of messages.slice(1)) turn = assistantReply(message, context, turn.state)
  return turn
}
const said = (message: string | string[], context = ctx()): string => chat(Array.isArray(message) ? message : [message], context).replies.map((r) => r.text).join(' ')
const cards = (reply: AssistantReply | undefined): number[] => (reply?.kind === 'products' ? reply.productIds : [])

// ── Which stores answer as outdoor ones ─────────────────────────────────────

test('only a store whose own data is outdoor gets the outdoor answers; Northfold never does', () => {
  const clothing = assistantProfile('apparel').clothing!
  assert.ok(clothing.outdoor, 'the apparel profile carries the outdoor knowledge')
  assert.ok(outdoorStore(ctx(), clothing))
  // Northfold says nothing about weather and sizes no feet or heads.
  const northfold = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-19')
  assert.equal(outdoorStore(ctx({ products: northfold.products.map((p) => assistantProduct(p)), sizeCharts: northfold.sizeCharts }), clothing), null)
  // A boots chart alone makes a store outdoor; so does one "waterproof" piece.
  const plain = products.map((p) => ({ ...p, description: '', material: '', care: '', fitNote: '', subtitle: '' }))
  assert.equal(outdoorStore(ctx({ products: plain, sizeCharts: [] }), clothing), null)
  assert.ok(outdoorStore(ctx({ products: plain, sizeCharts: CHARTS.filter((c) => c.id === CLOTHES.boots) }), clothing))
  // The greeting says what an outdoor store's assistant can do.
  assert.match(said('Hi'), /waterproof or warm enough, help you layer/)
})

test('a wash temperature never makes a store an outdoor one; a warmth rating does', () => {
  const clothing = assistantProfile('apparel').clothing!
  const northfold = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-19')
  const own = northfold.products.map((p) => assistantProduct(p))
  const edited = (change: Partial<typeof own[number]>) => ctx({ products: own.map((p, i) => (i === 0 ? { ...p, ...change } : p)), sizeCharts: northfold.sizeCharts })
  // An ordinary care edit, and a description that gives a wash temperature: still Northfold.
  assert.equal(outdoorStore(edited({ care: 'Machine wash at 30°C. Line dry.' }), clothing), null)
  assert.equal(outdoorStore(edited({ description: `${own[0]!.description} Wash at 40 °C.` }), clothing), null)
  assert.match(said('Hi', edited({ care: 'Machine wash at 30°C. Line dry.' })), /^Hi! I can look up your order, help you find your size, tell you what a piece is made of/)
  // A rating is the weather.
  assert.ok(outdoorStore(edited({ description: 'A heavy parka, warm to about 5°F.' }), clothing))
})

// ── Rain and wind ────────────────────────────────────────────────────────────

test('“is it waterproof?” is answered from the piece’s own page, and never promised where the page says nothing', () => {
  // Yes: the sentence that says so, once for a style made for women and men.
  assert.equal(said('Is the rain shell waterproof?'), 'Yes. Ridgeline Rain Shell: A waterproof, breathable 2.5-layer shell of 100% recycled nylon, with taped seams.')
  assert.equal(said('Are the boots waterproof?'), 'Yes. Canyon Hiking Boot: Waterproof suede and mesh upper with a waterproof, breathable membrane.')
  // Partly, with what keeps out steady rain, linked.
  const down = chat(['Is the down jacket waterproof?'])
  assert.equal(down.replies[0]!.text, 'Not fully: it’s water-resistant, not waterproof. Summit Down Jacket: Shell: 100% recycled nylon ripstop with a water-resistant finish. The shell sheds snow and a light shower, but it isn’t waterproof.')
  assert.equal(down.replies[1]!.text, 'For steady rain, the Ridgeline Rain Shell is waterproof.')
  assert.ok(down.replies[1]!.kind === 'text' && down.replies[1]!.link?.href === url(CATALOGUE[1]!))
  // Nothing said: an honest line, never a yes. "in the rain" is the weather, not the Rain Shell.
  for (const message of ['Is the fleece waterproof?', 'Will the fleece keep me dry in the rain?']) {
    const fleece = said(message)
    assert.match(fleece, /^I can’t promise the Alpine Fleece Pullover or the Alpine Fleece Jacket keep out the rain: we don’t list them as waterproof\. For steady rain, the Ridgeline Rain Shell is waterproof\.$/, message)
  }
  // Gear says it too, and a pack is never answered with a boot.
  assert.match(said('Is the headlamp waterproof?'), /^Not fully: it’s water-resistant, not waterproof\. Night Trail Headlamp: .*\(IPX4\)/)
  assert.equal(said('Is the pack waterproof?'), 'The Daybreak 24L Pack and the Basecamp Pack are water-resistant, not waterproof.')
  // No piece in mind: which one.
  assert.match(said('Is it waterproof?'), /^Which piece is it for\?/)
  // On a piece's page, that piece, for whom it is.
  const page = chat(['Is it waterproof?'], ctx({ currentProductId: 6007 }))
  assert.equal(page.state.productId, 6007)
  assert.ok(page.replies[1]?.kind === 'text' && page.replies[1].link?.href === url(CATALOGUE[7]!), 'the men’s shell for the men’s jacket')
})

test('asked for waterproof pieces, it shows those that are, of the kind, for whom and under the price asked', () => {
  const her = chat(['My wife needs a waterproof jacket'])
  assert.deepEqual(cards(her.replies[0]), [6002])
  assert.equal(her.replies[1]!.text, 'The women’s Summit Down Jacket is water-resistant, not waterproof.')
  assert.deepEqual(cards(chat(['waterproof boots']).replies[0]), [6006, 6012])
  assert.deepEqual(cards(chat(['Which jacket is waterproof?']).replies[0]), [6002, 6008])
  const cheap = chat(['waterproof jacket under $200'])
  assert.equal(cheap.replies[0]!.text, 'These are waterproof and under $200:')
  assert.match(chat(['waterproof jacket under $100']).replies[0]!.text, /^Nothing waterproof under \$100 right now\. These come closest:/)
  assert.match(said('any waterproof socks?'), /^We don’t list any socks as waterproof, so I can’t promise one keeps out the rain\./)
})

test('windproof is asked and answered the same way', () => {
  assert.match(said('Is the down jacket windproof?'), /^I can’t promise the Summit Down Jacket keeps out the wind: we don’t list it as windproof\./)
})

// ── Warmth ───────────────────────────────────────────────────────────────────

test('warmth for a temperature in °F or °C comes from the piece’s own rating, with both units', () => {
  assert.equal(said('Is the Summit Down Jacket warm enough for 20°F?'), 'Yes, 20°F (−7°C) is within its rating. Summit Down Jacket: Warm to about 14°F (−10°C) over a base layer and a fleece.')
  assert.match(said('Is the down jacket warm enough for -5°C?'), /^Yes, −5°C \(23°F\) is within its rating\./)
  // Colder than its rating: no, with its rating, and never the layers the rating already counts as a way past it.
  assert.equal(said('Is the down jacket warm enough for -15°C?'), 'No, −15°C (5°F) is colder than its rating. Summit Down Jacket: Warm to about 14°F (−10°C) over a base layer and a fleece. I can’t promise how warm you’ll be: wind, rain and how hard you’re moving all count, so take a spare layer.')
  for (const [message, page] of [['Is the down jacket warm enough for 10°F?', undefined], ['Is the down jacket warm enough for 0°F?', undefined], ['will it keep me warm at 0°F?', 6007]] as const) {
    const text = said(message, ctx({ currentProductId: page }))
    assert.match(text, /^No, .* is colder than its rating\./, message)
    assert.match(text, /I can’t promise how warm you’ll be/, message)
    assert.doesNotMatch(text, /wear it over|Not on its own/, message)
  }
  assert.equal(said('How warm is the down jacket?'), 'Summit Down Jacket: Warm to about 14°F (−10°C) over a base layer and a fleece.')
})

test('a piece with no temperature rating is never promised for one', () => {
  const shell = said('Is the rain shell good for -10°C?')
  assert.match(shell, /^I can’t promise the Ridgeline Rain Shell keeps you warm at −10°C \(14°F\): we don’t give it a temperature rating\./)
  assert.match(shell, /It’s a shell, for wind and rain: for warmth, wear the Alpine Fleece Pullover or the Alpine Fleece Jacket and the Summit Down Jacket under it\./)
  assert.match(said('How cold can I wear the base layer in?'), /^We don’t give the Merino Base Layer Top a temperature rating, so I can’t promise how cold it can go\. Merino Base Layer Top: A next-to-skin base layer that stays warm/)
  for (const message of ['Is the fleece warm enough for 10°F?', 'Is the rain shell good for -10°C?', 'How cold can I wear the base layer in?']) {
    assert.doesNotMatch(said(message), /^Yes\b/, message)
  }
})

test('temperatures are read the ways shoppers write them', () => {
  assert.deepEqual(temperatureIn('warm enough for 20°F?'), { f: 20, said: 'F' })
  assert.deepEqual(temperatureIn('good at -5°C'), { f: 23, said: 'C' })
  assert.deepEqual(temperatureIn('good at −5 °C'), { f: 23, said: 'C' })
  assert.deepEqual(temperatureIn('it will be 45 degrees'), { f: 45, said: null })
  assert.deepEqual(temperatureIn('10 degrees celsius'), { f: 50, said: 'C' })
  assert.deepEqual(temperatureIn('warm at minus 10'), { f: -10, said: null })
  assert.deepEqual(temperatureIn('10 below'), { f: -10, said: null })
  assert.deepEqual(temperatureIn('below freezing'), { f: 32, said: null })
  assert.equal(temperatureIn('size 9 boots under $150'), null)
  assert.equal(temperatureIn('the 24L pack'), null)
  assert.equal(temperatureText({ f: 20, said: null }), '20°F (−7°C)')
  assert.equal(temperatureText({ f: 23, said: 'C' }), '−5°C (23°F)')
})

// ── Layering ─────────────────────────────────────────────────────────────────

test('layering advice uses the store’s own layers, as many as the weather asks for, and asks for whom', () => {
  const cold = chat(['How should I layer for a cold hike?'])
  assert.equal(cold.replies[0]!.text, 'For the cold, layer up: the Merino Base Layer Top next to your skin, the Alpine Fleece Pullover or the Alpine Fleece Jacket over it and the Summit Down Jacket on top. Keep the Ridgeline Rain Shell in your pack for wind or rain. I can’t promise how warm you’ll be: wind, rain and how hard you’re moving all count, so take a spare layer.')
  assert.equal(cold.replies[1]!.text, 'Is it for women or men? Tell me and I’ll show you each piece.')
  // "for women" answers the question waiting, with each piece.
  const women = chat(['How should I layer for a cold hike?', 'for women'])
  assert.match(women.replies[0]!.text, /^For the cold, layer up: the women’s Merino Base Layer Top next to your skin, the Alpine Fleece Pullover over it and the women’s Summit Down Jacket on top\. Keep the women’s Ridgeline Rain Shell in your pack/)
  assert.deepEqual(cards(women.replies[1]), [6005, 6003, 6001, 6002])
  // Warm, cool and freezing ask for different layers; rain puts the shell on.
  assert.match(said('What should I wear hiking at 65°F for him?'), /^For 65°F \(18°C\), layer up: the men’s Merino Base Layer Top next to your skin\. Keep the men’s Ridgeline Rain Shell in your pack/)
  assert.match(said('It will be 45 degrees and rainy, what should I wear for women?'), /^For 45°F \(7°C\), layer up: the women’s Merino Base Layer Top next to your skin and the Alpine Fleece Pullover over it\. Put the women’s Ridgeline Rain Shell over everything to keep out the rain\./)
  const freezing = said('What should I wear for 0°F? for men')
  assert.match(freezing, /Add the Peak Beanie and the Trail Merino Socks, 3-pack\./)
  assert.match(freezing, /That’s colder than we rate the men’s Summit Down Jacket for: 14°F \(−10°C\)\./)
  // A bottle called "Insulated" is not a warm layer.
  assert.doesNotMatch(said('What should I wear for 0°F? for men'), /Bottle/)
})

test('“what do I wear under it?” gives the layers inside that piece, for whom it is', () => {
  const turn = chat(['what do I wear under the rain shell?'], ctx({ currentProductId: 6011 }))
  assert.equal(turn.replies[0]!.text, 'Under the Ridgeline Rain Shell, wear the men’s Merino Base Layer Top next to your skin and the Alpine Fleece Jacket over it. I can’t promise how warm you’ll be: wind, rain and how hard you’re moving all count, so take a spare layer.')
  assert.deepEqual(cards(turn.replies[1]), [6011, 6009])
})

// ── Boots, socks and hats ────────────────────────────────────────────────────

test('a boot made for women and men asks whose first, with the fit note both share, then answers from its chart', () => {
  const asked = chat(['What size boots should I get?'])
  assert.equal(asked.replies[0]!.text, 'Canyon Hiking Boot: True to size, with room for a hiking sock. Between sizes? Take the larger one. Is it the women’s or the men’s Canyon Hiking Boot? Tell me which, and I’ll check its size chart.')
  assert.equal(asked.state.asked, 'What size boots should I get?')
  // The follow-up that says whose, or gives a size, answers it.
  assert.match(said(['What size boots should I get?', 'women’s']), /^Women’s Canyon Hiking Boot: True to size.*Tell me the size you usually wear, or your foot length in inches or centimeters,/)
  assert.match(said(['My foot is 26 cm, what size Canyon boot?', 'men’s']), /^With a 26 cm foot, take size 9 in the men’s Canyon Hiking Boot: it’s the next size up from your foot length\. Size 9 is foot length 26\.5 cm\./)
  // In centimeters the answer follows the size guide's half-centimeter lengths: size 9 is listed at 26.5 cm.
  assert.match(said(['My foot is 26.5 cm, what size Canyon boot?', 'men’s']), /^With a 26\.5 cm foot, take size 9 in the men’s Canyon Hiking Boot\. Size 9 is foot length 26\.5 cm\./)
  assert.match(said(['I wear a 9 in sneakers, what size boot?', 'for women']), /^Your usual 9 should be right in the women’s Canyon Hiking Boot\. Size 9 is foot length 10\.25 in\./)
  // A size only one of them is made in says whose.
  assert.match(said('size 11 boot'), /^Your usual 11 should be right in the men’s Canyon Hiking Boot\./)
  assert.match(said('women’s boots in size 11'), /^We don’t make the women’s Canyon Hiking Boot in an 11: it comes in size 6 to 10\. The men’s Canyon Hiking Boot comes in an 11\./)
})

test('boots: a foot length picks the size (the next one up between two), and between sizes follows the fit note', () => {
  const women = ctx({ currentProductId: 6006 })
  assert.match(said('My foot is 10.25 inches long, which size?', women), /^With a 10\.25 in foot, take size 9 in the women’s Canyon Hiking Boot\. Size 9 is foot length 10\.25 in\./)
  assert.match(said('My foot is 10.3 inches', women), /^With a 10\.3 in foot, take size 10 in the women’s Canyon Hiking Boot: it’s the next size up from your foot length\./)
  assert.match(said('My foot is 27.5 cm, what size?', women), /^With a 27\.5 cm foot, you’re past our largest size in the women’s Canyon Hiking Boot\. Size 10 is foot length 26\.5 cm, so it may be snug\./)
  assert.match(said('I’m between 8 and 9', women), /^Between 8 and 9, take size 9, as its fit note says\./)
  assert.match(said('I’m between a 9 and a 9.5, which size?', women), /^Between 9 and 9\.5, take size 10, as its fit note says\./)
  assert.match(said('I wear a 9.5', women), /^We don’t make the women’s Canyon Hiking Boot in a 9\.5: it comes in size 6 to 10\. Take size 10, as its fit note says\./)
  // A boot whose fit note says nothing about between sizes: measure, never a guess.
  const silent = products.map((p) => (p.id === 6006 ? { ...p, fitNote: 'True to size.' } : p))
  assert.match(said('I’m between 8 and 9', ctx({ products: silent, currentProductId: 6006 })), /^Between 8 and 9, I can’t promise which fits better in the women’s Canyon Hiking Boot\. Measure your foot from heel to longest toe/)
  // Width: the fit note says nothing, so it can't promise.
  assert.match(said('Are the boots good for wide feet?'), /^I can’t promise how the Canyon Hiking Boot fits a wide or narrow foot: we don’t list a width for it\./)
})

test('socks are sized by shoe size, women’s or men’s; a hat by head', () => {
  assert.match(said('What size socks for a men’s 10?'), /^For a men’s 10 shoe, take L in the Trail Merino Socks, 3-pack\. L fits shoe size 9–12\./)
  assert.match(said('I wear a size 9 boot, which sock size?'), /^For a 9 shoe, take M if it’s a women’s size, or take L if it’s a men’s size\./)
  assert.match(said('I wear a size 8 boot, which sock size?'), /^For an 8 shoe, take M in the Trail Merino Socks, 3-pack\. M fits women’s shoe size 7–9\.5 and men’s shoe size 6–8\.5\./)
  assert.match(said('What size socks should I get?'), /Tell me your shoe size, and whether it’s a women’s or men’s size, and I’ll check it against the size chart\./)
  assert.match(said('What size sun hat for a 23 inch head?'), /^With head circumference 23 in, L\/XL is your size in the Packable Sun Hat\. L\/XL is head circumference 22\.75–24 in\./)
  assert.match(said('My head is 57 cm, what size hat?'), /^With head circumference 57 cm, S\/M is your size in the Packable Sun Hat\./)
  assert.match(said('I’m usually a medium, which size sun hat?'), /^Your usual S\/M should be right in the Packable Sun Hat\. S\/M is head circumference/)
  assert.equal(said('What size is the beanie?'), 'Peak Beanie: One size. The rib stretches to fit.')
})

test('other chart layouts read the same: one boots chart in centimeters with a US size column, one shoe size column for socks', () => {
  const layout = CHARTS.map((c) => {
    if (c.id === CLOTHES.boots) return { ...c, unit: 'cm' as const, columns: ['US size', 'Foot length'], rows: ['6', '7', '8', '9', '10', '11', '12'].map((size, i) => ({ size, values: [size, String(23 + i)] })) }
    if (c.id === CLOTHES.socks) return { ...c, columns: ['US shoe size'], rows: [['S', '4-6.5'], ['M', '7-9.5'], ['L', '10-13']].map(([size, value]) => ({ size: size!, values: [value!] })) }
    return c
  })
  const other = ctx({ sizeCharts: layout })
  assert.match(said('My foot is 26.5 cm, which women’s boot size?', other), /^With a 26\.5 cm foot, take size 10 in the women’s Canyon Hiking Boot: it’s the next size up from your foot length\. Size 10 is foot length 27 cm\./)
  assert.match(said('I’m between 8 and 9 in men’s boots', other), /^Between 8 and 9, take size 9, as its fit note says\. Size 9 is foot length 26 cm\./)
  assert.match(said('What size socks for a 13?', other), /^For a 13 shoe, take L in the Trail Merino Socks, 3-pack\. L fits US shoe size 10–13\./)
})

test('the rules read foot lengths, heads and shoe sizes, and nothing else, as sizes', () => {
  assert.deepEqual(footAndHeadIn('my foot is 10.5 inches long'), [{ what: 'foot', value: 10.5, unit: 'in' }])
  assert.deepEqual(footAndHeadIn('a 26 cm foot'), [{ what: 'foot', value: 26, unit: 'cm' }])
  assert.deepEqual(footAndHeadIn('a 23 inch head'), [{ what: 'head', value: 23, unit: 'in' }])
  assert.deepEqual(shoeSizesIn('I’m between a 9 and a 9.5'), [9, 9.5])
  assert.deepEqual(shoeSizesIn('I wear a 9 in sneakers'), [9])
  assert.deepEqual(shoeSizesIn('a men’s 10½'), [10.5])
  for (const message of ['my foot is 10.5 inches', 'warm at 20°F', 'the 24L pack', 'socks, 3-pack', 'under $50', '5\'6 and 140 lb']) {
    assert.deepEqual(shoeSizesIn(message), [], message)
  }
})

// ── Women’s and men’s pieces of one style ────────────────────────────────────

test('the women’s or men’s piece is the one the measurement, the size or the words fit; facts about a style are said once', () => {
  assert.match(said('What size Summit Down Jacket for a 40 inch chest?'), /^With chest 40 in, M is your size in the men’s Summit Down Jacket\. M is chest 38–40 in/)
  assert.match(said('What size down jacket for a 36 inch bust?'), /^With bust 36 in, M is your size in the women’s Summit Down Jacket\. M is bust 36–37 in/)
  assert.match(said('I’m usually an XS, which rain shell size?'), /bust 32–33 in/)
  assert.match(said('I wear an XXL, what size down jacket?'), /chest 47–49 in/)
  assert.match(said('Is the men’s fleece waterproof?'), /^I can’t promise the Alpine Fleece Jacket keeps out the rain/)
  // A size both are made in asks whose, then answers.
  assert.match(said('I’m usually a medium, which size rain shell?'), /^Ridgeline Rain Shell: Regular fit with room for a fleece underneath\. Is it the women’s or the men’s Ridgeline Rain Shell\?/)
  assert.match(said(['I’m usually a medium, which size rain shell?', 'women']), /^Your usual M should be right in the women’s Ridgeline Rain Shell\. M is bust 36–37 in/)
  assert.match(said(['Between M and L in the fleece', 'men’s']), /^Between M and L, take L, so there’s room to layer underneath\. L is chest 41–43 in/)
  // A fact about the style names neither whose, and remembers neither piece.
  const care = chat(['Can I wash the down jacket?'])
  assert.equal(care.replies[0]!.text, 'Yes. Summit Down Jacket: Machine wash cold on a gentle cycle. Tumble dry low with two clean tennis balls to lift the down.')
  assert.equal(care.state.productId, undefined)
  // "How should I wash it?" asks how, not whether: no yes.
  assert.equal(said('How should I wash the down jacket?'), 'Summit Down Jacket: Machine wash cold on a gentle cycle. Tumble dry low with two clean tennis balls to lift the down.')
  for (const message of ['Is the rain shell waterproof?', 'Are the boots waterproof?', 'Can I wash the down jacket?', 'Is the shell breathable?']) {
    assert.doesNotMatch(said(message), /\b(Women|Men)’s\b/, message)
  }
  // Merino: each style's care once.
  assert.equal(said('How do I wash merino?'), 'Merino Base Layer Top: Machine wash cold on a wool cycle. Dry flat. Trail Merino Socks, 3-pack: Machine wash warm, inside out. Tumble dry low. Peak Beanie: Hand wash cold. Dry flat.')
})

test('a style is asked about by its style name, and a piece named for its wearer reads “the women’s …” mid-sentence', () => {
  assert.match(said('What size boots should I get?'), /Is it the women’s or the men’s Canyon Hiking Boot\?/)
  const messages = [
    'What size boots should I get?', 'women’s boots in size 11', 'size 11 boot', 'I’m usually a medium, which size rain shell?',
    'My wife needs a waterproof jacket', 'What size down jacket for a 36 inch bust?', 'Is it waterproof?', 'will it keep me warm at 0°F?',
    'What should I wear for 0°F? for men', 'what do I wear under the rain shell?', 'Is the down jacket waterproof?',
  ]
  for (const page of [undefined, 6001, 6012]) {
    for (const message of messages) {
      const text = said(message, ctx({ currentProductId: page }))
      assert.doesNotMatch(text, /\b(women|men)’s (women|men)’s\b/i, `${page}: ${message}`)
      assert.doesNotMatch(text, /\b(the|a|an|in|of|for|and|or) (Women|Men)’s\b/, `${page}: ${message}`)
    }
  }
})

test('a boot question reads a foot length in cm or inches without the word “foot”, and asks for it in either unit', () => {
  assert.match(chat(['what size boot if I’m 26.5 cm?']).replies[0]!.text, /Is it the women’s or the men’s Canyon Hiking Boot\?/)
  assert.match(said(['what size boot if I’m 26.5 cm?', 'men’s']), /^With a 26\.5 cm foot, take size 9 in the men’s Canyon Hiking Boot/)
  assert.match(said(['what size boot if I’m 26.5 cm?', 'women’s']), /^With a 26\.5 cm foot, take size 10 in the women’s Canyon Hiking Boot/)
  assert.match(said('what size Canyon boot for 26.5 cm, men’s?'), /^With a 26\.5 cm foot, take size 9 in the men’s Canyon Hiking Boot/)
  assert.match(said(['I’m 10.5 inches, what size boot?', 'men’s']), /^With a 10\.5 in foot, take size 10 in the men’s Canyon Hiking Boot/)
  // A length alone answers the question waiting, then whose.
  assert.match(said(['What size boots should I get?', '26.5 cm', 'men’s']), /^With a 26\.5 cm foot, take size 9 in the men’s Canyon Hiking Boot/)
  // A height is not a foot; the question back offers either unit.
  const tall = said(['What size boots should I get?', 'women’s, I’m 5\'10"'])
  assert.match(tall, /height and weight alone/)
  assert.match(tall, /your foot length in inches or centimeters, and I’ll check it against the size chart\.$/)
})

test('a new question for the other wearer is about that wearer’s piece of the same style', () => {
  assert.match(said(['men’s boots, my foot is 26.5 cm', 'what size women’s boot for a 26.5 cm foot?']), /^With a 26\.5 cm foot, take size 10 in the women’s Canyon Hiking Boot/)
  assert.match(said(['men’s boots, my foot is 10.5 inches', 'what size women’s boot for a 10.5 inch foot?']), /^With a 10\.5 in foot, take size 10 in the women’s Canyon Hiking Boot\. Size 10 is foot length 10\.5 in\./)
  // On the women's boot page, a question for him; on the men's, for her.
  assert.match(said('what size for him? my foot is 10.75 inches', ctx({ currentProductId: 6006 })), /in the men’s Canyon Hiking Boot/)
  assert.match(said('what size for women with a 10.25 inch foot?', ctx({ currentProductId: 6012 })), /^With a 10\.25 in foot, take size 9 in the women’s Canyon Hiking Boot/)
  // Nothing said about whose: still the last one.
  assert.match(said(['men’s boots, my foot is 26.5 cm', 'and with a 27 cm foot?']), /in the men’s Canyon Hiking Boot/)
})

test('a membrane, a hardshell or a fabric brand asks whether a piece is waterproof, and a brand the store doesn’t sell says so', () => {
  const brand = chat(['do you have gore-tex jackets?'])
  assert.equal(brand.replies[0]!.text, 'We don’t sell that brand.')
  assert.deepEqual(cards(brand.replies[1]), [6002, 6008])
  assert.equal(brand.replies[2]!.text, 'The Summit Down Jacket is water-resistant, not waterproof.')
  assert.deepEqual(cards(chat(['do you sell a membrane jacket?']).replies[0]), [6002, 6008])
  assert.deepEqual(cards(chat(['do you have a hardshell?']).replies[0]), [6002, 6008])
  // About one piece: what its page says, and never a yes to a word the page doesn't use.
  assert.equal(said('Is the rain shell Gore-Tex?'), 'We don’t sell that brand. Ridgeline Rain Shell: A waterproof, breathable 2.5-layer shell of 100% recycled nylon, with taped seams.')
  assert.equal(said('Do the boots have a membrane?'), 'Canyon Hiking Boot: Waterproof suede and mesh upper with a waterproof, breathable membrane.')
  for (const message of ['do you have gore-tex jackets?', 'Is the rain shell Gore-Tex?', 'do you have a hardshell?']) {
    assert.doesNotMatch(said(message), /gore-?tex/i, message)
  }
})

test('“will the shell fit over the down jacket?” answers from the outer piece’s fit note, and promises no more room than it gives', () => {
  assert.equal(said('Will the rain shell fit over the down jacket?'), 'I can’t promise the Summit Down Jacket fits under the Ridgeline Rain Shell: it’s cut with room for a fleece underneath.')
  assert.equal(said('Will the rain shell fit over the fleece?'), 'Yes: the Ridgeline Rain Shell is cut with room for a fleece underneath.')
  assert.equal(said('Can I wear the base layer under the women’s rain shell?'), 'Yes: the women’s Ridgeline Rain Shell is cut with room for a fleece underneath.')
  assert.match(said('Will the down jacket fit over the rain shell?'), /^I can’t promise the Ridgeline Rain Shell fits under the Summit Down Jacket/)
  // Which layers go under a piece is still the layering answer.
  assert.match(said('What do I wear under the rain shell?'), /^Under the Ridgeline Rain Shell, wear the Merino Base Layer Top next to your skin/)
})

// ── Packs ────────────────────────────────────────────────────────────────────

test('a pack’s volume comes from its name or its specifications, with what its page says and nothing more', () => {
  assert.equal(said('How big is the Daybreak pack?'), 'The Daybreak 24L Pack holds 24 liters. One size. Fits torsos 16–21 in.')
  assert.equal(said('What’s the capacity of the Basecamp pack?'), 'The Basecamp Pack holds 45 liters. One size, with an adjustable back for torsos 15–20 in.')
  const trip = chat(['Which pack for an overnight trip?'])
  assert.equal(trip.replies[0]!.text, 'The Daybreak 24L Pack holds 24 liters. The Basecamp Pack holds 45 liters. For an overnight: A pack for overnights and long weekends, with a padded hip belt and a sleeping bag compartment.')
  assert.deepEqual(cards(trip.replies[1]), [6013, 6014])
  assert.match(said('Will a laptop fit in the daypack?'), /I can’t promise the Daybreak 24L Pack takes a laptop: its page doesn’t say\.$/)
  assert.match(said('Does the Daybreak pack take a hydration bladder?'), /with a sleeve for a 3-liter hydration bladder/)
  assert.match(said('Is the pack carry-on size?'), /I can’t promise the Daybreak 24L Pack or the Basecamp Pack is carry-on size: their pages don’t say\./)
})

// ── What a piece's page says ────────────────────────────────────────────────

test('a yes/no question about a piece is answered with the page’s own words, and left alone when they say nothing', () => {
  assert.equal(said('Does the bottle keep drinks cold?'), 'Insulated Trail Bottle, 24 oz: Keeps drinks cold for 24 hours and hot for 12.')
  assert.match(said('Is the sun hat UPF rated?'), /^Packable Sun Hat: Nylon with UPF 50\+ sun protection\./)
  assert.equal(said('Is the down ethically sourced?'), 'Summit Down Jacket: Fill: 650-fill responsibly sourced down.')
  assert.doesNotMatch(said('Does the beanie come in navy?'), /^Peak Beanie:/)
})

// ── Suggestions, offers and the store's pages ────────────────────────────────

test('suggestions keep to the kind of piece and the shopper’s own words', () => {
  const poles = chat(['Do you have trekking poles?']).replies[0]
  assert.equal(cards(poles)[0], 6017)
  assert.deepEqual(cards(chat(['warm boots']).replies[0]), [6006, 6012])
  assert.deepEqual(cards(chat(['hiking boots for him']).replies[0]), [6012])
  assert.ok(cards(chat(['a fleece for him']).replies[0]).includes(6009))
  assert.match(said('What do you recommend?'), /like a rain shell, hiking boots, a warm layer or a daypack/)
})

test('offers, returns and orders work as on any clothing store', () => {
  const sale = chat(['What’s on sale?'])
  assert.deepEqual(cards(sale.replies[0]), [6019, 6020])
  assert.match(sale.replies[1]!.text, /TRAIL20/)
  assert.match(said('Can I return boots that don’t fit?'), /Returns are free within 30 days/)
  assert.equal(said('Can I skip my subscription?'), 'We don’t sell subscriptions. Every order you place is listed in your account.')
})

test('no outdoor answer names a health claim, a real brand or a warmth it can’t back', () => {
  const messages = [
    'Is the rain shell waterproof?', 'Is the down jacket warm enough for -5°C?', 'How should I layer for a cold hike? for women',
    'Is the fleece warm enough for 10°F?', 'My foot is 26 cm, what size Canyon boot? men’s', 'Which pack for an overnight trip?',
  ]
  for (const message of messages) {
    const text = said(message)
    assert.doesNotMatch(text, /\b(cure|treat|heal|therapeutic|hypoallergenic|doctor|guarantee\w*)\b/i, message)
    assert.doesNotMatch(text, /gore-?tex|polartec|vibram|primaloft|patagonia|north face|arc'?teryx|columbia|salomon|merrell|osprey|\brei\b/i, message)
  }
})

// ── On the Aurora (demo) seed itself ─────────────────────────────────────────
// The store's own products, size charts and knowledge base, built from its blueprint
// as an install does and handed over as the store's chat widget hands them.

const AURORA_TODAY = '2026-11-24'
const aurora = AURORA_BLUEPRINT.build(contextFor(AURORA_BLUEPRINT, AURORA_BLUEPRINT.homeChannel, AURORA_TODAY))
const auroraEntries = (aurora.chatbot.config.knowledgeSources ?? [])
  .filter((s) => s.enabled && s.status === 'Active')
  .flatMap((s) => (s.entries ?? []).map((e) => ({ title: e.title, text: e.text, url: e.url, source: s.name })))
const auroraCtx = (over: Partial<AssistantContext> = {}): AssistantContext => ctx({
  products: aurora.products.filter((p) => (p.detail?.variantsList ?? []).some(variantAvailable)).map((p) => assistantProduct(p, `/products/${productHandle(p)}`)),
  entries: auroraEntries,
  sizeCharts: aurora.sizeCharts,
  promotion: aurora.campaigns.find((c) => c.startDate <= AURORA_TODAY && c.endDate >= AURORA_TODAY)?.offer?.message ?? '',
  profile: aurora.chatbot.assistantProfile,
  ...over,
})

test('the Aurora chatbot is on the apparel profile, and every quick prompt gets an answer on its topic', () => {
  assert.equal(aurora.chatbot.assistantProfile, 'apparel')
  const prompts = (aurora.chatbot.config.quickPrompts ?? []).filter((p) => p.enabled).map((p) => p.text)
  assert.deepEqual(prompts, ['Where is my order?', 'What size boots should I get?', 'Is the rain shell waterproof?', 'How warm is the down jacket?', 'How do returns work?'])
  for (const prompt of prompts) {
    const turn = chat([prompt], auroraCtx())
    assert.equal(turn.offerPrompts, false, prompt)
    assert.doesNotMatch(turn.replies[0]!.text, /^I’m not sure/, prompt)
  }
  assert.match(said('What size boots should I get?', auroraCtx()), /Canyon Hiking Boot/)
  assert.match(said('Is the rain shell waterproof?', auroraCtx()), /\bwaterproof\b/i)
  assert.match(said('How warm is the down jacket?', auroraCtx()), /14°F \(−10°C\)/)
  assert.match(said('How do returns work?', auroraCtx()), /free within 30 days/)
})

test('every earlier Aurora chat gets the same answers today as its history shows', () => {
  const conversations = AURORA_BLUEPRINT.history!(contextFor(AURORA_BLUEPRINT, AURORA_BLUEPRINT.homeChannel, AURORA_TODAY)).conversations
  assert.ok(conversations.length > 0)
  for (const conversation of conversations) {
    let state: AssistantState = NEW_CONVERSATION
    const messages = conversation.messages
    for (const [i, message] of messages.entries()) {
      if (message.from !== 'shopper') continue
      const turn = assistantReply(message.text, auroraCtx(), state)
      state = turn.state
      const shown = messages[i + 1]
      if (shown?.from === 'bot') assert.equal(turn.replies.map((r) => r.text).join(' '), shown.text, message.text)
    }
  }
})
