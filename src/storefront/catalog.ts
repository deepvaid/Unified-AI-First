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
