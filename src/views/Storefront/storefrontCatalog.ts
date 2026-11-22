import { parseDecimal, zero } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { toHandle } from '@/stores/useProductExtras'

// What the storefront sells. The real store's catalogue couldn't be crawled (its
// product search was down), so every web store sells the account's published
// Commerce products — a stand-in, listed in docs/rebuild/neelam-store/GAPS.md.

export function storefrontProducts(products: Product[]): Product[] {
  return products.filter((p) => p.publishStatus === 'Published')
}

/** `/products/<name>-<id>`: the id keeps the link working if the product is renamed. */
export function productHandle(product: Pick<Product, 'name' | 'id'>): string {
  return `${toHandle(product.name)}-${product.id}`
}

export function productFromHandle(products: Product[], handle: string): Product | undefined {
  const id = Number(/-(\d+)$/.exec(handle)?.[1] ?? Number.NaN)
  return storefrontProducts(products).find((p) => p.id === id)
}

export interface StorefrontCollection {
  name: string
  handle: string
}

export function collectionsOf(products: Product[]): StorefrontCollection[] {
  const names = [...new Set(storefrontProducts(products).flatMap((p) => p.collections))].sort()
  return names.map((name) => ({ name, handle: toHandle(name) }))
}

/** `all` is every product, as on Maropost stores. */
export function collectionByHandle(products: Product[], handle: string): { title: string; products: Product[] } | undefined {
  const listed = storefrontProducts(products)
  if (handle === 'all') return { title: 'All Products', products: listed }
  const collection = collectionsOf(products).find((c) => c.handle === handle)
  return collection ? { title: collection.name, products: listed.filter((p) => p.collections.includes(collection.name)) } : undefined
}

export function relatedProducts(products: Product[], product: Product, count = 4): Product[] {
  return storefrontProducts(products).filter((p) => p.id !== product.id && p.category === product.category).slice(0, count)
}

export function priceOf(product: Product, currency: string): Money {
  return parseDecimal(product.price, currency) ?? zero(currency)
}

export function inStock(product: Product): boolean {
  return product.inventory > 0
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
