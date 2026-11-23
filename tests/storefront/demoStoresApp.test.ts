// The demo stores as the app runs them: every Pinia store that holds part of a
// demo store, together. The pure tests (demoStoresVitaheal, demoStoresInstall)
// check what a blueprint builds; this one checks that the stores seed it, keep
// it in the browser under the same keys as before, and put it back on restore.
// The stores import each other with '@/', so the resolve hook is registered first.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { register } from 'node:module'
import { setMaxListeners } from 'node:events'

register('../support/appImports.mjs', import.meta.url)

const memory = new Map<string, string>()
// Each app started here adds its stores' storage listeners to the one window.
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
const { useStorefrontStore } = await import('@/stores/useStorefront')
const { useStoreContentStore } = await import('@/stores/useStoreContent')
const { useStoreNavigationStore } = await import('@/stores/useStoreNavigation')
const { useStoreCampaignsStore } = await import('@/stores/useStoreCampaigns')
const { useMerchandisingStore } = await import('@/stores/useMerchandising')
const { useChatbotStore } = await import('@/stores/useChatbot')
const { useSubscriptionsStore } = await import('@/stores/useSubscriptions')
const { useCampaignsStore, STORE_CAMPAIGN_TAG } = await import('@/stores/useCampaigns')
const { useDemoStores } = await import('@/stores/useDemoStores')
const { homeBlueprintOf } = await import('@/storefront/demoStores')
const { VITAHEAL_CUSTOMERS_LIST_ID } = await import('@/stores/useCdpEntities')
const { VITAHEAL_CAMPAIGN_CONTENT_ID } = await import('@/stores/useContent')
const { NORTHFOLD_CUSTOMERS_LIST_ID, useCdpEntitiesStore } = await import('@/stores/useCdpEntities')
const { NORTHFOLD_CAMPAIGN_CONTENT_ID, useContentStore } = await import('@/stores/useContent')
const { linePlan } = await import('@/subscriptions/plans')
const { frozen, readVitaheal } = await import('./fixtures/capture-vitaheal-app.mjs')

const fixture = JSON.parse(readFileSync(new URL('./fixtures/vitaheal-seed.json', import.meta.url), 'utf8'))
/**
 * What the stores held for Vitaheal before the registry, read by readVitaheal on a
 * frozen clock: `fresh` in an empty browser, `saved` in one holding
 * vitaheal-saved-head.json. How to capture it again: fixtures/capture-vitaheal-app.mjs.
 */
const beforeRegistry = JSON.parse(readFileSync(new URL('./fixtures/vitaheal-app-head.json', import.meta.url), 'utf8'))
const SAVED_HEAD = JSON.parse(readFileSync(new URL('./fixtures/vitaheal-saved-head.json', import.meta.url), 'utf8')) as Record<string, string>
const VH = 'vitaheal-demo'
const ACCOUNT = '2000290'
/** Every key a store keeps for Vitaheal. The names are what browsers already hold: never rename one. */
const VITAHEAL_KEYS = [
  'mp.vitaheal-demo.campaigns.v1', 'mp.vitaheal-demo.chatbot.v1', 'mp.vitaheal-demo.conversations.v1',
  'mp.vitaheal-demo.emails.v1', 'mp.vitaheal-demo.merchandise.v1', 'mp.vitaheal-demo.merchandising.v1',
  'mp.vitaheal-demo.plans.v1', 'mp.vitaheal-demo.products.v1', 'mp.vitaheal-demo.subscriptions.v1',
]

const plain = (value: unknown) => JSON.parse(JSON.stringify(value))
/** Lets the stores' watchers save to the browser. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
const keptKeys = () => [...memory.keys()].filter((key) => key.startsWith('mp.')).sort()

/** The app starting in a browser that holds `saved`. */
function startApp(saved: Record<string, string> = {}) {
  memory.clear()
  for (const [key, value] of Object.entries(saved)) memory.set(key, value)
  setActivePinia(createPinia())
  return {
    channels: useSalesChannelsStore(), commerce: useCommerceStore(), extras: useProductExtrasStore(), themes: useStoreThemesStore(),
    storefront: useStorefrontStore(), content: useStoreContentStore(), nav: useStoreNavigationStore(), storeCampaigns: useStoreCampaignsStore(),
    merch: useMerchandisingStore(), chatbot: useChatbotStore(), subscriptions: useSubscriptionsStore(), emails: useCampaignsStore(),
    demoStores: useDemoStores(),
  }
}
type App = ReturnType<typeof startApp>

/** Everything a demo store is made of, across every store, for every channel. */
function stateOf(app: App) {
  return { ...catalogueOf(app), ...lookOf(app) }
}

/** What Restore original store has always put back. */
function catalogueOf(app: App) {
  const vitaheal = app.channels.channels.find((channel) => channel.id === VH)
  return plain({
    // When a channel last changed stays the last change, restore included (as before the registry).
    channels: app.channels.channels.map(({ updatedAt: _, ...channel }) => channel), products: app.commerce.products,
    chrome: app.storefront.chromeFor(vitaheal),
    storeCampaigns: app.storeCampaigns.campaigns, searchRules: app.merch.searchRulesFor(VH), chatbots: app.chatbot.chatbots,
    chats: app.chatbot.conversationsFor(101), plans: app.subscriptions.plans, contracts: app.subscriptions.contracts,
    emails: app.emails.campaigns.map((email) => email.id),
  })
}

/** The theme, collections, pages and menus: a restore puts them back only when another theme was applied. */
function lookOf(app: App) {
  return plain({
    collections: app.extras.collections, themes: app.themes.themes,
    entries: app.content.entries, blogSeo: app.content.blogSeo(VH), menus: app.nav.menus,
  })
}

/** A merchant's afternoon on Vitaheal: something changed in every part. */
async function editVitaheal(app: App) {
  app.commerce.products.find((product) => product.id === 2001)!.name = 'Unwind (edited)'
  app.subscriptions.plans.find((plan) => plan.channelId === VH)!.name = 'Plan (edited)'
  app.subscriptions.contracts.find((contract) => contract.channelId === VH)!.status = 'Paused'
  const campaign = app.storeCampaigns.campaignsForChannel(VH)[0]!
  app.storeCampaigns.saveCampaign({ ...campaign, name: 'Campaign (edited)' })
  app.merch.setActiveChannel(VH)
  app.merch.createSynonym({ type: 'two_way', queries: ['knackered'], leadsTo: ['energy'] })
  app.channels.connectMerchandising(ACCOUNT, VH)
  app.chatbot.getByChannel(VH)!.config.welcomeMessage = 'Hello (edited)'
  app.chatbot.setStatus(101, 'Inactive')
  app.themes.updateSection('theme-vitaheal', 'home', 'vitaheal-home-banner', { hidden: true })
  app.nav.deleteMenu(app.nav.menus.find((menu) => menu.channelId === VH)!.id)
  app.extras.deleteCollection(25)
  await settle()
}

test('every store seeds Vitaheal as it did before the registry, and writes nothing to the browser on load', async () => {
  const app = startApp()
  await settle()
  const channel = app.channels.channels.find((c) => c.id === VH)!
  const { blueprint, ...webStore } = channel.webStore!
  assert.deepEqual(blueprint, { original: 'vitaheal', slot: 2 })
  assert.deepEqual(plain({ ...channel, webStore }), fixture.channel)
  assert.deepEqual(plain(app.themes.themes.find((theme) => theme.id === 'theme-vitaheal')), fixture.theme)
  assert.deepEqual(plain(app.extras.collections.filter((c) => c.salesChannels.includes(VH))), fixture.collectionRecords)
  assert.deepEqual(plain(app.content.entries.filter((entry) => entry.channelId === VH)), fixture.content)
  assert.deepEqual(plain(app.content.blogSeo(VH)), fixture.blogSeo)
  assert.deepEqual(plain(app.nav.menus.filter((menu) => menu.channelId === VH)), fixture.menus)
  assert.deepEqual(plain(app.storefront.chromeFor(channel)), fixture.chrome)
  assert.deepEqual(plain(app.commerce.products.filter((p) => p.channelIds?.includes(VH)).map(({ status: _, ...product }) => product)), fixture.products)
  assert.deepEqual(plain(app.subscriptions.plans.filter((plan) => plan.channelId === VH)), fixture.plans)
  assert.equal(app.chatbot.getByChannel(VH)?.id, 101)
  assert.equal(app.chatbot.getByChannel(VH)?.config.assistantProfile, 'wellness')
  assert.deepEqual(keptKeys(), [])
})

test('the other stores are no demo store: no theme can be applied to them and nothing of theirs is touched', async () => {
  const app = startApp()
  const before = stateOf(app)
  for (const id of ['neelam-store', 'retest-sales-notification', 'shopify-fashion', 'beta-sales-channel', 'max-test-store', 'pos-store']) {
    assert.equal(app.demoStores.canApply(id), false, id)
    assert.equal(app.demoStores.apply(id, 'vitaheal'), false, id)
    assert.equal(app.demoStores.restore(id), false, id)
  }
  await settle()
  assert.deepEqual(stateOf(app), before)
  assert.deepEqual(keptKeys(), [])
})

test('Restore original store puts back everything it started with, its theme included, and forgets what the browser kept', async () => {
  const app = startApp()
  const seeded = catalogueOf(app)
  const seededLook = lookOf(app)
  await editVitaheal(app)
  app.themes.duplicateTheme('theme-vitaheal')
  await settle()
  assert.notDeepEqual(catalogueOf(app), seeded)
  assert.notDeepEqual(lookOf(app), seededLook)
  assert.ok(keptKeys().includes('mp.vitaheal-demo.themes.v1'), keptKeys().join())
  assert.equal(app.demoStores.restore(VH), true)
  await settle()
  assert.deepEqual(catalogueOf(app), seeded)
  // Since the theme library (part 4): the theme goes back too, its copies and drafts removed, with the collections, pages and menus.
  assert.deepEqual(lookOf(app), seededLook)
  assert.deepEqual(keptKeys().filter((key) => key.startsWith('mp.vitaheal-demo.')), [])
})

test('applying the theme a store started from is a restore, and records no applied theme', async () => {
  const app = startApp()
  const seeded = stateOf(app)
  await editVitaheal(app)
  assert.equal(app.demoStores.blueprintOf(VH)?.id, 'vitaheal')
  assert.equal(app.demoStores.apply(VH, 'vitaheal'), true)
  await settle()
  assert.deepEqual(stateOf(app), seeded)
  assert.deepEqual(keptKeys(), [])
})

test('reseeding a store keeps a product it shares with another store, in the other store only', async () => {
  const app = startApp()
  const vitaheal = app.channels.channels.find((channel) => channel.id === VH)!
  const shared = app.commerce.createProduct({
    name: 'Shared tote', sku: 'SHARED-1', price: '10.00', inventory: 5, category: 'Bags', vendor: 'Test', variants: 1,
    type: 'product', publishStatus: 'Published', channelIds: [VH, 'other-store'],
    detail: { salesChannels: [vitaheal.name, 'Other store'] },
  } as Parameters<typeof app.commerce.createProduct>[0])
  const only = app.commerce.createProduct({
    name: 'Vitaheal only', sku: 'VH-ONLY-1', price: '10.00', inventory: 5, category: 'Bags', vendor: 'Test', variants: 1,
    type: 'product', publishStatus: 'Published', channelIds: [VH],
  } as Parameters<typeof app.commerce.createProduct>[0])
  await settle()
  assert.equal(app.demoStores.restore(VH), true)
  await settle()
  const kept = app.commerce.products.find((product) => product.id === shared.id)
  assert.deepEqual(kept?.channelIds, ['other-store'])
  assert.deepEqual(kept?.salesChannelNames, ['Other store'])
  assert.deepEqual(kept?.detail?.salesChannels, ['Other store'])
  assert.equal(app.commerce.products.some((product) => product.id === only.id), false)
  assert.equal(app.commerce.products.filter((product) => product.channelIds?.includes(VH)).length, fixture.products.length)
})

test('what the app before the registry saved in a browser is read under the same keys, not written back, and restored away', async () => {
  // Written by the code before the registry, in a browser that walked the demo script and edited every part.
  const saved = JSON.parse(readFileSync(new URL('./fixtures/vitaheal-saved-head.json', import.meta.url), 'utf8')) as Record<string, string>
  assert.deepEqual(Object.keys(saved).sort(), VITAHEAL_KEYS)
  const app = startApp(saved)
  await settle()
  assert.equal(app.commerce.products.find((product) => product.id === 2001)?.name, 'Unwind (edited)')
  assert.equal(app.subscriptions.plans.find((plan) => plan.id === 'plan-3-month')?.name, '3-month supply (edited)')
  assert.deepEqual(app.subscriptions.contracts.filter((contract) => contract.channelId === VH).map((contract) => contract.number).sort(),
    ['S-1001', 'S-1002', 'S-1003', 'S-1004', 'S-1005', 'S-1006', 'S-1007', 'S-1008', 'S-1009'])
  assert.equal(app.storeCampaigns.campaignsForChannel(VH).find((campaign) => campaign.id === 'camp-vitaheal-winter')?.name, 'Winter wellness week (edited)')
  assert.equal(app.chatbot.getByChannel(VH)?.config.welcomeMessage, 'Hej! (edited)')
  assert.deepEqual(app.chatbot.conversationsFor(101).filter((chat) => chat.id.startsWith('live-')).map((chat) => chat.id), ['live-1795102046839'])
  assert.equal(app.channels.channels.find((channel) => channel.id === VH)?.webStore?.merchandiseConnected, true)
  assert.ok(app.merch.searchRulesFor(VH).synonyms.some((synonym) => synonym.queries.includes('knackered')))
  // The announcement saved without a store is Vitaheal's.
  assert.ok(app.emails.campaigns.some((email) => email.id === 34))
  assert.deepEqual(Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)])), saved)

  assert.equal(app.demoStores.restore(VH), true)
  await settle()
  assert.equal(app.emails.campaigns.some((email) => email.id === 34), false)
  assert.equal(app.commerce.products.find((product) => product.id === 2001)?.name, 'Unwind')
  assert.deepEqual(keptKeys(), [])
})

test('what a browser kept before the registry is read under the same keys, and not written back', async () => {
  const first = startApp()
  await editVitaheal(first)
  first.chatbot.recordConversation({ id: 'live-1', chatbotId: 101, visitor: 'Visitor', startedAt: '2026-11-18T10:00:00.000Z', topic: 'Sleep', resolved: true, messages: [] })
  first.storeCampaigns.setEmailCampaign(first.storeCampaigns.campaignsForChannel(VH)[0]!.id, first.emails.createCampaign({ kind: 'email', name: 'Announcement', tag: STORE_CAMPAIGN_TAG, audienceSummary: 'Vitaheal customers' } as Parameters<typeof first.emails.createCampaign>[0]))
  await settle()
  const saved = Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)!]))
  // The keys browsers already hold, and since the theme library (part 4) the theme's edits.
  assert.deepEqual(Object.keys(saved).filter((key) => key.startsWith('mp.vitaheal-demo.')), [...VITAHEAL_KEYS, 'mp.vitaheal-demo.themes.v1'])

  const second = startApp(saved)
  await settle()
  assert.equal(second.commerce.products.find((product) => product.id === 2001)?.name, 'Unwind (edited)')
  assert.equal(second.storeCampaigns.campaignsForChannel(VH)[0]?.name, 'Campaign (edited)')
  assert.equal(second.chatbot.getByChannel(VH)?.config.welcomeMessage, 'Hello (edited)')
  assert.equal(second.channels.channels.find((channel) => channel.id === VH)?.webStore?.merchandiseConnected, true)
  assert.equal(second.themes.getTheme('theme-vitaheal')?.templates.home.find((section) => section.id === 'vitaheal-home-banner')?.hidden, true)
  assert.deepEqual(stateOf(second).plans, stateOf(first).plans)
  assert.deepEqual(stateOf(second).contracts, stateOf(first).contracts)
  assert.deepEqual(stateOf(second).searchRules, stateOf(first).searchRules)
  assert.deepEqual(Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)])), saved)
})

test('every store holds for Vitaheal what it held before the registry, in an empty browser and in one with saved changes', async () => {
  for (const scenario of ['fresh', 'saved'] as const) {
    const now = await frozen(async () => {
      const app = startApp(scenario === 'saved' ? SAVED_HEAD : {})
      await settle()
      return readVitaheal(app)
    })
    // What the registry adds on purpose: where the store came from, and the profile of a chatbot seeded now.
    const { blueprint, ...webStore } = now.channel.webStore
    const { assistantProfile, ...config } = now.chatbot.config
    assert.deepEqual(blueprint, { original: 'vitaheal', slot: 2 }, scenario)
    if (scenario === 'fresh') assert.equal(assistantProfile, 'wellness')
    const parts = { ...now, channel: { ...now.channel, webStore }, chatbot: { ...now.chatbot, config } }
    const before = beforeRegistry[scenario]
    assert.deepEqual(Object.keys(parts).sort(), Object.keys(before).sort(), scenario)
    for (const part of Object.keys(before)) assert.deepEqual(parts[part], before[part], `${scenario}: ${part}`)
  }
})

test('Vitaheal announces a campaign to its own customer list, with its own email', () => {
  const admin = homeBlueprintOf(VH)!.admin
  assert.equal(admin.audienceListId, VITAHEAL_CUSTOMERS_LIST_ID)
  assert.equal(admin.announcementContentId, VITAHEAL_CAMPAIGN_CONTENT_ID)
})

test('publishing another theme takes the old one off for good: discarding its edits later leaves it a draft', () => {
  const app = startApp()
  assert.equal(app.themes.getTheme('theme-neelam-aurora')?.status, 'Published')
  assert.equal(app.themes.getTheme('theme-neelam-lumos')?.status, 'Draft')
  app.themes.publishTheme('theme-neelam-lumos')
  app.themes.discardDraft('theme-neelam-aurora')
  assert.equal(app.themes.getTheme('theme-neelam-aurora')?.status, 'Draft')
  assert.deepEqual(app.themes.themesForChannel('neelam-store').filter((theme) => theme.status === 'Published').map((theme) => theme.id), ['theme-neelam-lumos'])
})

test('a duplicated product numbers its variants in its own block from 1, and the original keeps its ids', () => {
  const app = startApp()
  const variantIds = (id: number) => app.commerce.products.find((product) => product.id === id)!.detail!.variantsList.map((variant) => variant.id)
  const original = variantIds(2001)
  assert.ok(original.length >= 2, String(original))
  const copy = app.commerce.duplicateProduct(2001)!
  assert.deepEqual(variantIds(copy.id), original.map((_, i) => copy.id * 100 + i + 1))
  assert.deepEqual(variantIds(2001), original)
  assert.notEqual(copy.detail!.variantsList, app.commerce.products.find((product) => product.id === 2001)!.detail!.variantsList)
})

// A store made from a theme (Part 4: "Start from a theme"): the stores do not seed it
// on their own, so the app brings it in with useDemoStores().attach once its channel exists.
const CREATED = 'test-garage'
const CREATED_KEYS = (kept: string[]) => kept.filter((key) => key.startsWith(`mp.demo-store.${CREATED}.`))

/** What Part 4 will do on every start: put the created store's channel in the list. */
function addCreatedStore(app: App) {
  const vitaheal = plain(app.channels.channels.find((channel) => channel.id === VH))
  app.channels.channels.push({
    ...vitaheal, id: CREATED, name: 'Test Garage',
    webStore: { ...vitaheal.webStore, domain: 'test-garage.uat.maropost.store', blueprint: { original: 'vitaheal', slot: 5 } },
  })
}

/** What a merchant changed on the created store, as the stores hold it now. */
function createdStoreOf(app: App) {
  app.merch.setActiveChannel(CREATED)
  return plain({
    product: app.commerce.products.find((product) => product.id === 52001)?.name,
    campaign: app.storeCampaigns.campaignsForChannel(CREATED)[0]?.name,
    plan: app.subscriptions.plans.find((plan) => plan.channelId === CREATED)?.name,
    synonyms: app.merch.searchRulesFor(CREATED).synonyms.map((synonym) => synonym.queries.join()),
    welcome: app.chatbot.getByChannel(CREATED)?.config.welcomeMessage,
    status: app.chatbot.getById(104)?.status,
    contracts: app.subscriptions.contracts.filter((contract) => contract.channelId === CREATED).map((contract) => contract.number),
    chats: app.chatbot.conversationsFor(104).map((chat) => chat.id),
  })
}

test('a store made from a theme comes back after a reload with every change it saved; a reseed still resets it and a restore forgets it', async () => {
  const first = startApp()
  const vitaheal = readVitaheal(first)
  addCreatedStore(first)
  assert.equal(first.demoStores.attach(CREATED), true)
  await settle()
  const seeded = createdStoreOf(first)
  assert.equal(seeded.product, 'Unwind')
  assert.equal(seeded.status, 'Active')
  assert.deepEqual(seeded.contracts, [])
  assert.deepEqual(keptKeys(), [], 'bringing a store in writes nothing')

  // A merchant's afternoon on it, and a shopper who subscribes.
  first.commerce.products.find((product) => product.id === 52001)!.name = 'Unwind (garage)'
  first.storeCampaigns.saveCampaign({ ...first.storeCampaigns.campaignsForChannel(CREATED)[0]!, name: 'Campaign (garage)' })
  const plan = first.subscriptions.plans.find((p) => p.channelId === CREATED)!
  plan.name = 'Plan (garage)'
  first.merch.setActiveChannel(CREATED)
  first.merch.createSynonym({ type: 'two_way', queries: ['spanner'], leadsTo: ['wrench'] })
  first.chatbot.getByChannel(CREATED)!.config.welcomeMessage = 'Hello (garage)'
  first.chatbot.setStatus(104, 'Inactive')
  first.chatbot.recordConversation({ id: 'live-garage', chatbotId: 104, visitor: 'Visitor', startedAt: '2026-11-18T10:00:00.000Z', topic: 'Sleep', resolved: true, messages: [] })
  const product = first.commerce.products.find((p) => p.channelIds?.includes(CREATED) && plan.productIds.includes(p.id))!
  first.subscriptions.startFromCheckout({
    channelId: CREATED, methodId: 'card', customer: { name: 'Garage Shopper', email: 'shopper@example.com' }, amount: { currency: 'SEK' },
    order: { id: 990001, orderNumber: '#990001', date: '2026-11-18' },
    lineItems: [{ product: product.name, productId: product.id, sku: product.sku, qty: 1, price: product.price, plan: linePlan(plan) }],
  } as unknown as Parameters<typeof first.subscriptions.startFromCheckout>[0], { methodLabel: 'Visa •••• 4242' } as Parameters<typeof first.subscriptions.startFromCheckout>[1])
  await settle()
  const edited = createdStoreOf(first)
  assert.equal(edited.contracts.length, 1)
  assert.deepEqual(CREATED_KEYS(keptKeys()), ['campaigns', 'chatbot', 'conversations', 'merchandising', 'plans', 'products', 'subscriptions'].map((name) => `mp.demo-store.${CREATED}.${name}.v1`))
  const saved = Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)!]))

  // The next start: the store is brought in again and reads every change back, writing nothing.
  const second = startApp(saved)
  addCreatedStore(second)
  assert.equal(second.demoStores.attach(CREATED), true)
  await settle()
  assert.deepEqual(createdStoreOf(second), edited)
  assert.deepEqual(Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)])), saved)
  // Bringing it in again changes nothing.
  assert.equal(second.demoStores.attach(CREATED), true)
  await settle()
  assert.deepEqual(createdStoreOf(second), edited)
  // Vitaheal is as it was.
  assert.deepEqual(readVitaheal(second), vitaheal)

  // A reseed (an applied theme) puts the theme's parts back; the store's own history and its chatbot's on/off stay.
  for (const store of [second.channels, second.commerce, second.extras, second.themes, second.storefront, second.content, second.nav, second.storeCampaigns, second.merch, second.chatbot, second.subscriptions]) store.reseedDemo(CREATED)
  await settle()
  assert.deepEqual(createdStoreOf(second), { ...seeded, status: 'Inactive', contracts: edited.contracts, chats: edited.chats })
  assert.deepEqual(CREATED_KEYS(keptKeys()), ['chatbot', 'conversations', 'subscriptions'].map((name) => `mp.demo-store.${CREATED}.${name}.v1`))

  // A restore puts it back as it started and forgets everything this browser kept for it.
  assert.equal(second.demoStores.restore(CREATED), true)
  await settle()
  assert.deepEqual(createdStoreOf(second), seeded)
  assert.deepEqual(CREATED_KEYS(keptKeys()), [])
  assert.deepEqual(readVitaheal(second), vitaheal)
})

// ── Northfold (demo): the second demo store ─────────────────────────────────

const NF = 'northfold-demo'
const NORTHFOLD_BOT = 102
const NORTHFOLD_KEYS = (kept: string[]) => kept.filter((key) => key.startsWith(`mp.demo-store.${NF}.`))

/** Northfold's part of every store, as plain JSON. */
function northfoldOf(app: App) {
  app.merch.setActiveChannel(NF)
  const { updatedAt: _, ...channel } = app.channels.channels.find((c) => c.id === NF)!
  return plain({
    channel,
    products: app.commerce.products.filter((p) => p.channelIds?.includes(NF)),
    collections: app.extras.collections.filter((c) => c.salesChannels.includes(NF)),
    themes: app.themes.themesForChannel(NF),
    chrome: app.storefront.chromeFor(app.channels.channels.find((c) => c.id === NF)!),
    content: app.content.entries.filter((entry) => entry.channelId === NF),
    menus: app.nav.menus.filter((menu) => menu.channelId === NF),
    campaigns: app.storeCampaigns.campaignsForChannel(NF),
    searchRules: app.merch.searchRulesFor(NF),
    chatbot: app.chatbot.getByChannel(NF),
    chats: app.chatbot.conversationsFor(NORTHFOLD_BOT),
    plans: app.subscriptions.plans.filter((plan) => plan.channelId === NF),
    contracts: app.subscriptions.contracts.filter((contract) => contract.channelId === NF),
    emails: app.emails.campaigns.filter((email) => email.storeChannelId === NF).map((email) => email.id),
  })
}

test('every store seeds Northfold from its blueprint, connected to Merchandise Cloud, and writes nothing to the browser on load', async () => {
  const app = startApp()
  await settle()
  const nf = northfoldOf(app)
  assert.equal(nf.channel.name, 'Northfold (demo)')
  assert.deepEqual(nf.channel.webStore.blueprint, { original: 'northfold', slot: 3 })
  assert.equal(nf.channel.webStore.currency, 'USD')
  assert.equal(nf.channel.webStore.locale, undefined)
  assert.equal(nf.channel.webStore.merchandiseConnected, true)
  assert.ok(nf.channel.connectedClouds.includes('merchandise'))
  assert.equal(nf.channel.merchandising.status, 'connected')
  // The reference ids 3001-3020, in the store's order (northfoldDemo.ts PRODUCT_SEEDS).
  assert.deepEqual(nf.products.map((p: { id: number }) => p.id), [3003, 3005, 3006, 3007, 3001, 3002, 3004, 3008, 3009, 3010, 3011, 3012, 3015, 3016, 3017, 3018, 3019, 3013, 3014, 3020])
  assert.ok(nf.products.every((p: { status: string }) => p.status), 'every product has a stock status')
  assert.deepEqual(nf.collections.map((c: { id: number; title: string }) => [c.id, c.title]), [[3901, 'New in'], [3902, 'Women'], [3903, 'Men'], [3904, 'Knitwear'], [3905, 'Outerwear'], [3906, 'Sale']])
  assert.deepEqual(nf.themes.map((t: { id: string; status: string; styles: { drawing?: string } }) => [t.id, t.status, t.styles.drawing]), [['theme-northfold', 'Published', 'sections']])
  assert.equal(nf.chrome.copyright, '© 2026 Northfold (demo store)')
  assert.equal(nf.content.length, 8)
  assert.deepEqual(nf.menus.map((m: { id: string }) => m.id), ['menu-northfold-main', 'menu-northfold-footer'])
  assert.deepEqual(nf.campaigns.map((c: { offer: { code: string } }) => c.offer.code), ['LAYERS20', 'PREVIEW15', 'KNIT15'])
  assert.equal(nf.searchRules.synonyms.length, 5)
  assert.equal(nf.chatbot.id, NORTHFOLD_BOT)
  assert.equal(nf.chatbot.status, 'Active')
  assert.equal(nf.chatbot.conversations, 138)
  assert.equal(nf.chatbot.config.assistantProfile, 'apparel')
  assert.equal(nf.chatbot.config.storeUrl, 'https://2000290-13.uat.maropost.store')
  assert.equal(nf.chats.length, 3)
  assert.deepEqual(nf.plans, [])
  assert.deepEqual(nf.contracts, [])
  assert.deepEqual(keptKeys(), [])
  // Vitaheal is as it was.
  assert.equal(app.chatbot.getByChannel(VH)?.id, 101)
  assert.equal(app.channels.channels.find((c) => c.id === VH)?.webStore?.merchandiseConnected, false)
})

test('Northfold announces a campaign to its own customer list, with its own email', () => {
  startApp()
  const admin = homeBlueprintOf(NF)!.admin
  assert.equal(admin.audienceListId, NORTHFOLD_CUSTOMERS_LIST_ID)
  assert.equal(admin.announcementContentId, NORTHFOLD_CAMPAIGN_CONTENT_ID)
  assert.equal(admin.timezone, 'America/New_York')
  const list = useCdpEntitiesStore().lists.find((l) => l.id === NORTHFOLD_CUSTOMERS_LIST_ID)
  assert.equal(list?.name, 'Northfold customers')
  assert.equal(list?.fromEmail, 'hello@northfold.example')
  assert.equal(useContentStore().items.find((item) => item.id === NORTHFOLD_CAMPAIGN_CONTENT_ID)?.name, 'Northfold: campaign announcement')
})

test('Restore original store puts Northfold back as seeded, connected again, forgets every key it kept, and leaves Vitaheal alone', async () => {
  const app = startApp()
  await settle()
  const seeded = northfoldOf(app)
  const vitaheal = readVitaheal(app)

  // A merchant's afternoon on Northfold: something changed in every part it keeps.
  app.commerce.products.find((p) => p.id === 3015)!.name = 'Linen Overshirt (edited)'
  const campaign = app.storeCampaigns.campaignsForChannel(NF)[0]!
  app.storeCampaigns.saveCampaign({ ...campaign, name: 'Fall layers (edited)' })
  app.merch.setActiveChannel(NF)
  app.merch.createSynonym({ type: 'two_way', queries: ['cardi'], leadsTo: ['cardigan'] })
  app.channels.disconnectMerchandising(ACCOUNT, NF)
  app.chatbot.getByChannel(NF)!.config.welcomeMessage = 'Hello (edited)'
  app.chatbot.setStatus(NORTHFOLD_BOT, 'Inactive')
  app.chatbot.recordConversation({ id: 'live-nf', chatbotId: NORTHFOLD_BOT, visitor: 'Visitor', startedAt: '2026-11-19T10:00:00.000Z', topic: 'Sizing', resolved: true, messages: [] })
  app.storeCampaigns.setEmailCampaign(campaign.id, app.emails.createCampaign({ kind: 'email', name: 'Fall layers: announcement', tag: STORE_CAMPAIGN_TAG, audienceSummary: 'Northfold customers' } as Parameters<typeof app.emails.createCampaign>[0]))
  await settle()
  const edited = northfoldOf(app)
  assert.equal(edited.channel.webStore.merchandiseConnected, false)
  assert.equal(edited.emails.length, 1)
  assert.deepEqual(NORTHFOLD_KEYS(keptKeys()), ['campaigns', 'chatbot', 'conversations', 'merchandise', 'merchandising', 'products'].map((name) => `mp.demo-store.${NF}.${name}.v1`))
  assert.ok(keptKeys().includes('mp.vitaheal-demo.emails.v1'), 'the announcement is kept with every store\'s')

  // The next start reads every change back.
  const saved = Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)!]))
  const second = startApp(saved)
  await settle()
  const reloaded = northfoldOf(second)
  assert.equal(reloaded.products.find((p: { id: number }) => p.id === 3015).name, 'Linen Overshirt (edited)')
  assert.equal(reloaded.channel.webStore.merchandiseConnected, false)
  assert.equal(reloaded.chatbot.status, 'Inactive')
  assert.deepEqual(Object.fromEntries(keptKeys().map((key) => [key, memory.get(key)])), saved, 'reading it back writes nothing')

  assert.equal(second.demoStores.restore(NF), true)
  await settle()
  assert.deepEqual(northfoldOf(second), seeded)
  assert.deepEqual(NORTHFOLD_KEYS(keptKeys()), [])
  assert.deepEqual(keptKeys(), [], 'Northfold\'s announcement went with it, and nothing else was kept')
  assert.deepEqual(readVitaheal(second), vitaheal)
})
