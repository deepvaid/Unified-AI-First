import { defineStore } from 'pinia'
import { ref } from 'vue'
import { browserStorage } from '@/stores/demoKeep'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useChatbotStore } from '@/stores/useChatbot'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { useProductExtrasStore } from '@/stores/useProductExtras'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import type { CreateSalesChannelPayload, SalesChannel } from '@/stores/useSalesChannels'
import { useSizeChartsStore } from '@/stores/useSizeCharts'
import { useStoreCampaignsStore } from '@/stores/useStoreCampaigns'
import { useStoreContentStore } from '@/stores/useStoreContent'
import { useStoreLaunchStore } from '@/stores/useStoreLaunch'
import { useStoreNavigationStore } from '@/stores/useStoreNavigation'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useStorefrontVehicleStore } from '@/stores/useStorefrontVehicle'
import { useStorefrontWishlistStore } from '@/stores/useStorefrontWishlist'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { localDateKey } from '@/maropay/model'
import { canApplyTheme, demoStoreFor, homeBlueprintOf } from '@/storefront/demoStores'
import type { DemoStoreBlueprint, DemoStoreId, StoreSnapshot } from '@/storefront/demoStores'
import {
  clearInstalled, currentBlueprintId, historyFor, installedSlot, isSeedStale, readInstalled, snapshotFor, writeInstalled,
} from '@/storefront/demoStores/install'
import { applySummary, restoreMessage, restoreParts, restoreSummary, themeFacts } from '@/storefront/demoStores/summary'
import type { RestoreFacts } from '@/storefront/demoStores/summary'
import { CREATED_STORES_KEY, readCreatedStores, storeKeys } from '@/storefront/createdStores'

// Applying a theme from the library to a store, and putting a store back as it
// started ("Restore original store"). A demo store is a blueprint
// (src/storefront/demoStores/); each Pinia store keeps its own part of it, brings
// a store in with what this browser saved for it (attachDemo), and reseeds that
// part on request (reseedDemo, and restoreDemoHistory for what a store did before
// the demo). This store only says which blueprint a store runs and asks every
// part to follow.
//
// In its setup it reads the sales channels only; the other stores are reached
// from actions, so no store's setup waits on another's.

export const useDemoStores = defineStore('demoStores', () => {
  const salesChannels = useSalesChannelsStore()

  /** Bumped whenever a store's theme changes here or in another tab, so what reads the browser is read again. */
  const revision = ref(0)

  const channelOf = (channelId: string): SalesChannel | undefined => salesChannels.channels.find((channel) => channel.id === channelId)
  const today = (): string => localDateKey(Date.now())

  /** The blueprint the store runs now: the theme applied to it, else the one it started from. */
  function blueprintOf(channelId: string): DemoStoreBlueprint | undefined {
    void revision.value
    const channel = channelOf(channelId)
    const id = channel ? currentBlueprintId(channel, browserStorage()) : null
    return id ? demoStoreFor(id) : undefined
  }

  /** What the store is seeded with now: a fresh copy, or undefined for a store with no blueprint. */
  function snapshotOf(channelId: string): StoreSnapshot | undefined {
    const channel = channelOf(channelId)
    const id = blueprintOf(channelId)?.id
    return channel && id ? snapshotFor(channel, id, today()) : undefined
  }

  /** Whether a theme from the library can be applied to the store (and the store restored). */
  function canApply(channelId: string): boolean {
    return canApplyTheme(channelOf(channelId))
  }

  /** Every part of the store follows the blueprint it runs now. History stays. */
  function reseed(channelId: string): void {
    useSalesChannelsStore().reseedDemo(channelId)
    useCommerceStore().reseedDemo(channelId)
    // Kept in the browser like the products, so a restore always puts them back.
    useSizeChartsStore().reseedDemo(channelId)
    useProductExtrasStore().reseedDemo(channelId)
    useStoreThemesStore().reseedDemo(channelId)
    useStorefrontStore().reseedDemo(channelId)
    useStoreContentStore().reseedDemo(channelId)
    useStoreNavigationStore().reseedDemo(channelId)
    useStoreCampaignsStore().reseedDemo(channelId)
    useMerchandisingStore().reseedDemo(channelId)
    useChatbotStore().reseedDemo(channelId)
    useSubscriptionsStore().reseedDemo(channelId)
    revision.value++
  }

  /**
   * Brings a store that can take a theme in with what this browser saved for it,
   * as the app starts: a store made from a theme, which the stores do not seed on
   * their own (they seed the demo stores' own channels). Every part is seeded as
   * the theme the store runs now has it, then what was saved for it is read back;
   * nothing is cleared. Calling it again does nothing; so does calling it for a
   * seeded demo store. False when the store cannot take a theme.
   */
  function attach(channelId: string): boolean {
    if (!canApplyTheme(channelOf(channelId))) return false
    useSalesChannelsStore().attachDemo(channelId)
    useCommerceStore().attachDemo(channelId)
    useSizeChartsStore().attachDemo(channelId)
    useProductExtrasStore().attachDemo(channelId)
    useStoreThemesStore().attachDemo(channelId)
    useStorefrontStore().attachDemo(channelId)
    useStoreContentStore().attachDemo(channelId)
    useStoreNavigationStore().attachDemo(channelId)
    useStoreCampaignsStore().attachDemo(channelId)
    useMerchandisingStore().attachDemo(channelId)
    useChatbotStore().attachDemo(channelId)
    useSubscriptionsStore().attachDemo(channelId)
    return true
  }

  /** What only a restore puts back: the store's subscribers, chats, campaign emails and Merchandise Cloud connection as they were, its theme without drafts, and its launch checklist with nothing marked done. */
  function restoreHistory(channelId: string): void {
    useSalesChannelsStore().restoreDemoHistory(channelId)
    useStoreThemesStore().restoreDemoHistory(channelId)
    useChatbotStore().restoreDemoHistory(channelId)
    useSubscriptionsStore().restoreDemoHistory(channelId)
    useCampaignsStore().restoreDemoHistory(channelId)
    // The launch checklist starts again: nothing is marked done by hand.
    useStoreLaunchStore().forget(channelId)
  }

  /**
   * Makes the store a copy of the theme's showcase store. Orders, subscribers,
   * chats and the Merchandise Cloud connection stay; the cart is emptied and the
   * shopper's vehicle forgotten.
   * Applying the theme the store started from is a restore. False when the store
   * cannot take a theme, or the browser refused to remember it.
   */
  function apply(channelId: string, blueprintId: DemoStoreId): boolean {
    const channel = channelOf(channelId)
    if (!channel || !canApplyTheme(channel)) return false
    if (blueprintId === channel.webStore?.blueprint?.original) return restore(channelId)
    // First, so a tab that sees a part cleared already reseeds it from this theme.
    const recorded = writeInstalled(channelId, { blueprintId, seedVersion: demoStoreFor(blueprintId).seedVersion, appliedAt: new Date().toISOString() }, browserStorage())
    if (!recorded) return false
    reseed(channelId)
    useStorefrontCartStore().storeChanged(channelId)
    useStorefrontVehicleStore().clearVehicle(channelId)
    useStorefrontWishlistStore().clear(channelId)
    return true
  }

  /**
   * Puts the store back as it started: its theme (drafts and copies removed),
   * collections, pages, menus, products, plans, campaigns, search rules and chatbot
   * as seeded, with its subscribers, chats, campaign emails and Merchandise Cloud
   * connection as they were. Orders stay; the cart is emptied and the vehicle
   * forgotten. False when the store cannot take a theme.
   */
  function restore(channelId: string): boolean {
    const channel = channelOf(channelId)
    if (!channel || !canApplyTheme(channel)) return false
    clearInstalled(channelId, browserStorage())
    reseed(channelId)
    restoreHistory(channelId)
    markSeeded(channel)
    useStorefrontCartStore().storeChanged(channelId)
    useStorefrontVehicleStore().clearVehicle(channelId)
    useStorefrontWishlistStore().clear(channelId)
    return true
  }

  /** A store made with Create sales channel (kept in this browser): the only kind that can be deleted. */
  function isCreated(channelId: string): boolean {
    void revision.value
    return salesChannels.isCreatedStore(channelId)
  }

  /**
   * Makes a sales channel. A web store with Store Builder switched on can take a
   * theme, is kept in this browser, and starts as a copy of `payload.theme` (or blank):
   * every part is seeded here, so it is ready when the page it opens on reads it.
   */
  function create(accountId: string, payload: CreateSalesChannelPayload): SalesChannel {
    const channel = salesChannels.createChannel(accountId, payload)
    attach(channel.id)
    // Record the seed the store was made at, or the next start counts it as seed 1 and,
    // once its theme's blueprint is past that (Vitaheal is at 2), seeds it again over its changes.
    const made = salesChannels.channels.find((c) => c.id === channel.id) ?? channel
    markSeeded(made)
    revision.value++
    return made
  }

  /**
   * Deletes a store made here: every part of it is emptied, everything this browser
   * kept for it is removed, and it leaves the list. Orders placed on it stay. False
   * for any other store.
   */
  function remove(channelId: string): boolean {
    const channel = channelOf(channelId)
    if (!channel || !salesChannels.isCreatedStore(channelId)) return false
    empty(channel)
    const storage = browserStorage()
    for (const key of storeKeys(storage, channelId)) storage?.removeItem(key)
    salesChannels.deleteCreatedStore(channelId)
    revision.value++
    return true
  }

  /** Every part of a created store empties itself, as if it ran no theme: no theme, products, pages, plans or rules. */
  function empty(channel: SalesChannel): void {
    const webStore = channel.webStore!
    channel.webStore = { ...webStore, blueprint: { ...webStore.blueprint!, original: null } }
    clearInstalled(channel.id, browserStorage())
    reseed(channel.id)
    restoreHistory(channel.id)
    useStorefrontCartStore().clear(channel.id)
    useStorefrontVehicleStore().clearVehicle(channel.id)
    useStorefrontWishlistStore().clear(channel.id)
  }

  /** The store's storefront has a wishlist now: the sections drawing, with the header's wishlist tool. */
  function showsWishlist(channel: SalesChannel): boolean {
    return useStoreThemesStore().themeForChannel(channel.id)?.styles.drawing === 'sections'
      && useStorefrontStore().chromeFor(channel).headerTools.includes('wishlist')
  }

  /** The store as Apply and Restore count it: what it sells now. */
  function storeFacts(channel: SalesChannel) {
    const subscriptions = useSubscriptionsStore()
    const running = blueprintOf(channel.id)
    // Plans the theme applied now brought: the next Apply removes them rather than pausing them.
    const applied = running && running.id !== channel.webStore?.blueprint?.original ? running : undefined
    const brought = new Set(applied ? snapshotFor(channel, applied.id, today()).plans.map((plan) => plan.id) : [])
    const plans = subscriptions.plans.filter((plan) => plan.channelId === channel.id)
    return {
      name: channel.name,
      blank: !running,
      sizeCharts: useSizeChartsStore().chartsForChannel(channel.id).length,
      products: useCommerceStore().products.filter((product) => product.channelIds?.includes(channel.id)).length,
      currency: channel.webStore?.currency ?? 'USD',
      activePlans: plans.filter((plan) => !brought.has(plan.id) && plan.status !== 'Paused').length,
      runs: applied?.card.name ?? null,
      broughtPlans: plans.filter((plan) => brought.has(plan.id)).length,
      searchConnected: !!channel.webStore?.merchandiseConnected,
      wishlist: showsWishlist(channel),
      subscribers: subscriptions.contracts.filter((contract) => contract.channelId === channel.id).length,
    }
  }

  /** What applying `blueprintId` to the store does, one line each, for its confirm dialog. Empty when it cannot. */
  function applyPreview(channelId: string, blueprintId: DemoStoreId): string[] {
    const channel = channelOf(channelId)
    if (!channel || !canApplyTheme(channel)) return []
    const blueprint = demoStoreFor(blueprintId)
    return applySummary(storeFacts(channel), themeFacts(blueprint.card.name, snapshotFor(channel, blueprintId, today())))
  }

  /** What a restore puts back, counted from the seed of the theme the store started with; null when it cannot be restored. */
  function restoreFacts(channelId: string): RestoreFacts | null {
    void revision.value
    const channel = channelOf(channelId)
    if (!channel || !canApplyTheme(channel)) return null
    const original = channel.webStore!.blueprint!.original
    const running = blueprintOf(channelId)?.id ?? null
    const seed = original ? snapshotFor(channel, original, today()) : null
    // What the store priced in before: its own theme's market, or (blank) what it was made with, which is none or the account's.
    const before = seed ? seed.market.currency : salesChannels.madeWith(channelId)?.webStore?.currency ?? 'USD'
    const now = channel.webStore?.currency ?? 'USD'
    const appliedPlans = running && running !== original ? snapshotFor(channel, running, today()).plans.length : 0
    const started = salesChannels.startedConnected(channelId)
    const connected = !!channel.webStore?.merchandiseConnected
    return {
      original: original ? demoStoreFor(original).card.name : null,
      applied: running && running !== original ? demoStoreFor(running).card.name : null,
      plans: seed?.plans.length ?? 0,
      subscribers: historyFor(channelId, today())?.subscriptions.length ?? 0,
      campaigns: seed?.campaigns.length ?? 0,
      sizeCharts: seed?.sizeCharts.length ?? 0,
      announcesByEmail: homeBlueprintOf(channelId)?.admin.audienceListId !== undefined,
      ...(before !== now ? { pricesBackTo: before } : {}),
      ...(appliedPlans ? { appliedPlans } : {}),
      ...(showsWishlist(channel) ? { wishlist: true } : {}),
      ...(started !== connected ? { connectionBack: started ? 'connected' as const : 'disconnected' as const } : {}),
    }
  }

  /** What restoring the store does (its confirm dialog), and what it keeps in this browser (the restore card and toast). Null when it cannot be restored. */
  function restorePreview(channelId: string): { message: string; lines: string[]; parts: { card: string } } | null {
    const facts = restoreFacts(channelId)
    const channel = channelOf(channelId)
    return facts && channel ? { message: restoreMessage(channel.name, facts), lines: restoreSummary(facts), parts: restoreParts(facts) } : null
  }

  /**
   * A store without an `installed` record counts as seeded at version 1. Once the
   * blueprint it runs is past that, record the version it was seeded at now, or
   * the next start would seed it again over the merchant's changes. Called after
   * the reseed, whose cleared slots make room for the record in a full browser.
   * If the browser still refuses it, the next start seeds the store again; nothing
   * here tries again.
   */
  function markSeeded(channel: SalesChannel): void {
    const storage = browserStorage()
    if (!isSeedStale(channel, storage)) return
    const id = currentBlueprintId(channel, storage)!
    writeInstalled(channel.id, { blueprintId: id, seedVersion: demoStoreFor(id).seedVersion, appliedAt: readInstalled(channel.id, storage)?.appliedAt ?? new Date().toISOString() }, storage)
  }

  /** A seed fix reaches a browser that saved the old seed: such a store is seeded again (src/storefront/demoStores/install.ts, isSeedStale). */
  function reseedStale(): void {
    for (const channel of salesChannels.channels) {
      if (!canApplyTheme(channel) || !isSeedStale(channel, browserStorage())) continue
      reseed(channel.id)
      markSeeded(channel)
    }
  }
  // After setup, so the stores it seeds are not set up from inside this one: the
  // stores made here come in first, then any store whose seed is out of date is seeded again.
  queueMicrotask(() => {
    for (const channel of salesChannels.channels) if (salesChannels.isCreatedStore(channel.id)) attach(channel.id)
    reseedStale()
  })

  // Another tab applied a theme or restored a store. Each part also follows its own
  // slot, but a part with nothing saved fires no event when it is cleared. A removed
  // record is a restore: its history goes back here too, or this tab's reseed would
  // save its own state (a chatbot it had switched off, say) over the restored one.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      // Another tab made or deleted a store: the list follows, and a new store comes in.
      if (event.key === CREATED_STORES_KEY) {
        const listed = new Set(readCreatedStores(browserStorage()).map((channel) => channel.id))
        // A deleted store empties here too before it leaves the list, or its products would linger until a reload.
        for (const channel of salesChannels.channels) if (salesChannels.isCreatedStore(channel.id) && !listed.has(channel.id)) empty(channel)
        for (const id of salesChannels.syncCreatedStores().added) attach(id)
        revision.value++
        return
      }
      const channel = salesChannels.channels.find((c) => canApplyTheme(c) && installedSlot(c.id, browserStorage()).key === event.key)
      if (!channel) return
      reseed(channel.id)
      if (event.newValue === null) restoreHistory(channel.id)
      useStorefrontCartStore().storeChanged(channel.id)
      useStorefrontVehicleStore().clearVehicle(channel.id)
      useStorefrontWishlistStore().clear(channel.id)
    })
  }

  return { blueprintOf, snapshotOf, canApply, attach, apply, restore, isCreated, create, remove, applyPreview, restoreFacts, restorePreview }
})
