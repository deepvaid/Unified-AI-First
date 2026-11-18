import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NO_SEARCH_RULES, recommendFor, recommendationHeading, redirectPath, searchStore, synonymsFor } from '../../src/storefront/search.ts'
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
  // The start of a word is enough, and case and spacing do not matter.
  assert.deepEqual(names(searchStore('  ELECTRO ', products, NO_SEARCH_RULES).products), ['Vitaheal Electrolytes'])
  // A collection's name finds what is in it.
  assert.deepEqual(names(searchStore('hydrate', products, NO_SEARCH_RULES).products), ['Vitaheal Electrolytes'])
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
  assert.deepEqual(searchStore('tired', products, NO_SEARCH_RULES).products, [])
  const tired = searchStore('tired', products, rules)
  assert.deepEqual(tired.alsoSearched, ['energy', 'focus'])
  assert.equal(tired.products[0]!.name, 'Clear Focus')

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
  assert.deepEqual(names(searchStore('sleep', products, hidden).products), ['Nasal Strips'])
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
