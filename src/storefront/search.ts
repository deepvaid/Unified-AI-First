// What a store's search box finds, and what a product page recommends, once the
// store is connected to Merchandise Cloud. The merchant's rules decide: a redirect
// sends a query to a page, synonyms widen the query, pinned products lead the
// results, and a blacklisted product is never found. The admin's Search preview runs the same
// function, so it shows what a shopper gets. Pure, so Node can test it.

/** The fields search reads. A commerce `Product` satisfies it. */
export interface SearchableProduct {
  id: number
  name: string
  price: string
  collections: string[]
  detail?: { subtitle?: string; description?: string }
}

/** The merchant's search rules for one store, as Merchandising keeps them. */
export interface SearchRules {
  synonyms: { status: 'active' | 'inactive'; type: 'one_way' | 'two_way'; queries: string[]; leadsTo: string[] }[]
  redirects: { queries: string[]; leadsTo: string }[]
  pins: { query: string; pinnedProductIds: string[] }[]
  /** Products kept out of search (Blacklisting › Product matches), by id. */
  hiddenProductIds: string[]
}

export const NO_SEARCH_RULES: SearchRules = { synonyms: [], redirects: [], pins: [], hiddenProductIds: [] }

export type SearchSort = 'relevance' | 'price_asc' | 'price_desc'

export const SEARCH_SORTS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
]

export interface SearchResult<T> {
  /** The query as it was searched: trimmed, lower case, single spaces. */
  query: string
  /** A redirect matched: the shopper goes here, and no products are listed. */
  redirectTo?: string
  /** The words a synonym added to the query. */
  alsoSearched: string[]
  products: T[]
  /** The ids, among `products`, that a pin put first. */
  pinnedIds: number[]
}

const clean = (text: string): string => text.trim().toLowerCase().replace(/\s+/g, ' ')

/** "Capsules" and "capsule" are one word to a shopper. */
const stem = (word: string): string => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word)

const wordsOf = (text: string): string[] => (text.toLowerCase().match(/[\p{L}\p{N}+]+/gu) ?? []).map(stem)

/** Words a shopper types around what they mean: "something for sleep" is a search for sleep. */
const FILLER = new Set(['a', 'an', 'and', 'the', 'for', 'to', 'of', 'with', 'in', 'on', 'my', 'me', 'i', 'am', 'is', 'it', 'that', 'some', 'something', 'anything', 'need', 'want', 'help', 'can', 'you', 'do', 'have', 'good', 'best', 'please', 'get'])

/** The words of a query that say what is wanted. A query of filler words alone keeps them all. */
function meaningWords(query: string): string[] {
  const words = wordsOf(query)
  const meant = words.filter((word) => !FILLER.has(word))
  return meant.length ? meant : words
}

/** Every word of `phrase` begins a word of `text`: "sleep" finds "sleeping", "foc" finds "focus". */
function matches(phrase: string[], text: string[]): boolean {
  return phrase.length > 0 && phrase.every((word) => text.some((candidate) => candidate.startsWith(word)))
}

/** How well one phrase fits a product: its name counts most, its description least. */
function fit(phrase: string[], product: SearchableProduct): number {
  const everywhere = wordsOf([product.name, product.detail?.subtitle, product.detail?.description, ...product.collections].join(' '))
  if (!matches(phrase, everywhere)) return 0
  const parts: [string, number][] = [
    [product.name, 10],
    [product.collections.join(' '), 6],
    [product.detail?.subtitle ?? '', 5],
    [product.detail?.description ?? '', 2],
  ]
  // A phrase spread over two fields still counts: the product is about all of its words.
  // A query that is a product's whole name means that product ("Balance" before "Balance Refill").
  return (wordsOf(product.name).join(' ') === phrase.join(' ') ? 5 : 1) + parts.reduce((score, [text, weight]) => score + (phrase.some((word) => wordsOf(text).some((w) => w.startsWith(word))) ? weight : 0), 0)
}

/** Whether `query` is, or holds as whole words, `term`. */
function holds(query: string, term: string): boolean {
  const wanted = clean(term)
  return !!wanted && ` ${query} `.includes(` ${wanted} `)
}

/** The words the store's synonyms add to a query. */
export function synonymsFor(query: string, synonyms: SearchRules['synonyms']): string[] {
  const q = clean(query)
  const added = synonyms.filter((s) => s.status === 'active').flatMap((s) => {
    const hit = s.queries.filter((term) => holds(q, term))
    if (!hit.length) return []
    // One way: these words also mean those. Two way: every word in the group means the others.
    return s.type === 'one_way' ? s.leadsTo : s.queries.filter((term) => !hit.includes(term))
  })
  return [...new Set(added.map(clean))].filter((term) => term && !holds(q, term))
}

const priceOf = (product: SearchableProduct): number => Number.parseFloat(product.price) || 0

/**
 * What a query finds in a store. `all` are the products the store sells, in the
 * store's own order, which settles a tie.
 */
export function searchStore<T extends SearchableProduct>(query: string, all: T[], rules: SearchRules, sort: SearchSort = 'relevance'): SearchResult<T> {
  const q = clean(query)
  const nothing = { query: q, alsoSearched: [], products: [], pinnedIds: [] }
  if (!q) return nothing

  const redirect = rules.redirects.find((r) => r.queries.some((term) => clean(term) === q))
  if (redirect) return { ...nothing, redirectTo: redirect.leadsTo }

  const products = all.filter((p) => !rules.hiddenProductIds.includes(String(p.id)))
  const alsoSearched = synonymsFor(q, rules.synonyms)
  const scored = products
    .map((product, index) => {
      // What the shopper typed outweighs what a synonym added.
      const own = fit(meaningWords(q), product)
      const widened = Math.max(0, ...alsoSearched.map((term) => fit(wordsOf(term), product)))
      return { product, index, score: own + widened * 0.6 }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)

  // A pin is for what the query means: "something for sleep" gets the pins of "sleep".
  const meant = meaningWords(q).join(' ')
  const pin = rules.pins.find((p) => meaningWords(p.query).join(' ') === meant)
  const pinned = (pin?.pinnedProductIds ?? [])
    .map((id) => products.find((p) => String(p.id) === id))
    .filter((p): p is T => !!p)
  const rest = scored.map((row) => row.product).filter((p) => !pinned.includes(p))

  if (sort !== 'relevance') {
    const byPrice = [...pinned, ...rest].sort((a, b) => (sort === 'price_asc' ? priceOf(a) - priceOf(b) : priceOf(b) - priceOf(a)))
    return { query: q, alsoSearched, products: byPrice, pinnedIds: [] }
  }
  return { query: q, alsoSearched, products: [...pinned, ...rest], pinnedIds: pinned.map((p) => p.id) }
}

/**
 * Where a redirect sends a shopper inside the store: the path for a URL on the
 * store's own domain or a path, or null for somewhere else on the web.
 */
export function redirectPath(leadsTo: string, domain: string | undefined): string | null {
  const target = leadsTo.trim()
  if (target.startsWith('/')) return target
  const onStore = domain ? new RegExp(`^(https?:)?//${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=/|$)`, 'i').exec(target) : null
  return onStore ? target.slice(onStore[0].length) || '/' : null
}

// ── Recommendations ──────────────────────────────────────────────────────────

/** The ways an engine can choose products (Merchandising › Recommendation engines). */
export type RecommendationStrategy =
  | 'personalized'
  | 'popular_products'
  | 'newest_products'
  | 'visual_recommendations'
  | 'frequently_purchased_together'
  | 'recently_viewed'
  | 'viewed_together'
  | 'new_trending'

export interface RecommendationEngineLike {
  type: RecommendationStrategy
  maxProducts?: number
}

/** The row's heading on a product page, in the shopper's words. */
export function recommendationHeading(type: RecommendationStrategy, productName: string): string {
  switch (type) {
    case 'frequently_purchased_together': return `Goes well with ${productName}`
    case 'viewed_together': return 'Shoppers also looked at'
    case 'visual_recommendations': return `More like ${productName}`
    case 'newest_products': return 'New in'
    case 'popular_products': return 'Popular right now'
    case 'new_trending': return 'Trending now'
    default: return 'You may also like'
  }
}

/** How many products the row on a product page holds, whatever the engine allows. */
export const RECOMMENDATION_ROW = 4

/**
 * The products an engine puts beside `product`, from the ones the store sells
 * (in the store's own order, which stands for popularity: the merchant leads with
 * the best sellers).
 *
 * - Bought or viewed together, similar, personal: the products that share the
 *   most with this one. A collection of two says more than a collection of
 *   everything, so a small shared collection counts for more.
 * - Newest: the latest added first.
 * - Popular, trending and the rest: the store's own order.
 */
export function recommendFor<T extends SearchableProduct>(product: T, products: T[], engine: RecommendationEngineLike): T[] {
  const others = products.filter((p) => p.id !== product.id)
  const size = (collection: string): number => products.filter((p) => p.collections.includes(collection)).length
  const closeness = (other: T): number => other.collections
    .filter((c) => product.collections.includes(c))
    .reduce((total, c) => total + 1 / size(c), 0)

  let ranked: T[]
  switch (engine.type) {
    case 'frequently_purchased_together':
    case 'viewed_together':
    case 'visual_recommendations':
    case 'personalized':
      ranked = others.map((p, index) => ({ p, index, score: closeness(p) })).sort((a, b) => b.score - a.score || a.index - b.index).map((row) => row.p)
      break
    case 'newest_products':
      ranked = [...others].sort((a, b) => b.id - a.id)
      break
    default:
      ranked = others
  }
  return ranked.slice(0, Math.min(engine.maxProducts ?? RECOMMENDATION_ROW, RECOMMENDATION_ROW))
}
