// The eight products added to Vitaheal after Rubbecca's second review (25 Nov 2026), ids
// 2009-2016: general supplements, and three powders sold in a can or a cheaper refill bag,
// which are the ones on the plans. A sixth goal, Immunity, lists the three immune products,
// and the home page's "Our range" shows twelve. The store as the app runs it (the collection
// page, search once connected, the reseed) is in vitahealReseed.test.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  VITAHEAL_CHANNEL_ID, VITAHEAL_COLLECTIONS, VITAHEAL_MERCHANDISING, VITAHEAL_PHOTOS, VITAHEAL_PLANS, VITAHEAL_THEME_TEMPLATES, vitahealProducts,
} from '../../src/storefront/vitahealDemo.ts'
import { DEMO_STORES } from '../../src/storefront/demoStores/index.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { hasPriceRange, isAvailable } from '../../src/storefront/catalog.ts'
import { NO_SEARCH_RULES, searchStore, synonymsFor } from '../../src/storefront/search.ts'
import type { SearchRules } from '../../src/storefront/search.ts'
import { getSectionDef } from '../../src/storefront/themeSections.ts'
import type { ThemeSection } from '../../src/storefront/themeSections.ts'
import { cheapestInitialSelection, cheapestSelection, variantFor } from '../../src/storefront/variants.ts'
import { plansForProduct } from '../../src/subscriptions/plans.ts'

const products = vitahealProducts()
const byId = (id: number) => products.find((p) => p.id === id)!
const byName = (name: string) => products.find((p) => p.name === name)!
const onPlan = (id: number) => plansForProduct(VITAHEAL_PLANS, VITAHEAL_CHANNEL_ID, id).length > 0
const names = (list: { name: string }[]) => list.map((p) => p.name)

/** The lead's table (2026-11-25): option, prices in kronor, goals. */
const REFERENCE: [id: number, name: string, option: string | null, prices: Record<string, number>, goals: string[]][] = [
  [2009, 'Plant Protein', 'Format', { Can: 399, 'Refill bag': 369 }, ['Sport', 'Subscription']],
  [2010, 'Daily Greens', 'Format', { Can: 449, 'Refill bag': 429 }, ['Longevity', 'Subscription']],
  [2011, 'Vitamin D3 + K2', null, { Default: 199 }, ['Immunity']],
  [2012, 'Omega-3', null, { Default: 329 }, ['Longevity']],
  [2013, 'Magnesium', null, { Default: 229 }, ['Sleep', 'Sport']],
  [2014, 'Creatine', 'Format', { Can: 299, 'Refill bag': 279 }, ['Sport', 'Subscription']],
  [2015, 'Vitamin C + Zinc', null, { Default: 179 }, ['Immunity']],
  [2016, 'Daily Multi', null, { Default: 249 }, ['Immunity']],
]
const POWDERS = ['Plant Protein', 'Daily Greens', 'Creatine']

test('the eight new products are 2009-2016, after Balance, at the reference prices, formats and goals', () => {
  assert.deepEqual(products.slice(8).map((p) => p.id), REFERENCE.map(([id]) => id))
  assert.equal(products[7]!.name, 'Balance')
  for (const [id, name, option, prices, goals] of REFERENCE) {
    const p = byId(id)
    assert.equal(p.name, name, String(id))
    assert.deepEqual(p.detail!.options.map((o) => [o.name, o.values]), option ? [[option, Object.keys(prices)]] : [], `${name}: its choice`)
    assert.deepEqual(Object.fromEntries(p.detail!.variantsList.map((v) => [v.title, Number(v.price)])), prices, `${name}: prices`)
    assert.deepEqual([...p.collections].sort(), [...goals].sort(), `${name}: goals`)
    assert.deepEqual(p.channelIds, [VITAHEAL_CHANNEL_ID])
    // A product's variants number from its own id, as the first eight's do (product * 10 + n).
    p.detail!.variantsList.forEach((v, i) => assert.equal(v.id, id * 10 + i + 1, `${name} variant ${i + 1}`))
  }
  // No compare-at price among them: the Starter Pack stays the only one.
  assert.ok(products.slice(8).every((p) => p.detail!.variantsList.every((v) => !v.compareAtPrice)))
})

test('the three powders are on both plans, after the first five; the capsules and tablets are bought once', () => {
  assert.deepEqual(products.slice(8).filter((p) => onPlan(p.id)).map((p) => p.name), POWDERS)
  for (const plan of VITAHEAL_PLANS) assert.deepEqual(plan.productIds, [2001, 2002, 2003, 2005, 2006, 2009, 2010, 2014], plan.name)
  assert.equal(products.filter((p) => onPlan(p.id)).length, 8)
  // The plans read the Subscription collection: on a plan exactly when it is in it.
  for (const p of products) assert.equal(onPlan(p.id), p.collections.includes('Subscription'), p.name)
})

test('the refill bag is the cheaper format, so a card reads "From" the bag\'s price and the page opens on the bag', () => {
  for (const name of POWDERS) {
    const p = byName(name)
    const [can, bag] = p.detail!.variantsList
    assert.deepEqual([can!.title, bag!.title], ['Can', 'Refill bag'], name)
    assert.ok(Number(bag!.price) < Number(can!.price), `${name}: the bag costs less`)
    // The card shows the lowest price, with "From" because the two differ.
    assert.equal(p.price, bag!.price, name)
    assert.equal(hasPriceRange(p), true, name)
    // The product page opens on the lowest-priced choice (preselectVariant): the bag.
    assert.deepEqual(cheapestSelection(p), { Format: 'Refill bag' }, name)
    assert.deepEqual(cheapestInitialSelection(p), { Format: 'Refill bag' }, name)
    assert.equal(variantFor(p, cheapestSelection(p))?.sku, bag!.sku, name)
    // A shopper who links to the can still gets the can.
    assert.deepEqual(cheapestInitialSelection(p, { format: 'can' }), { Format: 'Can' }, name)
  }
  const detail = VITAHEAL_THEME_TEMPLATES.product.find((s) => s.kind === 'product-detail')!
  assert.equal(detail.settings.preselectVariant, true)
})

test('Immunity is the sixth goal: in the collections, the Shop by goal tiles, with the three immune products', () => {
  assert.deepEqual(VITAHEAL_COLLECTIONS.at(-1), {
    title: 'Immunity', productCount: 3, description: 'Vitamins C and D and zinc, for the dark Swedish winter.',
  })
  assert.deepEqual(names(products.filter((p) => p.collections.includes('Immunity'))), ['Vitamin D3 + K2', 'Vitamin C + Zinc', 'Daily Multi'])
  const goals = VITAHEAL_THEME_TEMPLATES.home.find((s) => s.id === 'vitaheal-home-collections')!
  assert.deepEqual(goals.blocks!.find((b) => b.id === 'vitaheal-collection-immunity'), {
    id: 'vitaheal-collection-immunity', kind: 'collection', settings: { label: 'Immunity', link: '/collections/immunity', image: VITAHEAL_PHOTOS.tileImmunity },
  })
})

test('the immune synonym: "flu", "cold", "winter" and "immune" find the Immunity products', () => {
  const rules: SearchRules = { synonyms: VITAHEAL_MERCHANDISING.synonyms, redirects: VITAHEAL_MERCHANDISING.redirects, pins: VITAHEAL_MERCHANDISING.searchPins, hiddenProductIds: [] }
  const immune = VITAHEAL_MERCHANDISING.synonyms.find((s) => s.id === 'vh-syn-immune')!
  assert.deepEqual([immune.type, immune.status, immune.queries, immune.leadsTo], ['one_way', 'active', ['immune', 'cold', 'flu', 'winter'], ['immunity']])
  // Without the synonym no product says "flu"; with it, the query means immunity too.
  assert.deepEqual(searchStore('flu', products, NO_SEARCH_RULES).products, [])
  const flu = searchStore('flu', products, rules)
  assert.deepEqual(flu.alsoSearched, ['immunity'])
  assert.deepEqual(names(flu.products).sort(), ['Daily Multi', 'Vitamin C + Zinc', 'Vitamin D3 + K2'])
  for (const word of ['cold', 'winter', 'immune']) {
    assert.deepEqual(synonymsFor(word, rules.synonyms), ['immunity'], word)
    assert.deepEqual(names(searchStore(word, products, rules).products).sort(), ['Daily Multi', 'Vitamin C + Zinc', 'Vitamin D3 + K2'], word)
  }
  // One way: "immunity" does not mean "flu".
  assert.deepEqual(synonymsFor('immunity', rules.synonyms), [])
})

// ── "Our range" shows twelve ─────────────────────────────────────────────────

const productCountField = () => getSectionDef('featured-products')!.fields.find((f) => f.key === 'productCount')!
const featured = (sections: ThemeSection[]) => sections.filter((s) => s.kind === 'featured-products')

test('"Our range" asks for twelve, which the builder\'s Products slider and the storefront row both allow', () => {
  const field = productCountField()
  assert.deepEqual([field.type, field.min, field.max], ['slider', 2, 12])
  const range = VITAHEAL_THEME_TEMPLATES.home.find((s) => s.id === 'vitaheal-home-featured')!
  assert.deepEqual([range.settings.collection, range.settings.productCount, range.settings.layout], ['all', 12, 'Carousel'])
  // FeaturedProducts.vue clamps what a section asks for to the slider's top, so the two cannot drift apart unnoticed.
  const component = readFileSync(new URL('../../src/views/Storefront/sections/FeaturedProducts.vue', import.meta.url), 'utf8')
  const clamp = /Math\.min\((\d+), Math\.max\(1, num\(props\.section\.settings, 'productCount'/.exec(component)
  assert.equal(Number(clamp?.[1]), field.max, 'the row clamps at the slider\'s top')
  // The row lists the store's products in its order, those in stock: the first eight, then four of the new ones.
  const shown = products.filter((p) => isAvailable(p)).slice(0, Number(range.settings.productCount))
  assert.deepEqual(names(shown), [
    'Unwind', 'Clear Focus', 'Daily NAD+', 'Nasal Strips', 'Vitaheal Electrolytes', 'Collagen+', 'Balance Refill', 'Balance',
    'Plant Protein', 'Daily Greens', 'Vitamin D3 + K2', 'Omega-3',
  ])
})

test('every other demo store\'s featured rows still ask for eight or fewer, so the higher limit moves nothing', () => {
  for (const blueprint of DEMO_STORES.filter((b) => b.id !== 'vitaheal')) {
    const snapshot = snapshotFor(blueprint.homeChannel, blueprint.id, '2026-11-25')
    const rows = Object.values(snapshot.theme.templates).flatMap(featured)
    for (const row of rows) {
      const count = row.settings.productCount
      // A row that names no count shows the section's default (4).
      assert.ok(count === undefined || (typeof count === 'number' && count <= 8), `${blueprint.id} ${row.id}: ${String(count)}`)
    }
  }
})
