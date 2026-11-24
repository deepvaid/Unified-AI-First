import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { browserStorage } from '@/stores/demoKeep'
import { catalogFor } from '@/storefront/catalog'
import { canApplyTheme } from '@/storefront/demoStores'
import { WISHLIST_KEY, parseWishlists, serializeWishlists, shownIds, toggled, without } from '@/storefront/wishlist'

// The shopper's wishlist on each store whose theme has one (the sections drawing with
// the header's wishlist tool: Lumos). It is kept in this browser, per store, under
// `mp.storefront.wishlist.v1`, and follows another tab that changes it. A saved
// product the store no longer sells stays saved but is not shown or counted, so
// applying another theme, or taking a product off sale, never leaves a dead card.
// The rules are pure, in src/storefront/wishlist.ts.

export const useStorefrontWishlistStore = defineStore('storefrontWishlist', () => {
  const lists = ref(parseWishlists(browserStorage()?.getItem(WISHLIST_KEY)))

  watch(lists, (value) => {
    try {
      browserStorage()?.setItem(WISHLIST_KEY, serializeWishlists(value))
    } catch {
      // Storage blocked or full: the wishlist lasts for this page view.
    }
  }, { deep: true })

  // A heart pressed in another tab of the same store shows here too.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === WISHLIST_KEY) lists.value = parseWishlists(event.newValue)
    })
  }

  /** The products the store sells now, by id. */
  function soldBy(channelId: string): number[] {
    const channel = useSalesChannelsStore().channels.find((c) => c.id === channelId)
    return catalogFor(useCommerceStore().products, channelId, canApplyTheme(channel)).map((p) => p.id)
  }

  /** The saved products the store still sells, newest first. */
  function idsFor(channelId: string): number[] {
    return shownIds(lists.value[channelId] ?? [], soldBy(channelId))
  }

  /** The product is saved on the store. */
  function has(channelId: string, productId: number): boolean {
    return (lists.value[channelId] ?? []).includes(productId)
  }

  /** Saves the product, or takes it off when it was saved. True when it is saved now. */
  function toggle(channelId: string, productId: number): boolean {
    lists.value = { ...lists.value, [channelId]: toggled(lists.value[channelId] ?? [], productId) }
    return has(channelId, productId)
  }

  function remove(channelId: string, productId: number): void {
    lists.value = { ...lists.value, [channelId]: without(lists.value[channelId] ?? [], productId) }
  }

  /** Forgets the store's wishlist: a theme was applied or the store restored, so its products were replaced. */
  function clear(channelId: string): void {
    if (!lists.value[channelId]) return
    const { [channelId]: _, ...rest } = lists.value
    lists.value = rest
  }

  /** How many saved products the store still sells: the header heart's count. */
  function count(channelId: string): number {
    return idsFor(channelId).length
  }

  return { idsFor, has, toggle, remove, clear, count }
})
