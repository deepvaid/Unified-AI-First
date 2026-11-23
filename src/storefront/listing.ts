// How a product reads in a store's product lists on the richer theme drawing
// (the collection and search pages of Northfold and Torqline): its price and
// sale, its colours, the photo for a chosen colour, whether quick add needs a
// choice, what the list calls what it holds, and the grid settings the
// collection template gives it. Filters and sort are in ./facets.ts.
//
// Pure rules: no Vue, no Pinia, no `@/` imports, so `npm run test:storefront`
// runs them in Node.

import { optionKey, optionKind, variantAvailable } from './variants.ts'
import type { SellableVariant, VariantOption } from './variants.ts'
import type { ListingNoun } from './facets.ts'

// ── What these rules read ────────────────────────────────────────────────────

/** The fields these rules read from a variant. A commerce `ProductVariant` satisfies it. */
export interface CardVariant extends SellableVariant {
  price: string
  /** The crossed-out "was" price. */
  compareAtPrice?: string
}

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface CardProduct {
  id: number
  price: string
  /** The "was" price of a product without variants; '' when it has none. */
  compareAtPrice?: string
  /** Units on hand, for a product without variants. */
  inventory: number
  collections?: string[]
  imageUrls?: string[]
  detail?: {
    options: VariantOption[]
    variantsList: CardVariant[]
    /** Photos per colour ("Sand" → its photos), for a product photographed in every colour. */
    imagesByColor?: Record<string, string[]>
    /** The vehicles a part fits (auto-parts stores). */
    fitment?: unknown
  }
}

const toNumber = (value: string | undefined): number => {
  const n = Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : Number.NaN
}

// ── Price ────────────────────────────────────────────────────────────────────

export interface CardPrice {
  /** What the shopper pays, as a decimal string ("98.00"): the lowest price of a variant in stock. */
  price: string
  /** The crossed-out "was" price, only when it is above `price`. */
  compareAt?: string
  /** "−20%" on the card: the saving on the "was" price, rounded. */
  salePercent?: number
  /** The variants differ in price, so the card reads "From $34.00". */
  from: boolean
}

/**
 * The price a card shows: the lowest a shopper can buy at now (a variant in
 * stock; any variant when none is), with that variant's "was" price when it is
 * on sale. Matches the price the filters and sorts use (./facets.ts).
 */
export function cardPrice(product: CardProduct): CardPrice {
  const variants = product.detail?.variantsList ?? []
  const priced = variants.filter((variant) => Number.isFinite(toNumber(variant.price)))
  const from = new Set(priced.map((variant) => toNumber(variant.price))).size > 1
  if (!priced.length) return withSale(product.price, product.compareAtPrice, false)
  const pool = priced.some(variantAvailable) ? priced.filter(variantAvailable) : priced
  const cheapest = pool.reduce((low, variant) => (toNumber(variant.price) < toNumber(low.price) ? variant : low))
  return withSale(cheapest.price, cheapest.compareAtPrice || product.compareAtPrice, from)
}

function withSale(price: string, compareAt: string | undefined, from: boolean): CardPrice {
  const now = toNumber(price)
  const was = toNumber(compareAt)
  if (!Number.isFinite(was) || !Number.isFinite(now) || was <= now) return { price, from }
  return { price, compareAt, salePercent: Math.round(((was - now) / was) * 100), from }
}

// ── Colours and photos ───────────────────────────────────────────────────────

export interface CardColor {
  /** As the product names it: "Heather Gray". */
  name: string
  /** As the URL writes it: "heather-gray". */
  key: string
  /** Its swatch, when the product has one. */
  hex?: string
  /** A variant in this colour can be bought. */
  available: boolean
}

/** The product's colours in its own order, with their swatches. None for a product without a colour option. */
export function colorsOf(product: CardProduct): CardColor[] {
  const options = product.detail?.options ?? []
  const at = options.findIndex((option) => optionKind(option) === 'color')
  if (at < 0) return []
  const option = options[at]!
  const variants = product.detail?.variantsList ?? []
  return option.values.map((name) => ({
    name,
    key: optionKey(name),
    ...(option.swatches?.[name] ? { hex: option.swatches[name] } : {}),
    available: variants.some((variant) => valuesOf(variant, options)[at] === name && variantAvailable(variant)),
  }))
}

/** A variant's option values: its own, else its title split by " / " (as ./variants.ts reads older seeds). */
function valuesOf(variant: CardVariant, options: readonly VariantOption[]): string[] {
  if (variant.optionValues?.length === options.length) return variant.optionValues
  if (options.length === 1) return [variant.title.trim()]
  return variant.title.split(' / ').map((part) => part.trim())
}

/**
 * The colour a card shows when the list is filtered by colour: the first of the
 * chosen colours (URL keys, in the order chosen) that the product comes in.
 * Undefined when no colour is chosen or the product has none of them.
 */
export function chosenColor(product: CardProduct, colorKeys: readonly string[]): CardColor | undefined {
  const colors = colorsOf(product)
  for (const key of colorKeys) {
    const color = colors.find((c) => c.key === key)
    if (color) return color
  }
  return undefined
}

/**
 * The photo a card leads with: the chosen colour's own first photo when the
 * product was photographed in that colour, else its first photo. Undefined for
 * a product without photos (the card draws its placeholder).
 */
export function cardPhoto(product: CardProduct, color?: Pick<CardColor, 'name'>): string | undefined {
  const own = color ? product.detail?.imagesByColor?.[color.name]?.[0] : undefined
  return own ?? product.imageUrls?.[0]
}

// ── Badges ───────────────────────────────────────────────────────────────────

/** A product shopped from a "New…" collection ("New in", "New arrivals") is new. */
export function isNewArrival(product: Pick<CardProduct, 'collections'>): boolean {
  return (product.collections ?? []).some((name) => /^new\b/i.test(name.trim()))
}

/** The products sold out in every variant (a product without variants: no units on hand). */
export function soldOut(product: CardProduct): boolean {
  const variants = product.detail?.variantsList ?? []
  return variants.length ? !variants.some(variantAvailable) : product.inventory <= 0
}

// ── Quick add ────────────────────────────────────────────────────────────────

/**
 * Quick add must ask before adding: an option has more than one value to
 * choose from. A product with one variant (or one value per option) is added
 * straight from the card.
 */
export function needsChoice(product: CardProduct): boolean {
  return (product.detail?.options ?? []).some((option) => option.values.length > 1)
    || (!(product.detail?.options ?? []).length && (product.detail?.variantsList ?? []).length > 1)
}

// ── The list ─────────────────────────────────────────────────────────────────

/**
 * What a list calls what it holds, from the products in it: "styles" where
 * they come in sizes (clothing), "parts" where they carry vehicle fitment,
 * else "products". So a store's copy follows its catalogue, wherever it runs.
 */
export function listingNoun(products: readonly CardProduct[]): ListingNoun {
  if (products.some((p) => (p.detail?.options ?? []).some((option) => optionKind(option) === 'size'))) return { one: 'style', other: 'styles' }
  if (products.some((p) => p.detail?.fitment !== undefined)) return { one: 'part', other: 'parts' }
  return { one: 'product', other: 'products' }
}

/** What the collection template's product grid asks of the list. */
export interface GridSettings {
  /** The filter panel (a rail on a desktop, a sheet on a phone). */
  filters: boolean
  /** The sort select. */
  sort: boolean
  /** The "+" on each card. */
  quickAdd: boolean
  /** Cards to a row on a wide screen, 2-5 (two on a phone whatever this is). */
  columns: number
}

export const DEFAULT_GRID: Readonly<GridSettings> = { filters: true, sort: true, quickAdd: true, columns: 4 }

/** The fields read from a template section. A theme's `ThemeSection` satisfies it. */
export interface GridSection {
  kind: string
  settings: Readonly<Record<string, string | number | boolean>>
  hidden?: boolean
}

const flag = (value: string | number | boolean | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback
  return value !== false && value !== 'false' && value !== 0
}

/**
 * The settings of the collection template's product grid (its first
 * `collection-grid` section), each falling back to the default when the
 * template does not say. A template without one gets the defaults.
 */
export function gridSettings(template: readonly GridSection[] | undefined): GridSettings {
  const section = template?.find((s) => s.kind === 'collection-grid')
  if (!section) return { ...DEFAULT_GRID }
  const columns = Math.round(Number(section.settings.columns))
  return {
    filters: flag(section.settings.filters, DEFAULT_GRID.filters),
    sort: flag(section.settings.sort, DEFAULT_GRID.sort),
    quickAdd: flag(section.settings.quickAdd, DEFAULT_GRID.quickAdd),
    columns: Number.isFinite(columns) && columns > 0 ? Math.min(5, Math.max(2, columns)) : DEFAULT_GRID.columns,
  }
}
