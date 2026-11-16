import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BKM_CHANNEL, BKM_CHANNEL_ID, BKM_CHROME, BKM_COLLECTIONS, BKM_CONTENT, BKM_MENUS, BKM_THEME_STYLES, bkmProducts,
} from '../../src/storefront/bkmDemo.ts'
import { catalogFor, hasPriceRange } from '../../src/storefront/catalog.ts'

// The seed against the reference tables in docs/store-builder/bkm-build-prompt.md, section 6.

const products = bkmProducts()
const byName = (name: string) => products.find((p) => p.name === name)!
const variantPrices = (name: string) => Object.fromEntries(byName(name).detail!.variantsList.map((v) => [v.title, Number(v.price)]))
const handle = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

test('the catalogue is BKM\'s eight products at their SEK prices', () => {
  assert.equal(products.length, 8)
  assert.deepEqual(variantPrices('BKM Electrolytes'), { 'Elderflower & Lime': 279, 'Swedish Berries': 279, 'Starter Pack (both flavours)': 499 })
  assert.deepEqual(variantPrices('Tranquil'), { Can: 419, Bag: 399 })
  assert.deepEqual(variantPrices('Ultra Focused'), { Original: 409, Refill: 389 })
  assert.deepEqual(variantPrices('Glow+'), { Original: 429, Refill: 409 })
  assert.deepEqual(variantPrices('Life NAD+'), { Original: 669, Refill: 649 })
  for (const single of ['Harmonized', 'Harmonized Refill']) assert.deepEqual(Object.values(variantPrices(single)), [419])
  assert.deepEqual(Object.values(variantPrices('Nasal Strips')), [199])
})

test('the Starter Pack is the only variant with a compare-at price', () => {
  const withCompareAt = products.flatMap((p) => p.detail!.variantsList).filter((v) => v.compareAtPrice)
  assert.deepEqual(withCompareAt.map((v) => [v.title, v.compareAtPrice]), [['Starter Pack (both flavours)', '558.00']])
})

test('every variant has a unique SKU and a weight', () => {
  const variants = products.flatMap((p) => p.detail!.variantsList)
  assert.equal(new Set(variants.map((v) => v.sku)).size, variants.length)
  for (const v of variants) {
    assert.ok(v.sku, `${v.title} has a SKU`)
    assert.ok(Number(v.weight) > 0, `${v.sku} has a weight`)
  }
})

test('a card shows the lowest price, with "From" only where variants differ', () => {
  assert.equal(byName('Tranquil').price, '399.00')
  assert.equal(hasPriceRange(byName('Tranquil')), true)
  assert.equal(byName('Nasal Strips').price, '199.00')
  assert.equal(hasPriceRange(byName('Nasal Strips')), false)
})

test('products belong to this store only, are published, in stock and have two pictures', () => {
  assert.equal(catalogFor(products, BKM_CHANNEL_ID).length, 8)
  assert.equal(catalogFor(products, 'neelam-store').length, 0)
  for (const p of products) {
    assert.deepEqual(p.channelIds, [BKM_CHANNEL_ID])
    assert.ok(p.inventory > 0, `${p.name} is in stock`)
    assert.equal(p.imageUrls?.length, 2)
    assert.notEqual(p.imageUrls![0], p.imageUrls![1])
    assert.equal(p.inventory, p.detail!.variantsList.reduce((n, v) => n + Object.values(v.stock).reduce((a, b) => a + b, 0), 0))
  }
})

test('collections match the reference: five on subscription', () => {
  const counts = Object.fromEntries(BKM_COLLECTIONS.map((c) => [c.title, c.productCount]))
  assert.deepEqual(Object.keys(counts), ['Subscription', 'Sport', 'Longevity', 'Sleep', 'Hydrate'])
  assert.equal(counts.Subscription, 5)
  for (const c of BKM_COLLECTIONS) assert.ok(c.productCount > 0, `${c.title} has products`)
})

test('the store is a published web store priced in SEK', () => {
  assert.equal(BKM_CHANNEL.type, 'web_store')
  assert.equal(BKM_CHANNEL.webStore?.currency, 'SEK')
  assert.equal(BKM_CHANNEL.webStore?.storeBuilderEnabled, true)
})

test('the theme is BKM\'s: Figtree, navy on white, 8px solid buttons, its badge colours', () => {
  assert.deepEqual(
    { ...BKM_THEME_STYLES, brandColor: BKM_THEME_STYLES.brandColor.toLowerCase() },
    {
      brandColor: '#0a2240', accentColor: '#0a2240', background: '#ffffff', textColor: '#000000',
      headingFont: 'Figtree', bodyFont: 'Figtree', cornerRadius: 8, buttonStyle: 'solid',
      saleBadgeColor: '#6d52ff', customBadgeColor: '#e4ff52', soldOutBadgeColor: '#000000',
    },
  )
})

test('the content is the pages, policies and posts the store needs', () => {
  const handles = (kind: string) => BKM_CONTENT.filter((e) => e.kind === kind).map((e) => e.handle)
  assert.deepEqual(handles('page'), ['about', 'contact', 'ambassadors', 'money-back-guarantee', 'cookies'])
  assert.deepEqual(handles('policy'), ['refund-policy', 'privacy-policy', 'terms-of-service'])
  assert.equal(handles('blog').length, 3)
  for (const e of BKM_CONTENT) {
    assert.equal(e.channelId, BKM_CHANNEL_ID)
    assert.equal(e.status, 'Active')
    assert.ok(e.body.length > 80 && e.seoDescription, `${e.title} has a body and a description`)
  }
})

test('every header, footer, menu and in-copy link leads somewhere', () => {
  const known = new Set<string>([
    '/', '/cart-page', '/collections/all',
    ...BKM_COLLECTIONS.map((c) => `/collections/${handle(c.title)}`),
    ...BKM_CONTENT.filter((e) => e.kind === 'page').map((e) => `/page/${e.handle}`),
    ...BKM_CONTENT.filter((e) => e.kind === 'policy').map((e) => `/policies/${e.handle}`),
  ])
  const chrome = [
    ...BKM_CHROME.nav, ...BKM_CHROME.mobileNav,
    ...BKM_CHROME.footerColumns.flatMap((c) => [c.heading, ...c.items]),
    ...(BKM_CHROME.newsletter?.consent ?? []).filter((part) => typeof part !== 'string'),
  ].map((link) => link.href)
  const menus = BKM_MENUS.flatMap((m) => m.items.map((i) => i.target))
  const inCopy = BKM_CONTENT.flatMap((e) => [...e.body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!))
  for (const href of [...chrome, ...menus, ...inCopy]) assert.ok(known.has(href), `${href} is a real storefront path`)
})
