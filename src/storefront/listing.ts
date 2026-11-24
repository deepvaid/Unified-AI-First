// How a product reads in a store's product lists on the richer theme drawing
// (the collection and search pages of Northfold, Torqline and Lumos): its price and
// sale, its colours, the photo for a chosen colour, a part's number and stock
// line, whether quick add needs a choice, what the list calls what it holds, and
// the grid settings the collection template gives it. Filters and sort are in
// ./facets.ts.
//
// Pure rules: no Vue, no Pinia, no `@/` imports, so `npm run test:storefront`
// runs them in Node.

import { LOW_STOCK, optionKey, optionKind, variantAvailable, variantUnits } from './variants.ts'
import type { SellableVariant, VariantOption } from './variants.ts'
import { parseFacets } from './facets.ts'
import type { FacetKey, ListingNoun } from './facets.ts'
import type { FitState } from './fitment.ts'
import { partNumberOf } from './productPage.ts'

// ── What these rules read ────────────────────────────────────────────────────

/** The fields these rules read from a variant. A commerce `ProductVariant` satisfies it. */
export interface CardVariant extends SellableVariant {
  price: string
  /** The crossed-out "was" price. */
  compareAtPrice?: string
  /** A part's number ("TQ-BRK-4471"). */
  sku?: string
}

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface CardProduct {
  id: number
  price: string
  sku?: string
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
    /** The size chart a piece of clothing links (Products › Size charts). */
    sizeChartId?: string
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

// ── Parts ────────────────────────────────────────────────────────────────────

/**
 * A part's number as its card shows it, the same one its page shows before a choice
 * (src/storefront/productPage.ts, `partNumberOf`): the product's own, else its one
 * variant's; '' for a part whose choices each have a number of their own (Front and
 * Rear pads), whose card says what it comes in instead (`choiceSummary`).
 */
export function partNumber(product: CardProduct): string {
  return partNumberOf({ sku: product.sku ?? '', detail: product.detail && { options: product.detail.options, variantsList: product.detail.variantsList.map((v) => ({ sku: v.sku ?? '' })) } })
}

/**
 * What a part with choices comes in, on its card where one part number would
 * mislead: "Front or rear", "Front row or front and rear", "6 lengths", "3 grades".
 * '' for a part with one number, or more than one option to choose.
 */
export function choiceSummary(product: CardProduct): string {
  const options = product.detail?.options ?? []
  if (options.length !== 1 || (product.detail?.variantsList.length ?? 0) < 2) return ''
  const { name, values } = options[0]!
  if (values.length < 2) return ''
  if (values.length === 2) return `${values[0]} or ${values[1]!.charAt(0).toLowerCase()}${values[1]!.slice(1)}`
  return `${values.length} ${name.toLowerCase()}s`
}

/**
 * Text drawn so a line never breaks inside a hyphenated name ("F-" | "150", "CR-" | "V"):
 * a hyphen between letters or digits becomes a non-breaking one. For what is seen only;
 * screen readers get the text as it is.
 */
export function unbrokenHyphens(text: string): string {
  return text.replace(/(?<=[\p{L}\p{N}])-(?=[\p{L}\p{N}])/gu, '\u2011')
}

export interface StockLine {
  level: 'in' | 'low' | 'out'
  /** "In stock", "Only 2 left", "Sold out". */
  text: string
}

/**
 * How many a shopper can still buy, as a dense card says it: "Sold out" when every
 * variant is; "Only 2 left" when the units left across the variants in stock are
 * down to `LOW_STOCK` or fewer (none sold untracked or on backorder); else "In stock".
 */
export function stockLine(product: CardProduct): StockLine {
  const variants = product.detail?.variantsList ?? []
  if (soldOut(product)) return { level: 'out', text: 'Sold out' }
  const available = variants.filter(variantAvailable)
  const unlimited = available.some((variant) => !variant.manageInventory || variant.allowBackorder)
  const units = variants.length ? available.reduce((n, variant) => n + variantUnits(variant), 0) : product.inventory
  if (!unlimited && units <= LOW_STOCK) return { level: 'low', text: `Only ${units} left` }
  return { level: 'in', text: 'In stock' }
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

/**
 * The card's button puts the product straight in the cart: it has nothing to choose,
 * and it is not a part the shopper's vehicle doesn't take (that one opens quick add,
 * which says so before anything is added). `fit` is the product's own state against
 * the vehicle; 'unknown' for anything that is not a part.
 */
export function addsDirectly(product: CardProduct, fit: FitState = 'unknown'): boolean {
  return !needsChoice(product) && fit !== 'no-fit'
}

/**
 * What a shopper is told when the choice they made can't be bought: "Sorry, Rear is sold
 * out. Choose another position." It "just sold out" only when it could still be bought
 * when they arrived, so a choice sold out all along never reads as news.
 */
export function soldOutText(value: string, optionName: string, soldDuringVisit = false): string {
  const what = value ? `${value} ${soldDuringVisit ? 'just sold out' : 'is sold out'}` : soldDuringVisit ? 'this just sold out' : 'this is sold out'
  return `Sorry, ${what}. Choose another ${optionName.toLowerCase() || 'option'}.`
}

// ── The list ─────────────────────────────────────────────────────────────────

/**
 * What a list calls what it holds, from the products in it: "styles" where
 * they come in sizes with a size chart (clothing; a rug or a bed in sizes is
 * still a product), "parts" where they carry vehicle fitment, else "products".
 * So a store's copy follows its catalogue, wherever it runs.
 */
export function listingNoun(products: readonly CardProduct[]): ListingNoun {
  const clothing = (p: CardProduct) => !!p.detail?.sizeChartId && (p.detail.options ?? []).some((option) => optionKind(option) === 'size')
  if (products.some(clothing)) return { one: 'style', other: 'styles' }
  if (products.some((p) => p.detail?.fitment !== undefined)) return { one: 'part', other: 'parts' }
  return { one: 'product', other: 'products' }
}

/**
 * How a list draws its cards: Editorial, a tall photo with the name, price and
 * colours (Northfold); Dense, a square photo with the part number, fit, stock and
 * Add to cart (Torqline); Boxed, the Figma product card: a framed card with the
 * photo, a badge, the wishlist heart, the name, the price and Add to cart (Lumos).
 */
export type CardStyle = 'Editorial' | 'Dense' | 'Boxed'

const CARD_STYLES: readonly CardStyle[] = ['Editorial', 'Dense', 'Boxed']

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
  cardStyle: CardStyle
  /**
   * The filter groups the collection and search pages show, in this order (the
   * section's `facets`: "category,color,brand,price"). Absent: every group the
   * products have (./facets.ts).
   */
  facets?: FacetKey[]
}

export const DEFAULT_GRID: Readonly<GridSettings> = { filters: true, sort: true, quickAdd: true, columns: 4, cardStyle: 'Editorial' }

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
  const facets = parseFacets(section.settings.facets)
  return {
    filters: flag(section.settings.filters, DEFAULT_GRID.filters),
    sort: flag(section.settings.sort, DEFAULT_GRID.sort),
    quickAdd: flag(section.settings.quickAdd, DEFAULT_GRID.quickAdd),
    columns: Number.isFinite(columns) && columns > 0 ? Math.min(5, Math.max(2, columns)) : DEFAULT_GRID.columns,
    cardStyle: CARD_STYLES.find((style) => style === section.settings.cardStyle) ?? DEFAULT_GRID.cardStyle,
    ...(facets ? { facets } : {}),
  }
}
