// Which products a web store sells, and how a product's price reads on a card.
// Pure rules: no Vue, no Pinia, no `@/` imports, so `npm run test:storefront` runs them in Node.

/** The fields these rules read. A commerce `Product` satisfies it. */
export interface CatalogProduct {
  publishStatus: string
  price: string
  /** Sales channels this product is assigned to. Absent: it belongs to the account's shared catalogue. */
  channelIds?: string[]
  detail?: { variantsList: { price: string }[] }
}

/**
 * The published products a store's shoppers see.
 *
 * A store that has products assigned to it sells only those. A store with none
 * sells the shared catalogue: every product that is assigned to no store. So a
 * product seeded for one store never shows up in another.
 */
export function catalogFor<T extends CatalogProduct>(products: T[], channelId: string): T[] {
  const assigned = products.filter((p) => p.channelIds?.includes(channelId))
  const pool = assigned.length ? assigned : products.filter((p) => !p.channelIds?.length)
  return pool.filter((p) => p.publishStatus === 'Published')
}

/** True when the variants don't all cost the same, so a card shows "From" before the lowest price. */
export function hasPriceRange(product: CatalogProduct): boolean {
  const prices = new Set((product.detail?.variantsList ?? []).map((v) => Number.parseFloat(v.price)).filter(Number.isFinite))
  return prices.size > 1
}

/** The lowest variant price as a decimal string; the product's own price when it has no variants. */
export function lowestPrice(product: CatalogProduct): string {
  const prices = (product.detail?.variantsList ?? []).map((v) => Number.parseFloat(v.price)).filter(Number.isFinite)
  return prices.length ? Math.min(...prices).toFixed(2) : product.price
}

// ── Product form rules ───────────────────────────────────────────────────────

/** The stores that have products of their own, by sales channel id, in the order they first appear. */
export function storesWithOwnCatalogue(products: Pick<CatalogProduct, 'channelIds'>[]): string[] {
  return [...new Set(products.flatMap((p) => p.channelIds ?? []))]
}

/**
 * The stores behind the sales channels picked on a product form. None: the
 * product stays in the shared catalogue, as every product did before.
 */
export function channelIdsFor(picked: string[], stores: { id: string; name: string }[]): string[] {
  return stores.filter((store) => picked.includes(store.name)).map((store) => store.id)
}

/** The fields the stock rules read. A commerce `ProductVariant` satisfies it. */
export interface StockVariant {
  manageInventory: boolean
  allowBackorder: boolean
  /** On-hand counts by location name. */
  stock: Record<string, number>
}

/** Units on hand across every location, counting only the variants whose stock is tracked. */
export function totalStock(variants: StockVariant[]): number {
  return variants
    .filter((v) => v.manageInventory)
    .reduce((total, v) => total + Object.values(v.stock).reduce((sum, qty) => sum + (Number(qty) || 0), 0), 0)
}

/** A shopper can buy it: there is stock, or a variant is sold without tracking stock or on backorder. */
export function isAvailable(product: { inventory: number; detail?: { variantsList: StockVariant[] } }): boolean {
  if (product.inventory > 0) return true
  return (product.detail?.variantsList ?? []).some((v) => !v.manageInventory || v.allowBackorder)
}

/** `primary` leads and the product's other collections stay. Without a primary nothing changes. */
export function withPrimaryCollection(collections: string[], primary: string): string[] {
  return primary ? [primary, ...collections.filter((c) => c !== primary)] : collections
}
