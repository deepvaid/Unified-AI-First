// The theme library as the app runs it (part 4): applying each theme to each store
// that can take one and back, a store made from a theme with Create sales channel,
// deleting it, theme edits kept in the browser, the store's own plans paused while
// another theme runs, and the shopper's cart told why it was emptied.
// The stores import each other with '@/', so the resolve hook is registered first.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { setMaxListeners } from 'node:events'

register('../support/appImports.mjs', import.meta.url)

const memory = new Map<string, string>()
const window = new EventTarget()
setMaxListeners(0, window)
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)) },
    removeItem: (key: string) => { memory.delete(key) },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
    clear: () => memory.clear(),
  },
  window,
})

const { createPinia, setActivePinia } = await import('pinia')
const { useSalesChannelsStore } = await import('@/stores/useSalesChannels')
const { useCommerceStore } = await import('@/stores/useCommerce')
const { useProductExtrasStore } = await import('@/stores/useProductExtras')
const { useStoreThemesStore } = await import('@/stores/useStoreThemes')
const { useStoreContentStore } = await import('@/stores/useStoreContent')
const { useStoreNavigationStore } = await import('@/stores/useStoreNavigation')
const { useStoreCampaignsStore } = await import('@/stores/useStoreCampaigns')
const { useMerchandisingStore } = await import('@/stores/useMerchandising')
const { useChatbotStore } = await import('@/stores/useChatbot')
const { useSubscriptionsStore } = await import('@/stores/useSubscriptions')
const { useSizeChartsStore } = await import('@/stores/useSizeCharts')
const { useStorefrontCartStore } = await import('@/stores/useStorefrontCart')
const { useDemoStores } = await import('@/stores/useDemoStores')
const { DEMO_STORES } = await import('@/storefront/demoStores')
type DemoStoreId = import('@/storefront/demoStores').DemoStoreId
const { snapshotFor } = await import('@/storefront/demoStores/install')
const { CREATED_STORES_KEY } = await import('@/storefront/createdStores')
const { localDateKey } = await import('@/maropay/model')

const ACCOUNT = '2000290'
const VH = 'vitaheal-demo'
const NF = 'northfold-demo'
const TQ = 'torqline-demo'
const LM = 'lumos-demo'
const AU = 'aurora-demo'
const GARAGE = 'test-garage'
const today = () => localDateKey(Date.now())

const plain = (value: unknown) => JSON.parse(JSON.stringify(value))
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
const keptKeys = () => [...memory.keys()].filter((key) => key.startsWith('mp.')).sort()
const savedBrowser = () => Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)!]))
/**
 * Since Vitaheal's seed version 2 (eight more products, 2026-11-25) a browser's first start
 * seeds Vitaheal again and records the version it holds (useDemoStores reseedStale); a restore
 * clears it and writes it again. It names the theme the store started with: no theme is applied.
 */
const VH_SEED = 'mp.vitaheal-demo.installed.v1'
const seedRecord = () => JSON.parse(memory.get(VH_SEED) ?? 'null') as { blueprintId: string; seedVersion: number } | null

function startApp(saved: Record<string, string> = {}) {
  memory.clear()
  for (const [key, value] of Object.entries(saved)) memory.set(key, value)
  setActivePinia(createPinia())
  return {
    channels: useSalesChannelsStore(), commerce: useCommerceStore(), extras: useProductExtrasStore(), themes: useStoreThemesStore(),
    content: useStoreContentStore(), nav: useStoreNavigationStore(), storeCampaigns: useStoreCampaignsStore(), merch: useMerchandisingStore(),
    chatbot: useChatbotStore(), subscriptions: useSubscriptionsStore(), sizeCharts: useSizeChartsStore(), cart: useStorefrontCartStore(),
    demoStores: useDemoStores(),
  }
}
type App = ReturnType<typeof startApp>

/** Everything one store holds, across every store, as plain JSON. */
function storeOf(app: App, channelId: string) {
  app.merch.setActiveChannel(channelId)
  const channel = app.channels.channels.find((c) => c.id === channelId)
  const { updatedAt: _, ...record } = channel ?? ({} as Record<string, unknown>)
  return plain({
    channel: record,
    products: app.commerce.products.filter((p) => p.channelIds?.includes(channelId)),
    collections: app.extras.collections.filter((c) => c.salesChannels.includes(channelId)),
    themes: app.themes.themesForChannel(channelId),
    content: app.content.entries.filter((entry) => entry.channelId === channelId),
    menus: app.nav.menus.filter((menu) => menu.channelId === channelId),
    campaigns: app.storeCampaigns.campaignsForChannel(channelId),
    searchRules: app.merch.searchRulesFor(channelId),
    chatbot: app.chatbot.getByChannel(channelId)?.config,
    plans: app.subscriptions.plans.filter((plan) => plan.channelId === channelId),
    contracts: app.subscriptions.contracts.filter((contract) => contract.channelId === channelId),
    sizeCharts: app.sizeCharts.chartsForChannel(channelId),
  })
}

const STORES = [VH, NF, TQ, LM, AU]
const everyStoreOf = (app: App, ids = STORES) => Object.fromEntries(ids.map((id) => [id, storeOf(app, id)]))

function createGarage(app: App, theme: DemoStoreId | null = 'torqline', merchandiseConnected = false) {
  return app.demoStores.create(ACCOUNT, { name: 'Test Garage', type: 'web_store', storeBuilderEnabled: true, merchandiseConnected, theme })
}

/** The store runs `blueprintId` as its snapshot has it: its products, theme, currency and chatbot. */
function assertRuns(app: App, channelId: string, blueprintId: DemoStoreId) {
  const channel = app.channels.channels.find((c) => c.id === channelId)!
  const snapshot = snapshotFor(channel, blueprintId, today())
  const products = app.commerce.products.filter((p) => p.channelIds?.includes(channelId))
  assert.deepEqual(products.map((p) => p.id).sort(), snapshot.products.map((p) => p.id).sort(), `${channelId} sells ${blueprintId}'s products`)
  assert.equal(app.themes.themeForChannel(channelId)?.id, snapshot.theme.id)
  assert.equal(app.themes.themeForChannel(channelId)?.status, 'Published')
  assert.equal(channel.webStore?.currency, snapshot.market.currency)
  assert.equal(app.chatbot.getByChannel(channelId)?.config.assistantProfile, snapshot.chatbot.assistantProfile)
  assert.equal(app.demoStores.blueprintOf(channelId)?.id, blueprintId)
}

// ── Every theme on every store that can take one ─────────────────────────────

for (const storeId of [...STORES, GARAGE]) {
  for (const [index, theme] of DEMO_STORES.entries()) {
    const next = DEMO_STORES[(index + 1) % DEMO_STORES.length]!
    test(`${storeId}: applying ${theme.id}, then ${next.id}, then restoring puts the store back as it started and touches no other store`, async () => {
      const app = startApp()
      if (storeId === GARAGE) createGarage(app)
      await settle()
      const others = STORES.filter((id) => id !== storeId)
      const before = storeOf(app, storeId)
      const othersBefore = everyStoreOf(app, others)

      assert.equal(app.demoStores.apply(storeId, theme.id), true)
      await settle()
      const original = storeId === GARAGE ? 'torqline' : DEMO_STORES.find((b) => b.homeChannel.id === storeId)!.id
      assertRuns(app, storeId, theme.id === original ? original : theme.id)

      assert.equal(app.demoStores.apply(storeId, next.id), true)
      await settle()
      assertRuns(app, storeId, next.id)
      assert.deepEqual(everyStoreOf(app, others), othersBefore)

      assert.equal(app.demoStores.restore(storeId), true)
      await settle()
      assert.deepEqual(storeOf(app, storeId), before)
      assert.deepEqual(everyStoreOf(app, others), othersBefore)
      // Nothing of the store is kept, but Vitaheal's record of the seed it holds (its own theme, not an applied one).
      const kept = keptKeys().filter((key) => key.includes(`${storeId}.`) && !key.endsWith('created-stores.v1'))
      assert.deepEqual(kept, storeId === VH ? [VH_SEED] : [], keptKeys().join())
      if (storeId === VH) assert.deepEqual([seedRecord()?.blueprintId, seedRecord()?.seedVersion], ['vitaheal', 2])
    })
  }
}

test('no other store can take a theme, and the library leaves it alone', async () => {
  const app = startApp()
  for (const id of ['neelam-store', 'retest-sales-notification', 'shopify-fashion', 'beta-sales-channel', 'max-test-store', 'pos-store']) {
    assert.equal(app.demoStores.canApply(id), false, id)
    assert.deepEqual(app.demoStores.applyPreview(id, 'northfold'), [], id)
    assert.equal(app.demoStores.restorePreview(id), null, id)
    assert.equal(app.demoStores.isCreated(id), false, id)
    assert.equal(app.demoStores.remove(id), false, id)
  }
})

// ── Start from a theme, and delete ───────────────────────────────────────────

test('a store made from a theme is last in the list, a copy of that theme in its own ids, and comes back after a reload', async () => {
  const app = startApp()
  const channel = createGarage(app, 'torqline')
  await settle()
  assert.equal(app.channels.channels.at(-1)?.id, GARAGE)
  assert.deepEqual(channel.webStore?.blueprint, { original: 'torqline', slot: 10 })
  assert.equal(channel.webStore?.demo, true)
  assert.equal(channel.webStore?.published, true)
  assert.equal(channel.status, 'connected')
  assert.equal(app.demoStores.isCreated(GARAGE), true)
  assert.equal(app.demoStores.canApply(GARAGE), true)
  assertRuns(app, GARAGE, 'torqline')
  // Its own block: store slot 10 (past the merchant window, so plus 1,000,000), Torqline's digit 4.
  assert.ok(app.commerce.products.filter((p) => p.channelIds?.includes(GARAGE)).every((p) => p.id > 1_104_000 && p.id < 1_105_000))
  // Only the store itself is saved (and Vitaheal's seed version); its parts follow their seed until changed.
  assert.deepEqual(keptKeys(), [CREATED_STORES_KEY, VH_SEED])
  const garage = storeOf(app, GARAGE)
  const demos = everyStoreOf(app)

  const again = startApp(savedBrowser())
  await settle()
  assert.equal(again.channels.channels.at(-1)?.id, GARAGE)
  assert.deepEqual(storeOf(again, GARAGE), garage)
  assert.deepEqual(everyStoreOf(again), demos)
  assert.deepEqual(keptKeys(), [CREATED_STORES_KEY, VH_SEED])
})

test('a blank store has nothing until a theme is applied, and a restore makes it blank again', async () => {
  const app = startApp()
  createGarage(app, null)
  await settle()
  const blank = storeOf(app, GARAGE)
  assert.deepEqual(blank.products, [])
  assert.deepEqual(blank.themes, [])
  assert.equal(app.demoStores.blueprintOf(GARAGE), undefined)
  assert.equal(app.demoStores.restoreFacts(GARAGE)?.original, null)

  assert.equal(app.demoStores.apply(GARAGE, 'northfold'), true)
  await settle()
  assertRuns(app, GARAGE, 'northfold')
  assert.equal(app.demoStores.restoreFacts(GARAGE)?.applied, 'Northfold')

  assert.equal(app.demoStores.restore(GARAGE), true)
  await settle()
  assert.deepEqual(storeOf(app, GARAGE), blank)
})

test('a store made connected to Merchandise Cloud stays connected after a reload and a restore', async () => {
  const app = startApp()
  createGarage(app, 'northfold', true)
  await settle()
  const connected = () => app.channels.channels.find((c) => c.id === GARAGE)?.webStore?.merchandiseConnected
  assert.equal(connected(), true)
  assert.equal(app.demoStores.restore(GARAGE), true)
  await settle()
  assert.equal(connected(), true)

  const again = startApp(savedBrowser())
  await settle()
  assert.equal(again.channels.channels.find((c) => c.id === GARAGE)?.webStore?.merchandiseConnected, true)
})

test('deleting a store made here removes everything of it from the app and this browser; the demo stores stay as they are', async () => {
  const app = startApp()
  await settle()
  const demos = everyStoreOf(app)
  createGarage(app, 'vitaheal')
  await settle()
  // Changes in every kept part, so the browser holds keys for it.
  app.commerce.products.find((p) => p.channelIds?.includes(GARAGE))!.name = 'Edited'
  app.themes.duplicateTheme(app.themes.themeForChannel(GARAGE)!.id)
  app.subscriptions.plans.find((plan) => plan.channelId === GARAGE)!.name = 'Edited plan'
  await settle()
  assert.ok(keptKeys().some((key) => key.startsWith(`mp.demo-store.${GARAGE}.`)))

  assert.equal(app.demoStores.remove(GARAGE), true)
  await settle()
  assert.equal(app.channels.channels.some((c) => c.id === GARAGE), false)
  const left = storeOf(app, GARAGE)
  for (const part of ['products', 'collections', 'themes', 'content', 'menus', 'campaigns', 'plans', 'sizeCharts'] as const) assert.deepEqual(left[part], [], part)
  assert.deepEqual(left.searchRules.synonyms, [])
  assert.equal(left.chatbot, undefined)
  assert.equal(app.chatbot.chatbots.some((bot) => bot.channelId === GARAGE), false)
  assert.ok(!keptKeys().some((key) => key.startsWith(`mp.demo-store.${GARAGE}.`)), keptKeys().join())
  assert.deepEqual(everyStoreOf(app), demos)

  // Gone after a reload too. Its id and slot are never used again here: what the app keeps by store id stays with the deleted store.
  assert.deepEqual(keptKeys(), [CREATED_STORES_KEY, VH_SEED])
  const again = startApp(savedBrowser())
  await settle()
  assert.equal(again.channels.channels.some((c) => c.id === GARAGE), false)
  const remade = createGarage(again, 'northfold')
  assert.deepEqual([remade.id, remade.webStore?.blueprint?.slot], ['test-garage-2', 11])
  await settle()
  assertRuns(again, remade.id, 'northfold')

  // In the same session too: a store with the same name is made whole, not empty.
  const third = createGarage(app, 'torqline')
  await settle()
  assert.equal(third.id, 'test-garage-2')
  assertRuns(app, third.id, 'torqline')
})

test('a store made in another tab comes in here; one deleted there leaves here with all of it', async () => {
  const app = startApp()
  // The other tab writes the list (as createChannel does), then this tab hears of it.
  const other = startApp()
  createGarage(other, 'northfold')
  const list = memory.get(CREATED_STORES_KEY)!
  const here = startApp()
  memory.set(CREATED_STORES_KEY, list)
  window.dispatchEvent(Object.assign(new Event('storage'), { key: CREATED_STORES_KEY, newValue: list }))
  await settle()
  assert.equal(here.channels.channels.at(-1)?.id, GARAGE)
  assertRuns(here, GARAGE, 'northfold')

  memory.delete(CREATED_STORES_KEY)
  window.dispatchEvent(Object.assign(new Event('storage'), { key: CREATED_STORES_KEY, newValue: null }))
  await settle()
  assert.equal(here.channels.channels.some((c) => c.id === GARAGE), false)
  assert.deepEqual(here.commerce.products.filter((p) => p.channelIds?.includes(GARAGE)), [])
  void app
})

// ── Theme edits, copies and drafts ───────────────────────────────────────────

test('a theme copy survives a reload, stays a draft when another theme is applied, and goes with a restore', async () => {
  const app = startApp()
  const copy = app.themes.duplicateTheme('theme-northfold')!
  assert.equal(copy.name, 'Copy of Northfold')
  assert.equal(copy.status, 'Draft')
  assert.equal(app.themes.duplicateTheme('theme-northfold')!.name, 'Copy of Northfold 2')
  assert.equal(app.themes.deleteTheme('theme-northfold'), false, 'the published theme cannot be deleted')
  await settle()

  const again = startApp(savedBrowser())
  await settle()
  // Each copy sits right after the theme it was copied from: the newest first.
  assert.deepEqual(again.themes.themesForChannel(NF).map((t) => [t.name, t.status]), [['Northfold', 'Published'], ['Copy of Northfold 2', 'Draft'], ['Copy of Northfold', 'Draft']])
  assert.equal(again.themes.deleteTheme(copy.id), true)

  assert.equal(again.demoStores.apply(NF, 'torqline'), true)
  await settle()
  assert.deepEqual(again.themes.themesForChannel(NF).map((t) => [t.name, t.status]), [['Torqline', 'Published'], ['Copy of Northfold 2', 'Draft']])
  const third = startApp(savedBrowser())
  await settle()
  assert.deepEqual(third.themes.themesForChannel(NF).map((t) => [t.name, t.status]), [['Torqline', 'Published'], ['Copy of Northfold 2', 'Draft']])

  assert.equal(third.demoStores.restore(NF), true)
  await settle()
  assert.deepEqual(third.themes.themesForChannel(NF).map((t) => [t.name, t.status]), [['Northfold', 'Published']])
  assert.ok(!keptKeys().some((key) => key.startsWith(`mp.demo-store.${NF}.`)), keptKeys().join())
})

test('after a reload, Discard still takes an edited theme back to how it was published', async () => {
  const app = startApp()
  const before = plain(app.themes.getTheme('theme-northfold'))
  app.themes.updateStyles('theme-northfold', { accentColor: '#ff0000' } as Parameters<typeof app.themes.updateStyles>[1])
  await settle()
  const again = startApp(savedBrowser())
  await settle()
  assert.notDeepEqual(plain(again.themes.getTheme('theme-northfold')), before)
  again.themes.discardDraft('theme-northfold')
  assert.deepEqual(plain(again.themes.getTheme('theme-northfold')), before)
})

test('publishing a copy takes the theme it was copied from off the store; applying a theme keeps the copy as a draft', async () => {
  const app = startApp()
  const copy = app.themes.duplicateTheme('theme-torqline')!
  app.themes.publishTheme(copy.id)
  assert.equal(app.themes.themeForChannel(TQ)?.id, copy.id)
  assert.equal(app.themes.getTheme('theme-torqline')?.status, 'Draft')
  assert.equal(app.demoStores.apply(TQ, 'northfold'), true)
  await settle()
  assert.equal(app.themes.getTheme(copy.id)?.status, 'Draft')
  assertRuns(app, TQ, 'northfold')
})

// ── The store's own plans while another theme runs ───────────────────────────

test('a plan the merchant made stays listed, switched off, while another theme runs; a restore removes it', async () => {
  const app = startApp()
  await settle()
  const seeded = storeOf(app, VH)
  const own = app.subscriptions.plans.filter((plan) => plan.channelId === VH)
  const made = app.subscriptions.createPlan(VH, { ...own[0]!, name: 'Merchant plan', isDefault: false })
  await settle()

  assert.equal(app.demoStores.apply(VH, 'northfold'), true)
  await settle()
  const listed = app.subscriptions.plans.filter((plan) => plan.channelId === VH)
  assert.deepEqual(listed.map((plan) => plan.id), [...own.map((plan) => plan.id), made.id])
  assert.ok(listed.every((plan) => plan.status === 'Paused'))
  assert.equal(app.subscriptions.contracts.filter((c) => c.channelId === VH).length, seeded.contracts.length)

  // Kept after a reload, and still there when a third theme replaces the second.
  const again = startApp(savedBrowser())
  await settle()
  assert.ok(again.subscriptions.plans.some((plan) => plan.id === made.id && plan.status === 'Paused'))
  assert.equal(again.demoStores.apply(VH, 'torqline'), true)
  await settle()
  assert.deepEqual(again.subscriptions.plans.filter((plan) => plan.channelId === VH).map((plan) => plan.id), [...own.map((plan) => plan.id), made.id])
  // Still kept after the second Apply, once the page reloads.
  const third = startApp(savedBrowser())
  await settle()
  assert.deepEqual(third.subscriptions.plans.filter((plan) => plan.channelId === VH).map((plan) => plan.id), [...own.map((plan) => plan.id), made.id])

  assert.equal(third.demoStores.restore(VH), true)
  await settle()
  assert.deepEqual(storeOf(third, VH).plans, seeded.plans)
})

test('the store\'s own plans paused by Apply are no longer preselected; switching one back on keeps one preselected', async () => {
  const app = startApp()
  // On Northfold, a default plan of its own, then Vitaheal's plans come in with theirs.
  const own = app.subscriptions.createPlan(NF, { ...app.subscriptions.plans.find((plan) => plan.channelId === VH)!, name: 'Own default', isDefault: true })
  assert.equal(app.demoStores.apply(NF, 'vitaheal'), true)
  await settle()
  const plans = app.subscriptions.plans.filter((plan) => plan.channelId === NF)
  assert.equal(plans.filter((plan) => plan.isDefault).length, 1)
  assert.equal(plans.find((plan) => plan.id === own.id)?.isDefault, false)
  const preselected = plans.find((plan) => plan.isDefault)!
  app.subscriptions.updatePlan(own.id, { ...plans.find((plan) => plan.id === own.id)!, isDefault: true })
  app.subscriptions.setPlanStatus(own.id, 'Active')
  assert.equal(app.subscriptions.plans.filter((plan) => plan.channelId === NF && plan.isDefault && plan.status === 'Active').length, 1)
  void preselected
})

test('a blank store that takes a theme is set up and published, after a reload too; back to blank it needs setup again', async () => {
  const app = startApp()
  createGarage(app, null)
  await settle()
  const garage = () => app.channels.channels.find((c) => c.id === GARAGE)!
  assert.deepEqual([garage().status, garage().webStore?.published], ['needs_setup', false])
  assert.equal(app.demoStores.apply(GARAGE, 'torqline'), true)
  await settle()
  assert.deepEqual([garage().status, garage().health, garage().webStore?.published], ['connected', 'healthy', true])
  const again = startApp(savedBrowser())
  await settle()
  const reloaded = again.channels.channels.find((c) => c.id === GARAGE)!
  assert.deepEqual([reloaded.status, reloaded.webStore?.published], ['connected', true])
  assert.equal(again.demoStores.restore(GARAGE), true)
  assert.deepEqual([reloaded.status, reloaded.health, reloaded.webStore?.published], ['needs_setup', 'incomplete', false])
})

test('applying Vitaheal to Northfold brings its plans; the next theme takes them away again', async () => {
  const app = startApp()
  assert.equal(app.demoStores.apply(NF, 'vitaheal'), true)
  await settle()
  const brought = app.subscriptions.plans.filter((plan) => plan.channelId === NF)
  assert.ok(brought.length > 0)
  assert.ok(brought.some((plan) => plan.status !== 'Paused'))
  assert.equal(app.demoStores.apply(NF, 'torqline'), true)
  await settle()
  assert.deepEqual(app.subscriptions.plans.filter((plan) => plan.channelId === NF), [])
})

// ── What the dialogs say ─────────────────────────────────────────────────────

test('the Apply and Restore dialogs count what the store holds and what the theme brings', async () => {
  const app = startApp()
  const products = app.commerce.products.filter((p) => p.channelIds?.includes(VH)).length
  const lines = app.demoStores.applyPreview(VH, 'northfold')
  assert.ok(lines.includes(`20 products replace the ${products} in this store.`), lines.join('\n'))
  assert.ok(lines.includes('Prices change to US dollars.'), lines.join('\n'))
  assert.ok(lines.some((line) => /subscription plans are paused, so no one new can subscribe; its \w+ subscribers keep their subscriptions\.$/.test(line)), lines.join('\n'))
  assert.ok(lines.includes('The chatbot answers as a clothing store.'))

  assert.ok(app.demoStores.restorePreview(VH)?.lines[0]?.startsWith('The theme goes back to Vitaheal'))
  assert.equal(app.demoStores.restorePreview(VH)?.parts.card, 'Products, subscription plans and subscribers')
  app.demoStores.apply(VH, 'torqline')
  await settle()
  assert.equal(app.demoStores.restorePreview(VH)?.lines[0], 'The theme goes back to Vitaheal, with its collections, pages and menus.')
  assert.equal(app.demoStores.restoreFacts(VH)?.applied, 'Torqline')
  assert.ok(app.demoStores.restorePreview(VH)?.lines.includes('Prices go back to Swedish kronor.'))
  // Vitaheal is seeded without Merchandise Cloud: search waits for it, and a restore disconnects a store connected since.
  assert.ok(app.demoStores.applyPreview(VH, 'northfold').includes('Search works once this store connects to Merchandise Cloud.'))
  app.channels.connectMerchandising(ACCOUNT, VH)
  assert.ok(app.demoStores.restorePreview(VH)?.lines.includes('Merchandise Cloud is disconnected again, as it was when the store started.'))
  assert.ok(!app.demoStores.applyPreview(VH, 'northfold').some((line) => line.startsWith('Search')))
})

// ── The shopper's cart ───────────────────────────────────────────────────────

test('applying a theme empties the store\'s cart and remembers what it held, so the storefront can say so', async () => {
  const app = startApp()
  const [first, second] = app.commerce.products.filter((p) => p.channelIds?.includes(NF))
  app.cart.add(NF, first!)
  app.cart.add(NF, second!, 2)
  app.cart.add(VH, app.commerce.products.find((p) => p.channelIds?.includes(VH))!)
  assert.equal(app.demoStores.apply(NF, 'torqline'), true)
  assert.deepEqual(app.cart.linesFor(NF), [])
  assert.deepEqual(app.cart.noticeFor(NF), [first!.name, second!.name])
  assert.equal(app.cart.linesFor(VH).length, 1, 'another store\'s cart stays')
  assert.equal(app.cart.noticeFor(VH), null)
  app.cart.dismissNotice(NF)
  assert.equal(app.cart.noticeFor(NF), null)
  // Shopping again takes the note away.
  app.cart.add(NF, app.commerce.products.find((p) => p.channelIds?.includes(NF))!)
  assert.equal(app.demoStores.apply(NF, 'vitaheal'), true)
  assert.ok(app.cart.noticeFor(NF))
  app.cart.add(NF, app.commerce.products.find((p) => p.channelIds?.includes(NF))!)
  assert.equal(app.cart.noticeFor(NF), null)
  // An empty cart has nothing to say.
  app.cart.clear(NF)
  assert.equal(app.demoStores.restore(NF), true)
  assert.equal(app.cart.noticeFor(NF), null)
})
