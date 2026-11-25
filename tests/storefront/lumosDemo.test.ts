// The Lumos Home (demo) seed against the reference tables of its catalogue: prices
// and sale prices, options and swatches, the colourway photos, the sold-out and "Only
// N left" variants, specs and warranties, the collections and what Newest puts first,
// what COZY20 takes off, what search and "Complete the room" find, the theme's styles
// and colour contrast, the templates the Lumos theme draws, the header and footer, the
// chatbot, and the store facts the checkout and the copy must agree on.
//
// The checks every demo store passes (links, photo files and credits, SKUs, real
// brands, capabilities) are in demoStores.test.ts, which runs them for Lumos too.
// This file adds what only a furniture store needs: its exact photo files, and no
// furniture maker a shopper might know.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LUMOS_BLUEPRINT } from '../../src/storefront/demoStores/lumos.ts'
import { contextFor } from '../../src/storefront/demoStores/install.ts'
import type { StoreSnapshot } from '../../src/storefront/demoStores/types.ts'
import {
  LUMOS_BRANDS, LUMOS_CATEGORIES, LUMOS_CHANNEL_ID, LUMOS_COLLECTION_NAMES, LUMOS_COLOURWAY_PHOTOS, LUMOS_PHOTO_DIR, LUMOS_SWATCHES,
  brandLink, brandLogo,
} from '../../src/storefront/lumosDemo.ts'
import { campaignStatus, discountFor, findByCode } from '../../src/storefront/campaigns.ts'
import { checkoutProfile } from '../../src/storefront/checkoutProfile.ts'
import { listProducts, parseListingQuery, sortProducts } from '../../src/storefront/facets.ts'
import { toHandle } from '../../src/storefront/handles.ts'
import { formatStorePrice } from '../../src/storefront/price.ts'
import { forSameAudience, galleryFor } from '../../src/storefront/productPage.ts'
import { recommendFor, searchStore } from '../../src/storefront/search.ts'
import { onBrandColor, themeFonts } from '../../src/storefront/themeSections.ts'
import { describeVariant, optionValuesOf, stockNote, variantFor } from '../../src/storefront/variants.ts'
import { money } from '../../src/maropay/money.ts'
import { contrastRatio } from '../../src/utils/brandContrast.ts'
import type { ProductVariant } from '../../src/stores/useCommerce.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'

const TODAY = '2026-11-19'
const STOCK = 'Oxford Warehouse'
const build = (channel: SalesChannel): StoreSnapshot => LUMOS_BLUEPRINT.build(contextFor(LUMOS_BLUEPRINT, channel, TODAY))
const home = build(LUMOS_BLUEPRINT.homeChannel)
/** The store installed in another one (slot 9), as Apply would. */
const qaChannel: SalesChannel = {
  ...LUMOS_BLUEPRINT.homeChannel, id: 'qa-store', name: 'QA store',
  webStore: { ...LUMOS_BLUEPRINT.homeChannel.webStore!, domain: 'qa-store.example', blueprint: { original: null, slot: 9 } },
}
const copy = build(qaChannel)
const history = LUMOS_BLUEPRINT.history!(contextFor(LUMOS_BLUEPRINT, LUMOS_BLUEPRINT.homeChannel, TODAY))

type SeededProduct = StoreSnapshot['products'][number]
const byName = (snapshot: StoreSnapshot, name: string): SeededProduct => {
  const product = snapshot.products.find((p) => p.name === name)
  assert.ok(product, name)
  return product
}
const ids = (products: { id: number }[]) => products.map((p) => p.id)
const variantsOf = (p: SeededProduct) => p.detail!.variantsList
const label = (p: SeededProduct, v: ProductVariant) => [p.name, ...optionValuesOf(v, p.detail!.options)].join(' › ')
const specOf = (p: SeededProduct, name: string) => p.detail!.specs!.find((s) => s.label === name)?.value
const section = (snapshot: StoreSnapshot, id: string) => {
  const t = snapshot.theme.templates
  const found = [...t.home, ...t.product, ...t.collection, ...t.cart].find((s) => s.id === id)
  assert.ok(found, id)
  return found
}

test('the catalogue is the twenty reference products, at their prices, in their place', () => {
  // In the catalogue table's order; the five New Arrivals have the newest ids (5016-5020).
  assert.deepEqual(home.products.map((p) => [p.id, p.name, p.detail!.brand, p.price]), [
    [5001, 'Arlo 3-Seat Sofa', 'Linden Row', '1299.00'], [5002, 'Arlo Lounge Chair', 'Linden Row', '649.00'],
    [5003, 'Mesa Coffee Table', 'Oakmere', '429.00'], [5004, 'Halden Media Console', 'Halden Works', '899.00'],
    [5005, 'Orbit Floor Lamp', 'Brightwell Studio', '189.00'], [5006, 'Weave Wool Rug', 'Cove & Co', '349.00'],
    [5007, 'Haven Bed Frame', 'Morrow & Pine', '1099.00'], [5008, 'Haven Nightstand', 'Morrow & Pine', '279.00'],
    [5016, 'Cloud Linen Bedding Set', 'Cove & Co', '219.00'], [5009, 'Fold Dining Table', 'Oakmere', '1149.00'],
    [5017, 'Ridge Dining Chair, set of 2', 'Oakmere', '399.00'], [5018, 'Linen Pendant Light', 'Brightwell Studio', '159.00'],
    [5019, 'Ledger Desk', 'Halden Works', '699.00'], [5010, 'Ergo Task Chair', 'Halden Works', '499.00'],
    [5011, 'Grid Bookshelf', 'Morrow & Pine', '549.00'], [5012, 'Cove Outdoor Sofa', 'Cove & Co', '1499.00'],
    [5013, 'Terrace Dining Set', 'Cove & Co', '1899.00'], [5020, 'Lantern Set of 3', 'Brightwell Studio', '129.00'],
    [5014, 'Stone Side Table', 'Oakmere', '219.00'], [5015, 'Ceramic Vase Trio', 'Cove & Co', '89.00'],
  ])
  // A size changes the price: the product reads its lowest, "From" on the page until a size is chosen.
  const prices = (name: string) => variantsOf(byName(home, name)).map((v) => [v.title, v.price])
  assert.deepEqual(prices('Weave Wool Rug'), [['5 × 8 ft', '349.00'], ['8 × 10 ft', '549.00']])
  assert.deepEqual(prices('Haven Bed Frame'), [['Queen', '1099.00'], ['King', '1249.00']])
  assert.deepEqual(prices('Fold Dining Table'), [['6-seat', '1149.00'], ['8-seat', '1399.00']])
  for (const p of home.products) {
    assert.equal(p.vendor, p.detail!.brand, p.name)
    assert.equal(p.price, variantsOf(p).map((v) => v.price).sort((a, b) => Number(a) - Number(b))[0], `${p.name}: the product's price is its lowest`)
    assert.equal(p.inventory, variantsOf(p).reduce((units, v) => units + v.stock[STOCK]!, 0), p.name)
    assert.equal(p.sku, variantsOf(p)[0]!.sku, `${p.name}: its SKU is its first variant's`)
    for (const [n, v] of variantsOf(p).entries()) {
      assert.equal(v.id, p.id * 100 + n + 1, `${label(p, v)}: id`)
      assert.match(v.sku, /^LM-(SEA|TBL|STO|BED|LGT|DEC)-\d{4}$/, label(p, v))
    }
  }
  const variants = home.products.flatMap(variantsOf)
  assert.equal(variants.length, 38)
  assert.equal(variants.reduce((units, v) => units + v.stock[STOCK]!, 0), 506)
  assert.deepEqual(home.market, { currency: 'USD' })
  assert.equal(formatStorePrice(money(129900, home.market.currency), home.market.locale), '$1,299.00')
  // The six makers each make two pieces or more, and every category has pieces.
  for (const brand of LUMOS_BRANDS) assert.ok(home.products.filter((p) => p.detail!.brand === brand).length >= 2, brand)
  assert.deepEqual([...new Set(home.products.map((p) => p.detail!.tag))].sort(), [...LUMOS_CATEGORIES].sort())
})

test('two pieces are on sale, with a compare-at price on every variant, both in Sale', () => {
  const onSale = home.products.filter((p) => p.compareAtPrice)
  assert.deepEqual(onSale.map((p) => [p.name, p.price, p.compareAtPrice]), [
    ['Stone Side Table', '219.00', '269.00'],
    ['Ceramic Vase Trio', '89.00', '109.00'],
  ])
  for (const p of onSale) {
    for (const v of variantsOf(p)) assert.equal(v.compareAtPrice, p.compareAtPrice, label(p, v))
    assert.ok(p.collections.includes('Sale'), p.name)
  }
  assert.equal(home.products.flatMap(variantsOf).filter((v) => v.compareAtPrice).length, 2)
})

test('the black Ergo chair is sold out, the Moss sofa and the terrace set are down to their last few, and nothing else is low', () => {
  const where = (stock: (units: number) => boolean) => home.products.flatMap((p) => variantsOf(p).filter((v) => stock(v.stock[STOCK]!)).map((v) => label(p, v)))
  assert.deepEqual(where((units) => units === 0), ['Ergo Task Chair › Black'])
  assert.deepEqual(where((units) => units > 0 && units < 4), ['Arlo 3-Seat Sofa › Moss', 'Terrace Dining Set'])
  assert.equal(stockNote(variantFor(byName(home, 'Arlo 3-Seat Sofa'), { Fabric: 'Moss' })!), 'Only 3 left')
  assert.equal(stockNote(variantsOf(byName(home, 'Terrace Dining Set'))[0]!), 'Only 2 left')
  assert.deepEqual(home.products.flatMap(variantsOf).map(stockNote).filter(Boolean), ['Only 3 left', 'Only 2 left'])
})

test('options are one per piece: fabrics, finishes and colours as swatches, sizes as buttons; a cart line reads "Size Queen"', () => {
  const sofa = byName(home, 'Arlo 3-Seat Sofa')
  assert.deepEqual(sofa.detail!.options, [
    { name: 'Fabric', values: ['Oat', 'Slate', 'Moss'], display: 'swatches', swatches: { Oat: '#d9cdb8', Slate: '#5f6b75', Moss: '#6f7a4f' } },
  ])
  const moss = variantFor(sofa, { Fabric: 'Moss' })!
  assert.deepEqual([moss.id, moss.sku, describeVariant(moss, sofa.detail!.options)], [500103, 'LM-SEA-1013', 'Moss'])
  const bed = byName(home, 'Haven Bed Frame')
  assert.deepEqual(bed.detail!.options, [{ name: 'Size', values: ['Queen', 'King'], display: 'buttons' }])
  assert.equal(describeVariant(variantFor(bed, { Size: 'Queen' })!, bed.detail!.options), 'Size Queen')
  const rug = byName(home, 'Weave Wool Rug')
  assert.equal(describeVariant(variantFor(rug, { Size: '8 × 10 ft' })!, rug.detail!.options), 'Size 8 × 10 ft')
  const shapes = home.products.map((p) => p.detail!.options.map((o) => `${o.name}${o.display === 'swatches' ? ' (swatches)' : ''}`).join(' × ') || 'none')
  const count = (shape: string) => shapes.filter((s) => s === shape).length
  assert.deepEqual(
    [count('Fabric (swatches)'), count('Finish (swatches)'), count('Color (swatches)'), count('Cushion (swatches)'), count('Size'), count('none')],
    [2, 7, 3, 1, 3, 4],
  )
  for (const p of home.products) {
    assert.ok(p.detail!.options.length <= 1, `${p.name}: one option at most`)
    for (const option of p.detail!.options) for (const [value, hex] of Object.entries(option.swatches ?? {})) assert.equal(hex, LUMOS_SWATCHES[value], `${p.name} › ${value}`)
  }
  const set = byName(home, 'Terrace Dining Set')
  assert.deepEqual([set.detail!.options, set.detail!.hasVariants, variantsOf(set).map((v) => [v.title, v.sku])], [[], false, [['Default', 'LM-TBL-1131']]])
  // The photos show the first value: the black lamp, the teak console, the white cushions.
  const firsts = (name: string) => byName(home, name).detail!.options[0]!.values
  assert.deepEqual([firsts('Orbit Floor Lamp'), firsts('Halden Media Console'), firsts('Cove Outdoor Sofa')], [['Black', 'Brass'], ['Teak', 'Black'], ['White', 'Charcoal']])
})

test('the colourway photos are wired to their colour; any other colour shows the first colour, and says so', () => {
  const files = (name: string) => byName(home, name).imageUrls!.map((url) => url.slice(LUMOS_PHOTO_DIR.length + 1))
  for (const p of home.products) {
    const base = p.imageUrls![0]!.slice(LUMOS_PHOTO_DIR.length + 1).replace(/-1\.jpg$/, '')
    const colourways = Object.values(LUMOS_COLOURWAY_PHOTOS[base] ?? {})
    assert.deepEqual(files(p.name), [`${base}-1.jpg`, `${base}-2.jpg`, ...colourways], p.name)
    assert.equal(p.images, p.imageUrls!.length)
  }
  // No free photo matched the sofa's Slate and Moss or the console's Black, so those show the first colour.
  assert.deepEqual(files('Arlo 3-Seat Sofa'), ['arlo-sofa-1.jpg', 'arlo-sofa-2.jpg'])
  const colourways = home.products.filter((p) => p.detail!.imagesByColor)
  assert.deepEqual(ids(colourways), [5016, 5010])
  for (const p of colourways) {
    const byColor = p.detail!.imagesByColor!
    const first = p.detail!.options[0]!.values[0]!
    assert.deepEqual(byColor[first], p.imageUrls!.slice(0, 2), `${p.name}: its own photos are of ${first}`)
    const listed = Object.values(byColor).flat()
    assert.equal(new Set(listed).size, listed.length, `${p.name}: no photo is listed under two colours`)
  }
  const gallery = (name: string, choice: Record<string, string>) => {
    const g = galleryFor(byName(home, name), choice)
    return [g.images.map((url) => url.slice(LUMOS_PHOTO_DIR.length + 1)), g.shownIn]
  }
  assert.deepEqual(gallery('Arlo 3-Seat Sofa', { Fabric: 'Moss' }), [['arlo-sofa-1.jpg', 'arlo-sofa-2.jpg'], 'Shown in Oat'])
  assert.deepEqual(gallery('Cloud Linen Bedding Set', { Color: 'Sage' }), [['cloud-bedding-sage-1.jpg'], ''])
  assert.deepEqual(gallery('Arlo 3-Seat Sofa', { Fabric: 'Oat' }), [['arlo-sofa-1.jpg', 'arlo-sofa-2.jpg'], ''])
  assert.deepEqual(gallery('Ergo Task Chair', { Color: 'Black' }), [['ergo-chair-black-1.jpg'], ''])
  // A finish without a photo of its own: the first finish's photos, named.
  assert.deepEqual(gallery('Mesa Coffee Table', { Finish: 'Walnut' }), [['mesa-table-1.jpg', 'mesa-table-2.jpg'], 'Shown in Oak'])
})

test('every piece lists its specs with the labels the chatbot reads, and the warranty its kind has', () => {
  const LABELS = ['Width', 'Depth', 'Height', 'Seat height', 'Weight', 'Materials', 'Care', 'Assembly']
  const fiveYear = home.products.filter((p) => p.detail!.warranty === '5-year frame warranty')
  const oneYear = home.products.filter((p) => p.detail!.warranty === '1-year warranty')
  assert.deepEqual(ids(oneYear), [5005, 5006, 5016, 5018, 5020, 5015], 'lighting and textiles: a year')
  assert.equal(fiveYear.length + oneYear.length, 20)
  for (const p of home.products) {
    const labels = p.detail!.specs!.map((s) => s.label)
    for (const name of labels) assert.ok(LABELS.includes(name), `${p.name}: "${name}"`)
    assert.deepEqual(labels, LABELS.filter((name) => labels.includes(name)), `${p.name}: in the order the row lists them`)
    for (const name of ['Materials', 'Care', 'Assembly', 'Weight']) assert.ok(specOf(p, name), `${p.name}: ${name}`)
    assert.equal(p.detail!.material, specOf(p, 'Materials'), `${p.name}: the admin's material is the spec`)
    if (fiveYear.includes(p)) assert.ok(specOf(p, 'Width') && specOf(p, 'Height'), `${p.name}: furniture has its size`)
    if (p.detail!.tag === 'Sofas & chairs') assert.ok(specOf(p, 'Seat height'), `${p.name}: seat height`)
  }
  const sofa = byName(home, 'Arlo 3-Seat Sofa')
  assert.deepEqual(['Width', 'Depth', 'Height', 'Seat height'].map((name) => specOf(sofa, name)), ['84 in', '36 in', '33 in', '18 in'])
  assert.equal(specOf(byName(home, 'Linen Pendant Light'), 'Assembly'), 'Wired to a ceiling box by an electrician')
  // Each product has its own rows, so editing one leaves the others as they were.
  const fresh = build(LUMOS_BLUEPRINT.homeChannel)
  fresh.products[0]!.detail!.specs![0]!.value = '90 in'
  assert.equal(specOf(home.products[0]!, 'Width'), '84 in')
})

test('the collections are the nine reference ones; Best Sellers holds eight pieces from every room; Newest leads with the New Arrivals', () => {
  const members = (title: string) => ids(home.products.filter((p) => p.collections.includes(title)))
  assert.deepEqual(home.collections.map((c) => [c.id, c.title, c.productCount]), [
    [5901, 'Living Room', 7], [5902, 'Bedroom', 3], [5903, 'Dining', 3], [5904, 'Office', 3], [5905, 'Outdoor', 3],
    [5906, 'Lighting & Decor', 5], [5907, 'New Arrivals', 5], [5908, 'Best Sellers', 8], [5909, 'Sale', 2],
  ])
  assert.deepEqual(home.collections.map((c) => c.title), [...LUMOS_COLLECTION_NAMES])
  assert.deepEqual(members('Living Room'), [5001, 5002, 5003, 5004, 5006, 5011, 5014])
  assert.deepEqual(members('Bedroom'), [5007, 5008, 5016])
  assert.deepEqual(members('Dining'), [5009, 5017, 5018])
  assert.deepEqual(members('Office'), [5019, 5010, 5011])
  assert.deepEqual(members('Outdoor'), [5012, 5013, 5020])
  assert.deepEqual(members('Lighting & Decor'), [5005, 5006, 5018, 5020, 5015])
  assert.deepEqual(members('New Arrivals'), [5016, 5017, 5018, 5019, 5020])
  assert.deepEqual(members('Best Sellers'), [5001, 5003, 5005, 5007, 5009, 5018, 5010, 5012])
  assert.deepEqual(members('Sale'), [5014, 5015])
  // Sorted by Newest (the highest id first), every list leads with its New Arrivals.
  const newest = sortProducts(home.products, 'newest')
  assert.deepEqual(ids(newest.slice(0, 5)).sort(), members('New Arrivals').sort())
  assert.deepEqual(ids(sortProducts(home.products.filter((p) => p.collections.includes('Dining')), 'newest')), [5018, 5017, 5009])
  for (const c of home.collections) {
    assert.equal(c.productCount, members(c.title).length, c.title)
    assert.ok(c.description, c.title)
  }
  // The breadcrumb is the first collection a piece names.
  for (const p of home.products) assert.equal(p.detail!.collection, p.collections[0], p.name)
})

test('COZY20 takes 20% off the living room, sale pieces included as its message says: an Arlo sofa in Oat comes to $1,039.20, and a lamp keeps its price', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  const campaign = findByCode(home.campaigns, LUMOS_CHANNEL_ID, 'cozy20')
  assert.equal(campaign?.name, 'Winter home event')
  assert.equal(campaign!.offer!.message, 'Winter home event: 20% off the living room, sale pieces included, with code COZY20')
  assert.equal(campaignStatus(campaign!, now), 'Active')
  assert.deepEqual([campaign!.startDate, campaign!.startTime], [TODAY, '00:00'], 'running from the day the store is opened')
  const line = (name: string, choice: Record<string, string> = {}) => {
    const product = byName(home, name)
    const variant = Object.keys(choice).length ? variantFor(product, choice)! : variantsOf(product)[0]!
    return { price: variant.price, qty: 1, collections: product.collections }
  }
  const total = (lines: ReturnType<typeof line>[]) => {
    const subtotal = lines.reduce((sum, l) => sum + Math.round(Number(l.price) * 100) * l.qty, 0)
    return formatStorePrice(money(subtotal - (discountFor(lines, campaign, 'USD')?.amount.amount ?? 0), 'USD'))
  }
  const sofa = line('Arlo 3-Seat Sofa', { Fabric: 'Oat' })
  assert.equal(formatStorePrice(discountFor([sofa], campaign, 'USD')!.amount), '$259.80')
  assert.equal(total([sofa]), '$1,039.20')
  assert.equal(total([sofa, line('Orbit Floor Lamp', { Finish: 'Brass' })]), '$1,228.20')
  // Every piece COZY20 covers: the Living Room, the side table on sale included.
  assert.deepEqual(ids(home.products.filter((p) => p.collections.some((c) => campaign!.targets.includes(c)))), [5001, 5002, 5003, 5004, 5006, 5011, 5014])
  assert.equal(total([line('Stone Side Table')]), '$175.20')
})

test('one campaign runs, one has ended and one is to come', () => {
  const now = new Date(`${TODAY}T12:00:00`)
  assert.deepEqual(home.campaigns.map((c) => [c.name, c.offer?.code, c.targets, campaignStatus(c, now)]), [
    ['Winter home event', 'COZY20', ['Living Room'], 'Active'],
    ['Bedroom refresh', 'REST15', ['Bedroom'], 'Ended'],
    ['Home office refresh', 'OFFICE15', ['Office'], 'Scheduled'],
  ])
  assert.deepEqual(home.campaigns.map((c) => [c.startDate, c.endDate]), [['2026-11-19', '2026-12-09'], ['2026-10-05', '2026-10-12'], ['2026-12-24', '2027-01-06']])
  for (const c of home.campaigns) assert.ok(LUMOS_COLLECTION_NAMES.includes(c.targets[0] as never), c.name)
})

test('the search rules change what a search finds, as the catalogue tables say', () => {
  const rules = { synonyms: home.merchandising.synonyms, redirects: home.merchandising.redirects, pins: home.merchandising.searchPins, hiddenProductIds: [] }
  const none = { synonyms: [], redirects: [], pins: [], hiddenProductIds: [] }
  const found = (query: string, withRules = true) => ids(searchStore(query, home.products, withRules ? rules : none).products)
  assert.deepEqual(found('couch', false), [])
  assert.deepEqual(found('couch'), [5001, 5012, 5002, 5003])
  // Lamp, floor lamp, pendant light and lantern are the store's lights, whichever a shopper types; no rug or vase.
  assert.deepEqual(found('desk lamp', false), [])
  assert.deepEqual(found('desk lamp'), [5018, 5005, 5020])
  assert.deepEqual(found('lamp', false), [5005])
  assert.deepEqual(found('lamp'), [5005, 5018, 5020])
  assert.deepEqual(found('lantern'), [5020, 5018, 5005])
  assert.deepEqual(found('bedside table', false), [])
  assert.deepEqual(found('bedside table'), [5008])
  assert.deepEqual(found('bookcase', false), [])
  assert.deepEqual(found('bookcase'), [5011])
  assert.deepEqual(found('patio', false), [])
  assert.deepEqual(found('patio'), [5012, 5013, 5020])
  // The pins put the best sellers first.
  assert.deepEqual(found('table', false), [5003, 5009, 5014, 5013, 5018])
  assert.deepEqual(found('table'), [5009, 5003, 5014, 5013, 5018])
  assert.deepEqual(found('chair', false), [5002, 5017, 5010, 5009])
  assert.deepEqual(found('chair'), [5010, 5002, 5017, 5009])
  const store = 'https://2000290-15.uat.maropost.store'
  assert.equal(searchStore('delivery', home.products, rules).redirectTo, `${store}/page/delivery-and-returns`)
  assert.equal(searchStore('shipping', home.products, rules).redirectTo, `${store}/page/delivery-and-returns`)
  assert.equal(searchStore('returns', home.products, rules).redirectTo, `${store}/policies/refund-policy`)
  assert.equal(searchStore('care guide', home.products, rules).redirectTo, `${store}/page/care-guide`)
})

test('"Complete the room" puts a piece beside the others of its room', () => {
  const engine = home.merchandising.engines.find((e) => e.status === 'active')!
  assert.equal(engine.name, 'Complete the room')
  assert.deepEqual(home.merchandising.engines.map((e) => [e.name, e.type, e.status]), [
    ['Complete the room', 'frequently_purchased_together', 'active'],
    ['New arrivals', 'newest_products', 'inactive'],
  ])
  // As the product page asks it.
  const row = (name: string) => {
    const product = byName(home, name)
    return ids(recommendFor(product, forSameAudience(home.products, product), { ...engine, type: engine.type as 'frequently_purchased_together' }).slice(0, 4))
  }
  assert.deepEqual(row('Arlo 3-Seat Sofa'), [5003, 5002, 5004, 5006])
  assert.deepEqual(row('Haven Bed Frame').slice(0, 2), [5008, 5016])
  assert.deepEqual(row('Fold Dining Table').slice(0, 2), [5018, 5017])
  assert.deepEqual(row('Cove Outdoor Sofa').slice(0, 2), [5013, 5020])
  assert.deepEqual(row('Ergo Task Chair').slice(0, 2), [5019, 5011])
})

test('the brand strip and the filters agree: each logo opens the shop filtered to its maker', () => {
  const strip = section(home, 'lumos-home-brands')
  assert.deepEqual(strip.blocks!.map((b) => [b.kind, b.settings.name, b.settings.image, b.settings.link]), LUMOS_BRANDS.map((brand) => ['logo', brand, brandLogo(brand), brandLink(brand)]))
  assert.equal(brandLink('Morrow & Pine'), '/collections/all?brand=morrow-pine')
  assert.equal(brandLogo('Brightwell Studio'), '/storefront/lumos/brand-brightwell-studio.svg')
  for (const brand of LUMOS_BRANDS) {
    const query = Object.fromEntries(new URLSearchParams(brandLink(brand).split('?')[1]))
    const listed = listProducts(home.products, parseListingQuery(query))
    assert.ok(listed.length >= 2, brand)
    assert.ok(listed.every((p) => p.detail!.brand === brand), `${brand}: only its own pieces`)
  }
})

test('the store is a USD web store with free delivery, no Click & collect, and copy that says what the checkout does', () => {
  const channel = LUMOS_BLUEPRINT.homeChannel
  assert.deepEqual([channel.id, channel.name, channel.storeNumber, channel.webStore?.domain], ['lumos-demo', 'Lumos Home (demo)', 15, '2000290-15.uat.maropost.store'])
  assert.deepEqual(channel.webStore?.blueprint, { original: 'lumos', slot: 5 })
  assert.equal(channel.webStore?.currency, 'USD')
  assert.equal(channel.webStore?.locale, undefined)
  assert.equal(channel.webStore?.merchandiseConnected, true)
  assert.equal(channel.webStore?.demo, true)
  assert.equal(LUMOS_BLUEPRINT.seedVersion, 1)
  assert.deepEqual(home.checkout, { ...checkoutProfile('USD'), keepsAddress: true, pickup: false })
  assert.deepEqual([home.plans, home.sizeCharts], [[], []])
  // Where the pages and the chatbot say the store delivers is where the checkout delivers.
  const delivery = home.content.find((e) => e.handle === 'delivery-and-returns')!.body
  const whereWeDeliver = home.chatbot.config.knowledgeSources!.flatMap((s) => s.entries ?? []).find((e) => e.title === 'Where we deliver')!.text
  for (const country of home.checkout.countries) {
    assert.ok(delivery.includes(country), `the delivery page names ${country}`)
    assert.ok(whereWeDeliver.includes(country), `the chatbot names ${country}`)
  }
  const copyText = JSON.stringify([home.content, home.chatbot, home.chrome, home.theme.templates, home.campaigns, history])
  assert.equal(copyText.match(/click (&|and) collect|collect (it )?(in|from)|pick ?up|in-store/i)?.[0], undefined, 'nothing offers collection')
  assert.equal(copyText.match(/\b\d+ to \d+ business days/g)?.find((days) => days !== '3 to 5 business days'), undefined, 'every delivery time is 3 to 5 business days')
  assert.ok(copyText.includes('3 to 5 business days'))
  assert.equal(copyText.match(/orders? over \$|white.glove|same.day|express|next.day/i)?.[0], undefined, 'nothing else about delivery')
  assert.equal(copyText.match(/\b(14|60|90) days\b/)?.[0], undefined, 'returns are 30 days everywhere')
  assert.equal(home.theme.templates.home[0]!.settings.text, 'Free delivery on every order · 30-day returns')
})

test('the theme is Lumos: the style guide’s indigo, Inter at 500 in uppercase, square-ish buttons and soft white cards', () => {
  assert.deepEqual(home.theme.styles, {
    brandColor: '#495da7', accentColor: '#495da7', background: '#ffffff', textColor: '#272727',
    headingFont: 'Inter', bodyFont: 'Inter', cornerRadius: 4, buttonStyle: 'solid',
    saleBadgeColor: '#d4183d', customBadgeColor: '#495da7', soldOutBadgeColor: '#272727', drawing: 'sections',
    buttonColor: '#495da7', surfaceColor: '#f9fafb', mutedColor: '#6d6d6d', dividerColor: '#e8e8e8', headingCase: 'Uppercase',
    headingWeight: 500, cardColor: '#ffffff', cardRadius: 8, cardShadow: 'Soft', buttonBorderColor: '#495da7',
    buttonHoverColor: '#394a8a', buttonCase: 'Uppercase', tintColor: '#f4f7ff', measure: 1328, gutter: 56,
    heroTitleSize: 64, sectionTitleSize: 32, controlBorderColor: '#949494',
  })
  assert.ok(themeFonts.includes(home.theme.styles.headingFont))
  assert.deepEqual([home.theme.id, home.theme.name, home.theme.version], ['theme-lumos', 'Lumos', '1.1.9'])
  assert.deepEqual(LUMOS_BLUEPRINT.card, {
    name: 'Lumos', version: '1.1.9', kind: 'Furniture and home', description: LUMOS_BLUEPRINT.card.description, thumbnail: '/storefront/lumos/theme.jpg',
  })
  assert.equal(LUMOS_BLUEPRINT.admin.themeName, 'Lumos 1.1.9')
})

test('the theme’s colour pairs pass WCAG 2.1 AA for text, and a field’s edge is 3:1', () => {
  const s = home.theme.styles
  const ratio = (a: string, b: string) => contrastRatio(a, b)!
  const pairs: [string, string, string][] = [
    ['text on the page', s.textColor, s.background],
    ['text on the surface', s.textColor, s.surfaceColor!],
    ['text on a card', s.textColor, s.cardColor!],
    ['muted text on the page', s.mutedColor!, s.background],
    ['muted text on the surface', s.mutedColor!, s.surfaceColor!],
    ['muted text on the tint', s.mutedColor!, s.tintColor!],
    ['button text on the indigo', onBrandColor(s.buttonColor!)!, s.buttonColor!],
    ['button text on its hover', onBrandColor(s.buttonHoverColor!)!, s.buttonHoverColor!],
    ['the indigo as text on the page', s.accentColor, s.background],
    ['the indigo as text on the tint', s.accentColor, s.tintColor!],
    ['sale badge', onBrandColor(s.saleBadgeColor)!, s.saleBadgeColor],
    ['sale price on a card', s.saleBadgeColor, s.cardColor!],
    ['new badge', onBrandColor(s.customBadgeColor)!, s.customBadgeColor],
    ['sold-out badge', onBrandColor(s.soldOutBadgeColor)!, s.soldOutBadgeColor],
  ]
  for (const [name, fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${name}: ${ratio(fg, bg).toFixed(2)}:1`)
  // Form fields (checkout, cart, search, newsletter) sit on the page or on a card: their edge is 3:1 (1.4.11).
  for (const bg of [s.background, s.cardColor!]) assert.ok(ratio(s.controlBorderColor!, bg) >= 3, `field edge on ${bg}: ${ratio(s.controlBorderColor!, bg).toFixed(2)}:1`)
  // The hairlines stay the paler divider, which is not a field's edge.
  assert.notEqual(s.controlBorderColor, s.dividerColor)
  assert.equal(onBrandColor(s.buttonColor!), '#ffffff')
  assert.equal(onBrandColor(s.saleBadgeColor), '#ffffff')
  // The chat's brand colour is the theme's indigo.
  assert.equal(home.chatbot.config.primaryColor, s.accentColor)
})

test('the templates are the ones the Lumos theme names, with its hero, room carousel, brand strip and boxed cards', () => {
  const t = home.theme.templates
  const kinds = (template: keyof typeof t) => t[template].map((s) => s.kind)
  assert.deepEqual(kinds('home'), ['announcement-bar', 'header', 'image-banner', 'collection-grid', 'logo-strip', 'featured-products', 'icon-row', 'footer'])
  assert.deepEqual(kinds('product'), ['header', 'product-detail', 'featured-products', 'footer'])
  assert.deepEqual(kinds('collection'), ['header', 'collection-grid', 'footer'])
  assert.deepEqual(kinds('cart'), ['header', 'cart-summary', 'footer'])
  const settings = (id: string, keys: string[]) => keys.map((key) => section(home, `lumos-${id}`).settings[key])
  for (const s of [...t.home, ...t.product, ...t.collection, ...t.cart]) {
    if (s.kind === 'header') assert.deepEqual([s.settings.menuStyle, s.settings.sticky, s.settings.colorScheme], ['Inline', true, 'Light'], s.id)
    if (s.kind === 'footer') assert.deepEqual([s.settings.columns, s.settings.colorScheme, s.settings.showSocial], [4, 'Light', false], s.id)
  }

  assert.deepEqual(settings('home-hero', ['badge', 'headline', 'accentWords', 'height', 'contentPosition', 'image']), [
    'New arrivals', 'Discover your perfect place', 'perfect place', 'Large', 'Center left', '/storefront/lumos/hero-living.jpg',
  ])
  assert.ok(section(home, 'lumos-home-hero').settings.subheadline)
  assert.deepEqual(section(home, 'lumos-home-hero').blocks!.map((b) => (b.kind === 'stat' ? [b.kind, b.settings.value, b.settings.label] : [b.kind, b.settings.label, b.settings.link])), [
    ['button', 'Shop new arrivals', '/collections/new-arrivals'],
    ['button', 'Browse rooms', '/collections/all'],
    ['stat', '12K+', 'Homes furnished'],
    ['stat', '4.8/5', 'Customer rating'],
    ['stat', '5-year', 'Frame warranty'],
  ])

  assert.deepEqual(settings('home-rooms', ['title', 'accentWords', 'layout', 'tileStyle', 'background']), ['Shop by room', 'room', 'Carousel', 'Label over photo', 'Tint'])
  const rooms = section(home, 'lumos-home-rooms').blocks!
  assert.deepEqual(rooms.map((b) => [b.kind, b.settings.link, b.settings.image]), [
    ['collection', '/collections/living-room', '/storefront/lumos/room-living.jpg'],
    ['collection', '/collections/bedroom', '/storefront/lumos/room-bedroom.jpg'],
    ['collection', '/collections/dining', '/storefront/lumos/room-dining.jpg'],
    ['collection', '/collections/office', '/storefront/lumos/room-office.jpg'],
    ['collection', '/collections/outdoor', '/storefront/lumos/room-outdoor.jpg'],
  ])
  for (const b of rooms) assert.ok(String(b.settings.label).toLowerCase().includes(String(b.settings.accent).toLowerCase()), `${b.settings.label}: its accent words are in it`)

  assert.deepEqual(settings('home-brands', ['eyebrow', 'title', 'background']), ['', 'Brands we carry', 'Tint'])
  assert.deepEqual(settings('home-featured', ['eyebrow', 'title', 'collection', 'layout', 'productCount']), ['Recommendations', 'Featured products', 'best-sellers', 'Carousel', 8])
  assert.deepEqual(settings('home-why', ['eyebrow', 'title', 'alignment', 'tileStyle']), ['Why choose us', 'The Lumos difference', 'Center', 'Card'])
  assert.ok(section(home, 'lumos-home-why').settings.subtitle)
  assert.deepEqual(section(home, 'lumos-home-why').blocks!.map((b) => [b.kind, b.settings.icon, b.settings.title]), [
    ['feature', 'award', 'Built to last'], ['feature', 'truck', 'Free delivery'], ['feature', 'headphones', 'Design help'], ['feature', 'shield-check', '30-day returns'],
  ])

  const detail = section(home, 'lumos-product-detail')
  assert.deepEqual([detail.settings.galleryLayout, detail.settings.imageRatio, detail.settings.sizeGuide, detail.settings.fitment], ['Thumbnails', 'Square', false, false])
  assert.deepEqual(detail.blocks!.map((b) => [b.kind, b.settings.title, b.settings.source, b.settings.open]), [
    ['collapsible-row', 'Description', 'description', true],
    ['collapsible-row', 'Dimensions and materials', 'specs', false],
    ['collapsible-row', 'Warranty', 'warranty', false],
    ['collapsible-row', 'Delivery and returns', 'delivery-returns', false],
  ])
  assert.equal(section(home, 'lumos-product-related').settings.title, 'You may also like')
  const grid = section(home, 'lumos-collection-grid').settings
  assert.deepEqual([grid.filters, grid.sort, grid.quickAdd, grid.cardStyle, grid.columns], [true, true, true, 'Boxed', 3])
  // The filter groups, in order: no Size group mixing rug, bed and table sizes.
  assert.equal(grid.facets, 'category,color,brand,price')
})

test('the header and footer: the Lumos wordmark, a search field, the rooms, a newsletter column and the legal links', () => {
  const c = home.chrome
  // Typed as a name (the tab title and the logo link read it); the theme's heading case draws it in capitals.
  assert.equal(c.wordmark, 'Lumos')
  assert.equal(home.theme.styles.headingCase, 'Uppercase')
  assert.deepEqual(c.headerTools, ['search', 'account', 'wishlist'])
  assert.equal(c.headerSearch, 'field')
  assert.equal(c.searchPlaceholder, 'Search furniture and decor')
  assert.deepEqual(c.nav.map((l) => [l.label, l.href]), [
    ['Living Room', '/collections/living-room'], ['Bedroom', '/collections/bedroom'], ['Dining', '/collections/dining'],
    ['Office', '/collections/office'], ['Outdoor', '/collections/outdoor'], ['Sale', '/collections/sale'],
  ])
  assert.deepEqual(c.footerColumns.map((col) => col.heading.label), ['Shop', 'Help'])
  assert.equal(c.newsletterColumn, true)
  assert.equal(c.newsletter?.heading, 'Ideas for every room, once a month')
  assert.equal(c.tagline, 'Furniture made to live with')
  assert.deepEqual(c.bottomLinks!.map((l) => [l.label, l.href]), [
    ['Privacy policy', '/policies/privacy-policy'], ['Terms of service', '/policies/terms-of-service'], ['Accessibility', '/page/accessibility'],
  ])
  assert.equal(c.copyright, '© 2026 Lumos Home (demo store)')
  // Every collection is one menu or another away.
  const linked = new Set([...c.nav, ...c.mobileNav, ...c.footerColumns.flatMap((col) => col.items)].map((l) => l.href))
  for (const title of LUMOS_COLLECTION_NAMES) assert.ok(linked.has(`/collections/${toHandle(title)}`), title)
  assert.deepEqual(home.content.map((e) => `${e.kind}:${e.handle}`), [
    'page:about', 'page:delivery-and-returns', 'page:care-guide', 'page:faq', 'page:contact', 'page:accessibility',
    'policy:refund-policy', 'policy:privacy-policy', 'policy:terms-of-service',
  ])
})

test('the chatbot answers on the home profile, knows what the pages say, and the store has three earlier chats', () => {
  assert.equal(home.chatbot.assistantProfile, 'home')
  const config = home.chatbot.config
  assert.equal(config.welcomeMessage, 'Hi! Ask me about sizes, materials, delivery or your order.')
  assert.deepEqual([config.storeName, config.storeType, config.brandName, config.position], ['Lumos Home', 'Home & Living', 'Lumos assistant', 'right'])
  assert.ok(config.quickPrompts!.length >= 4)
  const entries = config.knowledgeSources!.flatMap((s) => s.entries ?? [])
  for (const source of config.knowledgeSources!) assert.equal(source.items, source.entries!.length, source.name)
  const pages = new Map(home.content.map((e) => [`/${e.kind === 'page' ? 'page' : 'policies'}/${e.handle}`, e.body]))
  for (const entry of entries) assert.ok(pages.has(entry.url!), `${entry.title} → ${entry.url}`)
  assert.deepEqual(history.subscriptions, [])
  assert.deepEqual(history.conversations.map((c) => c.topic), ['Dimensions', 'Delivery', 'Care'])
  // What a chat says about a piece is what its page says.
  const said = history.conversations.flatMap((c) => c.messages.map((m) => m.text)).join(' ')
  const sofa = byName(home, 'Arlo 3-Seat Sofa')
  for (const name of ['Width', 'Depth', 'Height', 'Seat height']) assert.ok(said.includes(specOf(sofa, name)!), name)
  assert.ok(said.includes(`comes in ${sofa.detail!.options[0]!.values.join(', ').replace(/, (?=[^,]*$)/, ' and ')}.`))
  assert.ok(said.includes(specOf(byName(home, 'Mesa Coffee Table'), 'Care')!))
})

// ── What only a furniture store needs ───────────────────────────────────────

/** Every string in a value, with where it is. */
function* stringsOf(value: unknown, path = ''): Generator<[string, string]> {
  if (typeof value === 'string') yield [path, value]
  else if (Array.isArray(value)) for (const [i, item] of value.entries()) yield* stringsOf(item, `${path}[${i}]`)
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) yield* stringsOf(item, path ? `${path}.${key}` : key)
}

test('every photo is one of the files the theme names, in its own folder', () => {
  const products = PRODUCT_PHOTOS.flatMap((base) => [`${base}-1.jpg`, `${base}-2.jpg`])
  const colourways = Object.values(LUMOS_COLOURWAY_PHOTOS).flatMap((byValue) => Object.values(byValue))
  const logos = ['oakmere', 'linden-row', 'morrow-pine', 'halden-works', 'cove-co', 'brightwell-studio'].map((name) => `brand-${name}.svg`)
  const rooms = ['living', 'bedroom', 'dining', 'office', 'outdoor'].map((room) => `room-${room}.jpg`)
  const expected = new Set(['hero-living.jpg', ...rooms, ...logos, ...products, ...colourways].map((file) => `${LUMOS_PHOTO_DIR}/${file}`))
  const photos = new Set([...stringsOf(home)].map(([, text]) => text).filter((text) => text.startsWith('/storefront/')))
  assert.deepEqual([...photos].sort(), [...expected].sort())
  assert.deepEqual(new Set([...stringsOf(copy)].map(([, text]) => text).filter((text) => text.startsWith('/storefront/'))), photos, 'an install shows the same photos')
})

/** The photo names of the catalogue table, in its order. */
const PRODUCT_PHOTOS = [
  'arlo-sofa', 'arlo-chair', 'mesa-table', 'halden-console', 'orbit-lamp', 'weave-rug', 'haven-bed', 'haven-nightstand', 'cloud-bedding', 'fold-table',
  'ridge-chairs', 'linen-pendant', 'ledger-desk', 'ergo-chair', 'grid-bookshelf', 'cove-sofa', 'terrace-set', 'lantern-set', 'stone-table', 'vase-trio',
]

/** The furniture makers a shopper might know (demoStores.test.ts checks every store for the other real brands). */
const FURNITURE_BRANDS = /\b(ikea|west elm|pottery barn|crate (&|and) barrel|restoration hardware|herman miller|steelcase|knoll|muuto|vitra|wayfair|cb2|la-z-boy|joybird)\b/i

test('it names no furniture maker a shopper might know', () => {
  for (const [part, value] of [['home', home], ['history', history]] as const) {
    for (const [where, text] of stringsOf(value)) assert.equal(text.match(FURNITURE_BRANDS)?.[0], undefined, `${part}: ${where}: "${text.slice(0, 80)}"`)
  }
})

test('every swatch product has a swatch per value, what it sells matches its capabilities, and its pack shot is a sofa', () => {
  for (const p of home.products) {
    for (const option of p.detail!.options) if (option.display === 'swatches') for (const value of option.values) assert.match(option.swatches![value]!, /^#[0-9a-f]{6}$/i, `${p.name} › ${value}`)
  }
  // Every swatch colour is offered by some product.
  const offered = new Set(home.products.flatMap((p) => p.detail!.options.flatMap((o) => Object.keys(o.swatches ?? {}))))
  assert.deepEqual(Object.keys(LUMOS_SWATCHES).filter((value) => !offered.has(value)), [])
  assert.deepEqual(LUMOS_BLUEPRINT.capabilities, { subscriptions: false, variantPicker: true, sizeGuide: false, vehicleFitment: false })
  assert.ok(home.products.every((p) => !p.detail!.sizeChartId && !p.detail!.fitment))
  assert.deepEqual([LUMOS_BLUEPRINT.id, LUMOS_BLUEPRINT.slot, LUMOS_BLUEPRINT.photoDir], ['lumos', 5, '/storefront/lumos'])
  assert.deepEqual([LUMOS_BLUEPRINT.admin.audienceListId, LUMOS_BLUEPRINT.admin.announcementContentId, LUMOS_BLUEPRINT.admin.timezone], [905, 9004, 'America/Los_Angeles'])
  assert.equal(LUMOS_BLUEPRINT.packShot!.shape, 'furniture')
})

test('installed in another store, the same store with that store\'s ids, channel and links', () => {
  assert.deepEqual(ids(copy.products), home.products.map((p) => p.id - 5000 + 95000))
  assert.ok(copy.products.every((p) => p.channelIds?.length === 1 && p.channelIds[0] === 'qa-store' && p.detail!.salesChannels[0] === 'QA store'))
  assert.equal(variantFor(byName(copy, 'Arlo 3-Seat Sofa'), { Fabric: 'Moss' })!.id, 9500103)
  assert.equal(variantFor(byName(copy, 'Arlo 3-Seat Sofa'), { Fabric: 'Moss' })!.sku, 'LM-SEA-1013')
  assert.deepEqual(copy.merchandising.searchPins.map((p) => p.pinnedProductIds), [['95009'], ['95010']])
  assert.equal(copy.merchandising.redirects[0]!.leadsTo, 'https://qa-store.example/page/delivery-and-returns')
  assert.ok(copy.merchandising.synonyms.every((s) => s.id.startsWith('qa-store--lumos-') && s.channelId === 'qa-store'))
  assert.deepEqual(copy.collections.map((c) => c.id), [95901, 95902, 95903, 95904, 95905, 95906, 95907, 95908, 95909])
  assert.equal(copy.theme.id, 'theme-qa-store--lumos')
  assert.ok(section(copy, 'qa-store--lumos-home-hero'))
  assert.ok(copy.campaigns.every((c) => c.channelId === 'qa-store' && c.id.includes('qa-store--lumos')))
  const text = JSON.stringify(copy)
  assert.ok(!text.includes('lumos-demo') && !text.includes('2000290-15'), 'nothing of the home store is left')
  assert.deepEqual(
    copy.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory, p.detail!.specs, p.detail!.warranty, p.imageUrls]),
    home.products.map((p) => [p.name, p.price, p.compareAtPrice, p.inventory, p.detail!.specs, p.detail!.warranty, p.imageUrls]),
  )
})
