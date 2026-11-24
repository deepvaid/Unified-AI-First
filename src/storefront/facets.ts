// Filters and sort for a store's product lists (the collection and search
// pages), held in the URL query so a filtered list can be shared, reloaded and
// gone back to:
//
//   ?category=knitwear&size=m,l&color=black&price=50-100&brand=graymoor&fits=0&sort=price-asc
//
// Several values of one filter are comma-separated and either one may match;
// different filters must all match. A product matches Size and Color when one
// variant that is in stock has a chosen size and a chosen colour, so "M in
// Black" never lists a shirt whose black M is sold out. A product sold out in
// every variant stays listed (it is still there to look at) but goes last.
//
// On an auto-parts store (Torqline) a list with the shopper's vehicle shows only
// the parts that fit it (or fit anything), unless the URL says `fits=0`: the
// "Only show parts that fit" switch, which is a mode of the list rather than a
// filter, so it has no chip and Clear all leaves it as it is.
//
// Pure rules: no Vue, no Pinia, no `@/` imports, so `npm run test:storefront`
// runs them in Node.

import { optionKey, optionKind, optionValuesOf, variantAvailable } from './variants.ts'
import type { SellableVariant, VariantOption } from './variants.ts'

// ── What these rules read ────────────────────────────────────────────────────

/** The fields these rules read from a variant. A commerce `ProductVariant` satisfies it. */
export interface ListingVariant extends SellableVariant {
  price?: string
}

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface ListingProduct {
  id: number
  name: string
  price: string | number
  /** Units on hand, for a product without variants. */
  inventory?: number
  vendor?: string
  productType?: string
  collections?: string[]
  detail?: {
    options: VariantOption[]
    variantsList: ListingVariant[]
    /** The product's category ("Knitwear", "Brakes"). */
    tag?: string
    brand?: string
  }
}

// ── The filters ──────────────────────────────────────────────────────────────

/** A group of values a list can be filtered by, in the order the filter panel shows them. */
export type FacetKey = 'category' | 'size' | 'color' | 'price' | 'brand'
export const FACET_KEYS: readonly FacetKey[] = ['category', 'size', 'color', 'price', 'brand']

export type ListingSort = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name'

/**
 * A list's filters and sort as the URL holds them. Values are written as the
 * query writes them (`optionKey`: "Heather Gray" is "heather-gray"); a price is
 * a range, "50-100" (from 50, under 100), "0-50" or "200-" (200 and over).
 */
export interface ListingFilters {
  category: string[]
  size: string[]
  color: string[]
  price: string[]
  brand: string[]
  /**
   * Only what fits the shopper's vehicle (auto-parts stores). On unless the URL
   * says `fits=0`; does nothing until the list is given a `fits` rule (a vehicle).
   */
  fits: boolean
  sort: ListingSort
}

export function emptyFilters(sort: ListingSort = 'featured'): ListingFilters {
  return { category: [], size: [], color: [], price: [], brand: [], fits: true, sort }
}

/** Every query key these rules own; a page's other keys (the search's `q`) are left alone. */
export const LISTING_QUERY_KEYS: readonly string[] = [...FACET_KEYS, 'fits', 'sort']

export const LISTING_SORTS: readonly { value: ListingSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name', label: 'Name, A to Z' },
]

/** The sorts a list offers. On search results the given order is the best match, and says so. */
export function listingSorts(page: 'collection' | 'search' = 'collection'): { value: ListingSort; label: string }[] {
  return LISTING_SORTS.map((sort) => (page === 'search' && sort.value === 'featured' ? { ...sort, label: 'Most relevant' } : { ...sort }))
}

function isSort(value: unknown): value is ListingSort {
  return LISTING_SORTS.some((sort) => sort.value === value)
}

// ── The URL ──────────────────────────────────────────────────────────────────

/** A query value as the router holds one. */
export type QueryValue = string | null | (string | null)[]

/** Every string in a query value, split at commas, trimmed, empty ones dropped. */
function rawValues(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [raw]
  return list
    .filter((value): value is string => typeof value === 'string')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
}

const unique = (values: string[]): string[] => [...new Set(values)]

/** A price range: from `lo`, under `hi`; no `hi` is "and over". */
interface PriceRange {
  lo: number
  hi?: number
}

const amount = (n: number): string => String(Math.round(n * 100) / 100)

function priceKey(range: PriceRange): string {
  return `${amount(range.lo)}-${range.hi === undefined ? '' : amount(range.hi)}`
}

/** "50-100", "0-50", "-50" or "200-" as a range; null for anything else, or a range that holds nothing. */
export function parsePriceRange(value: string): PriceRange | null {
  const match = /^(\d+(?:\.\d+)?)?-(\d+(?:\.\d+)?)?$/.exec(value.trim())
  if (!match || (match[1] === undefined && match[2] === undefined)) return null
  const lo = match[1] === undefined ? 0 : Number(match[1])
  const hi = match[2] === undefined ? undefined : Number(match[2])
  if (hi !== undefined && hi <= lo) return null
  return { lo, hi }
}

/**
 * The filters a URL query asks for. Values are written the query's way
 * (lower case, dashes); a price that is not a range and an unknown sort are
 * dropped, so a hand-edited URL never breaks the page.
 */
export function parseListingQuery(query: Readonly<Record<string, unknown>>): ListingFilters {
  const filters = emptyFilters()
  for (const key of ['category', 'size', 'color', 'brand'] as const) filters[key] = unique(rawValues(query[key]).map(optionKey).filter(Boolean))
  filters.price = unique(rawValues(query.price).flatMap((value) => {
    const range = parsePriceRange(value)
    return range ? [priceKey(range)] : []
  }))
  filters.fits = !rawValues(query.fits).some((value) => value === '0' || value === 'false')
  const sort = rawValues(query.sort)[0]
  if (isSort(sort)) filters.sort = sort
  return filters
}

/** The filters as query keys, in a fixed order; empty filters, the fits switch on and the featured sort are left out. */
export function toListingQuery(filters: ListingFilters): Record<string, string> {
  const query: Record<string, string> = {}
  for (const key of FACET_KEYS) if (filters[key].length) query[key] = filters[key].join(',')
  if (!filters.fits) query.fits = '0'
  if (filters.sort !== 'featured') query.sort = filters.sort
  return query
}

/** `current` with its filter and sort keys replaced by `filters`; every other key (the search's `q`) stays. */
export function withListingQuery(current: Readonly<Record<string, QueryValue | undefined>>, filters: ListingFilters): Record<string, QueryValue> {
  const next: Record<string, QueryValue> = {}
  for (const [key, value] of Object.entries(current)) if (!LISTING_QUERY_KEYS.includes(key) && value !== undefined) next[key] = value
  return { ...next, ...toListingQuery(filters) }
}

// ── Editing the filters ──────────────────────────────────────────────────────

/** A value is chosen in one of the filter groups. The fits switch is a mode of the list, not one of them. */
export function hasActiveFilters(filters: ListingFilters): boolean {
  return FACET_KEYS.some((key) => filters[key].length > 0)
}

/** Adds the value to the filter, or takes it out when it is in. */
export function toggleFilter(filters: ListingFilters, key: FacetKey, value: string): ListingFilters {
  const list = filters[key]
  return { ...filters, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
}

export function removeFilter(filters: ListingFilters, key: FacetKey, value?: string): ListingFilters {
  return { ...filters, [key]: value === undefined ? [] : filters[key].filter((v) => v !== value) }
}

/** Every filter off; the sort and the fits switch stay as they are. */
export function clearFilters(filters: ListingFilters): ListingFilters {
  return { ...emptyFilters(filters.sort), fits: filters.fits }
}

/**
 * The filters a list reads when it shows only some groups (the collection template's
 * `facets`): the others are off, so a filter the shopper can't see or take off never
 * narrows the list. All groups shown (`facets` absent): the filters as they are.
 */
export function onlyFacets(filters: ListingFilters, facets?: readonly FacetKey[]): ListingFilters {
  if (!facets) return filters
  const next = { ...filters }
  for (const key of FACET_KEYS) if (!facets.includes(key)) next[key] = []
  return next
}

/**
 * The groups a setting names, in its order: "category, color, brand, price" (keys
 * as FACET_KEYS writes them, any case, comma-separated; unknown words and repeats
 * are dropped). Undefined when it names none, so the list shows every group.
 */
export function parseFacets(value: unknown): FacetKey[] | undefined {
  if (typeof value !== 'string') return undefined
  const keys: FacetKey[] = []
  for (const word of value.split(',')) {
    const key = FACET_KEYS.find((k) => k === word.trim().toLowerCase())
    if (key && !keys.includes(key)) keys.push(key)
  }
  return keys.length ? keys : undefined
}

// ── Reading the products ─────────────────────────────────────────────────────

/** How the list reads money in labels: "$50", "$12.50". */
export interface MoneyLabel {
  /** ISO code; the store's currency. Default "USD". */
  currency?: string
  /** The store's locale; default "en-US". */
  locale?: string
}

export interface ListingOptions<P extends ListingProduct = ListingProduct> extends MoneyLabel {
  /**
   * The products the shopper's vehicle fits (src/storefront/fitment.ts). With it,
   * `filters.fits` lists only those; without it the switch does nothing.
   */
  fits?: (product: P) => boolean
}

interface VariantFacts {
  size?: string
  color?: string
  available: boolean
}

/** What the rules need from one product, read once. */
interface Facts<P> {
  product: P
  index: number
  inStock: boolean
  /** The lowest price of a variant in stock (of any variant when none is). */
  listPrice: number
  category?: { key: string; label: string }
  brand?: { key: string; label: string }
  variants: VariantFacts[]
  /** Size and colour values as written, by query key; colours with their swatch. */
  sizes: Map<string, string>
  colors: Map<string, { label: string; swatch?: string }>
}

const toNumber = (value: string | number | undefined): number => {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : Number.NaN
}

/** The product's category: its own (`detail.tag`), else its first collection, else its product type. */
function categoryOf(product: ListingProduct): string {
  return product.detail?.tag?.trim() || product.collections?.[0]?.trim() || product.productType?.trim() || ''
}

function factsOf<P extends ListingProduct>(product: P, index: number): Facts<P> {
  const options = product.detail?.options ?? []
  const variants = product.detail?.variantsList ?? []
  const sizeAt = options.findIndex((option) => optionKind(option) === 'size')
  const colorAt = options.findIndex((option) => optionKind(option) === 'color')
  const sizes = new Map<string, string>()
  const colors = new Map<string, { label: string; swatch?: string }>()
  const facts: VariantFacts[] = variants.map((variant) => {
    const values = optionValuesOf(variant, options)
    const size = sizeAt >= 0 ? values[sizeAt] : undefined
    const color = colorAt >= 0 ? values[colorAt] : undefined
    if (size) sizes.set(optionKey(size), sizes.get(optionKey(size)) ?? size)
    if (color && !colors.has(optionKey(color))) colors.set(optionKey(color), { label: color, swatch: options[colorAt]?.swatches?.[color] })
    return { size: size ? optionKey(size) : undefined, color: color ? optionKey(color) : undefined, available: variantAvailable(variant) }
  })
  const inStock = variants.length ? facts.some((variant) => variant.available) : (product.inventory ?? 1) > 0
  const priced = variants.map((variant, i) => ({ price: toNumber(variant.price ?? product.price), available: facts[i]!.available })).filter((v) => Number.isFinite(v.price))
  const pool = priced.some((v) => v.available) ? priced.filter((v) => v.available) : priced
  const listPrice = pool.length ? Math.min(...pool.map((v) => v.price)) : toNumber(product.price)
  const category = categoryOf(product)
  const brand = (product.detail?.brand || product.vendor || '').trim()
  return {
    product,
    index,
    inStock,
    listPrice,
    category: category ? { key: optionKey(category), label: category } : undefined,
    brand: brand ? { key: optionKey(brand), label: brand } : undefined,
    variants: facts,
    sizes,
    colors,
  }
}

function inRange(price: number, key: string): boolean {
  const range = parsePriceRange(key)
  return !!range && Number.isFinite(price) && price >= range.lo && (range.hi === undefined || price < range.hi)
}

/** Whether a product passes every filter. */
function matches<P extends ListingProduct>(facts: Facts<P>, filters: ListingFilters, options: ListingOptions<P>): boolean {
  if (filters.category.length && !(facts.category && filters.category.includes(facts.category.key))) return false
  if (filters.brand.length && !(facts.brand && filters.brand.includes(facts.brand.key))) return false
  if (filters.price.length && !filters.price.some((key) => inRange(facts.listPrice, key))) return false
  if (filters.fits && options.fits && !options.fits(facts.product)) return false
  if (!filters.size.length && !filters.color.length) return true
  // One variant in stock must carry a chosen size and a chosen colour.
  return facts.variants.some((variant) => variant.available
    && (!filters.size.length || (variant.size !== undefined && filters.size.includes(variant.size)))
    && (!filters.color.length || (variant.color !== undefined && filters.color.includes(variant.color))))
}

// ── Listing ──────────────────────────────────────────────────────────────────

/** The products that pass the filters, in the given order. */
export function applyFilters<P extends ListingProduct>(products: readonly P[], filters: ListingFilters, options: ListingOptions<P> = {}): P[] {
  return products.map(factsOf).filter((facts) => matches(facts, filters, options)).map((facts) => facts.product)
}

/**
 * The products in the sort's order: featured is the given order, newest the
 * highest id first (ids grow as products are added), price by the lowest price
 * a shopper can buy at. Products sold out in every variant go last; ties keep
 * the given order.
 */
export function sortProducts<P extends ListingProduct>(products: readonly P[], sort: ListingSort): P[] {
  const facts = products.map(factsOf)
  const by = (a: Facts<P>, b: Facts<P>): number => {
    switch (sort) {
      case 'newest': return b.product.id - a.product.id
      case 'price-asc': return a.listPrice - b.listPrice
      case 'price-desc': return b.listPrice - a.listPrice
      case 'name': return a.product.name.localeCompare(b.product.name, 'en', { sensitivity: 'base' })
      default: return 0
    }
  }
  return facts
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || by(a, b) || a.index - b.index)
    .map((f) => f.product)
}

/** The list as the page shows it: filtered, then sorted. */
export function listProducts<P extends ListingProduct>(products: readonly P[], filters: ListingFilters, options: ListingOptions<P> = {}): P[] {
  return sortProducts(applyFilters(products, filters, options), filters.sort)
}

// ── The filter panel ─────────────────────────────────────────────────────────

export interface FacetValue {
  /** As the query writes it. */
  value: string
  label: string
  /** Products that would be listed with this value, given the other filters. */
  count: number
  selected: boolean
  /** A colour's swatch ("#1a1a1a"), when the product has one. */
  swatch?: string
}

export interface FacetGroup {
  key: FacetKey
  label: string
  values: FacetValue[]
  /** How many of its values are chosen. */
  selected: number
}

export const FACET_LABELS: Readonly<Record<FacetKey, string>> = {
  category: 'Category',
  size: 'Size',
  color: 'Color',
  price: 'Price',
  brand: 'Brand',
}

/** Letter sizes in the order a size runs. */
const LETTER_SIZES = ['XXS', '2XS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL']

/** Sizes in the order they run: XS to XL, then numbers (waists) from small to large, then anything else as first seen. */
export function compareSizes(a: string, b: string): number {
  const rank = (size: string): [number, number] => {
    const letter = LETTER_SIZES.indexOf(size.trim().toUpperCase())
    if (letter >= 0) return [0, letter]
    const n = Number.parseFloat(size)
    if (Number.isFinite(n) && /^\d/.test(size.trim())) return [1, n]
    return [2, 0]
  }
  const [ga, va] = rank(a)
  const [gb, vb] = rank(b)
  return ga - gb || va - vb
}

/** Round boundaries a price list is split at, coarse first. */
const COARSE_STEPS = [10, 25, 50, 100, 200, 500, 1000, 2500, 5000, 10000]
const FINE_STEPS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000]
/** At most this many price ranges. */
const MAX_PRICE_RANGES = 5

/**
 * Price ranges that suit the prices given: round boundaries inside the range
 * of prices (Under $50, $50 to $100, $100 to $200, Over $200 for $34-$268), no
 * empty range and at most five, the smallest neighbours merged first. None when
 * every product costs about the same.
 */
export function priceRanges(prices: readonly number[]): string[] {
  const sorted = prices.filter(Number.isFinite).sort((a, b) => a - b)
  if (sorted.length < 2) return []
  const min = sorted[0]!
  const max = sorted[sorted.length - 1]!
  const inside = (steps: number[]) => steps.filter((step) => step > min && step <= max)
  let bounds = inside(COARSE_STEPS)
  if (!bounds.length) bounds = inside(FINE_STEPS)
  const counts = (): number[] => {
    const edges = [0, ...bounds, Number.POSITIVE_INFINITY]
    return edges.slice(0, -1).map((lo, i) => sorted.filter((p) => p >= lo && p < edges[i + 1]!).length)
  }
  // Merge an empty range into its neighbour, then the smallest neighbouring pair, until it fits.
  for (;;) {
    const c = counts()
    const empty = c.findIndex((n) => n === 0)
    if (empty >= 0) {
      bounds.splice(Math.min(empty, bounds.length - 1), 1)
      continue
    }
    if (bounds.length < MAX_PRICE_RANGES) break
    let at = 0
    for (let i = 1; i < bounds.length; i++) if (c[i]! + c[i + 1]! < c[at]! + c[at + 1]!) at = i
    bounds.splice(at, 1)
  }
  if (!bounds.length) return []
  const edges = [0, ...bounds]
  return edges.map((lo, i) => priceKey({ lo, hi: bounds[i] }))
}

function moneyLabel(n: number, money: MoneyLabel): string {
  const whole = Number.isInteger(n)
  return new Intl.NumberFormat(money.locale ?? 'en-US', {
    style: 'currency',
    currency: money.currency ?? 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(n)
}

/** "Under $50", "$50 to $100", "Over $200". */
export function priceRangeLabel(key: string, money: MoneyLabel = {}): string {
  const range = parsePriceRange(key)
  if (!range) return key
  if (range.hi === undefined) return `Over ${moneyLabel(range.lo, money)}`
  if (range.lo === 0) return `Under ${moneyLabel(range.hi, money)}`
  return `${moneyLabel(range.lo, money)} to ${moneyLabel(range.hi, money)}`
}

export interface FacetOptions<P extends ListingProduct = ListingProduct> extends ListingOptions<P> {
  /** Groups the page leaves out (a category's own collection needs no Category). */
  omit?: readonly FacetKey[]
  /** The groups to show, in this order (the collection template's `facets`); absent: all, in FACET_KEYS order. */
  facets?: readonly FacetKey[]
}

/** A key read back as words, for a value the products no longer have ("light-grey" → "Light grey"). */
function labelFromKey(key: string): string {
  const words = key.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Every value each group has across `products`, labelled, in the order the panel lists them. */
function valuesOf<P extends ListingProduct>(all: Facts<P>[], money: MoneyLabel): Record<FacetKey, Map<string, { label: string; swatch?: string }>> {
  const groups: Record<FacetKey, Map<string, { label: string; swatch?: string }>> = {
    category: new Map(), size: new Map(), color: new Map(), price: new Map(), brand: new Map(),
  }
  for (const facts of all) {
    if (facts.category && !groups.category.has(facts.category.key)) groups.category.set(facts.category.key, { label: facts.category.label })
    if (facts.brand && !groups.brand.has(facts.brand.key)) groups.brand.set(facts.brand.key, { label: facts.brand.label })
    for (const [key, label] of facts.sizes) if (!groups.size.has(key)) groups.size.set(key, { label })
    for (const [key, color] of facts.colors) {
      const known = groups.color.get(key)
      if (!known) groups.color.set(key, { ...color })
      else if (!known.swatch && color.swatch) known.swatch = color.swatch
    }
  }
  groups.size = new Map([...groups.size].sort(([, a], [, b]) => compareSizes(a.label, b.label)))
  for (const key of priceRanges(all.map((facts) => facts.listPrice))) groups.price.set(key, { label: priceRangeLabel(key, money) })
  return groups
}

/**
 * The filter panel for a list: Category, Size, Color, Price and Brand (or the
 * groups `options.facets` names, in its order), each with every value the
 * products have and how many products each would list with the other filters as
 * they are (choosing it within its own group adds to the list, so its count
 * ignores the group's own choices). A group with one value says nothing and is
 * left out, unless that value is chosen.
 */
export function facetGroups<P extends ListingProduct>(products: readonly P[], filters: ListingFilters, options: FacetOptions<P> = {}): FacetGroup[] {
  const all = products.map(factsOf)
  const values = valuesOf(all, options)
  const groups: FacetGroup[] = []
  for (const key of options.facets ?? FACET_KEYS) {
    if (options.omit?.includes(key)) continue
    const known = values[key]
    // A value chosen in the URL that no product has: listed, so it can be taken off.
    for (const chosen of filters[key]) if (!known.has(chosen)) known.set(chosen, { label: key === 'price' ? priceRangeLabel(chosen, options) : labelFromKey(chosen) })
    const list: FacetValue[] = [...known].map(([value, { label, swatch }]) => {
      const alone = { ...filters, [key]: [value] }
      const count = all.filter((facts) => matches(facts, alone, options)).length
      return { value, label, count, selected: filters[key].includes(value), ...(swatch ? { swatch } : {}) }
    })
    const selected = list.filter((value) => value.selected).length
    if (list.length < 2 && !selected) continue
    groups.push({ key, label: FACET_LABELS[key], values: list, selected })
  }
  return groups
}

// ── Chips and the result count ───────────────────────────────────────────────

export interface ActiveFilter {
  key: FacetKey
  value: string
  /** "Size M", "Black", "Under $50". */
  label: string
  /** The chip's accessible name: "Remove filter Size M". */
  removeLabel: string
  /** The filters once this one is taken off. */
  next: ListingFilters
}

/** One chip per chosen value, in the panel's order (`options.facets`, else FACET_KEYS), each knowing the filters without it. */
export function activeFilters<P extends ListingProduct>(products: readonly P[], filters: ListingFilters, options: MoneyLabel & { facets?: readonly FacetKey[] } = {}): ActiveFilter[] {
  const values = valuesOf(products.map(factsOf), options)
  const chips: ActiveFilter[] = []
  for (const key of options.facets ?? FACET_KEYS) {
    for (const value of filters[key]) {
      const known = values[key].get(value)?.label
      const name = key === 'price' ? (known ?? priceRangeLabel(value, options)) : (known ?? labelFromKey(value))
      const label = key === 'size' && !/\bsize\b/i.test(name) ? `Size ${name}` : name
      chips.push({ key, value, label, removeLabel: `Remove filter ${label}`, next: removeFilter(filters, key, value) })
    }
  }
  return chips
}

/** What the list holds: "style" and "styles", "part" and "parts". */
export interface ListingNoun {
  one: string
  other: string
}

/**
 * How many products the list shows, for the toolbar and the live announcement:
 * "20 styles", "8 of 20 styles", "No styles match these filters", "No styles yet".
 */
export function resultCountText(shown: number, total: number, noun: ListingNoun = { one: 'product', other: 'products' }): string {
  const word = (n: number): string => (n === 1 ? noun.one : noun.other)
  if (total === 0) return `No ${noun.other} yet`
  if (shown === 0) return `No ${noun.other} match these filters`
  if (shown === total) return `${total} ${word(total)}`
  return `${shown} of ${total} ${word(total)}`
}

// ── Nothing fits the shopper's vehicle ───────────────────────────────────────

/** Where a list is when nothing in it fits: a category of parts ("Brakes"), another collection ("Deals"), or a search. */
export interface NoFitScope {
  /** The collection or category: "Brakes". None on All products or a search. */
  name?: string
  /** `name` is a kind of part (every product in it is one), so the button can say "brake parts". */
  category?: boolean
  page?: 'collection' | 'search'
}

/** A kind of part as the button names it: "brake parts", "lighting parts", "batteries", "oil & fluids". */
function partsOf(category: string): string {
  const words = category.trim().toLowerCase()
  if (/\s/.test(words) || words.endsWith('ies')) return words
  return `${words.endsWith('s') && !words.endsWith('ss') ? words.slice(0, -1) : words} parts`
}

/**
 * What a list says when the shopper's vehicle leaves nothing in it, and its button
 * that turns the fits switch off: "No parts fit your 2015 Honda Civic in Brakes" with
 * "Show all brake parts"; "No parts fit your 2015 Honda Civic" with "Show all parts"
 * on All products, "Show all results" on a search, "Show all deals" in a collection
 * that is not a kind of part.
 */
export function noFitText(vehicle: string, scope: NoFitScope = {}): { title: string; showAll: string } {
  const name = scope.name?.trim()
  const title = `No parts fit your ${vehicle}${name ? ` in ${name}` : ''}`
  if (scope.page === 'search') return { title, showAll: 'Show all results' }
  if (!name) return { title, showAll: 'Show all parts' }
  return { title, showAll: `Show all ${scope.category ? partsOf(name) : name.toLowerCase()}` }
}
