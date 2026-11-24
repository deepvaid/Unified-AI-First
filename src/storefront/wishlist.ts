// A shopper's wishlist on a store drawn with the sections drawing (Lumos): the
// products they saved with a heart, kept in this browser per store. What the
// browser keeps, how a heart toggles, which saved products a store still sells
// (only those are shown and counted), and what the hearts and the header say.
//
// Pure rules: no Vue, no Pinia, no `@/` imports, so `npm run test:storefront`
// runs them in Node. The Pinia store is src/stores/useStorefrontWishlist.ts.

/** Where the browser keeps every store's wishlist: `{ [channelId]: productId[] }`, oldest first. */
export const WISHLIST_KEY = 'mp.storefront.wishlist.v1'

/** Each store's saved product ids, in the order they were saved. */
export type SavedWishlists = Record<string, number[]>

const isProductId = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0

/** A store's saved ids, cleaned: product ids only, each once, in the order first saved. */
function cleanIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isProductId))]
}

/**
 * What the browser keeps, read back. Anything malformed (no value, bad JSON, a
 * store whose list is not a list of ids) reads as nothing saved for that store.
 */
export function parseWishlists(raw: string | null | undefined): SavedWishlists {
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
  const lists: SavedWishlists = {}
  for (const [channelId, ids] of Object.entries(parsed as Record<string, unknown>)) {
    const clean = cleanIds(ids)
    if (channelId && clean.length) lists[channelId] = clean
  }
  return lists
}

/** The lists as the browser keeps them: stores with nothing saved are left out. */
export function serializeWishlists(lists: SavedWishlists): string {
  return JSON.stringify(Object.fromEntries(Object.entries(lists).filter(([, ids]) => ids.length)))
}

/** The list with the product saved (last, as the newest) or, when it was saved, taken off. */
export function toggled(ids: readonly number[], productId: number): number[] {
  return ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]
}

/** The list without the product. */
export function without(ids: readonly number[], productId: number): number[] {
  return ids.filter((id) => id !== productId)
}

/**
 * The saved products a store still sells, newest first: what its wishlist page
 * shows and its header counts. A product the store no longer sells (taken off
 * sale, or left behind when another theme was applied) is kept but not shown.
 */
export function shownIds(ids: readonly number[], sold: Iterable<number>): number[] {
  const selling = new Set(sold)
  return ids.filter((id) => selling.has(id)).reverse()
}

/** How many saved products a store still sells. */
export function wishlistCount(ids: readonly number[], sold: Iterable<number>): number {
  return shownIds(ids, sold).length
}

// ── What it says ─────────────────────────────────────────────────────────────

/**
 * A heart's name: the same whether the product is saved or not, because the
 * button says its state itself (`aria-pressed`): "Save Arlo 3-Seat Sofa to your
 * wishlist, toggle button, pressed" reads as saved.
 */
export function heartLabel(productName: string): string {
  return `Save ${productName} to your wishlist`
}

/** What screen readers hear, politely, once a heart is pressed. */
export function toggleAnnouncement(productName: string, savedNow: boolean): string {
  return savedNow ? `Saved to your wishlist · ${productName}` : `Removed from your wishlist · ${productName}`
}

/** The header heart's name: "Wishlist", or "Wishlist, 2 items" once something is saved. */
export function wishlistLinkLabel(count: number): string {
  return count > 0 ? `Wishlist, ${count} ${count === 1 ? 'item' : 'items'}` : 'Wishlist'
}

/** The line under the wishlist page's title: "2 items saved". */
export function savedCountText(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'} saved`
}
