// The checks every demo store must pass, run over each blueprint in DEMO_STORES,
// on its home channel and installed in another store, and over the history its
// home channel is seeded with. A store appended to the registry is checked here
// with nothing else to write: its links lead somewhere, its photos are ours and
// credited, its fonts load, its SKUs and variants are sound, it names no real
// brand (a vehicle make only in fitment rows), and what it sells matches its
// capabilities.
// Store-specific facts (prices, the reference tables) stay in its own test file.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { DEMO_STORES } from '../../src/storefront/demoStores/index.ts'
import { historyFor, snapshotFor } from '../../src/storefront/demoStores/install.ts'
import type { DemoStoreBlueprint, StoreSnapshot } from '../../src/storefront/demoStores/types.ts'
import { productHandle, toHandle } from '../../src/storefront/handles.ts'
import { themeFonts } from '../../src/storefront/themeSections.ts'
import { optionValuesOf } from '../../src/storefront/variants.ts'
import { VEHICLES } from '../../src/storefront/vehicles.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'

const TODAY = '2026-11-19'
const publicFile = (path: string) => new URL(`../../public${path}`, import.meta.url)
/** Faces every browser has: nothing to load. */
const SYSTEM_FONTS = new Set(['Georgia', 'system-ui'])
const fontImport = readFileSync(new URL('../../src/styles/global.scss', import.meta.url), 'utf8').match(/@import url\('(https:\/\/fonts\.googleapis\.com[^']+)'\)/)?.[1] ?? ''
/** Names of real brands a demo store must not carry (each store's own test also lists the brand it stands in for). */
const REAL_BRANDS = /\b(bkm|shopify|nike|adidas|uniqlo|levi'?s|patagonia|zara|everlane|carhartt|bosch|brembo|acdelco|motorcraft|mopar|denso|ngk|moog|bilstein|castrol|mobil ?1)\b/i
/**
 * The vehicle makes shoppers pick from (src/storefront/vehicles.ts), and "Chevy",
 * the nickname src/storefront/fitment.ts reads. Real brands too, so a store names
 * them only in fitment rows. Matched whatever the case, except Ram: "ram" is an
 * everyday word in parts copy ("ram air intake", "hydraulic ram"), so only "Ram"
 * or "RAM" counts, and never in "ram air" however it is written.
 */
const VEHICLE_MAKES = new RegExp(`\\b(${[...new Set(VEHICLES.map((v) => v.make)), 'Chevy'].filter((make) => make !== 'Ram').join('|')})\\b`, 'i')
function vehicleMakeIn(text: string): string | undefined {
  return text.match(VEHICLE_MAKES)?.[0] ?? text.replace(/\bram[\s-]*air\b/gi, '').match(/\b(Ram|RAM)\b/)?.[0]
}

/** The blueprint installed in a store of its own (slot 5), as Apply would. */
function installedChannel(blueprint: DemoStoreBlueprint): SalesChannel {
  const home = blueprint.homeChannel
  return { ...home, id: 'qa-store', name: 'QA store', webStore: { ...home.webStore!, domain: 'qa-store.example', blueprint: { original: null, slot: 5 } } }
}

/** Every string in a value, with where it is ("theme.templates.home[0].settings.buttonLink"). */
function* stringsOf(value: unknown, path = ''): Generator<[string, string]> {
  if (typeof value === 'string') yield [path, value]
  else if (Array.isArray(value)) for (const [i, item] of value.entries()) yield* stringsOf(item, `${path}[${i}]`)
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) yield* stringsOf(item, path ? `${path}.${key}` : key)
}

/** The storefront paths a store serves (src/router/index.ts, the storefront's children). */
function servedPaths(snapshot: StoreSnapshot): Set<string> {
  const collections = new Set([...snapshot.collections.map((c) => c.title), ...snapshot.products.flatMap((p) => p.collections)])
  return new Set([
    '/', '/cart-page', '/account', '/search', '/checkout', '/collections/all',
    ...[...collections].map((title) => `/collections/${toHandle(title)}`),
    ...snapshot.products.map((p) => `/products/${productHandle(p)}`),
    ...snapshot.content.filter((e) => e.kind === 'page').map((e) => `/page/${e.handle}`),
    ...snapshot.content.filter((e) => e.kind === 'policy').map((e) => `/policies/${e.handle}`),
  ])
}

/** Every storefront link the store writes: link fields, hrefs inside copy, and the store's URL, alone or inside copy. */
function linksOf(value: unknown, domain: string): [string, string][] {
  const links: [string, string][] = []
  const storeUrl = new RegExp(`https://${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/[^\\s"'<>()]*)?`, 'g')
  for (const [where, text] of stringsOf(value)) {
    if (where.includes('.fitment.')) continue
    if (/^\/(?!storefront\/)[a-z0-9-/]*([?#].*)?$/i.test(text)) links.push([where, text])
    for (const match of text.matchAll(/href="([^"]+)"/g)) links.push([`${where} (href)`, match[1]!])
    // A sentence may end right after the URL.
    for (const match of text.matchAll(storeUrl)) links.push([`${where} (url)`, (match[1] ?? '').replace(/[.,;:!]+$/, '')])
  }
  return links.map(([where, href]) => [where, href.replace(/[?#].*$/, '') || '/'])
}

for (const blueprint of DEMO_STORES) {
  const home = snapshotFor(blueprint.homeChannel, blueprint.id, TODAY)
  const copyChannel = installedChannel(blueprint)
  const copy = snapshotFor(copyChannel, blueprint.id, TODAY)
  const homeDomain = blueprint.homeChannel.webStore!.domain
  const installs: [string, StoreSnapshot, string][] = [
    ['home', home, homeDomain],
    ['installed', copy, copyChannel.webStore!.domain],
  ]
  // Subscribers and earlier chats: seeded on the home channel only, never cloned.
  const history = historyFor(blueprint.homeChannel.id, TODAY)

  test(`${blueprint.id}: every link leads to a page the store serves, at home, installed and in its history`, () => {
    const checks: [string, unknown, string, Set<string>][] = [
      ...installs.map(([where, snapshot, domain]): [string, unknown, string, Set<string>] => [where, snapshot, domain, servedPaths(snapshot)]),
      ['history', history, homeDomain, servedPaths(home)],
    ]
    for (const [where, value, domain, served] of checks) {
      const links = linksOf(value, domain)
      // History is chats and subscribers, which need not link anywhere.
      if (where !== 'history') assert.ok(links.length > 0, `${where}: the store links somewhere`)
      for (const [field, href] of links) {
        if (/^(https?:|mailto:|tel:)/.test(href)) continue
        assert.ok(served.has(href), `${where}: ${field} → ${href} is not a page of the store`)
      }
    }
  })

  test(`${blueprint.id}: every search pin, plan and size chart a product names is the store's own`, () => {
    for (const [where, snapshot] of installs) {
      const ids = new Set(snapshot.products.map((p) => p.id))
      for (const pin of snapshot.merchandising.searchPins) for (const id of pin.pinnedProductIds) assert.ok(ids.has(Number(id)), `${where}: pin ${id}`)
      for (const plan of snapshot.plans) for (const id of plan.productIds) assert.ok(ids.has(id), `${where}: plan ${plan.id} product ${id}`)
      const charts = new Set(snapshot.sizeCharts.map((chart) => chart.id))
      for (const p of snapshot.products) if (p.detail?.sizeChartId) assert.ok(charts.has(p.detail.sizeChartId), `${where}: ${p.name} size chart ${p.detail.sizeChartId}`)
    }
  })

  test(`${blueprint.id}: every photo is a file of its own folder in public/, credited in its CREDITS.md`, () => {
    assert.match(blueprint.photoDir, /^\/storefront\/[a-z0-9-]+$/)
    const creditsFile = publicFile(`${blueprint.photoDir}/CREDITS.md`)
    assert.ok(existsSync(creditsFile), `${blueprint.photoDir}/CREDITS.md exists`)
    const credits = readFileSync(creditsFile, 'utf8')
    const photos = new Set([...stringsOf(home)].map(([, text]) => text).filter((text) => text.startsWith('/storefront/')))
    assert.ok(photos.size > 0, 'the store has photos')
    for (const photo of photos) {
      assert.ok(photo.startsWith(`${blueprint.photoDir}/`), `${photo} is in ${blueprint.photoDir}`)
      assert.ok(existsSync(publicFile(photo)), `${photo} exists`)
      assert.ok(credits.includes(`\`${photo.slice(blueprint.photoDir.length + 1)}\``), `${photo} is credited in CREDITS.md`)
    }
  })

  test(`${blueprint.id}: its theme card names a thumbnail in its photo folder`, () => {
    assert.equal(blueprint.card.thumbnail, `${blueprint.photoDir}/theme.jpg`)
    assert.ok(blueprint.card.name && blueprint.card.version && blueprint.card.kind && blueprint.card.description)
  })

  const thumbnailMissing = !existsSync(publicFile(blueprint.card.thumbnail))
  test(`${blueprint.id}: its theme card thumbnail is a file`, { skip: thumbnailMissing && 'not captured yet: scripts/theme-thumbnails.mjs writes it in the theme library part' }, () => {
    assert.ok(existsSync(publicFile(blueprint.card.thumbnail)), `${blueprint.card.thumbnail} exists`)
  })

  test(`${blueprint.id}: its fonts are offered in the theme builder and loaded by global.scss`, () => {
    for (const font of new Set([home.theme.styles.headingFont, home.theme.styles.bodyFont])) {
      assert.ok(themeFonts.includes(font), `${font} is in themeFonts`)
      if (!SYSTEM_FONTS.has(font)) assert.ok(fontImport.includes(`family=${font.replace(/ /g, '+')}:`), `${font} is loaded by the Google Fonts import`)
    }
  })

  test(`${blueprint.id}: SKUs never repeat, and every variant is one combination of its product's options`, () => {
    const productSkus = home.products.map((p) => p.sku)
    assert.equal(new Set(productSkus).size, productSkus.length, 'product SKUs are unique')
    const variantSkus = home.products.flatMap((p) => p.detail?.variantsList.map((v) => v.sku) ?? [])
    assert.equal(new Set(variantSkus).size, variantSkus.length, 'variant SKUs are unique')
    for (const p of home.products) {
      const detail = p.detail
      if (!detail) continue
      assert.ok(detail.variantsList.length > 0, `${p.name} has a variant`)
      if (!detail.hasVariants) {
        assert.equal(detail.variantsList.length, 1, `${p.name} has one variant`)
        continue
      }
      const combos = detail.variantsList.map((v) => {
        const values = optionValuesOf(v, detail.options)
        values.forEach((value, i) => assert.ok(detail.options[i]!.values.includes(value), `${p.name} › ${v.title}: "${value}" is a ${detail.options[i]!.name}`))
        return values.join(' / ')
      })
      assert.equal(new Set(combos).size, combos.length, `${p.name}: no two variants are the same combination`)
      for (const option of detail.options) {
        for (const [value, hex] of Object.entries(option.swatches ?? {})) {
          assert.ok(option.values.includes(value), `${p.name} › ${option.name}: swatch for "${value}", which is not a value`)
          assert.match(hex, /^#[0-9a-f]{6}$/i, `${p.name} › ${option.name} › ${value}`)
        }
        if (option.display === 'swatches') for (const value of option.values) assert.ok(option.swatches?.[value], `${p.name} › ${option.name}: "${value}" has a swatch`)
      }
    }
  })

  test(`${blueprint.id}: it names no real brand, and a vehicle make only in a fitment row`, () => {
    for (const [part, value] of [['home', home], ['history', history]] as const) {
      for (const [where, text] of stringsOf(value)) {
        assert.equal(text.match(REAL_BRANDS)?.[0], undefined, `${part}: ${where}: "${text.slice(0, 80)}"`)
        if (!where.includes('.fitment.')) assert.equal(vehicleMakeIn(text), undefined, `${part}: ${where}: "${text.slice(0, 80)}"`)
      }
    }
  })

  test(`${blueprint.id}: what it sells matches its capabilities`, () => {
    const { capabilities } = blueprint
    assert.equal(home.plans.length > 0, capabilities.subscriptions, 'subscription plans only in a store that sells on them')
    if (!capabilities.subscriptions) assert.deepEqual(history?.subscriptions ?? [], [], 'subscribers only in a store that sells on subscription')
    if (capabilities.variantPicker) assert.ok(home.products.some((p) => p.detail?.options.some((o) => o.values.length > 1)), 'a variant picker means products with options to pick')
    assert.equal(home.sizeCharts.length > 0, capabilities.sizeGuide, 'size charts only in a store with a size guide')
    assert.equal(home.products.some((p) => p.detail?.sizeChartId), capabilities.sizeGuide, 'products link size charts only in a store with a size guide')
    assert.equal(home.products.some((p) => p.detail?.fitment), capabilities.vehicleFitment, 'fitment only in a store with vehicle fitment')
  })

  test(`${blueprint.id}: every fitment row names a vehicle shoppers can pick, over years it was sold`, () => {
    for (const p of home.products) {
      const fitment = p.detail?.fitment
      if (!fitment) continue
      assert.ok(fitment.universal || fitment.rows.length > 0, `${p.name}: universal, or fits some vehicle`)
      for (const row of fitment.rows) {
        const model = VEHICLES.find((v) => v.make === row.make && v.model === row.model)
        assert.ok(model, `${p.name}: ${row.make} ${row.model} is in the vehicle table`)
        assert.ok(row.yearFrom <= row.yearTo && row.yearFrom >= model.yearFrom && row.yearTo <= model.yearTo, `${p.name}: ${row.make} ${row.model} ${row.yearFrom}-${row.yearTo}`)
      }
    }
  })
}
