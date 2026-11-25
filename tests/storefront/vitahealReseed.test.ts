// Vitaheal's seed version 2 (eight more products, 2026-11-25), as the app runs it. A browser
// that saved Vitaheal at seed 1 (no `installed` record, or one at version 1) is seeded again
// on its next start (useDemoStores reseedStale), so a reviewer who already opened the store
// sees all sixteen products. What that reseed keeps and drops is pinned here: it is the same
// reseed an applied theme does, without emptying the cart. A browser at seed 2 is left alone.
//
// A store made with Create sales channel from the Vitaheal theme records the seed it was made at
// (useDemoStores.create, markSeeded), so its next start does not seed it again: see
// demoStoresApp.test.ts, 'a store made from a theme comes back after a reload'.
//
// The new range on the storefront (collection page, search once connected, "Our range") is
// checked here too, with the app's own stores; the pure rules are in vitahealRange.test.ts.
// The stores import each other with '@/', so the resolve hook is registered first.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { register } from 'node:module'
import { setMaxListeners } from 'node:events'

register('../support/appImports.mjs', import.meta.url)

const memory = new Map<string, string>()
/** The tab's sessionStorage (the cart): it outlives a reload of the same tab. */
const session = new Map<string, string>()
const storage = (map: Map<string, string>) => ({
  getItem: (key: string) => map.get(key) ?? null,
  setItem: (key: string, value: string) => { map.set(key, String(value)) },
  removeItem: (key: string) => { map.delete(key) },
  key: (index: number) => [...map.keys()][index] ?? null,
  get length() { return map.size },
  clear: () => map.clear(),
})
const window = new EventTarget()
setMaxListeners(0, window)
Object.assign(globalThis, { localStorage: storage(memory), sessionStorage: storage(session), window })

const { createPinia, setActivePinia } = await import('pinia')
const { useSalesChannelsStore } = await import('@/stores/useSalesChannels')
const { useCommerceStore } = await import('@/stores/useCommerce')
const { useProductExtrasStore } = await import('@/stores/useProductExtras')
const { useStoreThemesStore } = await import('@/stores/useStoreThemes')
const { useStorefrontStore } = await import('@/stores/useStorefront')
const { useStoreContentStore } = await import('@/stores/useStoreContent')
const { useStoreNavigationStore } = await import('@/stores/useStoreNavigation')
const { useStoreCampaignsStore } = await import('@/stores/useStoreCampaigns')
const { useMerchandisingStore } = await import('@/stores/useMerchandising')
const { useChatbotStore } = await import('@/stores/useChatbot')
const { useSubscriptionsStore } = await import('@/stores/useSubscriptions')
const { useCampaignsStore } = await import('@/stores/useCampaigns')
const { useSizeChartsStore } = await import('@/stores/useSizeCharts')
const { useStorefrontCartStore } = await import('@/stores/useStorefrontCart')
const { useDemoStores } = await import('@/stores/useDemoStores')
const { DEMO_STORES, demoStoreFor } = await import('@/storefront/demoStores')
const { linePlan } = await import('@/subscriptions/plans')
const { canSearch } = await import('@/storefront/storeSearch')
const { searchStore } = await import('@/storefront/search')
const { collectionByHandle, inStock, storefrontProducts } = await import('@/views/Storefront/storefrontCatalog')

const VH = 'vitaheal-demo'
const NF = 'northfold-demo'
const ACCOUNT = '2000290'
const VH_SEED = 'mp.vitaheal-demo.installed.v1'
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
const plain = (value: unknown) => JSON.parse(JSON.stringify(value))
const browser = () => Object.fromEntries(memory)
const record = () => JSON.parse(memory.get(VH_SEED) ?? 'null') as { blueprintId: string; seedVersion: number; appliedAt: string } | null
const at = (seedVersion: number, appliedAt = '2026-11-20T09:00:00.000Z') => JSON.stringify({ blueprintId: 'vitaheal', seedVersion, appliedAt })
/** Written by the app before the registry, in a browser that walked the demo script and edited every part: seed 1. */
const SAVED_HEAD = JSON.parse(readFileSync(new URL('./fixtures/vitaheal-saved-head.json', import.meta.url), 'utf8')) as Record<string, string>

/** The app starting in a browser that holds `saved` (and a tab that holds `tab`), once it has started. */
async function startApp(saved: Record<string, string> = {}, tab: Record<string, string> = {}) {
  memory.clear()
  for (const [key, value] of Object.entries(saved)) memory.set(key, value)
  session.clear()
  for (const [key, value] of Object.entries(tab)) session.set(key, value)
  setActivePinia(createPinia())
  const app = {
    channels: useSalesChannelsStore(), commerce: useCommerceStore(), extras: useProductExtrasStore(), themes: useStoreThemesStore(),
    storefront: useStorefrontStore(), content: useStoreContentStore(), nav: useStoreNavigationStore(), storeCampaigns: useStoreCampaignsStore(),
    merch: useMerchandisingStore(), chatbot: useChatbotStore(), subscriptions: useSubscriptionsStore(), emails: useCampaignsStore(),
    sizeCharts: useSizeChartsStore(), cart: useStorefrontCartStore(), demoStores: useDemoStores(),
  }
  await settle()
  return app
}
type App = Awaited<ReturnType<typeof startApp>>

const vitahealProducts = (app: App) => app.commerce.products.filter((p) => p.channelIds?.includes(VH))
const vitaheal = (app: App) => app.channels.channels.find((c) => c.id === VH)!

// ── Which browsers are seeded again ──────────────────────────────────────────

test('only Vitaheal\'s seed version moves to 2; every other demo store stays at 1', () => {
  assert.equal(demoStoreFor('vitaheal').seedVersion, 2)
  assert.deepEqual(DEMO_STORES.filter((b) => b.id !== 'vitaheal').map((b) => [b.id, b.seedVersion]), [
    ['northfold', 1], ['torqline', 1], ['lumos', 1], ['aurora', 1], ['daybloom', 1],
  ])
})

test('an empty browser seeds sixteen products and records seed 2; the next start seeds nothing again', async () => {
  const first = await startApp()
  assert.equal(vitahealProducts(first).length, 16)
  assert.deepEqual(Object.keys(browser()), [VH_SEED])
  assert.deepEqual([record()?.blueprintId, record()?.seedVersion], ['vitaheal', 2])
  const saved = browser()
  await startApp(saved)
  assert.deepEqual(browser(), saved)
})

test('a browser at seed 1 with no record (as the app before the registry left it) is seeded again: sixteen products, seed 2 recorded', async () => {
  const app = await startApp(SAVED_HEAD)
  const products = vitahealProducts(app)
  assert.equal(products.length, 16)
  assert.deepEqual(products.map((p) => p.id), Array.from({ length: 16 }, (_, i) => 2001 + i))
  assert.equal(products[0]!.name, 'Unwind', 'the edit made at seed 1 went with the reseed')
  assert.deepEqual([record()?.blueprintId, record()?.seedVersion], ['vitaheal', 2])
})

test('a browser whose record says seed 1 is seeded again too, and keeps the date it was first recorded', async () => {
  const app = await startApp({ ...SAVED_HEAD, [VH_SEED]: at(1) })
  assert.equal(vitahealProducts(app).length, 16)
  assert.deepEqual(record(), { blueprintId: 'vitaheal', seedVersion: 2, appliedAt: '2026-11-20T09:00:00.000Z' })
})

test('a browser at seed 2 is not seeded again: what it saved is read back and nothing is written', async () => {
  const saved = { ...SAVED_HEAD, [VH_SEED]: at(2) }
  const app = await startApp(saved)
  assert.equal(vitahealProducts(app).find((p) => p.id === 2001)?.name, 'Unwind (edited)')
  // It saved the store as it was then: eight products. Restore original store brings the sixteen.
  assert.equal(vitahealProducts(app).length, 8)
  assert.deepEqual(browser(), saved)
  assert.equal(app.demoStores.restore(VH), true)
  await settle()
  assert.equal(vitahealProducts(app).length, 16)
})

test('another demo store, at seed 1 (Northfold), is not seeded again, and its saved changes stay', async () => {
  const first = await startApp()
  first.commerce.products.find((p) => p.id === 3015)!.name = 'Linen Overshirt (edited)'
  await settle()
  const saved = browser()
  assert.ok(Object.keys(saved).some((key) => key.startsWith(`mp.demo-store.${NF}.`)))
  const app = await startApp(saved)
  assert.equal(app.commerce.products.find((p) => p.id === 3015)?.name, 'Linen Overshirt (edited)')
  assert.deepEqual(browser(), saved)
})

test('a store that applied the Vitaheal theme at seed 1 is seeded again too: it sells the sixteen', async () => {
  const first = await startApp()
  assert.equal(first.demoStores.apply(NF, 'vitaheal'), true)
  await settle()
  const northfoldSells = (app: App) => app.commerce.products.filter((p) => p.channelIds?.includes(NF))
  assert.equal(northfoldSells(first).length, 16)
  northfoldSells(first)[0]!.name = 'Edited on Northfold'
  await settle()
  const key = `mp.demo-store.${NF}.installed.v1`
  // As the app at seed 1 recorded it.
  const saved = { ...browser(), [key]: JSON.stringify({ ...JSON.parse(memory.get(key)!), seedVersion: 1 }) }
  const app = await startApp(saved)
  assert.equal(northfoldSells(app).length, 16)
  assert.notEqual(northfoldSells(app)[0]!.name, 'Edited on Northfold')
  assert.deepEqual([JSON.parse(memory.get(key)!).blueprintId, JSON.parse(memory.get(key)!).seedVersion], ['vitaheal', 2])
})

// ── What the reseed keeps and drops ──────────────────────────────────────────

test('the reseed of a browser saved before the registry: the catalogue goes back, history and the connection stay', async () => {
  const app = await startApp(SAVED_HEAD)
  app.merch.setActiveChannel(VH)
  // Dropped: what the reviewer changed in the store's products, plans, campaigns, search rules and chatbot settings.
  assert.equal(app.subscriptions.plans.find((p) => p.id === 'plan-3-month')?.name, '3-month supply')
  assert.deepEqual(app.subscriptions.plans.find((p) => p.id === 'plan-3-month')?.productIds, [2001, 2002, 2003, 2005, 2006, 2009, 2010, 2014])
  const winter = app.storeCampaigns.campaignsForChannel(VH).find((c) => c.id === 'camp-vitaheal-winter')!
  assert.equal(winter.name, 'Winter wellness week')
  // The campaign also forgets the announcement it was sent with, though the email itself stays (below).
  assert.equal(winter.emailCampaignId, undefined)
  const synonyms = app.merch.searchRulesFor(VH).synonyms
  assert.equal(synonyms.some((s) => s.queries.includes('knackered')), false)
  assert.ok(synonyms.some((s) => s.queries.includes('flu') && s.leadsTo.includes('immunity')), 'the new synonym comes with the reseed')
  assert.notEqual(app.chatbot.getByChannel(VH)?.config.welcomeMessage, 'Hej! (edited)')
  // Kept: the subscribers, the chats, the announcement email, the Merchandise Cloud connection.
  assert.deepEqual(app.subscriptions.contracts.filter((c) => c.channelId === VH).map((c) => c.number).sort(),
    ['S-1001', 'S-1002', 'S-1003', 'S-1004', 'S-1005', 'S-1006', 'S-1007', 'S-1008', 'S-1009'])
  assert.deepEqual(app.chatbot.conversationsFor(101).filter((c) => c.id.startsWith('live-')).map((c) => c.id), ['live-1795102046839'])
  assert.ok(app.emails.campaigns.some((email) => email.id === 34))
  assert.equal(vitaheal(app).webStore?.merchandiseConnected, true)
  // In the browser: the reseeded parts' slots are cleared; history stays as it was saved.
  const kept = Object.keys(browser()).sort()
  assert.deepEqual(kept, [
    'mp.vitaheal-demo.conversations.v1', 'mp.vitaheal-demo.emails.v1', VH_SEED, 'mp.vitaheal-demo.merchandise.v1', 'mp.vitaheal-demo.subscriptions.v1',
  ])
  for (const key of kept.filter((k) => k !== VH_SEED)) assert.equal(memory.get(key), SAVED_HEAD[key], `${key} is as it was saved`)
})

/** A reviewer's session on Vitaheal: something changed in every part, a shopper's cart, an order and a subscription. */
async function reviewersSession(app: App) {
  app.commerce.products.find((p) => p.id === 2001)!.name = 'Unwind (edited)'
  app.subscriptions.plans.find((p) => p.id === 'plan-monthly')!.name = 'Monthly (edited)'
  app.storeCampaigns.saveCampaign({ ...app.storeCampaigns.campaignsForChannel(VH)[0]!, name: 'Campaign (edited)' })
  app.merch.setActiveChannel(VH)
  app.merch.createSynonym({ type: 'two_way', queries: ['knackered'], leadsTo: ['energy'] })
  app.channels.connectMerchandising(ACCOUNT, VH)
  app.chatbot.getByChannel(VH)!.config.welcomeMessage = 'Hello (edited)'
  app.chatbot.setStatus(101, 'Inactive')
  app.chatbot.recordConversation({ id: 'live-review', chatbotId: 101, visitor: 'Visitor', startedAt: '2026-11-24T10:00:00.000Z', topic: 'Sleep', resolved: true, messages: [] })
  // The theme: an edit to the store's own, and a copy of it published in its place.
  app.themes.updateStyles('theme-vitaheal', { brandColor: '#123456' })
  app.themes.publishTheme('theme-vitaheal')
  const copy = app.themes.duplicateTheme('theme-vitaheal')!
  app.themes.publishTheme(copy.id)
  // A shopper's cart, an order with a step taken on its fulfillment, and a subscription.
  const unwind = app.commerce.products.find((p) => p.id === 2001)!
  app.cart.add(VH, unwind, 2)
  app.commerce.createCheckoutOrder({
    id: 20001, orderNumber: '#20001', date: '2026-11-24', channelId: VH, salesChannel: 'Vitaheal (demo)',
    customer: { name: 'Linnea Berg', email: 'linnea@example.com', address: { line1: 'Storgatan 12', city: 'Stockholm', region: '', postalCode: '111 51', country: 'Sweden' } },
    lineItems: [{ product: 'Unwind', sku: 'VTH-UNW-BAG', qty: 2, price: '399.00' }], shipping: '0.00', total: '798.00', currency: 'SEK',
    payment: { provider: 'maropay', paymentId: 'pay_20001', paymentStatus: 'Paid', paymentMethod: 'Visa •••• 4242' },
    timeline: [{ text: 'Order placed via Vitaheal (demo) checkout', date: '2026-11-24' }],
  } as Parameters<typeof app.commerce.createCheckoutOrder>[0])
  assert.equal(app.commerce.packFulfillment(20001), true)
  const plan = app.subscriptions.plans.find((p) => p.id === 'plan-3-month')!
  app.subscriptions.startFromCheckout({
    channelId: VH, methodId: 'card', customer: { name: 'Review Shopper', email: 'review@example.com' }, amount: { currency: 'SEK' },
    order: { id: 20002, orderNumber: '#20002', date: '2026-11-24' },
    lineItems: [{ product: unwind.name, productId: unwind.id, sku: unwind.sku, qty: 1, price: unwind.price, plan: linePlan(plan) }],
  } as unknown as Parameters<typeof app.subscriptions.startFromCheckout>[0], { methodLabel: 'Visa •••• 4242' } as Parameters<typeof app.subscriptions.startFromCheckout>[1])
  await settle()
  return { copyId: copy.id }
}

test('the reseed of a reviewer\'s browser: what it keeps and what it drops, part by part', async () => {
  // The session runs on today's app; dropping the record makes the browser one saved at seed 1.
  const first = await startApp()
  const { copyId } = await reviewersSession(first)
  const contracts = plain(first.subscriptions.contracts.filter((c) => c.channelId === VH))
  const chats = plain(first.chatbot.conversationsFor(101))
  const { [VH_SEED]: _, ...atSeed1 } = browser()
  const tab = Object.fromEntries(session)
  assert.ok(tab['mp.storefront.cart.v1'], 'the cart is kept by the tab')

  const app = await startApp(atSeed1, tab)
  // Dropped: products, plans, store campaigns, search rules, chatbot settings, and the edit to the store's own theme.
  assert.equal(vitahealProducts(app).length, 16)
  assert.equal(app.commerce.products.find((p) => p.id === 2001)?.name, 'Unwind')
  assert.equal(app.subscriptions.plans.find((p) => p.id === 'plan-monthly')?.name, 'Monthly subscription')
  assert.notEqual(app.storeCampaigns.campaignsForChannel(VH)[0]?.name, 'Campaign (edited)')
  app.merch.setActiveChannel(VH)
  assert.equal(app.merch.searchRulesFor(VH).synonyms.some((s) => s.queries.includes('knackered')), false)
  assert.notEqual(app.chatbot.getByChannel(VH)?.config.welcomeMessage, 'Hello (edited)')
  assert.notEqual(app.themes.getTheme('theme-vitaheal')?.styles.brandColor, '#123456')
  // The copy stays, as a draft: the store runs its own theme again.
  assert.equal(app.themes.themeForChannel(VH)?.id, 'theme-vitaheal')
  assert.equal(app.themes.getTheme(copyId)?.status, 'Draft')
  // Kept: subscribers (the new one too), chats, the chatbot switched off, the Merchandise Cloud connection, the cart.
  assert.deepEqual(plain(app.subscriptions.contracts.filter((c) => c.channelId === VH)), contracts)
  assert.deepEqual(plain(app.chatbot.conversationsFor(101)), chats)
  assert.equal(app.chatbot.getByChannel(VH)?.status, 'Inactive')
  assert.equal(vitaheal(app).webStore?.merchandiseConnected, true)
  assert.deepEqual(app.cart.linesFor(VH).map((line) => [line.name, line.qty]), [['Unwind (edited)', 2]])
  assert.equal(app.cart.noticeFor(VH), null, 'the cart is not emptied, so no notice')
  // Orders: Maropay keeps them and the fulfillments' progress outside the store's slots, which the reseed never touches.
  for (const [key, value] of Object.entries(atSeed1)) {
    if (!key.startsWith('mp.vitaheal-demo.')) assert.equal(memory.get(key), value, `${key} is untouched`)
  }
  assert.ok(atSeed1['mp.commerce.fulfillments.v1'], 'the order\'s fulfillment step was kept')
  assert.deepEqual([record()?.blueprintId, record()?.seedVersion], ['vitaheal', 2])
})

test('within a session the same reseed leaves orders alone', async () => {
  const app = await startApp()
  await reviewersSession(app)
  const orders = plain(app.commerce.orders.filter((o) => o.channelId === VH))
  assert.ok(orders.some((o: { id: number }) => o.id === 20001))
  // Every part follows the seed again, as reseedStale does on start.
  for (const store of [app.channels, app.commerce, app.sizeCharts, app.extras, app.themes, app.storefront, app.content, app.nav, app.storeCampaigns, app.merch, app.chatbot, app.subscriptions]) store.reseedDemo(VH)
  await settle()
  assert.deepEqual(plain(app.commerce.orders.filter((o) => o.channelId === VH)), orders)
  assert.equal(app.commerce.getOrderById(20001)?.fulfillmentStage, 'Pack')
})

// ── The new range on the storefront ──────────────────────────────────────────

test('the Immunity collection page lists the three Immunity products, and every goal page lists its own', async () => {
  const app = await startApp()
  const immunity = collectionByHandle(app.commerce.products, VH, 'immunity')!
  assert.equal(immunity.title, 'Immunity')
  assert.deepEqual(immunity.products.map((p) => p.name), ['Vitamin D3 + K2', 'Vitamin C + Zinc', 'Daily Multi'])
  const admin = app.extras.collections.filter((c) => c.salesChannels.includes(VH))
  assert.deepEqual(admin.map((c) => [c.id, c.title, c.productCount]), [
    [23, 'Subscription', 8], [24, 'Sport', 6], [25, 'Longevity', 6], [26, 'Sleep', 3], [27, 'Hydrate', 1], [28, 'Immunity', 3],
  ])
  for (const c of admin) assert.equal(collectionByHandle(app.commerce.products, VH, c.title.toLowerCase())?.products.length, c.productCount, c.title)
  assert.equal(collectionByHandle(app.commerce.products, VH, 'all')?.products.length, 16)
})

test('once the store is connected to Merchandise Cloud, a search for "flu" finds the Immunity products through the synonym', async () => {
  const app = await startApp()
  assert.equal(canSearch(vitaheal(app), app.commerce.products), false, 'no search before the store is connected')
  app.channels.connectMerchandising(ACCOUNT, VH)
  assert.equal(canSearch(vitaheal(app), app.commerce.products), true)
  // As StorefrontSearch.vue searches: the store's products and its search rules.
  const flu = searchStore('flu', storefrontProducts(app.commerce.products, VH), app.merch.searchRulesFor(VH))
  assert.deepEqual(flu.alsoSearched, ['immunity'])
  assert.deepEqual(flu.products.map((p) => p.name).sort(), ['Daily Multi', 'Vitamin C + Zinc', 'Vitamin D3 + K2'])
})

test('"Our range" on the home page lists twelve of the sixteen, in the store\'s order', async () => {
  const app = await startApp()
  const range = app.themes.themeForChannel(VH)!.templates.home.find((s) => s.id === 'vitaheal-home-featured')!
  assert.equal(range.settings.productCount, 12)
  // As FeaturedProducts.vue lists a row for "all": the store's products a shopper can buy, as many as it asks for.
  const listed = storefrontProducts(app.commerce.products, VH).filter(inStock).slice(0, Number(range.settings.productCount))
  assert.equal(listed.length, 12)
  assert.deepEqual(listed.slice(8).map((p) => p.name), ['Plant Protein', 'Daily Greens', 'Vitamin D3 + K2', 'Omega-3'])
})

test('every other theme the app seeds asks for eight products or fewer in a featured row', async () => {
  const app = await startApp()
  const rows = app.themes.themes
    .filter((theme) => theme.channelId !== VH)
    .flatMap((theme) => Object.values(theme.templates).flat().filter((s) => s.kind === 'featured-products').map((s) => [theme.id, s.id, s.settings.productCount] as const))
  assert.ok(rows.length > 0)
  for (const [theme, section, count] of rows) assert.ok(count === undefined || Number(count) <= 8, `${theme} ${section}: ${String(count)}`)
})
