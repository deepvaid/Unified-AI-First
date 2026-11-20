import { defineStore } from 'pinia'
import { ref } from 'vue'
import { browserStorage } from '@/stores/demoKeep'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useChatbotStore } from '@/stores/useChatbot'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { useProductExtrasStore } from '@/stores/useProductExtras'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import type { SalesChannel } from '@/stores/useSalesChannels'
import { useStoreCampaignsStore } from '@/stores/useStoreCampaigns'
import { useStoreContentStore } from '@/stores/useStoreContent'
import { useStoreNavigationStore } from '@/stores/useStoreNavigation'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { localDateKey } from '@/maropay/model'
import { canApplyTheme, demoStoreFor } from '@/storefront/demoStores'
import type { DemoStoreBlueprint, DemoStoreId, StoreSnapshot } from '@/storefront/demoStores'
import {
  clearInstalled, currentBlueprintId, installedSlot, isSeedStale, readInstalled, snapshotFor, writeInstalled,
} from '@/storefront/demoStores/install'

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

  /**
   * Every part of the store follows the blueprint it runs now. History stays.
   * Without `look`, the theme, collections, pages and menus are left as they are:
   * a restore of a store that kept its own theme never touched them (they are not
   * kept in the browser, so a reload puts them back anyway).
   */
  function reseed(channelId: string, look = true): void {
    useSalesChannelsStore().reseedDemo(channelId)
    useCommerceStore().reseedDemo(channelId)
    if (look) useProductExtrasStore().reseedDemo(channelId)
    if (look) useStoreThemesStore().reseedDemo(channelId)
    useStorefrontStore().reseedDemo(channelId)
    if (look) useStoreContentStore().reseedDemo(channelId)
    if (look) useStoreNavigationStore().reseedDemo(channelId)
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

  /** What only a restore puts back: the store's subscribers, chats, campaign emails and Merchandise Cloud connection as they were. */
  function restoreHistory(channelId: string): void {
    useSalesChannelsStore().restoreDemoHistory(channelId)
    useChatbotStore().restoreDemoHistory(channelId)
    useSubscriptionsStore().restoreDemoHistory(channelId)
    useCampaignsStore().restoreDemoHistory(channelId)
  }

  /**
   * Makes the store a copy of the theme's showcase store. Orders, subscribers,
   * chats and the Merchandise Cloud connection stay; the cart is emptied.
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
    useStorefrontCartStore().clear(channelId)
    return true
  }

  /**
   * Puts the store back as it started: its products, plans, campaigns, search
   * rules and chatbot as seeded, with its subscribers, chats, campaign emails and
   * Merchandise Cloud connection as they were. A store running another theme also
   * gets its own theme, collections, pages and menus back (the confirm dialog says
   * so); one that kept its own theme keeps this session's edits to them, as restore
   * always did. Orders stay; the cart is emptied. False when the store cannot take a theme.
   */
  function restore(channelId: string): boolean {
    const channel = channelOf(channelId)
    if (!channel || !canApplyTheme(channel)) return false
    const storage = browserStorage()
    const ranAnother = currentBlueprintId(channel, storage) !== channel.webStore!.blueprint!.original
    clearInstalled(channelId, storage)
    reseed(channelId, ranAnother)
    restoreHistory(channelId)
    markSeeded(channel)
    useStorefrontCartStore().clear(channelId)
    return true
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
  // After setup, so the stores it reseeds are not set up from inside this one.
  queueMicrotask(reseedStale)

  // Another tab applied a theme or restored a store. Each part also follows its own
  // slot, but a part with nothing saved fires no event when it is cleared. A removed
  // record is a restore: its history goes back here too, or this tab's reseed would
  // save its own state (a chatbot it had switched off, say) over the restored one.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      const channel = salesChannels.channels.find((c) => canApplyTheme(c) && installedSlot(c.id, browserStorage()).key === event.key)
      if (!channel) return
      reseed(channel.id)
      if (event.newValue === null) restoreHistory(channel.id)
      useStorefrontCartStore().clear(channel.id)
    })
  }

  return { blueprintOf, snapshotOf, canApply, attach, apply, restore }
})
