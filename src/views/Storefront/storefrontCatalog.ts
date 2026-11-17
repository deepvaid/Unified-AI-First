import { parseDecimal, zero } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { toHandle } from '@/stores/useProductExtras'
import { catalogFor, isAvailable } from '@/storefront/catalog'

// What a storefront sells. A store with products assigned to it (Vitaheal (demo)) sells
// those. The others share the account's published Commerce products: a stand-in,
// because the real store's catalogue couldn't be crawled (its product search was
// down), listed in docs/rebuild/neelam-store/GAPS.md. The rule is catalogFor.

export function storefrontProducts(products: Product[], channelId: string): Product[] {
  return catalogFor(products, channelId)
}

/** `/products/<name>-<id>`: the id keeps the link working if the product is renamed. */
export function productHandle(product: Pick<Product, 'name' | 'id'>): string {
  return `${toHandle(product.name)}-${product.id}`
}

export function productFromHandle(products: Product[], channelId: string, handle: string): Product | undefined {
  const id = Number(/-(\d+)$/.exec(handle)?.[1] ?? Number.NaN)
  return storefrontProducts(products, channelId).find((p) => p.id === id)
}

export interface StorefrontCollection {
  name: string
  handle: string
}

export function collectionsOf(products: Product[], channelId: string): StorefrontCollection[] {
  const names = [...new Set(storefrontProducts(products, channelId).flatMap((p) => p.collections))].sort()
  return names.map((name) => ({ name, handle: toHandle(name) }))
}

/** `all` is every product, as on Maropost stores. */
export function collectionByHandle(products: Product[], channelId: string, handle: string): { title: string; products: Product[] } | undefined {
  const listed = storefrontProducts(products, channelId)
  if (handle === 'all') return { title: 'All Products', products: listed }
  const collection = collectionsOf(products, channelId).find((c) => c.handle === handle)
  return collection ? { title: collection.name, products: listed.filter((p) => p.collections.includes(collection.name)) } : undefined
}

export function relatedProducts(products: Product[], channelId: string, product: Product, count = 4): Product[] {
  return storefrontProducts(products, channelId).filter((p) => p.id !== product.id && p.category === product.category).slice(0, count)
}

export function priceOf(product: Product, currency: string): Money {
  return parseDecimal(product.price, currency) ?? zero(currency)
}

export function inStock(product: Product): boolean {
  return isAvailable(product)
}

/** Stands in for the product photograph. */
export const CATEGORY_ICONS: Record<string, string> = {
  Electronics: 'headphones',
  Apparel: 'shirt',
  'Home & Kitchen': 'cooking-pot',
  'Sports & Outdoors': 'tent',
  'Beauty & Health': 'sparkles',
  'Tools & Garden': 'hammer',
}
