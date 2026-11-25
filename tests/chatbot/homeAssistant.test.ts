import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ASSISTANT_PROFILES, assistantProfile } from '../../src/chatbot/assistantProfiles.ts'
import { piecesNamed, sizesOf, spacesIn } from '../../src/chatbot/homeAnswers.ts'
import { respond } from '../../src/chatbot/previewResponder.ts'
import { NEW_CONVERSATION, assistantProduct, assistantReply } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext, AssistantOrder, AssistantReply, AssistantState, StoreProductFields } from '../../src/chatbot/storeAssistant.ts'
import { contextFor } from '../../src/storefront/demoStores/install.ts'
import { LUMOS_BLUEPRINT } from '../../src/storefront/demoStores/lumos.ts'
import { productHandle } from '../../src/storefront/handles.ts'
import { variantAvailable } from '../../src/storefront/variants.ts'
import { vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

// The home profile (a furniture and home store), tested on a small catalogue of its
// own, shaped like the Lumos (demo) seed: each product's `detail.specs` rows with the
// labels the profile reads (Width, Depth, Height, Seat height, Weight, Materials, Care,
// Assembly), written the ways the seed writes them ("14 in (shade)", "38 to 42 in",
// "64 in (Queen), 80 in (King)"), its warranty and its choices, and a knowledge base
// with the store's delivery, returns, care, assembly, warranty and contact pages.

const spec = (rows: Record<string, string>) => Object.entries(rows).map(([label, value]) => ({ label, value }))
const piece = (
  id: number, name: string, price: number, collections: string[], description: string,
  specs: Record<string, string>, warranty: string, options: Array<{ name: string; values: string[] }> = [],
): StoreProductFields => ({ id, name, price: price.toFixed(2), collections, detail: { subtitle: '', description, specs: spec(specs), warranty, options } })

const FIVE = '5-year frame warranty'
const ONE = '1-year warranty'
const UPHOLSTERY = 'Vacuum weekly with a soft brush. Blot spills straight away; the covers zip off for dry cleaning.'

const CATALOGUE: StoreProductFields[] = [
  piece(5001, 'Arlo 3-Seat Sofa', 1299, ['Living Room', 'Best Sellers'], 'A deep, low sofa with a kiln-dried oak frame and feather-wrapped cushions.',
    { Width: '84 in', Depth: '36 in', Height: '33 in', 'Seat height': '18 in', Weight: '128 lb', Materials: 'Kiln-dried oak frame, wool blend cover', Care: UPHOLSTERY, Assembly: 'Arrives assembled; screw on the four legs.' },
    FIVE, [{ name: 'Fabric', values: ['Oat', 'Slate', 'Moss'] }]),
  piece(5002, 'Arlo Lounge Chair', 649, ['Living Room'], 'The Arlo sofa’s chair, with the same deep seat.',
    { Width: '32 in', Depth: '34 in', Height: '31 in', 'Seat height': '18 in', Materials: 'Kiln-dried oak frame, wool blend cover', Care: UPHOLSTERY, Assembly: 'Arrives assembled' },
    FIVE, [{ name: 'Fabric', values: ['Oat', 'Slate'] }]),
  piece(5003, 'Mesa Coffee Table', 429, ['Living Room', 'Best Sellers'], 'A solid wood coffee table with rounded corners.',
    { Width: '48 in', Depth: '24 in', Height: '16 in', Weight: '44 lb', Materials: 'Solid oak or solid walnut, hard-wax oil finish', Care: 'Wipe with a damp cloth and dry. Re-oil once a year.', Assembly: 'Screw in the four legs; about 10 minutes.' },
    FIVE, [{ name: 'Finish', values: ['Natural oak', 'Walnut'] }]),
  piece(5005, 'Orbit Floor Lamp', 189, ['Lighting & Decor'], 'A brass floor lamp with a linen drum shade.',
    { Width: '14 in (shade)', Height: '62 in', Weight: '13 lb', Materials: 'Brass-finished steel, linen shade', Care: 'Dust with a dry cloth.', Assembly: 'Screw the stem together and fit the shade.' },
    ONE, [{ name: 'Finish', values: ['Brass', 'Black'] }]),
  piece(5006, 'Weave Wool Rug', 349, ['Lighting & Decor', 'Living Room'], 'A flat-woven rug in undyed wool.',
    { Height: '0.4 in', Weight: '18 lb (5 × 8 ft), 36 lb (8 × 10 ft)', Materials: 'Hand-woven wool on a cotton warp', Care: 'Vacuum without the beater bar.', Assembly: 'Arrives rolled; lay it flat for a day.' },
    ONE, [{ name: 'Size', values: ['5 × 8 ft', '8 × 10 ft'] }]),
  piece(5007, 'Haven Bed Frame', 1099, ['Bedroom', 'Best Sellers'], 'A solid ash bed frame with a tall headboard.',
    { Width: '64 in (Queen), 80 in (King)', Depth: '86 in', Height: '40 in at the headboard', Materials: 'Solid ash', Care: 'Dust with a dry cloth.', Assembly: 'Assembly required: about 45 minutes with two people. Tools included.' },
    FIVE, [{ name: 'Size', values: ['Queen', 'King'] }]),
  piece(5008, 'Haven Nightstand', 279, ['Bedroom'], 'A compact nightstand with one soft-close drawer.',
    { Width: '20 in', Depth: '16 in', Height: '24 in', Materials: 'Solid oak or solid walnut', Care: 'Wipe with a damp cloth.', Assembly: 'Arrives assembled' },
    FIVE, [{ name: 'Finish', values: ['Oak', 'Walnut'] }]),
  piece(5009, 'Cloud Linen Bedding Set', 219, ['Bedroom', 'New Arrivals'], 'A stonewashed linen duvet cover and two pillowcases.',
    { Weight: '5 lb', Materials: '100% stonewashed linen', Care: 'Machine wash warm and tumble dry low.', Assembly: 'Arrives ready to use' },
    ONE, [{ name: 'Color', values: ['White', 'Sage', 'Clay'] }]),
  piece(5010, 'Fold Dining Table', 1149, ['Dining', 'Best Sellers'], 'A solid oak dining table that comes in a six-seat or an eight-seat length.',
    { Width: '72 in (6-seat), 94 in (8-seat)', Depth: '38 in', Height: '30 in', Materials: 'Solid oak', Care: 'Wipe with a damp cloth and dry.', Assembly: 'Bolt on the legs with two people; about 30 minutes.' },
    FIVE, [{ name: 'Size', values: ['6-seat', '8-seat'] }]),
  piece(5012, 'Linen Pendant Light', 159, ['Lighting & Decor', 'Dining'], 'A wide linen drum to hang over a dining table.',
    { Width: '18 in', Height: '12 in shade, on a 60 in cord', Materials: 'Linen shade on a steel frame', Care: 'Dust with a soft brush.', Assembly: 'Wired to a ceiling box by an electrician' },
    ONE, [{ name: 'Color', values: ['Natural', 'Charcoal'] }]),
  piece(5013, 'Ledger Desk', 699, ['Office', 'New Arrivals'], 'An oak writing desk with a cable tray.',
    { Width: '48 in', Depth: '24 in', Height: '30 in', Weight: '62 lb', Materials: 'Solid oak', Care: 'Wipe with a damp cloth.', Assembly: 'Attach the legs and cable tray; about 30 minutes.' },
    FIVE, [{ name: 'Finish', values: ['Oak', 'Black'] }]),
  piece(5014, 'Ergo Task Chair', 499, ['Office'], 'An adjustable office chair.',
    { Width: '26 in', Depth: '25 in', Height: '38 to 42 in', 'Seat height': '17 to 21 in', Materials: 'Mesh back, aluminum base', Care: 'Wipe with a damp cloth.', Assembly: 'Click the base and wheels on; about 10 minutes.' },
    FIVE, [{ name: 'Color', values: ['Grey', 'Black'] }]),
  piece(5015, 'Grid Bookshelf', 549, ['Office', 'Living Room'], 'A five-shelf bookshelf.',
    { Width: '36 in', Depth: '14 in', Height: '72 in', Materials: 'Solid oak', Care: 'Dust with a dry cloth.', Assembly: 'Assembly required: about 40 minutes with two people. Wall anchor included.' },
    FIVE, [{ name: 'Finish', values: ['Oak', 'White'] }]),
  piece(5016, 'Cove Outdoor Sofa', 1499, ['Outdoor'], 'A teak outdoor sofa with quick-dry cushions.',
    { Width: '80 in', Depth: '34 in', Height: '30 in', Materials: 'Teak frame, quick-dry outdoor fabric', Care: 'Hose the frame down. Bring the cushions in or cover them in heavy rain.', Assembly: 'Arrives assembled' },
    FIVE, [{ name: 'Cushion', values: ['Sand', 'Charcoal'] }]),
  piece(5017, 'Terrace Dining Set', 1899, ['Outdoor'], 'An outdoor table and four stacking chairs. Seats four comfortably.',
    { Width: '63 in (table)', Depth: '35 in (table)', Height: '29 in (table)', Materials: 'Aluminum frames, teak tabletop', Care: 'Cover it or store it over winter.', Assembly: 'Bolt on the table legs; the chairs arrive assembled' },
    FIVE),
  piece(5018, 'Lantern Set of 3', 129, ['Outdoor', 'Lighting & Decor'], 'Three lanterns in graded heights.',
    { Height: '8 in, 11 in and 14 in', Materials: 'Powder-coated steel and clear glass', Care: 'Wipe the glass with a damp cloth.', Assembly: 'Arrives ready to use' },
    ONE),
  piece(5019, 'Stone Side Table', 219, ['Living Room', 'Sale'], 'A round travertine side table.',
    { Width: '18 in', Height: '20 in', Materials: 'Travertine', Care: 'Wipe with a damp cloth.', Assembly: 'Arrives assembled' },
    FIVE),
]

const products = CATALOGUE.map((p) => assistantProduct(p, `/products/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${p.id}`))
const byName = (name: string) => products.find((p) => p.name === name)!
const names = (ids: number[]) => ids.map((id) => products.find((p) => p.id === id)!.name)

const ENTRIES = [
  { title: 'Delivery times and cost', url: '/page/delivery-and-returns', source: 'Help pages', text: 'Delivery is free on every order, large or small. It takes 3 to 5 business days, and we email you a tracking link when your order ships.' },
  { title: 'Returns and refunds', url: '/policies/refund-policy', source: 'Store policies', text: 'Returns are free within 30 days of delivery, as long as the piece is unused. Write to us with your order number and we arrange the return.' },
  { title: 'Will it fit?', url: '/page/faq', source: 'Help pages', text: 'Every product page lists the piece’s width, depth and height. Measure your room, and the doorways, stairs and halls it has to pass through, before you order.' },
  { title: 'Assembly', url: '/page/faq', source: 'Help pages', text: 'Most pieces arrive assembled or need only their legs screwed on. Pendant lights are wired by an electrician.' },
  { title: 'Caring for wood, fabric and rugs', url: '/page/care-guide', source: 'Help pages', text: 'Wipe oiled wood with a damp cloth and dry it, and re-oil it once a year. Vacuum upholstery weekly.' },
  { title: 'Warranty', url: '/page/faq', source: 'Help pages', text: 'Sofas, chairs, tables, beds and storage have a 5-year frame warranty. Lighting, rugs, bedding and decor have a 1-year warranty.' },
  { title: 'Contact and hours', url: '/page/contact', source: 'Help pages', text: 'Write to hello@lumos.example and we answer within one business day.' },
]

const ANA = 'ana.reyes@example.com'
const order = (over: Partial<AssistantOrder> = {}): AssistantOrder => ({
  id: 900015, number: '#20015', email: ANA, date: '2026-11-20', status: 'Processing', fulfillment: 'Not Ready',
  tracking: null, items: [{ name: 'Arlo 3-Seat Sofa', qty: 1 }], total: '$1,299.00', ...over,
})

const ctx = (over: Partial<AssistantContext> = {}): AssistantContext => ({
  email: null, orders: [order()], subscriptions: [], products, entries: ENTRIES,
  shoppingEnabled: true, trackingEnabled: true, demo: true, profile: 'home', ...over,
})

function chat(messages: string[], context = ctx(), state: AssistantState = NEW_CONVERSATION) {
  let turn = assistantReply(messages[0]!, context, state)
  for (const message of messages.slice(1)) turn = assistantReply(message, context, turn.state)
  return turn
}
const first = (message: string, context = ctx()): AssistantReply => chat([message], context).replies[0]!
const said = (message: string, context = ctx()): string => chat([message], context).replies.map((r) => r.text).join(' ')
const linkOf = (reply: AssistantReply | undefined) => (reply?.kind === 'text' || reply?.kind === 'answer' ? reply.link : undefined)
const cards = (reply: AssistantReply | undefined): string[] => (reply?.kind === 'products' ? names(reply.productIds) : [])
const cardsOf = (reply: AssistantReply | undefined): number[] => (reply?.kind === 'products' ? reply.productIds : [])

// ── The profile ──────────────────────────────────────────────────────────────

test('the home profile reads like a furniture store, sells no subscriptions, and links within the store', () => {
  const profile = assistantProfile('home')
  assert.equal(profile, ASSISTANT_PROFILES.home)
  assert.equal(profile.subscriptions, false)
  assert.ok(profile.home)
  assert.deepEqual(profile.needs.map((n) => n.label), ['the living room', 'the bedroom', 'dining', 'a home office', 'outdoors', 'lighting', 'a small space'])
  assert.equal(profile.placeholder, 'Ask about a size, delivery or an order')
  assert.match(said('Hi'), /^Hi! I can check a piece’s size against your space/)
  assert.match(said('How do I pause my subscription?'), /We don’t sell subscriptions/)
  // The other profiles know nothing of furniture.
  for (const id of ['wellness', 'apparel', 'auto-parts'] as const) assert.equal(assistantProfile(id).home, undefined)
})

test('a product with specifications carries them, its warranty and its choices; others read as before', () => {
  const sofa = byName('Arlo 3-Seat Sofa')
  assert.equal(sofa.specs?.find((s) => s.label === 'Width')?.value, '84 in')
  assert.equal(sofa.warranty, '5-year frame warranty')
  assert.deepEqual(sofa.options, [{ name: 'Fabric', values: ['Oat', 'Slate', 'Moss'] }])
  // Vitaheal's products carry their supplement facts as rows since the feedback round (and so their choices), never a warranty.
  for (const product of vitahealProducts()) {
    const read = assistantProduct(product)
    assert.deepEqual(read.specs, product.detail!.specs, product.name)
    assert.equal('warranty' in read, false, product.name)
  }
})

// ── A piece's measurements ───────────────────────────────────────────────────

test('a piece’s sizes are read from its specifications as the store writes them', () => {
  const size = (name: string) => sizesOf(byName(name)).map((s) => [s.label, s.width?.text, s.depth?.text, s.height?.text, s.height?.note])
  assert.deepEqual(size('Arlo 3-Seat Sofa'), [['', '84 in', '36 in', '33 in', undefined]])
  // Sizes named by the piece's own choices; a side given once is the same in each.
  assert.deepEqual(size('Haven Bed Frame'), [['Queen', '64 in', '86 in', '40 in', 'at the headboard'], ['King', '80 in', '86 in', '40 in', 'at the headboard']])
  assert.deepEqual(size('Fold Dining Table'), [['6-seat', '72 in', '38 in', '30 in', undefined], ['8-seat', '94 in', '38 in', '30 in', undefined]])
  // A rug sold by floor size takes its width and depth from the choice.
  assert.deepEqual(size('Weave Wool Rug'), [['5 × 8 ft', '5 ft', '8 ft', '0.4 in', undefined], ['8 × 10 ft', '8 ft', '10 ft', '0.4 in', undefined]])
  // A note is never a size; a set's lengths are said whole and checked at the largest; a range keeps its least.
  assert.equal(sizesOf(byName('Orbit Floor Lamp'))[0]!.width!.note, 'shade')
  assert.deepEqual(sizesOf(byName('Lantern Set of 3'))[0]!.height, { inches: 14, text: '8 in, 11 in and 14 in' })
  assert.deepEqual(sizesOf(byName('Ergo Task Chair'))[0]!.height, { inches: 42, least: 38, text: '38 to 42 in' })
  assert.deepEqual(sizesOf(byName('Cloud Linen Bedding Set')), [])
})

test('“how wide is the Arlo sofa?” answers its width first, then the rest, and remembers the piece', () => {
  const turn = chat(['how wide is the Arlo sofa?'])
  const reply = turn.replies[0]!
  assert.equal(reply.text, 'The Arlo 3-Seat Sofa is 84 in wide. It’s 36 in deep and 33 in high.')
  assert.ok(reply.kind === 'text' && reply.topic === 'Size and fit')
  assert.equal(turn.state.productId, 5001)
  // A couch is a sofa; a follow-up needs no name.
  assert.equal(said('how deep is the Arlo couch?'), 'The Arlo 3-Seat Sofa is 36 in deep. It’s 84 in wide and 33 in high.')
  assert.match(said('how deep is the couch?'), /^Arlo 3-Seat Sofa: 84 in wide, 36 in deep and 33 in high. Cove Outdoor Sofa: /)
  assert.equal(chat(['how wide is the Arlo sofa?', 'how much does it weigh?']).replies[0]!.text, 'The Arlo 3-Seat Sofa weighs 128 lb.')
})

test('dimensions read naturally for every kind of piece, in centimeters when asked', () => {
  assert.equal(said('What are the dimensions of the coffee table?'), 'The Mesa Coffee Table is 48 in wide, 24 in deep and 16 in high.')
  assert.equal(said('how tall is the floor lamp in cm?'), 'The Orbit Floor Lamp is 62 in (157 cm) tall. It’s 14 in (36 cm) wide (shade).')
  assert.equal(said('How big is the rug?'), 'The Weave Wool Rug comes in two sizes. 5 × 8 ft: 5 ft wide, 8 ft long and 0.4 in thick. 8 × 10 ft: 8 ft wide, 10 ft long and 0.4 in thick.')
  assert.equal(said('what size is the king bed?'), 'The Haven Bed Frame in King is 80 in wide, 86 in deep and 40 in high (at the headboard).')
  assert.equal(said('how big is the terrace set?'), 'The Terrace Dining Set is 63 in wide, 35 in deep and 29 in high (table).')
  assert.equal(said('how tall are the lanterns?'), 'The Lantern Set of 3 is 8 in, 11 in and 14 in tall.')
  assert.equal(said('What is the seat height of the lounge chair?'), 'The Arlo Lounge Chair’s seat is 18 in high.')
  assert.equal(said('how wide are the sofas?'), 'Arlo 3-Seat Sofa: 84 in wide, 36 in deep and 33 in high. Cove Outdoor Sofa: 80 in wide, 34 in deep and 30 in high.')
})

test('a measurement the store doesn’t list is said to be missing, with a way to ask', () => {
  const reply = first('How big is the bedding set?')
  assert.equal(reply.text, 'I don’t have the Cloud Linen Bedding Set’s measurements. Write to us and we’ll find out for you.')
  assert.deepEqual(linkOf(reply), { label: 'Contact us', href: '/page/contact' })
  // The store's own contact page, wherever its knowledge says it is.
  const elsewhere = ENTRIES.map((e) => (e.title === 'Contact and hours' ? { ...e, url: '/page/faq' } : e))
  assert.deepEqual(linkOf(first('How big is the bedding set?', ctx({ entries: elsewhere }))), { label: 'Contact us', href: '/page/faq' })
  assert.deepEqual(linkOf(first('Can I talk to someone?', ctx({ entries: elsewhere }))), { label: 'Contact us', href: '/page/faq' })
  assert.deepEqual(linkOf(first('Where is order #20099?', ctx({ entries: elsewhere, email: ANA }))), { label: 'Contact us', href: '/page/faq' })
})

// ── Will it fit ──────────────────────────────────────────────────────────────

test('the shopper’s space is read in inches, feet, feet and inches, centimeters and meters', () => {
  const read = (text: string) => spacesIn(text).map((s) => [s.kind, Math.round(s.inches * 10) / 10, s.said])
  assert.deepEqual(read('a 90 inch wall'), [['width', 90, '90 in']])
  assert.deepEqual(read('my alcove is 6\'6" wide'), [['width', 78, '6 ft 6 in (78 in)']])
  assert.deepEqual(read('a space 7 ft wide and 40 inches deep'), [['width', 84, '7 ft (84 in)'], ['depth', 40, '40 in']])
  assert.deepEqual(read('a 2 m wide space'), [['width', 78.7, '2 m (78.7 in)']])
  assert.deepEqual(read('my doorway is 30 inches'), [['opening', 30, '30 in']])
  assert.deepEqual(read('under a 28 inch window'), [['height', 28, '28 in']])
  assert.deepEqual(read('a 10 by 12 room'), [['room', 120, '10 × 12 ft (120 × 144 in)']])
  assert.deepEqual(read('2 in stock'), [])
  assert.deepEqual(spacesIn('the wall is 7 wide')[0]!.unclear, true)
})

test('a piece is checked side by side against the space, and the answer says which side', () => {
  assert.equal(said('I have a 90 inch wall, will the Arlo sofa fit?'), 'Yes, the Arlo 3-Seat Sofa fits. It’s 84 in wide, 6 in less than your 90 in wall. It’s also 36 in deep and 33 in high, so check those too.')
  assert.equal(said('Will the Arlo sofa fit an 80 inch wall?'), 'No, the Arlo 3-Seat Sofa won’t fit. It’s 84 in wide, 4 in more than your 80 in wall.')
  assert.equal(said('will the arlo sofa fit a space 7 ft wide and 35 in deep'), 'No, the Arlo 3-Seat Sofa won’t fit. It’s 84 in wide, exactly your 7 ft (84 in) space, with nothing to spare. It’s 36 in deep, 1 in more than your 35 in space.')
  assert.equal(said('Will the Arlo sofa fit through a 30 inch door?'), 'No, the Arlo 3-Seat Sofa won’t fit. Even its smallest side, 33 in high, is 3 in more than your 30 in door.')
  assert.equal(said('Will the desk fit under a 28 inch window?'), 'No, the Ledger Desk won’t fit. It’s 30 in high, 2 in more than your 28 in window.')
  assert.equal(said('will the king bed fit a 10 by 12 room'), 'Yes, the Haven Bed Frame in King fits. At 80 in wide and 86 in deep, it fits a 10 × 12 ft (120 × 144 in) room.')
  // "the 8 × 10 rug" names its size, not a space.
  assert.equal(said('will the 8 x 10 rug fit a 9 by 12 room'), 'Yes, the Weave Wool Rug in 8 × 10 ft fits. At 8 ft wide and 10 ft long, it fits a 9 × 12 ft (108 × 144 in) room.')
})

test('a piece sold in sizes is checked size by size', () => {
  assert.equal(said('will the dining table fit a 90 inch space'), 'The Fold Dining Table fits in 6-seat, not in 8-seat. 6-seat: 72 in wide (18 in to spare). 8-seat: 94 in wide (4 in too wide).')
  assert.equal(said('will the dining table fit a 72 inch space'), 'The Fold Dining Table fits in 6-seat, not in 8-seat. 6-seat: 72 in wide (nothing to spare). 8-seat: 94 in wide (22 in too wide).')
})

test('a piece that arrives in parts or rolled is never checked against a doorway or stairs', () => {
  const bed = 'The Haven Bed Frame arrives in parts and is put together in the room, so its assembled size doesn’t have to go'
  const how = 'Assembly: About 45 minutes with two people. Tools included.'
  const king = first('Will the king Haven bed fit through a 32 inch doorway?')
  assert.equal(king.text, `${bed} through your 32 in doorway. ${how}`)
  assert.deepEqual(linkOf(king), { label: 'Read: Assembly', href: '/page/faq' })
  assert.equal(said('Will the Haven bed fit up my stairs, they are 34 inches wide?'), `${bed} up your 34 in stairs. ${how}`)
  // No width needed, so none is asked for.
  const door = chat(['Will the bed fit through my doorway?'])
  assert.equal(door.replies[0]!.text, `${bed} through a doorway or up the stairs. ${how}`)
  assert.equal(door.state.asked, undefined)
  // Legs bolted on with two people: in parts. A rug arrives rolled.
  assert.match(said('does the 8 seat table fit through a 28 inch door'), /^The Fold Dining Table arrives in parts and is put together in the room, so its assembled size doesn’t have to go through your 28 in door\. Assembly: Bolt on the legs/)
  assert.equal(said('Will the rug fit through a 30 inch door?'), 'The Weave Wool Rug arrives rolled, so its full size doesn’t have to go through your 30 in door.')
  // A piece that arrives whole, legs aside, is still checked side by side.
  assert.match(said('Will the Arlo sofa fit through a 30 inch door?'), /^No, the Arlo 3-Seat Sofa won’t fit\. Even its smallest side, 33 in high/)
  // The room is still checked; the doorway is said after.
  const both = chat(['Will the king bed fit through a 32 inch door and in a 10 by 12 room?']).replies
  assert.equal(both[0]!.text, 'Yes, the Haven Bed Frame in King fits. At 80 in wide and 86 in deep, it fits a 10 × 12 ft (120 × 144 in) room.')
  assert.equal(both[1]!.text, `${bed} through your 32 in door. ${how}`)
  // Among several pieces: the ones checked as cards, the one in parts on its own line.
  const room = chat(['which pieces fit through a 30 inch door in my bedroom?']).replies
  assert.deepEqual(cards(room[0]), ['Haven Nightstand'])
  assert.equal(room[1]!.text, `${bed} through your 30 in door. ${how}`)
})

test('it never guesses: a side it doesn’t have, a note with another length, or a number without a unit', () => {
  const missing = first('will the side table fit a space 20 in wide and 16 in deep?')
  assert.equal(missing.text, 'Here’s what I can check for the Stone Side Table. It’s 18 in wide, 2 in less than your 20 in space. I don’t have its depth, so I can’t check your 16 in space. Write to us and we’ll find out for you.')
  assert.deepEqual(linkOf(missing), { label: 'Contact us', href: '/page/contact' })
  assert.equal(said('Will the pendant fit under an 8 ft ceiling?'), 'Here’s what I can check for the Linen Pendant Light. It’s 12 in high (shade, on a 60 in cord), so I can’t check it against your 8 ft (96 in) ceiling from that alone. Write to us and we’ll find out for you.')
  assert.equal(said('my wall is 7 wide, will the sofa fit'), 'Is that 7 ft or 7 in? Tell me again with the unit, like 7 ft, and I’ll check it.')
  // An adjustable piece fits when set to.
  assert.equal(said('will the ergo chair fit under my 40 inch desk'), 'Yes, the Ergo Task Chair fits. It’s 38 to 42 in tall, so it fits your 40 in desk when set to 40 in or less. It’s also 26 in wide and 25 in deep, so check those too.')
  assert.match(said('will the ergo chair fit under a 36 inch desk'), /^No, .*even at 38 in, it’s 2 in more than your 36 in desk\.$/)
  // "Is the table 72 inches wide?" asks about the table, not about a space.
  assert.match(said('Is the dining table 72 inches wide?'), /^The Fold Dining Table comes in two sizes\. 6-seat: 72 in wide/)
})

test('without a space it gives the piece’s size and asks; the answer to that question is checked', () => {
  const asked = chat(['Will the arlo sofa fit through my doorway?'])
  assert.equal(asked.replies[0]!.text, 'The Arlo 3-Seat Sofa’s smallest side is 33 in high. How wide is the doorway? Tell me in inches and I’ll check it.')
  assert.equal(chat(['Will the arlo sofa fit through my doorway?', '36 inches']).replies[0]!.text, 'Yes, the Arlo 3-Seat Sofa fits. Its smallest side, 33 in high, is 3 in less than your 36 in doorway.')
  // No piece named: which one, then the space.
  assert.equal(said('Will it fit?'), assistantProfile('home').home!.askPiece)
  const named = chat(['Will it fit?', 'the arlo sofa'])
  assert.equal(named.replies[0]!.text, 'The Arlo 3-Seat Sofa is 84 in wide, 36 in deep and 33 in high. Tell me the width and depth of your space in inches or feet, and I’ll check it.')
  assert.match(chat(['Will it fit?', 'the arlo sofa', '86 in']).replies[0]!.text, /^Yes, the Arlo 3-Seat Sofa fits\. It’s 84 in wide, 2 in less than your 86 in space\./)
  // On a product's page, "it" is that piece.
  assert.match(said('will it fit a 50 inch space?', ctx({ currentProductId: 5003 })), /^Yes, the Mesa Coffee Table fits\. It’s 48 in wide, 2 in less than your 50 in space\./)
})

test('which of several pieces fit: the ones that do as cards, and a line on the ones that don’t', () => {
  const turn = chat(['which sofas fit an 82 inch wall?'])
  assert.equal(turn.replies[0]!.text, 'This fits an 82 in wall:')
  assert.deepEqual(cards(turn.replies[0]), ['Cove Outdoor Sofa'])
  assert.equal(turn.replies[1]!.text, 'The Arlo 3-Seat Sofa (84 in wide) doesn’t.')
  assert.equal(said('will the sofa fit a 2 m wide space'), 'None of them fit a space 2 m (78.7 in) wide: the Arlo 3-Seat Sofa (84 in wide) and the Cove Outdoor Sofa (80 in wide).')
  // The pieces for a room the shopper names.
  assert.deepEqual(cards(first('What fits a 60 inch wall in my living room?')), ['Arlo Lounge Chair', 'Mesa Coffee Table'])
  // Shopping turned off: the names, no cards.
  assert.equal(first('which sofas fit an 82 inch wall?', ctx({ shoppingEnabled: false })).kind, 'text')
})

test('a piece named for the shopper’s own things is not the piece asked about', () => {
  assert.deepEqual(piecesNamed('will the nightstand fit next to my bed', products).products.map((p) => p.name), ['Haven Nightstand'])
  assert.match(said('Will the nightstand fit a 22 inch gap next to my bed?'), /^Yes, the Haven Nightstand fits\. It’s 20 in wide, 2 in less than your 22 in gap\./)
})

test('a piece the shopper measures against, or puts it under, over or beside, is not the piece asked about', () => {
  const named = (text: string) => piecesNamed(text, products).products.map((p) => p.name)
  assert.deepEqual(named('will the 5x8 rug fit under my 72 inch table'), ['Weave Wool Rug'])
  assert.deepEqual(named('will the pendant fit over a 30 in table'), ['Linen Pendant Light'])
  assert.deepEqual(named('will the rug fit under my dining table'), ['Weave Wool Rug'])
  // A rug lies flat, so the height under the table says nothing.
  assert.equal(said('Will the 5x8 rug fit under my 72 inch table?'), 'Yes, the Weave Wool Rug in 5 × 8 ft fits. It lies flat, at 0.4 in thick. It’s also 5 ft wide and 8 ft long, so check those too.')
  assert.equal(said('Will the pendant fit over a 30 in table?'), 'Yes, the Linen Pendant Light fits. It’s 18 in wide, 12 in less than your 30 in space. It’s also 12 in high (shade, on a 60 in cord), so check that too.')
  // "covered" starts with "Cove", but the Arlo is the sofa named in full.
  assert.equal(said('Is the Arlo sofa covered by a 10 year warranty?'), 'Arlo 3-Seat Sofa: 5-year frame warranty.')
  // A word that only starts like a name still finds it when nothing else ties.
  assert.deepEqual(cards(first('Do you have an ergonomic chair?')), ['Ergo Task Chair'])
})

// ── How many it seats, and what it comes in ──────────────────────────────────

test('how many a piece seats comes from its name, its sizes or its description', () => {
  assert.equal(said('does the sofa seat 4?', ctx({ currentProductId: 5001 })), 'No, the Arlo 3-Seat Sofa seats 3.')
  assert.equal(said('is the couch 3 seats?', ctx({ currentProductId: 5001 })), 'Yes, the Arlo 3-Seat Sofa seats 3.')
  assert.equal(said('how many people does the dining table seat?'), 'The Fold Dining Table comes in 6-seat and 8-seat.')
  assert.equal(said('does it seat 8?', ctx({ currentProductId: 5010 })), 'Yes, the Fold Dining Table in 8-seat seats 8.')
  assert.equal(said('Is the dining table big enough for 8?'), 'Yes, the Fold Dining Table in 8-seat seats 8.')
  assert.equal(said('how many people does the terrace set seat?'), 'The Terrace Dining Set seats 4.')
})

test('the colours and finishes a piece comes in, and the pieces that come in one', () => {
  assert.equal(said('What colors does the Arlo sofa come in?'), 'The Arlo 3-Seat Sofa comes in Oat, Slate and Moss.')
  const walnut = first('do you have anything in walnut?')
  assert.equal(walnut.text, 'These come in walnut:')
  assert.deepEqual(cards(walnut), ['Mesa Coffee Table', 'Haven Nightstand'])
  assert.equal(said('Does the Arlo sofa come in moss?'), 'Yes, the Arlo 3-Seat Sofa comes in Moss. It also comes in Oat and Slate.')
})

test('a colour the store has sold out of is never said to be available', () => {
  // The Ergo chair with its variants' stock, as the store hands it in: Black is sold out, Grey isn't.
  const variant = (value: string, units: number, over = {}) => ({ title: value, optionValues: [value], sku: `LM-${value}`, price: '499.00', manageInventory: true, allowBackorder: false, stock: { 'Oxford Warehouse': units }, ...over })
  const ergo = CATALOGUE.find((p) => p.id === 5014)!
  const stocked = (variantsList: ReturnType<typeof variant>[]) => assistantProduct({ ...ergo, detail: { ...ergo.detail, variantsList } })
  assert.deepEqual(stocked([variant('Grey', 15), variant('Black', 0)]).options, [{ name: 'Color', values: ['Grey', 'Black'], soldOut: ['Black'] }])
  // On backorder, or with stock not counted, it can still be bought.
  assert.deepEqual(stocked([variant('Grey', 15), variant('Black', 0, { allowBackorder: true })]).options, [{ name: 'Color', values: ['Grey', 'Black'] }])
  assert.deepEqual(stocked([variant('Grey', 15), variant('Black', 0, { manageInventory: false })]).options, [{ name: 'Color', values: ['Grey', 'Black'] }])

  const store = ctx({ products: products.map((p) => (p.id === 5014 ? stocked([variant('Grey', 15), variant('Black', 0)]) : p)) })
  const no = 'No, the Ergo Task Chair in Black is sold out right now. It’s in stock in Grey.'
  assert.equal(said('Is the Ergo chair available in black?', store), no)
  assert.equal(said('Is the Ergo chair in stock in black?', store), no)
  assert.equal(said('Is the Ergo chair in stock?', store), 'Yes, the Ergo Task Chair is in stock in Grey; Black is sold out right now.')
  assert.equal(said('Is the Ergo chair available in grey?', store), 'Yes, the Ergo Task Chair is in stock in Grey.')
  assert.equal(said('What colors does the Ergo chair come in?', store), 'The Ergo Task Chair comes in Grey and Black (sold out right now).')
  assert.equal(said('is it in stock?', ctx({ ...store, currentProductId: 5003 })), 'Yes, the Mesa Coffee Table is in stock in Natural oak and Walnut.')
  // Delivery being available is not a piece in stock, and "anything available" asks for pieces.
  assert.match(said('Is delivery available?', ctx({ ...store, currentProductId: 5014 })), /^Delivery is free on every order/)
  assert.equal(first('Is anything available under $500?', ctx({ ...store, currentProductId: 5003 })).kind, 'products')
  // The pieces that come in black now: not the chair that is sold out in it.
  const black = first('do you have anything in black?', store)
  assert.equal(black.text, 'These come in black:')
  assert.deepEqual(cards(black), ['Orbit Floor Lamp', 'Ledger Desk'])
})

// ── Materials, care, assembly and warranty ───────────────────────────────────

test('materials and care come from the piece, with the store’s care page', () => {
  const reply = first('What is the Mesa table made of?')
  assert.equal(reply.text, 'Mesa Coffee Table: Solid oak or solid walnut, hard-wax oil finish.')
  assert.ok(reply.kind === 'text' && reply.topic === 'Materials and care')
  assert.deepEqual(linkOf(reply), { label: 'Read: Caring for wood, fabric and rugs', href: '/page/care-guide' })
  assert.equal(said('How do I clean the Arlo sofa?'), `Arlo 3-Seat Sofa: ${UPHOLSTERY}`)
  assert.equal(said('Can I machine wash the bedding?'), 'Yes. Cloud Linen Bedding Set: Machine wash warm and tumble dry low.')
  assert.equal(said('Can the outdoor sofa stay outside?'), 'Cove Outdoor Sofa: Hose the frame down. Bring the cushions in or cover them in heavy rain.')
  // Two things at once, each said for what it is.
  assert.equal(said('How much does the Arlo sofa weigh and what is it made of?'), 'The Arlo 3-Seat Sofa weighs 128 lb. Materials: Kiln-dried oak frame, wool blend cover.')
  // No piece: the store's own care page answers.
  assert.equal(first('How do I look after oak?').kind, 'answer')
  assert.match(said('How do I look after oak?'), /^Wipe oiled wood/)
})

test('a dishwasher or a machine wash is a care question, answered yes or no from the piece’s care', () => {
  const vases = assistantProduct(piece(5020, 'Ceramic Vase Trio', 89, ['Lighting & Decor', 'Sale'], 'Three stoneware vases.',
    { Height: '6 in, 9 in and 12 in', Materials: 'Stoneware with a matte glaze', Care: 'Hand wash. Not for the dishwasher.', Assembly: 'Arrives ready to use' }, ONE))
  const store = ctx({ products: [...products, vases] })
  const no = 'No. Ceramic Vase Trio: Hand wash. Not for the dishwasher.'
  assert.equal(said('Is the Ceramic Vase Trio dishwasher safe?', store), no)
  assert.equal(said('Can I put the vases in the dishwasher?', store), no)
  assert.equal(said('Can I machine wash the vases?', store), no)
  assert.ok(first('Is the Ceramic Vase Trio dishwasher safe?', store).kind === 'text')
  // Bedding that goes in the machine: yes.
  assert.equal(said('Can I machine wash the bedding?'), 'Yes. Cloud Linen Bedding Set: Machine wash warm and tumble dry low.')
})

test('assembly says yes or no when that is the question, and how it arrives', () => {
  assert.equal(said('Does the desk need assembly?'), 'Yes. Ledger Desk: Attach the legs and cable tray; about 30 minutes.')
  assert.equal(said('Does the nightstand need assembly?'), 'No. Haven Nightstand: Arrives assembled.')
  assert.equal(said('How do I set up the bookshelf?'), 'Grid Bookshelf: Assembly required: about 40 minutes with two people. Wall anchor included.')
  const arrives = chat(['How does the Arlo sofa arrive?']).replies
  assert.equal(arrives[0]!.text, 'Arlo 3-Seat Sofa: Arrives assembled; screw on the four legs.')
  assert.equal(arrives[1]!.kind, 'answer')
  assert.match(arrives[1]!.text, /^Delivery is free on every order/)
  assert.match(said('Do things need assembly?'), /^Most pieces arrive assembled/)
})

test('a warranty comes from the piece; pieces that share one share a line', () => {
  const lamp = first('What is the warranty on the floor lamp?')
  assert.equal(lamp.text, 'Orbit Floor Lamp: 1-year warranty.')
  assert.ok(lamp.kind === 'text' && lamp.topic === 'Warranty')
  assert.deepEqual(linkOf(lamp), { label: 'Read: Warranty', href: '/page/faq' })
  assert.equal(said('What’s the warranty on the sofas?'), 'Arlo 3-Seat Sofa and Cove Outdoor Sofa: 5-year frame warranty.')
  assert.equal(said('does it come with a warranty?', ctx({ currentProductId: 5003 })), 'Mesa Coffee Table: 5-year frame warranty.')
  assert.match(said('Is there a warranty?'), /^Sofas, chairs, tables, beds and storage have a 5-year frame warranty/)
})

// ── Delivery ─────────────────────────────────────────────────────────────────

test('delivery comes from the store’s own pages, and a service they don’t mention is never promised', () => {
  const large = chat(['Do you deliver large items like sofas?']).replies
  assert.equal(large.length, 1)
  assert.equal(large[0]!.kind, 'answer')
  assert.equal(large[0]!.text, ENTRIES[0]!.text)
  assert.deepEqual(linkOf(large[0]), { label: 'Read: Delivery times and cost', href: '/page/delivery-and-returns' })
  for (const [question, service] of [
    ['Will you carry the sofa upstairs?', 'carrying it inside or upstairs'],
    ['Is white glove delivery included?', 'carrying it inside or upstairs'],
    ['Can I choose a delivery time?', 'choosing a delivery day or time'],
    ['Will you take away my old sofa?', 'taking away the packaging or your old furniture'],
    ['Can I get express delivery?', 'faster delivery'],
  ] as const) {
    const replies = chat([question]).replies
    // The FAQ mentions stairs ("measure … the stairs"), which is not carrying anything upstairs.
    assert.equal(replies[0]!.text, ENTRIES[0]!.text, question)
    const caveat = replies.find((r) => r.kind === 'text' && r.topic === 'Delivery')
    assert.equal(caveat?.text, `Our delivery details don’t mention ${service}, so I can’t promise it. Write to us before you order and we’ll tell you what’s possible.`, question)
    assert.deepEqual(linkOf(caveat), { label: 'Contact us', href: '/page/contact' }, question)
  }
  // A store whose pages do offer the service: that page answers, and nothing is held back.
  const glove = [...ENTRIES, { title: 'White glove delivery', url: '/page/delivery-and-returns', source: 'Help pages', text: 'We carry every piece inside to the room of your choice and take the packaging away.' }]
  const offered = chat(['Will you carry the sofa upstairs?'], ctx({ entries: glove })).replies
  assert.equal(offered.length, 1)
  assert.equal(offered[0]!.text, glove[glove.length - 1]!.text)
})

test('“do you assemble?” answers from the store’s page on assembly, never its delivery times, and promises nothing', () => {
  const assembly = ENTRIES.find((e) => e.title === 'Assembly')!
  for (const question of ['do you assemble?', 'Do you assemble furniture?', 'Is assembly included?', 'Will you assemble the bed for me?']) {
    const replies = chat([question]).replies
    assert.equal(replies[0]!.kind, 'answer', question)
    assert.equal(replies[0]!.text, assembly.text, question)
    assert.deepEqual(linkOf(replies[0]), { label: 'Read: Assembly', href: '/page/faq' }, question)
    assert.ok(replies.every((r) => r.text !== ENTRIES[0]!.text), question)
    const caveat = replies.find((r) => r.kind === 'text' && r.topic === 'Delivery')
    assert.equal(caveat?.text, 'Our delivery details don’t mention assembling it for you, so I can’t promise it. Write to us before you order and we’ll tell you what’s possible.', question)
  }
  // A store with no page on assembly only says it can't promise it.
  const none = chat(['do you assemble?'], ctx({ entries: ENTRIES.filter((e) => e !== assembly && !/assembl/i.test(e.text)) })).replies
  assert.equal(none.length, 1)
  assert.match(none[0]!.text, /^Our delivery details don’t mention assembling it for you/)
})

test('when their own piece arrives is an order question; a box or a package is a question about the piece', () => {
  assert.equal(said('When will my sofa arrive?'), 'I can check that. Which email did you order with?')
  assert.match(said('When will my sofa arrive?', ctx({ email: ANA })), /^Order #20015, placed/)
  const box = first('Does the bed come in one package?')
  assert.ok(box.kind === 'text' && box.topic === 'Assembly')
  assert.match(box.text, /^Haven Bed Frame: Assembly required/)
  assert.match(said('Has my order shipped?'), /Which email did you order with/)
})

// ── Suggestions ──────────────────────────────────────────────────────────────

test('pieces for a room, a kind of piece in a room, and the smallest for a small space', () => {
  const room = first('I need furniture for my living room')
  assert.match(room.text, /^For the living room, here’s what I’d pick:$/)
  assert.equal(cards(room).length, 3)
  assert.ok(cards(room).every((name) => byName(name).collections.includes('Living Room')))
  const sofa = first('a sofa for the living room')
  assert.equal(sofa.text, 'For the living room, here’s the one I’d pick:')
  assert.deepEqual(cards(sofa), ['Arlo 3-Seat Sofa'])
  assert.deepEqual(cards(first('lighting for the dining room')), ['Linen Pendant Light'])
  // The bedding has no footprint, so it comes last.
  assert.deepEqual(cards(first('furniture for a small bedroom')), ['Haven Nightstand', 'Haven Bed Frame', 'Cloud Linen Bedding Set'])
  // A small space alone: what the store calls compact, then the pieces that take the least floor.
  assert.equal(cards(first('something for a small apartment'))[0], 'Haven Nightstand')
  const outdoors = cards(first('Show me outdoor furniture'))
  assert.equal(outdoors[0], 'Cove Outdoor Sofa')
  assert.ok(outdoors.every((name) => byName(name).collections.includes('Outdoor')))
})

test('a price limit with thousands, and the closest pieces when nothing is under it', () => {
  const under = first('anything for the bedroom under $500?')
  assert.equal(under.text, 'For the bedroom under $500, here’s what I’d pick:')
  assert.deepEqual(cards(under), ['Haven Nightstand', 'Cloud Linen Bedding Set'])
  const over = first('a sofa under $1,000')
  assert.equal(over.text, 'Nothing under $1,000 fits that. These come closest:')
  assert.deepEqual(cards(over), ['Arlo 3-Seat Sofa', 'Cove Outdoor Sofa'])
  // A length is never a price.
  assert.notEqual(first('a desk under 50 inches wide').kind, 'products')
})

test('a piece asked about by name shows its card, with its description when it is a question', () => {
  const comfy = first('Is the Arlo sofa comfortable?')
  assert.equal(comfy.text, 'Arlo 3-Seat Sofa: A deep, low sofa with a kiln-dried oak frame and feather-wrapped cushions.')
  assert.deepEqual(cards(comfy), ['Arlo 3-Seat Sofa'])
  assert.equal(first('How much is the Arlo sofa?').text, 'Here it is:')
  assert.deepEqual(cards(first('Do you have bookshelves?')), ['Grid Bookshelf'])
  // "the dining table" names a piece, not a room to fill.
  assert.deepEqual(cards(first('Is the dining table extendable?')), ['Fold Dining Table'])
})

test('what’s on sale, and the running code', () => {
  const sale = chat(['What’s on sale?'], ctx({ promotion: 'Winter home event: 20% off Living Room with code COZY20' })).replies
  assert.deepEqual(cards(sale[0]), ['Stone Side Table'])
  assert.match(sale[1]!.text, /COZY20/)
  assert.match(said('Do you have a discount code?'), /^There’s no discount code running right now\. Our Sale collection/)
})

// ── Care, and the store's pages ──────────────────────────────────────────────

test('safety and health questions get a careful answer, never a product', () => {
  const careful = assistantProfile('home').caution.text
  for (const question of ['Will the bookshelf tip over?', 'Do I need to anchor the bookshelf to the wall?', 'Does the pendant need an electrician?', 'Is the Ergo chair good for back pain?', 'Is the sofa safe for my baby?', 'Can I put real candles in the lanterns?', 'Does the rug off-gas?']) {
    assert.equal(said(question), careful, question)
  }
  assert.doesNotMatch(careful, /\b(cure|treat|safe to)\b/i)
})

test('returns and refunds are the store’s pages’ to answer, even about a piece', () => {
  for (const question of ['Can I return the sofa?', 'Can I return the Arlo sofa if it doesn’t fit?']) {
    const reply = first(question)
    assert.equal(reply.kind, 'answer', question)
    assert.match(reply.text, /^Returns are free within 30 days/, question)
  }
})

test('other stores never reach the home answers', () => {
  // The same catalogue asked through the wellness and apparel profiles gets none of them.
  for (const profile of ['wellness', 'apparel'] as const) {
    for (const question of ['how wide is the Arlo sofa?', 'I have a 90 inch wall, will the Arlo sofa fit?', 'Will you carry the sofa upstairs?']) {
      const turn = chat([question], ctx({ profile }))
      assert.ok(turn.replies.every((r) => !(r.kind === 'text' && (r.topic === 'Size and fit' || r.topic === 'Delivery'))), `${profile}: ${question}`)
      assert.equal(turn.state.asked, undefined, `${profile}: ${question}`)
    }
  }
})

// ── The Lumos (demo) seed ────────────────────────────────────────────────────
// The store's own products, knowledge base, quick prompts and earlier chats, built
// from its blueprint as an install does, and handed to the assistant as the store's
// chat widget hands them: products a shopper can buy, the enabled knowledge sources.

const lumos = LUMOS_BLUEPRINT.build(contextFor(LUMOS_BLUEPRINT, LUMOS_BLUEPRINT.homeChannel, '2026-11-24'))
const lumosChatbot = lumos.chatbot.config
const lumosEntries = (lumosChatbot.knowledgeSources ?? [])
  .filter((s) => s.enabled && s.status === 'Active')
  .flatMap((s) => (s.entries ?? []).map((e) => ({ title: e.title, text: e.text, url: e.url, source: s.name })))
const lumosProducts = lumos.products
  .filter((p) => (p.detail?.variantsList ?? []).some(variantAvailable))
  .map((p) => assistantProduct(p, `/products/${productHandle(p)}`))
const lumosRunning = lumos.campaigns.find((c) => c.startDate <= '2026-11-24' && c.endDate >= '2026-11-24')
const lumosCtx = (over: Partial<AssistantContext> = {}): AssistantContext => ctx({
  products: lumosProducts, entries: lumosEntries, promotion: lumosRunning?.offer?.message ?? '', profile: lumos.chatbot.assistantProfile, ...over,
})
const entryText = (title: string) => lumosEntries.find((e) => e.title === title)!.text

test('the Lumos chatbot is on the home profile, and every quick prompt gets an answer on its topic', () => {
  assert.equal(lumos.chatbot.assistantProfile, 'home')
  const prompts = (lumosChatbot.quickPrompts ?? []).filter((p) => p.enabled).map((p) => p.text)
  assert.deepEqual(prompts, ['How big is the Arlo sofa?', 'Where is my order?', 'Does it need assembly?', 'How do returns work?', 'What’s on sale?'])
  const asked = (prompt: string) => chat([prompt], lumosCtx({ email: ANA }))
  for (const prompt of prompts) assert.equal(asked(prompt).offerPrompts, false, prompt)

  const size = asked(prompts[0]!).replies[0]!
  assert.match(size.text, /^The Arlo 3-Seat Sofa is \d+ in wide, \d+ in deep and \d+ in (high|tall)\.$/)
  assert.ok(size.kind === 'text' && size.topic === 'Size and fit')
  assert.equal(asked(prompts[1]!).replies[0]!.kind, 'order')
  const assembly = asked(prompts[2]!).replies[0]!
  assert.equal(assembly.kind, 'answer')
  assert.equal(assembly.text, entryText('Assembly'))
  assert.equal(asked(prompts[3]!).replies[0]!.text, entryText('Returns and refunds'))
  const sale = asked(prompts[4]!).replies
  assert.ok(cardsOf(sale[0]).length > 0)
  assert.ok(cardsOf(sale[0]).every((id) => lumos.products.find((p) => p.id === id)!.collections.includes('Sale')))
  assert.ok(sale[1]!.text.includes(lumosRunning!.offer!.code))
})

test('the Lumos quick prompts in the builder’s preview: the knowledge base answers its own, the live store the rest', () => {
  const previewEntries = lumosEntries.map(({ title, text, source }) => ({ title, text, source }))
  const preview = (prompt: string) => respond(prompt, { shoppingEnabled: true, trackingEnabled: true, entries: previewEntries })
  const replies = (lumosChatbot.quickPrompts ?? []).map((p) => preview(p.text))
  assert.deepEqual(replies.map((r) => r.kind), ['live', 'live', 'answer', 'answer', 'live'])
  assert.equal(replies[2]!.text, entryText('Assembly'))
  assert.equal(replies[3]!.text, entryText('Returns and refunds'))
  assert.match(replies[0]!.text, /live store’s products/)
  assert.match(replies[4]!.text, /live store’s products/)
})

test('every question in the Lumos chatbot’s earlier chats gets an answer on its topic', () => {
  const conversations = LUMOS_BLUEPRINT.history!(contextFor(LUMOS_BLUEPRINT, LUMOS_BLUEPRINT.homeChannel, '2026-11-24')).conversations
  assert.ok(conversations.length > 0)
  for (const conversation of conversations) {
    let state: AssistantState = NEW_CONVERSATION
    for (const message of conversation.messages.filter((m) => m.from === 'shopper')) {
      const turn = assistantReply(message.text, lumosCtx(), state)
      state = turn.state
      const reply = turn.replies[0]!
      // Never the fallback that says it didn't understand.
      assert.equal(turn.offerPrompts, false, message.text)
      assert.doesNotMatch(reply.text, /^I’m not sure/, message.text)
      // The questions the seed asks today, each on its own topic.
      const named = piecesNamed(message.text.toLowerCase(), lumosProducts).products[0]
      if (/how big/i.test(message.text)) assert.match(reply.text, new RegExp(`^The ${named!.name} is \\d+ in wide`), message.text)
      if (/come in/i.test(message.text)) {
        // What the piece comes in, every choice named ("Does it come in green?" gets them all, never a yes it can't back).
        const piece = lumosProducts.find((p) => p.id === state.productId)!
        for (const value of piece.options![0]!.values) assert.ok(reply.text.includes(value), `${message.text}: ${value}`)
      }
      if (/delivery/i.test(message.text)) assert.equal(reply.text, entryText('Delivery times and cost'), message.text)
      if (/look after|care|clean/i.test(message.text)) {
        const care = named!.specs!.find((s) => s.label === 'Care')!.value
        assert.ok(reply.text.startsWith(`${named!.name}: ${care}`), message.text)
      }
    }
  }
})

test('on the Lumos seed: a sold-out colour, a piece that arrives in parts, a dishwasher, and “do you assemble?”', () => {
  // Every value the seed has sold out of is said to be, never offered as available.
  const sold = lumosProducts.flatMap((p) => (p.options ?? []).flatMap((o) => (o.soldOut ?? []).map((value) => ({ p, value }))))
  assert.ok(sold.length > 0, 'the seed has a sold-out colour to show')
  for (const { p, value } of sold) {
    assert.match(said(`Is the ${p.name} available in ${value.toLowerCase()}?`, lumosCtx()), new RegExp(`^No, the ${p.name} in ${value} is sold out right now\\.`))
  }
  // The bed takes two people to put together: its headboard's height is no reason it won't get upstairs.
  const stairs = said('Will the Haven bed fit up my stairs, they are 34 inches wide?', lumosCtx())
  assert.match(stairs, /^The Haven Bed Frame arrives in parts and is put together in the room, so its assembled size doesn’t have to go up your 34 in stairs\./)
  // A piece whose care rules out the dishwasher says no.
  for (const p of lumosProducts.filter((x) => /not for the dishwasher/i.test(x.specs?.find((s) => s.label === 'Care')?.value ?? ''))) {
    assert.match(said(`Is the ${p.name} dishwasher safe?`, lumosCtx()), new RegExp(`^No\\. ${p.name}: `))
  }
  const assemble = chat(['do you assemble?'], lumosCtx()).replies
  assert.equal(assemble[0]!.text, entryText('Assembly'))
  assert.ok(assemble.every((r) => r.text !== entryText('Delivery times and cost')))
})
