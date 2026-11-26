import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import {
  VITAHEAL_BLOG_SEO, VITAHEAL_CHANNEL, VITAHEAL_CHANNEL_ID, VITAHEAL_CHROME, VITAHEAL_COLLECTIONS, VITAHEAL_CONTENT, VITAHEAL_MENUS, VITAHEAL_PHOTOS, VITAHEAL_THEME_STYLES, vitahealProducts,
} from '../../src/storefront/vitahealDemo.ts'
import { catalogFor, hasPriceRange } from '../../src/storefront/catalog.ts'

// The seed against the reference tables in docs/store-builder/bkm-build-prompt.md, section 6.

const products = vitahealProducts()
const byName = (name: string) => products.find((p) => p.name === name)!
const variantPrices = (name: string) => Object.fromEntries(byName(name).detail!.variantsList.map((v) => [v.title, Number(v.price)]))
const handle = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

test('the catalogue is the eight reference products at their US price points', () => {
  assert.equal(products.length, 8)
  assert.deepEqual(variantPrices('Vitaheal Electrolytes'), { 'Lemon & Ginger': 27.99, 'Wild Berries': 27.99, 'Starter Pack (both flavours)': 49.99 })
  assert.deepEqual(variantPrices('Unwind'), { Can: 41.99, Bag: 39.99 })
  assert.deepEqual(variantPrices('Clear Focus'), { Original: 40.99, Refill: 38.99 })
  assert.deepEqual(variantPrices('Collagen+'), { Original: 42.99, Refill: 40.99 })
  assert.deepEqual(variantPrices('Daily NAD+'), { Original: 66.99, Refill: 64.99 })
  for (const single of ['Balance', 'Balance Refill']) assert.deepEqual(Object.values(variantPrices(single)), [41.99])
  assert.deepEqual(Object.values(variantPrices('Nasal Strips')), [19.99])
})

test('the Starter Pack is the only variant with a compare-at price', () => {
  const withCompareAt = products.flatMap((p) => p.detail!.variantsList).filter((v) => v.compareAtPrice)
  assert.deepEqual(withCompareAt.map((v) => [v.title, v.compareAtPrice]), [['Starter Pack (both flavours)', '55.98']])
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
  assert.equal(byName('Unwind').price, '39.99')
  assert.equal(hasPriceRange(byName('Unwind')), true)
  assert.equal(byName('Nasal Strips').price, '19.99')
  assert.equal(hasPriceRange(byName('Nasal Strips')), false)
})

test('products belong to this store only, are published, in stock and have two pictures', () => {
  assert.equal(catalogFor(products, VITAHEAL_CHANNEL_ID).length, 8)
  assert.equal(catalogFor(products, 'neelam-store').length, 0)
  for (const p of products) {
    assert.deepEqual(p.channelIds, [VITAHEAL_CHANNEL_ID])
    assert.ok(p.inventory > 0, `${p.name} is in stock`)
    assert.equal(p.imageUrls?.length, 2)
    assert.notEqual(p.imageUrls![0], p.imageUrls![1])
    assert.equal(p.inventory, p.detail!.variantsList.reduce((n, v) => n + Object.values(v.stock).reduce((a, b) => a + b, 0), 0))
  }
})

test('collections match the reference: five on subscription', () => {
  const counts = Object.fromEntries(VITAHEAL_COLLECTIONS.map((c) => [c.title, c.productCount]))
  assert.deepEqual(Object.keys(counts), ['Subscription', 'Sport', 'Longevity', 'Sleep', 'Hydrate'])
  assert.equal(counts.Subscription, 5)
  for (const c of VITAHEAL_COLLECTIONS) assert.ok(c.productCount > 0, `${c.title} has products`)
})

test('the store is a published web store priced in US dollars', () => {
  assert.equal(VITAHEAL_CHANNEL.type, 'web_store')
  assert.equal(VITAHEAL_CHANNEL.webStore?.currency, 'USD')
  assert.equal(VITAHEAL_CHANNEL.webStore?.locale, undefined, 'dollars read "$39.99", with no locale of their own')
  assert.equal(VITAHEAL_CHANNEL.webStore?.storeBuilderEnabled, true)
})

test('the theme is the reference one: Figtree, navy on white, 8px solid buttons, its badge colours', () => {
  assert.deepEqual(
    { ...VITAHEAL_THEME_STYLES, brandColor: VITAHEAL_THEME_STYLES.brandColor.toLowerCase() },
    {
      brandColor: '#0a2240', accentColor: '#0a2240', background: '#ffffff', textColor: '#000000',
      headingFont: 'Figtree', bodyFont: 'Figtree', cornerRadius: 8, buttonStyle: 'solid',
      saleBadgeColor: '#6d52ff', customBadgeColor: '#e4ff52', soldOutBadgeColor: '#000000',
    },
  )
})

test('the content is the pages, policies and posts the store needs', () => {
  const handles = (kind: string) => VITAHEAL_CONTENT.filter((e) => e.kind === kind).map((e) => e.handle)
  assert.deepEqual(handles('page'), ['about', 'contact', 'ambassadors', 'money-back-guarantee', 'cookies'])
  assert.deepEqual(handles('policy'), ['refund-policy', 'privacy-policy', 'terms-of-service'])
  assert.equal(handles('blog').length, 3)
  for (const e of VITAHEAL_CONTENT) {
    assert.equal(e.channelId, VITAHEAL_CHANNEL_ID)
    assert.equal(e.status, 'Active')
    assert.ok(e.body.length > 80 && e.seoDescription, `${e.title} has a body and a description`)
  }
})

test('every photo the store names is a file in public/, so nothing is loaded from another site', () => {
  const photos = [...Object.values(VITAHEAL_PHOTOS), ...products.flatMap((p) => p.imageUrls!)]
  assert.equal(photos.length, 7 + 8 * 2)
  for (const photo of photos) {
    assert.match(photo, /^\/storefront\/vitaheal\/[a-z0-9-]+\.jpg$/)
    assert.ok(existsSync(new URL(`../../public${photo}`, import.meta.url)), `${photo} exists`)
  }
})

test('the store carries a fictional brand: nothing in the seed names the real one', () => {
  const seed = JSON.stringify([
    VITAHEAL_CHANNEL, VITAHEAL_CHROME, VITAHEAL_COLLECTIONS, VITAHEAL_CONTENT, VITAHEAL_MENUS, VITAHEAL_BLOG_SEO,
    products.map((p) => ({ ...p, imageUrls: p.imageUrls!.map(decodeURIComponent) })),
  ])
  const realNames = /bkm|tranquil|ultra focused|life nad|glow\+|harmonized|elderflower|swedish berries/i
  assert.equal(seed.match(realNames)?.[0], undefined)
})

test('the header offers no tool whose page does not exist yet: only the account, at its own page', () => {
  assert.deepEqual(VITAHEAL_CHROME.headerTools, ['account'])
  assert.equal(VITAHEAL_CHROME.accountHref, '/account')
})

test('every header, footer, menu and in-copy link leads somewhere', () => {
  const known = new Set<string>([
    '/', '/cart-page', '/account', '/collections/all',
    ...VITAHEAL_COLLECTIONS.map((c) => `/collections/${handle(c.title)}`),
    ...VITAHEAL_CONTENT.filter((e) => e.kind === 'page').map((e) => `/page/${e.handle}`),
    ...VITAHEAL_CONTENT.filter((e) => e.kind === 'policy').map((e) => `/policies/${e.handle}`),
  ])
  const chrome = [
    ...VITAHEAL_CHROME.nav, ...VITAHEAL_CHROME.mobileNav,
    ...VITAHEAL_CHROME.footerColumns.flatMap((c) => [c.heading, ...c.items]),
    ...(VITAHEAL_CHROME.newsletter?.consent ?? []).filter((part) => typeof part !== 'string'),
  ].map((link) => link.href)
  const menus = VITAHEAL_MENUS.flatMap((m) => m.items.map((i) => i.target))
  const inCopy = VITAHEAL_CONTENT.flatMap((e) => [...e.body.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!))
  for (const href of [...chrome, ...menus, ...inCopy]) assert.ok(known.has(href), `${href} is a real storefront path`)
})
