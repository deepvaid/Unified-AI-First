import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NO_SEARCH_RULES, findPartNumber, partNumberSearch, partNumberTarget, recommendFor, recommendationHeading, redirectPath, searchStore, synonymsFor } from '../../src/storefront/search.ts'
import type { SearchRules } from '../../src/storefront/search.ts'
import { VITAHEAL_CHANNEL, VITAHEAL_CHANNEL_ID, VITAHEAL_CONTENT, VITAHEAL_MERCHANDISING, vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

const products = vitahealProducts()
const seeded = VITAHEAL_MERCHANDISING
const rules: SearchRules = { synonyms: seeded.synonyms, redirects: seeded.redirects, pins: seeded.searchPins, hiddenProductIds: [] }
const names = (list: { name: string }[]): string[] => list.map((p) => p.name)
const byName = (name: string) => products.find((p) => p.name === name)!

test('a query finds the products that are about every word of it, the best fit first', () => {
  assert.deepEqual(names(searchStore('collagen', products, NO_SEARCH_RULES).products), ['Collagen+'])
  // A product's whole name finds it before a longer name that holds it.
  assert.deepEqual(names(searchStore('balance', products, NO_SEARCH_RULES).products).slice(0, 2), ['Balance', 'Balance Refill'])
  assert.deepEqual(names(searchStore('nasal strip', products, NO_SEARCH_RULES).products), ['Nasal Strips'])
  // A name that holds more of the words fits better: Collagen+ is about vitamin C too, but not by name.
  assert.equal(searchStore('vitamin c', products, NO_SEARCH_RULES).products[0]!.name, 'Vitamin C + Zinc')
  // The start of a word is enough, and case and spacing do not matter.
  assert.deepEqual(names(searchStore('  ELECTRO ', products, NO_SEARCH_RULES).products), ['Vitaheal Electrolytes'])
  // A collection's name finds what is in it.
  assert.deepEqual(names(searchStore('hydrate', products, NO_SEARCH_RULES).products), ['Vitaheal Electrolytes'])
})

test('the words around what a shopper means are ignored, so a sentence finds what its subject finds', () => {
  const plain = searchStore('sleep', products, rules)
  for (const sentence of ['something for sleep', 'Help me sleep', 'I need the best sleep', 'sleeps']) {
    const found = searchStore(sentence, products, rules)
    assert.deepEqual(names(found.products), names(plain.products), sentence)
    assert.deepEqual(found.pinnedIds, plain.pinnedIds, `${sentence} keeps the pin`)
  }
  assert.equal(searchStore('I am tired', products, rules).products[0]!.name, 'Clear Focus')
  // A query of nothing but such words is still searched as typed.
  assert.deepEqual(searchStore('the', products, NO_SEARCH_RULES).query, 'the')
  assert.ok(searchStore('for', products, NO_SEARCH_RULES).products.length > 0)
})

test('nothing is found for an empty query or for words no product has', () => {
  assert.deepEqual(searchStore('   ', products, rules).products, [])
  const none = searchStore('blorp', products, rules)
  assert.deepEqual(none.products, [])
  assert.equal(none.redirectTo, undefined)
  // Every word has to fit: one stray word finds nothing.
  assert.deepEqual(searchStore('collagen blorp', products, NO_SEARCH_RULES).products, [])
})

test('a pinned product leads the results, even when its own words would not find it', () => {
  const sleep = searchStore('sleep', products, rules)
  assert.equal(sleep.products[0]!.name, 'Unwind')
  assert.deepEqual(sleep.pinnedIds, [byName('Unwind').id])
  assert.ok(names(sleep.products).includes('Nasal Strips'))
  assert.equal(new Set(sleep.products).size, sleep.products.length, 'a pinned product is listed once')

  const energy = searchStore('energy', products, rules)
  assert.equal(energy.products[0]!.name, 'Vitaheal Electrolytes')
  assert.ok(!names(searchStore('energy', products, NO_SEARCH_RULES).products).includes('Vitaheal Electrolytes'))
})

test('a synonym widens the query, and what the shopper typed still counts for more', () => {
  // On its own, "tired" finds only Magnesium, whose copy says it helps reduce tiredness.
  assert.deepEqual(names(searchStore('tired', products, NO_SEARCH_RULES).products), ['Magnesium'])
  const tired = searchStore('tired', products, rules)
  assert.deepEqual(tired.alsoSearched, ['energy', 'focus'])
  assert.equal(tired.products[0]!.name, 'Clear Focus')
  assert.ok(names(tired.products).includes('Magnesium'), 'what the shopper typed still finds its own')

  assert.deepEqual(synonymsFor('jet lag', rules.synonyms), ['sleep'])
  assert.deepEqual(synonymsFor('Anti-Ageing', rules.synonyms), ['longevity'])
  // Two way: each word of the group means the others.
  assert.deepEqual(synonymsFor('rehydrate', rules.synonyms), ['hydration', 'electrolytes'])
  assert.equal(searchStore('rehydrate', products, rules).products[0]!.name, 'Vitaheal Electrolytes')
  // A synonym that is switched off adds nothing.
  assert.deepEqual(synonymsFor('tired', rules.synonyms.map((s) => ({ ...s, status: 'inactive' as const }))), [])
  // Part of a word is not the word.
  assert.deepEqual(synonymsFor('retired', rules.synonyms), [])
})

test('a redirect sends the whole query to a page, and a blacklisted product is never found', () => {
  const returns = searchStore('Returns', products, rules)
  assert.ok(returns.redirectTo?.endsWith('/policies/refund-policy'))
  assert.deepEqual(returns.products, [])
  // Only the whole query redirects.
  assert.equal(searchStore('returns on unwind', products, rules).redirectTo, undefined)

  // Not by its own words, and not by a pin either.
  const hidden: SearchRules = { ...rules, hiddenProductIds: [String(byName('Unwind').id)] }
  assert.deepEqual(names(searchStore('sleep', products, rules).products), ['Unwind', 'Nasal Strips', 'Magnesium'])
  assert.deepEqual(names(searchStore('sleep', products, hidden).products), ['Nasal Strips', 'Magnesium'])
  assert.deepEqual(searchStore('unwind', products, hidden).products, [])
})

test('results can be sorted by price instead, and then no pin leads', () => {
  const cheap = searchStore('sleep', products, rules, 'price_asc')
  const prices = cheap.products.map((p) => Number.parseFloat(p.price))
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b))
  assert.deepEqual(cheap.pinnedIds, [])
  assert.deepEqual(names(searchStore('sleep', products, rules, 'price_desc').products), names(cheap.products).reverse())
})

test('a redirect on the store’s own domain is a path in the store; anywhere else is not', () => {
  const domain = VITAHEAL_CHANNEL.webStore!.domain
  assert.equal(redirectPath(`https://${domain}/policies/refund-policy`, domain), '/policies/refund-policy')
  assert.equal(redirectPath(`https://${domain}`, domain), '/')
  assert.equal(redirectPath('/page/about-us', domain), '/page/about-us')
  assert.equal(redirectPath('https://example.com/help', domain), null)
  assert.equal(redirectPath(`https://${domain}.example.com/x`, domain), null)
})

test('the demo store’s rules each point at something that exists', () => {
  const ids = products.map((p) => String(p.id))
  for (const pin of seeded.searchPins) assert.ok(pin.pinnedProductIds.every((id) => ids.includes(id)), pin.query)
  const pages = VITAHEAL_CONTENT.map((entry) => entry.handle)
  for (const redirect of seeded.redirects) {
    const path = redirectPath(redirect.leadsTo, VITAHEAL_CHANNEL.webStore!.domain)
    assert.ok(path && pages.includes(path.split('/').pop()!), redirect.leadsTo)
  }
  for (const row of [...seeded.synonyms, ...seeded.redirects, ...seeded.searchPins, ...seeded.engines]) assert.equal(row.channelId, VITAHEAL_CHANNEL_ID)
  // Every synonym leads somewhere: the words it adds find a product.
  for (const synonym of seeded.synonyms) assert.ok(searchStore(synonym.queries[0]!, products, rules).products.length > 0, synonym.queries[0])
  assert.equal(seeded.engines.filter((e) => e.page === 'product' && e.status === 'active').length, 1)
})

test('"goes well with" puts the product that shares the smallest collection first', () => {
  const unwind = byName('Unwind')
  const row = recommendFor(unwind, products, { type: 'frequently_purchased_together', maxProducts: 4 })
  assert.equal(row.length, 4)
  assert.equal(row[0]!.name, 'Nasal Strips')
  assert.ok(!row.includes(unwind))
  assert.equal(recommendationHeading('frequently_purchased_together', 'Unwind'), 'Goes well with Unwind')
})

test('other engines follow their own order, and no row is longer than four', () => {
  const unwind = byName('Unwind')
  const newest = recommendFor(unwind, products, { type: 'newest_products', maxProducts: 10 })
  assert.deepEqual(newest.map((p) => p.id), [...products].filter((p) => p !== unwind).sort((a, b) => b.id - a.id).slice(0, 4).map((p) => p.id))
  assert.deepEqual(recommendFor(unwind, products, { type: 'popular_products', maxProducts: 2 }), products.filter((p) => p !== unwind).slice(0, 2))
})

test('a part number typed whole goes to its product, on the variant it numbers', () => {
  const variant = (id: number, title: string, sku: string) => ({ id, title, optionValues: [title], sku })
  const pads = {
    id: 4001,
    sku: 'TQ-BRK-4471',
    detail: { options: [{ name: 'Position', values: ['Front', 'Rear'] }], variantsList: [variant(1, 'Front', 'TQ-BRK-4471'), variant(2, 'Rear', 'TQ-BRK-4472')] },
  }
  const gauge = { id: 4020, sku: 'TQ-ACC-4820', detail: { options: [], variantsList: [{ id: 3, title: 'Default', sku: 'TQ-ACC-4820' }] } }
  const parts = [pads, gauge]
  assert.deepEqual(findPartNumber('TQ-BRK-4472', parts), { product: pads, variantId: 2, query: { position: 'rear' } })
  // Any case, with or without its dashes and spaces.
  for (const typed of ['tq-brk-4472', 'TQBRK4472', ' tq brk 4472 ', 'Tq-Brk 4472']) assert.equal(findPartNumber(typed, parts)?.variantId, 2, typed)
  // A product without options opens as it is.
  assert.deepEqual(findPartNumber('tq-acc-4820', parts), { product: gauge, variantId: 3, query: {} })
  // Only the whole number: part of one, or words around it, are searched as words.
  for (const typed of ['TQ-BRK', '4472', 'TQ-BRK-4472 pads', '', '  ', 'brake pads']) assert.equal(findPartNumber(typed, parts), undefined, typed)
  // A product's own number counts when no variant carries it.
  assert.equal(findPartNumber('tq-old-1', [{ id: 9, sku: 'TQ-OLD-1', detail: { options: [], variantsList: [] } }])?.product.id, 9)
})

test('a blacklisted part is not found by its number either', () => {
  const pads = { id: 4001, sku: 'TQ-BRK-4471', detail: { options: [], variantsList: [{ id: 1, title: 'Default', sku: 'TQ-BRK-4471' }] } }
  const gauge = { id: 4020, sku: 'TQ-ACC-4820', detail: { options: [], variantsList: [{ id: 3, title: 'Default', sku: 'TQ-ACC-4820' }] } }
  assert.equal(findPartNumber('TQ-BRK-4471', [pads, gauge], ['4001']), undefined)
  assert.equal(findPartNumber('TQ-ACC-4820', [pads, gauge], ['4001'])?.product.id, 4020)
  assert.equal(findPartNumber('TQ-BRK-4471', [pads, gauge], [])?.product.id, 4001)
})

test('a part-number search opens its part, unless a merchant redirect takes the same words or the part is blacklisted', () => {
  const variant = (id: number, title: string, sku: string) => ({ id, title, optionValues: [title], sku })
  const pads = {
    id: 4001,
    name: 'Ceramic Brake Pads, Truck & SUV',
    sku: 'TQ-BRK-4471',
    detail: { options: [{ name: 'Position', values: ['Front', 'Rear'] }], variantsList: [variant(1, 'Front', 'TQ-BRK-4471'), variant(2, 'Rear', 'TQ-BRK-4472')] },
  }
  const gauge = { id: 4020, name: 'Digital Tire Pressure Gauge', sku: 'TQ-ACC-9310', detail: { options: [], variantsList: [{ id: 3, title: 'Default', sku: 'TQ-ACC-9310' }] } }
  const parts = [pads, gauge]
  const none = { redirects: [], hiddenProductIds: [] }
  const rear = partNumberSearch('tqbrk4472', parts, none)!
  assert.deepEqual([rear.product.id, rear.variantId, rear.query], [4001, 2, { position: 'rear' }])
  assert.equal(partNumberTarget(rear), 'Ceramic Brake Pads, Truck & SUV (Rear)')
  assert.equal(partNumberTarget(partNumberSearch('TQ-ACC-9310', parts, none)!), 'Digital Tire Pressure Gauge')
  // The merchant's redirect for the same words wins, as on the storefront.
  assert.equal(partNumberSearch('TQ-BRK-4471', parts, { redirects: [{ queries: ['tq-brk-4471'], leadsTo: '/page/brakes' }], hiddenProductIds: [] }), undefined)
  // A blacklisted part is never opened this way.
  assert.equal(partNumberSearch('TQ-BRK-4471', parts, { redirects: [], hiddenProductIds: ['4001'] }), undefined)
  assert.equal(partNumberSearch('brake pads', parts, none), undefined)
  assert.equal(partNumberSearch('  ', parts, none), undefined)
})
