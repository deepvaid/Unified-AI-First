// A product's options and variants as a shopper picks them: which variant a
// choice of values is, whether a value can still be bought, what is chosen
// first, and how a choice reads on a cart line. Also how the product form builds
// and numbers variants. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:storefront` runs them in Node.

import { toHandle } from './handles.ts'

/** How an option's values are offered on the product page. */
export type OptionDisplay = 'buttons' | 'swatches'

/** The fields these rules read from an option. A commerce `ProductOption` satisfies it. */
export interface VariantOption {
  name: string
  values: string[]
  display?: OptionDisplay
  /** Value → hex colour ("#1a1a1a"), for an option shown as swatches. */
  swatches?: Record<string, string>
}

/** The fields these rules read from a variant. A commerce `ProductVariant` satisfies it. */
export interface SellableVariant {
  id: number
  title: string
  manageInventory: boolean
  allowBackorder: boolean
  /** On-hand counts by location name. */
  stock: Record<string, number>
  /** The variant's value for each option, in the options' order. Older seeds have none: the title holds them, split by " / ". */
  optionValues?: string[]
}

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface VariantProduct<V extends SellableVariant = SellableVariant> {
  detail?: { options: VariantOption[]; variantsList: V[] }
}

/** Option name → the value chosen. An option that is left out is not chosen yet. */
export type VariantSelection = Readonly<Record<string, string | undefined>>

/** What an option is about, which decides what the product page chooses first and how a line reads. */
export type OptionKind = 'color' | 'size' | 'plain'

/** Whether a value can be chosen given the other choices: in stock, sold out, or no such combination. */
export type ValueState = 'available' | 'sold-out' | 'absent'

/** At this many units or fewer a variant says how many are left. */
export const LOW_STOCK = 3

/** The option's name as a URL query key, and a value as the query writes it: "Light grey" → "light-grey". */
export function optionKey(text: string): string {
  return toHandle(text)
}

/** A colour when it is shown as swatches or named Colour/Color, a size when named Size, else plain. */
export function optionKind(option: Pick<VariantOption, 'name' | 'display' | 'swatches'>): OptionKind {
  if (option.display === 'swatches' || Object.keys(option.swatches ?? {}).length || /\bcolou?rs?\b/i.test(option.name)) return 'color'
  if (/\bsizes?\b/i.test(option.name)) return 'size'
  return 'plain'
}

/** Units on hand across every location. */
export function variantUnits(variant: Pick<SellableVariant, 'stock'>): number {
  return Object.values(variant.stock).reduce((sum, qty) => sum + (Number(qty) || 0), 0)
}

/** A shopper can buy it: there is stock, or it is sold without tracking stock or on backorder. */
export function variantAvailable(variant: Pick<SellableVariant, 'manageInventory' | 'allowBackorder' | 'stock'>): boolean {
  return !variant.manageInventory || variant.allowBackorder || variantUnits(variant) > 0
}

/**
 * The variant's value for each option, in the options' order. From `optionValues`
 * when it has one per option; otherwise from the title: a one-option title is the
 * value whole, and a longer one is split by " / " ("M / Black").
 */
export function optionValuesOf(
  variant: Pick<SellableVariant, 'title' | 'optionValues'>,
  options: readonly Pick<VariantOption, 'name'>[],
): string[] {
  if (variant.optionValues?.length === options.length) return [...variant.optionValues]
  if (options.length === 1) return [variant.title.trim()]
  const parts = variant.title.split(' / ').map((part) => part.trim())
  return options.map((_, i) => parts[i] ?? '')
}

/**
 * The variant a selection names, or undefined while an option is still unchosen
 * or the combination does not exist. A product without options has one variant,
 * and that is it.
 */
export function variantFor<V extends SellableVariant>(product: VariantProduct<V>, selection: VariantSelection): V | undefined {
  const options = product.detail?.options ?? []
  const variants = product.detail?.variantsList ?? []
  if (!options.length) return variants[0]
  const chosen = options.map((option) => selection[option.name])
  if (chosen.some((value) => value === undefined)) return undefined
  return variants.find((variant) => optionValuesOf(variant, options).every((value, i) => value === chosen[i]))
}

/**
 * Whether `value` of the option `optionName` can be chosen, given what is chosen
 * for the other options (an unchosen option matches anything). Available when a
 * matching variant can be bought, sold out when every matching one is out of
 * stock, absent when no variant has that combination.
 */
export function valueState(product: VariantProduct, selection: VariantSelection, optionName: string, value: string): ValueState {
  const options = product.detail?.options ?? []
  const index = options.findIndex((option) => option.name === optionName)
  if (index < 0) return 'absent'
  const matching = (product.detail?.variantsList ?? []).filter((variant) => {
    const values = optionValuesOf(variant, options)
    return options.every((option, i) => {
      const wanted = i === index ? value : selection[option.name]
      return wanted === undefined || values[i] === wanted
    })
  })
  if (!matching.length) return 'absent'
  return matching.some(variantAvailable) ? 'available' : 'sold-out'
}

/**
 * What the product page has chosen when it opens. A value named in the URL
 * (`?color=black&size=m`, keys and values as `optionKey` writes them) wins when
 * that combination exists. Otherwise an option with one value is chosen, and a
 * colour starts on the first one in stock. A size, or any other option with a
 * real choice, is left for the shopper.
 */
export function initialSelection(product: VariantProduct, query: Readonly<Record<string, string | undefined>> = {}): Record<string, string> {
  const options = product.detail?.options ?? []
  const selection: Record<string, string> = {}
  for (const option of options) {
    const asked = query[optionKey(option.name)]
    const value = asked === undefined ? undefined : option.values.find((v) => optionKey(v) === optionKey(asked))
    if (value !== undefined && valueState(product, selection, option.name, value) !== 'absent') selection[option.name] = value
  }
  for (const option of options) {
    if (selection[option.name] !== undefined) continue
    if (option.values.length === 1) selection[option.name] = option.values[0]!
    else if (optionKind(option) === 'color') {
      const first = option.values.find((v) => valueState(product, selection, option.name, v) === 'available')
        ?? option.values.find((v) => valueState(product, selection, option.name, v) !== 'absent')
      if (first !== undefined) selection[option.name] = first
    }
  }
  return selection
}

/**
 * How a chosen variant reads on a cart line, an order and the checkout: sizes
 * first, then the other values, "Size M · Black" or "Front". Empty for a product
 * without options.
 */
export function describeVariant(variant: Pick<SellableVariant, 'title' | 'optionValues'>, options: readonly VariantOption[]): string {
  if (!options.length) return ''
  const values = optionValuesOf(variant, options)
  const sizes: string[] = []
  const others: string[] = []
  options.forEach((option, i) => {
    const value = values[i]
    if (!value) return
    if (optionKind(option) !== 'size') others.push(value)
    else sizes.push(/\bsize\b/i.test(value) ? value : `Size ${value}`)
  })
  return [...sizes, ...others].join(' · ')
}

/** "Only 2 left" when a tracked variant is down to `LOW_STOCK` or fewer; null otherwise, sold out included. */
export function stockNote(variant: Pick<SellableVariant, 'manageInventory' | 'allowBackorder' | 'stock'>): string | null {
  if (!variant.manageInventory || variant.allowBackorder) return null
  const units = variantUnits(variant)
  return units > 0 && units <= LOW_STOCK ? `Only ${units} left` : null
}

// ── The product form ─────────────────────────────────────────────────────────

/**
 * The variants a product form's options make: one per combination of values, in
 * option order, titled "M / Black" and carrying its `optionValues`. A combination
 * the product already has keeps its variant (id, SKU, prices, stock), matched by
 * its option values, or by its title for a variant saved before it had them.
 * `make(title)` makes a new one. Options without a name or values make nothing.
 */
export function buildVariants<V extends { title: string; optionValues?: string[] }>(
  options: readonly Pick<VariantOption, 'name' | 'values'>[],
  previous: readonly V[],
  make: (title: string) => V,
): V[] {
  const valid = options.filter((option) => option.name.trim() && option.values.length)
  if (!valid.length) return []
  let combos: string[][] = [[]]
  for (const option of valid) combos = combos.flatMap((combo) => option.values.map((value) => [...combo, value]))
  const kept = new Map(previous.map((v) => [v.optionValues ? JSON.stringify(v.optionValues) : `title:${v.title}`, v]))
  return combos.map((combo) => {
    const title = combo.join(' / ')
    const keys = [JSON.stringify(combo), `title:${title}`]
    const key = keys.find((k) => kept.has(k))
    const before = key === undefined ? undefined : kept.get(key)
    // A value listed twice must not hand one variant to two rows.
    if (key !== undefined) kept.delete(key)
    return { ...(before ?? make(title)), title, optionValues: combo }
  })
}

/**
 * The product's next variant id: `productId * 100 + n`, with n past the highest
 * n among `taken` (ids outside the product's block don't count), so an id that
 * was given out and then removed is never given out again.
 */
export function nextVariantId(productId: number, taken: Iterable<number>): number {
  const base = productId * 100
  const ids = new Set(taken)
  let n = 0
  for (const id of ids) if (id > base && id < base + 100) n = Math.max(n, id - base)
  do n++
  while (ids.has(base + n))
  return base + n
}

/**
 * A product's variants with their ids as saved. A variant that has an id keeps it,
 * so carts and orders that name it still find it; a new one (the form gives them
 * 0 or less) gets the product's next id, as does a repeat of an id. `alsoTaken` is
 * the ids the product had before, removed ones included, so a new variant never
 * takes the id of one that was removed. Ids are unique within the product; while
 * n stays within 99 they are also unique across products, because each product
 * has its own block.
 */
export function numberVariants<V extends { id: number }>(variants: readonly V[], productId: number, alsoTaken: Iterable<number> = []): V[] {
  const taken = new Set(alsoTaken)
  const kept = new Set<number>()
  const keeps = variants.map((variant) => {
    const keep = variant.id > 0 && !kept.has(variant.id)
    if (keep) kept.add(variant.id)
    return keep
  })
  for (const id of kept) taken.add(id)
  return variants.map((variant, i) => {
    if (keeps[i]) return variant
    const id = nextVariantId(productId, taken)
    taken.add(id)
    return { ...variant, id }
  })
}
