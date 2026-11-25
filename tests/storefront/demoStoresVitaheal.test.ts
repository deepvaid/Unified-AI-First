import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { VITAHEAL_BLUEPRINT } from '../../src/storefront/demoStores/vitaheal.ts'
import { contextFor, historyFor, INSTALL_ID_FLOOR } from '../../src/storefront/demoStores/install.ts'
import { VITAHEAL_THEME_TEMPLATES } from '../../src/storefront/vitahealDemo.ts'
import { productHandle } from '../../src/storefront/handles.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'
import type { StoreSnapshot } from '../../src/storefront/demoStores/types.ts'

// fixtures/vitaheal-seed.json is the Vitaheal seed as the stores built it before the
// registry existed (vitahealDemo.ts, the theme record from useStoreThemes and the
// collections from useProductExtras), for the fixed date in its `today`. The
// blueprint on its home channel must be exactly that, so nothing a visitor or a
// merchant sees changed. Recapture it only for a deliberate seed change.
//
// Recaptured once, on 2026-11-24 (feedback round): Vitaheal was given the health-store
// features on purpose. Its products gained their facts (`detail.specs`), its header a
// mega menu, its pages the subscription terms, its theme a promises strip and the
// product page's rows and Purchase options block, and its collections a description.
// Plans, campaigns, search rules, the chatbot, the channel and the styles are as captured.
//
// Recaptured a second time, on 2026-11-25 (second feedback round): Vitaheal moved to the
// Lumos look on the sections drawing. Only `themeStyles`, `theme` and `chrome` changed, and
// `admin` for the theme's name ('Vitaheal 2.0'); `menus` was recaptured and came out the
// same. A one-off script built the blueprint at the fixture's `today` and checked that
// every other key (products, plans, campaigns, merchandising, chatbot, content,
// subscriptions and the rest) was byte-identical before it wrote anything.

const fixture = JSON.parse(readFileSync(new URL('./fixtures/vitaheal-seed.json', import.meta.url), 'utf8'))
/** As stored: JSON drops undefined fields, as the fixture did. */
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const blueprint = VITAHEAL_BLUEPRINT
const homeCtx = contextFor(blueprint, blueprint.homeChannel, fixture.today)
const home = json(blueprint.build(homeCtx))

test('on its home channel the build is the Vitaheal seed, field by field', () => {
  assert.equal(homeCtx.home, true)
  assert.deepEqual(home.products, fixture.products)
  assert.deepEqual(home.chrome, fixture.chrome)
  assert.deepEqual(home.menus, fixture.menus)
  assert.deepEqual(home.content, fixture.content)
  assert.deepEqual(home.blogSeo, fixture.blogSeo)
  assert.deepEqual(home.plans, fixture.plans)
  assert.deepEqual(home.campaigns, fixture.campaigns)
  assert.deepEqual(home.merchandising, fixture.merchandising)
  assert.deepEqual(home.chatbot, { config: fixture.chatbot, assistantProfile: 'wellness' })
  assert.deepEqual(home.sizeCharts, [])
})

test('the theme is the record useStoreThemes seeded, with the same section ids and links', () => {
  const t = home.theme
  const record = { id: t.id, channelId: homeCtx.channelId, name: t.name, status: 'Published', publishedAt: t.publishedAt, updatedAt: t.publishedAt, styles: t.styles, templates: t.templates }
  assert.deepEqual(record, fixture.theme)
  assert.deepEqual(t.styles, fixture.themeStyles)
  assert.deepEqual(json(VITAHEAL_THEME_TEMPLATES), fixture.theme.templates)
  assert.equal(t.version, '2.0')
})

test('the collections keep their admin ids (23-27), titles, counts and date', () => {
  assert.deepEqual(home.collections.map(({ title, productCount }) => ({ title, productCount })), fixture.collections)
  assert.deepEqual(
    home.collections.map((c) => [c.id, c.title, c.productCount, c.updatedAt]),
    fixture.collectionRecords.map((c: { id: number; title: string; productCount: number; updatedAt: string }) => [c.id, c.title, c.productCount, c.updatedAt]),
  )
})

test('the home channel is the seeded one plus where it came from, and its market is its own', () => {
  const { blueprint: ref, ...webStore } = blueprint.homeChannel.webStore!
  assert.deepEqual(ref, { original: 'vitaheal', slot: 2 })
  assert.deepEqual(json({ ...blueprint.homeChannel, webStore }), fixture.channel)
  assert.deepEqual(home.market, { currency: fixture.channel.webStore.currency, locale: fixture.channel.webStore.locale })
  assert.equal(home.checkout.shopper.country, 'Sweden')
  assert.equal(blueprint.photoDir, fixture.photoDir)
  const { revenue, themeName, business } = blueprint.admin
  assert.deepEqual(json({ revenue, themeName, business }), fixture.admin)
})

test('its history is the seeded subscribers and chats, for its home channel only', () => {
  const history = json(historyFor(homeCtx.channelId, fixture.today)!)
  assert.deepEqual(history.subscriptions, fixture.subscriptions)
  assert.deepEqual(history.conversations, fixture.conversations)
  assert.equal(historyFor('neelam-store', fixture.today), undefined)
})

// ── Installed on another store ───────────────────────────────────────────────

const other: SalesChannel = {
  id: 'test-garage', accountId: '2000290', name: 'Test Garage', type: 'web_store', provider: 'maropost_store_builder',
  status: 'connected', health: 'healthy', connectedClouds: ['commerce', 'store_builder'],
  createdAt: '2026-11-19T09:00:00Z', updatedAt: '2026-11-19T09:00:00Z', lastActivityAt: '2026-11-19T09:00:00Z',
  webStore: { domain: 'test-garage.example', storeBuilderEnabled: true, published: true, merchandiseConnected: false, blueprint: { original: null, slot: 5 } },
}
const ctx = contextFor(blueprint, other, fixture.today)
const copy: StoreSnapshot = json(blueprint.build(ctx))
const text = JSON.stringify(copy)

test('a copy takes the store\'s own id block: products 52001-52008, variants *100, collections 52901-', () => {
  assert.equal(ctx.home, false)
  assert.deepEqual(copy.products.map((p) => p.id), [52001, 52002, 52003, 52004, 52005, 52006, 52007, 52008])
  for (const p of copy.products) {
    assert.ok(p.id >= INSTALL_ID_FLOOR)
    p.detail!.variantsList.forEach((v, i) => assert.equal(v.id, p.id * 100 + i + 1))
  }
  assert.deepEqual(copy.collections.map((c) => c.id), [52901, 52902, 52903, 52904, 52905])
})

test('a copy belongs to the store it is installed in: channel, name, domain and string ids', () => {
  assert.equal(text.includes('vitaheal-demo'), false, 'no row names the Vitaheal channel')
  assert.equal(text.includes(blueprint.homeChannel.webStore!.domain), false, 'no link leads to the Vitaheal store')
  assert.equal(text.includes('Vitaheal (demo)'), false, 'no product names the Vitaheal channel')
  for (const p of copy.products) {
    assert.deepEqual(p.channelIds, ['test-garage'])
    assert.deepEqual(p.salesChannelNames, ['Test Garage'])
    assert.deepEqual(p.detail!.salesChannels, ['Test Garage'])
  }
  const rows = [...copy.menus, ...copy.content, ...copy.campaigns, ...copy.plans, ...Object.values(copy.merchandising).flat()]
  for (const row of rows) {
    assert.equal(row.channelId, 'test-garage')
    assert.ok(row.id.includes('test-garage--vitaheal'), `${row.id} carries the install's prefix`)
  }
  assert.equal(copy.theme.id, 'theme-test-garage--vitaheal')
  const sections = Object.values(copy.theme.templates).flat()
  for (const id of [...sections.map((s) => s.id), ...sections.flatMap((s) => s.blocks ?? []).map((b) => b.id)]) {
    assert.ok(id.startsWith('test-garage--vitaheal-'), id)
  }
  assert.ok(copy.merchandising.redirects.every((r) => r.leadsTo.startsWith('https://test-garage.example/')))
})

test('every product link, search pin and plan in a copy points at a product of the copy', () => {
  const ids = new Set(copy.products.map((p) => p.id))
  const handles = new Set(copy.products.map((p) => productHandle(p)))
  const links = [...text.matchAll(/\/products\/([a-z0-9-]+-\d+)/g)].map((m) => m[1]!)
  assert.ok(links.length >= 2, 'the theme links two products')
  for (const handle of links) assert.ok(handles.has(handle), `/products/${handle} is a product of the copy`)
  for (const pin of copy.merchandising.searchPins) for (const id of pin.pinnedProductIds) assert.ok(ids.has(Number(id)), `pin ${id}`)
  for (const plan of copy.plans) for (const id of plan.productIds) assert.ok(ids.has(id), `plan product ${id}`)
})

test('apart from ids, channel and links, a copy is the same store', () => {
  assert.deepEqual(copy.products.map((p) => [p.name, p.sku, p.price]), home.products.map((p) => [p.name, p.sku, p.price]))
  assert.deepEqual(copy.theme.styles, home.theme.styles)
  assert.deepEqual(copy.chrome, home.chrome)
  assert.deepEqual(copy.market, home.market)
  assert.deepEqual(copy.chatbot, home.chatbot)
  assert.equal(copy.plans.length, 2)
})
