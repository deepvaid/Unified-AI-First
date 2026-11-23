// The product page of the sections drawing (Northfold's and Torqline's themes):
// which photos the gallery shows for the chosen colour, how the price reads, the
// choice kept in the URL so a shared link opens the same colour and size, the
// collapsible rows the product template asks for, and the row of other products
// when the store has no recommendation engine. Pure rules: no Vue, no Pinia, no
// `@/` imports, so `npm run test:storefront` runs them in Node.

import { audienceOf, sharesAudience } from './audience.ts'
import { hasPriceRange, lowestPrice } from './catalog.ts'
import type { QueryValue } from './facets.ts'
import { optionKey, optionKind } from './variants.ts'
import type { VariantOption, VariantSelection } from './variants.ts'

// ── Gallery ──────────────────────────────────────────────────────────────────

/** The fields the gallery rules read. A commerce `Product` satisfies it. */
export interface GalleryProduct {
  name: string
  imageUrls?: string[]
  detail?: {
    options: VariantOption[]
    /** Photos per value of the Color option, for a product photographed in every colour. */
    imagesByColor?: Record<string, string[]>
  }
}

export interface ProductGallery {
  /** The photos to show, in order. */
  images: string[]
  /**
   * The colour each photo shows, by index, for its alt text: '' when the data does not
   * say (a photo listed under several colours, or under none), so an alt never names a
   * colour a photo is not of.
   */
  colors: string[]
  /** The colour the gallery is of ("Sand"), for its label. Empty for a product in one look. */
  color: string
  /** "Shown in White" when the chosen colour has no photos of its own; empty otherwise. */
  shownIn: string
}

/** The product's colour option (shown as swatches or named Color), if it has one. */
export function colorOptionOf(options: readonly VariantOption[]): VariantOption | undefined {
  return options.find((option) => optionKind(option) === 'color')
}

/**
 * The colour a photo shows. A product photographed by colour says it: the one colour
 * whose photos list it, else none ('' for a photo listed under several, or under
 * none). A product without photos by colour pictures its first colour.
 */
function photoColor(url: string, product: GalleryProduct, first: string): string {
  const byColor = product.detail?.imagesByColor
  if (!byColor) return first
  const owners = Object.keys(byColor).filter((color) => byColor[color]!.includes(url))
  return owners.length === 1 ? owners[0]! : ''
}

/**
 * What the gallery shows for a selection. A colour photographed on its own shows
 * its photos. Any other colour shows the product's photos, which picture its first
 * colour, and says so: "Shown in White". The first colour needs no note.
 */
export function galleryFor(product: GalleryProduct, selection: VariantSelection): ProductGallery {
  const all = product.imageUrls ?? []
  const option = colorOptionOf(product.detail?.options ?? [])
  if (!option?.values.length) return { images: all, colors: all.map(() => ''), color: '', shownIn: '' }
  const first = option.values[0]!
  const chosen = selection[option.name]
  const colorsOf = (images: string[]) => images.map((url) => photoColor(url, product, first))
  const own = chosen === undefined ? undefined : product.detail?.imagesByColor?.[chosen]
  if (own?.length) return { images: [...own], colors: colorsOf(own), color: chosen!, shownIn: '' }
  // The first colour's own photos when it has them; otherwise the product's, which lead with it.
  const lead = product.detail?.imagesByColor?.[first]
  const images = lead?.length ? [...lead] : all
  const shownIn = chosen !== undefined && chosen !== first && option.values.length > 1 && images.length ? `Shown in ${first}` : ''
  return { images, colors: colorsOf(images), color: first, shownIn }
}

/** "Linen Overshirt in Sand", then ", picture 2 of 4" after the first of several. `color` is that photo's own (`ProductGallery.colors`). */
export function galleryAlt(name: string, color: string, index: number, total: number): string {
  const base = color ? `${name} in ${color}` : name
  return total > 1 && index > 0 ? `${base}, picture ${index + 1} of ${total}` : base
}

// ── Price ────────────────────────────────────────────────────────────────────

/** The fields the price rules read. A commerce `Product` and `ProductVariant` satisfy them. */
export interface PricedProduct {
  price: string
  compareAtPrice: string
  publishStatus: string
  detail?: { variantsList: { price: string }[] }
}

export interface PricedVariant {
  price: string
  compareAtPrice?: string
}

export interface ProductPrice {
  /** What it costs, as a decimal string. */
  price: string
  /** The crossed-out "was" price, or '' when it is not on sale. */
  compareAt: string
  /** Whole percent off the "was" price ("−25%"); 0 when not on sale. */
  percentOff: number
  /** No variant chosen and the variants differ in price: the price reads "From". */
  from: boolean
}

/**
 * How the price reads: the chosen variant's, else the product's (its lowest when
 * the variants differ). A "was" price only counts when it is higher.
 */
export function priceFor(product: PricedProduct, variant?: PricedVariant): ProductPrice {
  const from = !variant && hasPriceRange(product)
  const price = variant?.price ?? (from ? lowestPrice(product) : product.price)
  const was = variant ? variant.compareAtPrice ?? '' : product.compareAtPrice
  const now = Number.parseFloat(price)
  const before = Number.parseFloat(was)
  const onSale = !from && Number.isFinite(now) && Number.isFinite(before) && before > now
  return {
    price,
    compareAt: onSale ? was : '',
    percentOff: onSale ? Math.round(((before - now) / before) * 100) : 0,
    from,
  }
}

// ── The choice in the URL ────────────────────────────────────────────────────

/** The chosen values as the URL writes them: `{ color: 'sand', size: 'm' }`. Unchosen options are left out. */
export function selectionQuery(options: readonly VariantOption[], selection: VariantSelection): Record<string, string> {
  const query: Record<string, string> = {}
  for (const option of options) {
    const value = selection[option.name]
    // An option with one value has nothing to choose, so a link needs no word for it.
    if (value !== undefined && option.values.length > 1) query[optionKey(option.name)] = optionKey(value)
  }
  return query
}

/**
 * The page's query with the selection in it: every option's key is rewritten, so an
 * option the shopper let go leaves the URL, and other keys (`sizeGuide`, a
 * campaign's tags) stay as they were.
 */
export function withSelectionQuery(
  current: Readonly<Record<string, QueryValue | undefined>>,
  options: readonly VariantOption[],
  selection: VariantSelection,
): Record<string, QueryValue> {
  const keys = new Set(options.map((option) => optionKey(option.name)))
  const kept: Record<string, QueryValue> = {}
  for (const [key, value] of Object.entries(current)) if (!keys.has(key) && value !== undefined) kept[key] = value
  return { ...kept, ...selectionQuery(options, selection) }
}

/** The query values `initialSelection` reads: the first of a repeated key, strings only. */
export function selectionFromQuery(query: Readonly<Record<string, unknown>>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    const first = Array.isArray(value) ? value[0] : value
    if (typeof first === 'string' && first) out[key] = first
  }
  return out
}

// ── Collapsible rows ─────────────────────────────────────────────────────────

/** Where a row's body comes from. */
export type RowSource = 'description' | 'fit' | 'fabric-care' | 'delivery-returns' | 'custom'

/** A `collapsible-row` block of the product template's product-detail section. */
export interface RowBlock {
  id: string
  kind: string
  settings: Record<string, string | number | boolean>
}

/** The fields the rows read. A commerce `Product` satisfies it. */
export interface RowProduct {
  detail?: {
    description?: string
    fitNote?: string
    material?: string
    care?: string
    countryOfOrigin?: string
  }
}

export interface ProductRow {
  id: string
  title: string
  source: RowSource
  /** Starts open. */
  open: boolean
  paragraphs: string[]
  /** Label and value lines: "Fabric", "Care", "Made in". */
  facts: { label: string; value: string }[]
  /** Ends with "Open the size guide". */
  sizeGuide: boolean
}

const ROW_TITLES: Record<RowSource, string> = {
  description: 'Description',
  fit: 'Fit and sizing',
  'fabric-care': 'Fabric and care',
  'delivery-returns': 'Delivery and returns',
  custom: '',
}

/** The words a row's source may be written in (the theme's ids or the builder's labels), by handle. */
const SOURCE_WORDS: Record<string, RowSource> = {
  description: 'description',
  fit: 'fit',
  'fit-and-sizing': 'fit',
  sizing: 'fit',
  'fabric-care': 'fabric-care',
  'fabric-and-care': 'fabric-care',
  care: 'fabric-care',
  'delivery-returns': 'delivery-returns',
  'delivery-and-returns': 'delivery-returns',
  'shipping-and-returns': 'delivery-returns',
}

/** A row's source from its setting (`source`, or `content` as the builder may name it); anything else is custom text. */
export function rowSource(value: unknown): RowSource {
  return typeof value === 'string' ? SOURCE_WORDS[optionKey(value)] ?? 'custom' : 'custom'
}

/** Text split into paragraphs at blank lines. */
function paragraphsOf(text: unknown): string[] {
  return typeof text === 'string' ? text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean) : []
}

/**
 * The rows under the buy box, in the template's order. A row with nothing to say
 * for this product is left out (a fit row without a fit note or a size guide, say).
 * A product-detail section without rows gets the description alone.
 */
export function productRows(blocks: readonly RowBlock[] | undefined, product: RowProduct, opts: { sizeGuide: boolean }): ProductRow[] {
  const rows = (blocks ?? []).filter((block) => block.kind === 'collapsible-row')
  const wanted: RowBlock[] = rows.length ? rows : [{ id: 'description', kind: 'collapsible-row', settings: { source: 'description', open: true } }]
  const detail = product.detail ?? {}
  return wanted.flatMap((block): ProductRow[] => {
    const source = rowSource(block.settings.source ?? block.settings.content)
    const written = typeof block.settings.title === 'string' ? block.settings.title.trim() : ''
    const row: ProductRow = {
      id: block.id,
      title: written || ROW_TITLES[source],
      source,
      open: block.settings.open === true,
      paragraphs: [],
      facts: [],
      sizeGuide: false,
    }
    switch (source) {
      case 'description':
        row.paragraphs = paragraphsOf(detail.description)
        break
      case 'fit':
        row.paragraphs = paragraphsOf(detail.fitNote)
        row.sizeGuide = opts.sizeGuide
        break
      case 'fabric-care':
        row.facts = [
          { label: 'Fabric', value: detail.material?.trim() ?? '' },
          { label: 'Care', value: detail.care?.trim() ?? '' },
          { label: 'Made in', value: detail.countryOfOrigin?.trim() ?? '' },
        ].filter((fact) => fact.value)
        break
      default:
        row.paragraphs = paragraphsOf(block.settings.text)
    }
    if (!row.title) return []
    return row.paragraphs.length || row.facts.length || row.sizeGuide ? [row] : []
  })
}

// ── The row of other products ────────────────────────────────────────────────

/** The fields the related rule reads. A commerce `Product` satisfies it. */
export interface RelatedProduct {
  id: number
  collections: string[]
}

/** The fields the audience rule reads. A commerce `Product` satisfies it. */
export interface AudienceProduct {
  collections: string[]
  detail?: { subtitle?: string }
}

/**
 * The products the row under a piece may show: for a men's or a women's piece, the
 * pieces for the same audience and those for everyone (src/storefront/audience.ts),
 * so a men's overshirt is never paired with a women's jacket. A piece for everyone,
 * or in a store that does not sell by audience, may show them all.
 */
export function forSameAudience<T extends AudienceProduct>(products: readonly T[], product: AudienceProduct): T[] {
  const own = audienceOf(product.collections, product.detail?.subtitle)
  return products.filter((p) => sharesAudience(own, audienceOf(p.collections, p.detail?.subtitle)))
}

/**
 * Other products for "You may also like" when the store has no recommendation
 * engine: those in the product's own collection (its breadcrumb) first, then those
 * sharing any of its collections, each in the store's order.
 */
export function relatedByCollection<T extends RelatedProduct>(products: readonly T[], product: RelatedProduct, count = 4): T[] {
  const others = products.filter((p) => p.id !== product.id)
  const primary = product.collections[0]
  const same = primary === undefined ? [] : others.filter((p) => p.collections.includes(primary))
  const sharing = others.filter((p) => !same.includes(p) && p.collections.some((c) => product.collections.includes(c)))
  return [...same, ...sharing].slice(0, count)
}
