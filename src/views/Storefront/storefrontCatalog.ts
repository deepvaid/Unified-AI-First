import { parseDecimal, zero } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { productHandle, toHandle } from '@/storefront/handles'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import type { SalesChannel } from '@/stores/useSalesChannels'
import { canApplyTheme } from '@/storefront/demoStores'
import { catalogFor, hasPriceRange, isAvailable, lowestPrice, storesWithOwnCatalogue } from '@/storefront/catalog'
import { formatStorePrice } from '@/storefront/price'
import { cardPrice, choiceSummary, isNewArrival, partNumber } from '@/storefront/listing'
import { roundForDisplay } from '@/subscriptions/plans'

// What a storefront sells. A store with products assigned to it (Vitaheal (demo)) sells
// those. The others share the account's published Commerce products: a stand-in,
// because the real store's catalogue couldn't be crawled (its product search was
// down), listed in docs/rebuild/neelam-store/GAPS.md. The rule is catalogFor.

export function storefrontProducts(products: Product[], channelId: string): Product[] {
  // A store that can take a theme (a demo store, one made with Create sales channel) never borrows the shared catalogue.
  return catalogFor(products, channelId, canApplyTheme(useSalesChannelsStore().channels.find((channel) => channel.id === channelId)))
}

// `/products/<name>-<id>`; the rule lives in src/storefront/handles.ts and is still exported from here.
export { productHandle }

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

/** A product as the admin's drawing of the storefront shows it. */
export interface PreviewProduct {
  /** The product's id: two products may share a name (a women's and a men's piece), never an id. */
  id: number
  name: string
  /** As the store's product card reads: "From 399 kr". */
  price: string
  image?: string
  /** Its photos in order, for the sections drawing's product page (two tiles). */
  images?: string[]
  /** The collections it is in, for a preview row that names one (the sections drawing). */
  collections?: string[]
  /** On sale, the price it was, as the store writes prices ("$40.00"); a Framed card strikes it through. */
  compareAt?: string
  /** A part's number, as its card shows it. */
  partNumber?: string
  /** What it comes in ("Front or rear"), as a part's card says. */
  choice?: string
  /** Its choices as its page offers them (a colour's swatches). */
  options?: { name: string; values: string[]; display?: 'buttons' | 'swatches'; swatches?: Record<string, string> }[]
  /** Its card's badge. */
  badge?: 'Sale' | 'New'
}

/**
 * The products a store's home page features, for the admin's drawing of it
 * (StorefrontPreview), in the storefront's own order and wording, with what its
 * card shows (a part's number, a sale's struck price, its badge). Only for a
 * store with products of its own: a store on the shared catalogue keeps the
 * drawn stand-ins, so this returns undefined for it.
 */
export function previewProducts(products: Product[], channel: Pick<SalesChannel, 'id' | 'webStore'>): PreviewProduct[] | undefined {
  if (!storesWithOwnCatalogue(products).includes(channel.id)) return undefined
  const currency = channel.webStore?.currency ?? 'USD'
  const locale = channel.webStore?.locale
  // The channel given, not the store's copy of it: the same products storefrontProducts sells, without reading the store.
  return catalogFor(products, channel.id, canApplyTheme(channel)).filter(inStock).map((product) => {
    const price = formatStorePrice(roundForDisplay(parseDecimal(lowestPrice(product), currency) ?? priceOf(product, currency)), locale)
    const was = cardPrice(product).compareAt
    const wasPrice = was ? parseDecimal(was, currency) : null
    return {
      id: product.id,
      name: product.name,
      price: hasPriceRange(product) ? `From ${price}` : price,
      image: product.imageUrls?.[0],
      images: product.imageUrls?.slice(0, 2),
      collections: product.collections,
      compareAt: wasPrice ? formatStorePrice(roundForDisplay(wasPrice), locale) : undefined,
      partNumber: partNumber(product),
      choice: choiceSummary(product),
      options: product.detail?.options.map((o) => ({ name: o.name, values: o.values, display: o.display, swatches: o.swatches })) ?? [],
      badge: was ? 'Sale' as const : isNewArrival(product) ? 'New' as const : undefined,
    }
  })
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
