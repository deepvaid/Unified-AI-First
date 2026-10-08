import type { ProductOption } from '@/stores/useCommerce'

// Da Vinci Catalog Co-Pilot — deterministic product-draft generator.
//
// Turns a merchant's plain-English brief into a structured draft that maps 1:1
// onto the product create stepper and edit page (the PRD's draft field map).
// Same pattern as useThemeGenerator: synchronous, \b-anchored rules, no network.
// The two entry points keep their shape if they later delegate to the AI Gateway.
//
// Rules from the PRD, enforced here rather than in the UI:
// - a price is drafted only when the merchant stated one;
// - a brand is drafted only when the merchant named one;
// - SEO is never drafted for a product without a title.
//
// Pure module (type-only imports), so `node --test` can run it directly.

export type CatalogFieldKey =
  | 'title' | 'subtitle' | 'sku' | 'handle' | 'description'
  | 'brand' | 'tag' | 'categories' | 'collection'
  | 'options' | 'price'
  | 'seoTitle' | 'seoMetaDescription'

/** The order fields appear in the create stepper — drafts and diffs follow it. */
export const CATALOG_FIELD_ORDER: CatalogFieldKey[] = [
  'title', 'subtitle', 'sku', 'handle', 'description',
  'brand', 'tag', 'categories', 'collection',
  'options', 'price',
  'seoTitle', 'seoMetaDescription',
]

export interface CatalogDraft {
  title?: string
  subtitle?: string
  sku?: string
  /** URL handle — lands in the product URL and the SEO URL handle. */
  handle?: string
  description?: string
  brand?: string
  /** One tag: `ProductDetail.tag` holds a single value, so the draft does too. */
  tag?: string
  categories?: string[]
  collection?: string
  options?: ProductOption[]
  /** Only when the merchant stated a price; applied to every variant. */
  price?: string
  seoTitle?: string
  seoMetaDescription?: string
}

/** What the open form holds right now — unsaved edits included. */
export interface ProductSnapshot {
  name: string
  subtitle: string
  sku: string
  description: string
  brand: string
  tag: string
  categories: string[]
  collection: string
  options: ProductOption[]
  seo?: { title: string; metaDescription: string; urlHandle: string }
}

export interface CatalogVocab {
  /** Category names the product forms offer. */
  categories: string[]
  /** Active collection titles. */
  collections: string[]
  /** Brands already in the catalog — normalises the casing of a stated brand. */
  brands: string[]
}

export type CatalogAsk = 'all' | 'description' | 'seo'
export type CatalogGenErrorCode = 'timeout' | 'missing_title' | 'unclear' | 'no_changes'

export interface CatalogGenSuccess {
  ok: true
  draft: CatalogDraft
  /** Drafted keys, in form order. */
  keys: CatalogFieldKey[]
  /** Current values for the same keys (enrich and field modes) — the diff's left side. */
  current?: CatalogDraft
  /** One sentence for the chat bubble; the card carries the detail. */
  intro: string
  /** Full sentence version, for speech. */
  explanation: string
  /** Fields deliberately left blank — the merchant fills them (PRD: never invent price or brand). */
  gaps: CatalogFieldKey[]
  /** Assumptions the merchant should check, one short sentence each. */
  notes: string[]
  steps: string[]
  /** Follow-up prompts that refine this draft. */
  refinements: string[]
}

export interface CatalogGenFailure {
  ok: false
  code: CatalogGenErrorCode
  message: string
  steps: string[]
}

export type CatalogGenOutcome = CatalogGenSuccess | CatalogGenFailure

export const SEO_TITLE_MAX = 60
export const SEO_META_MAX = 155

/** Demo fault injection: any prompt containing "timeout" simulates a gateway timeout. */
export const SIMULATED_TIMEOUT_RE = /\btimeout\b/i

// ── Product kinds ────────────────────────────────────────────────────────────
// Ordered most-specific first. `categories` use the names the product forms offer.

interface Kind {
  id: string
  /** SKU segment. */
  code: string
  test: RegExp
  /** Fallback descriptor when the brief doesn't say what the product is. */
  noun: string
  /** Use the matched word as the noun ("tumbler", "hoodie") instead of `noun`. */
  nounFromMatch?: boolean
  /** Matched word → noun, for words the plain singular gets wrong ("headphones"). */
  nouns?: Record<string, string>
  categories: string[]
  tag: string
  sizes?: 'shoe' | 'apparel'
  purpose: string
  features: [string, string, string]
  subtitle: string
  /** Used only to suggest a refinement ("Set the price to $X") — never drafted. */
  typicalPrice: string
}

const KINDS: Kind[] = [
  {
    id: 'trail-shoe', code: 'TRL', noun: 'trail running shoe',
    test: /\b(?:trail|hiking)\b[^.,;]*?\b(?:shoes?|runners?|sneakers?|boots?|trainers?)\b/i,
    categories: ['Sports & Outdoors', 'Apparel'], tag: 'Running', sizes: 'shoe',
    purpose: 'made for runs that leave the pavement',
    features: ['a cushioned midsole that softens long descents', 'a lugged outsole that grips on loose ground', 'a breathable upper that dries fast'],
    subtitle: 'Cushioned grip for technical trails', typicalPrice: '129',
  },
  {
    id: 'running-shoe', code: 'RUN', noun: 'running shoe',
    test: /\brunning\b[^.,;]*?\b(?:shoes?|sneakers?|trainers?)\b|\brunners?\b/i,
    categories: ['Sports & Outdoors', 'Apparel'], tag: 'Running', sizes: 'shoe',
    purpose: 'made for easy daily miles',
    features: ['a responsive, cushioned midsole', 'a lightweight knit upper', 'a durable rubber outsole'],
    subtitle: 'Light, cushioned and ready for daily miles', typicalPrice: '119',
  },
  {
    id: 'shoe', code: 'SHO', noun: 'shoe', nounFromMatch: true, nouns: { footwear: 'shoe' },
    test: /\b(?:shoes?|sneakers?|trainers?|boots?|footwear|sandals?|loafers?|slippers?)\b/i,
    categories: ['Apparel'], tag: 'Footwear', sizes: 'shoe',
    purpose: 'made for all-day comfort',
    features: ['a cushioned footbed', 'a flexible, hard-wearing sole', 'an upper that breathes'],
    subtitle: 'All-day comfort with a clean, versatile look', typicalPrice: '99',
  },
  {
    id: 'top', code: 'TOP', noun: 'top', nounFromMatch: true, nouns: { hoodies: 'hoodie' },
    test: /\b(?:t-?shirts?|tees?|shirts?|hoodies?|sweatshirts?|jumpers?|sweaters?|cardigans?|jackets?|coats?|tops?|polos?|vests?|fleeces?)\b/i,
    categories: ['Apparel'], tag: 'Tops', sizes: 'apparel',
    purpose: 'cut for everyday wear',
    features: ['soft, breathable fabric', 'a relaxed fit that layers easily', 'seams that keep their shape wash after wash'],
    subtitle: 'An easy everyday layer', typicalPrice: '35',
  },
  {
    id: 'bottoms', code: 'BTM', noun: 'pair of trousers', nounFromMatch: true,
    nouns: {
      pants: 'pair of pants', trousers: 'pair of trousers', jeans: 'pair of jeans', shorts: 'pair of shorts',
      leggings: 'pair of leggings', joggers: 'pair of joggers', chinos: 'pair of chinos',
    },
    test: /\b(?:pants|trousers|jeans|shorts|leggings|joggers|skirts?|chinos)\b/i,
    categories: ['Apparel'], tag: 'Bottoms', sizes: 'apparel',
    purpose: 'made to move with you',
    features: ['a comfortable waistband', 'fabric with just enough stretch', 'a fit that works from morning to evening'],
    subtitle: 'Comfortable, everyday fit', typicalPrice: '59',
  },
  {
    id: 'kitchen', code: 'KIT', noun: 'kitchen appliance', nounFromMatch: true,
    nouns: { mixer: 'stand mixer', mixers: 'stand mixer', 'sous vide': 'sous vide cooker' },
    test: /\b(?:cookers?|mixers?|blenders?|espresso machines?|coffee makers?|kettles?|toasters?|grills?|dutch ovens?|air fryers?|sous vide)\b/i,
    categories: ['Home & Kitchen'], tag: 'Kitchen',
    purpose: 'made to make everyday cooking easier',
    features: ['simple, intuitive controls', 'parts that are easy to clean', 'a footprint that suits most counters'],
    subtitle: 'Everyday cooking, made easier', typicalPrice: '149',
  },
  {
    id: 'mug', code: 'MUG', noun: 'mug', nounFromMatch: true,
    test: /\b(?:mugs?|cups?|teacups?)\b/i,
    categories: ['Home & Kitchen'], tag: 'Drinkware',
    purpose: 'made for slow mornings and long afternoons',
    features: ['a comfortable, easy-to-hold shape', 'a finish that cleans up easily', 'a size that suits your daily routine'],
    subtitle: 'Your new everyday favourite', typicalPrice: '24',
  },
  {
    id: 'bottle', code: 'BTL', noun: 'insulated bottle',
    nouns: { tumbler: 'insulated tumbler', tumblers: 'insulated tumbler', quencher: 'insulated tumbler', quenchers: 'insulated tumbler' },
    test: /\b(?:bottles?|flasks?|tumblers?|quenchers?)\b/i,
    categories: ['Home & Kitchen'], tag: 'Drinkware',
    purpose: 'made to keep drinks at the right temperature on long days out',
    features: ['double-wall insulation', 'a leak-resistant lid', 'a size that fits most cup holders'],
    subtitle: 'Cold for hours, wherever the day goes', typicalPrice: '39',
  },
  {
    id: 'home-fragrance', code: 'CDL', noun: 'candle', nounFromMatch: true, nouns: { 'room spray': 'room spray', 'room sprays': 'room spray' },
    test: /\b(?:candles?|diffusers?|incense|room sprays?)\b/i,
    categories: ['Home & Kitchen'], tag: 'Home fragrance',
    purpose: 'made to make a room feel settled',
    features: ['a clean, even burn', 'a scent that fills the room without overpowering it', 'a vessel worth keeping'],
    subtitle: 'Calm, clean scent for any room', typicalPrice: '32',
  },
  {
    id: 'home', code: 'HOM', noun: 'homeware piece', nounFromMatch: true,
    test: /\b(?:throws?|blankets?|cushions?|pillows?|vases?|rugs?|planters?|baskets?)\b/i,
    categories: ['Home & Kitchen'], tag: 'Home',
    purpose: 'made to make your space feel finished',
    features: ['materials that feel good to the touch', 'a shape that suits most rooms', 'a finish that is easy to care for'],
    subtitle: 'An easy way to finish a room', typicalPrice: '45',
  },
  {
    id: 'bag', code: 'BAG', noun: 'bag', nounFromMatch: true,
    nouns: {
      tote: 'tote bag', totes: 'tote bag', duffel: 'duffel bag', duffels: 'duffel bag', luggage: 'suitcase',
      'carry-on': 'carry-on suitcase', 'carry-ons': 'carry-on suitcase', carryon: 'carry-on suitcase',
    },
    test: /\b(?:bags?|backpacks?|totes?|wallets?|purses?|duffels?|satchels?|luggage|suitcases?|carry-?ons?)\b/i,
    categories: ['Apparel'], tag: 'Bags',
    purpose: 'built to carry the day',
    features: ['hard-wearing, water-resistant fabric', 'pockets where you need them', 'straps that stay comfortable when it is full'],
    subtitle: 'Everything you need, carried well', typicalPrice: '79',
  },
  {
    id: 'beauty', code: 'BTY', noun: 'skincare product', nounFromMatch: true, nouns: { massage: 'massage device' },
    test: /\b(?:serums?|creams?|moisturi[sz]ers?|lotions?|cleansers?|shampoos?|conditioners?|balms?|face oils?|body oils?|soaps?|scrubs?|massage)\b/i,
    categories: ['Beauty & Health'], tag: 'Skincare',
    purpose: 'made for a simple daily routine',
    features: ['a lightweight texture that absorbs quickly', 'a formula that feels gentle on skin', 'a size that lasts'],
    subtitle: 'A simple step for your daily routine', typicalPrice: '28',
  },
  {
    id: 'audio', code: 'AUD', noun: 'speaker', nounFromMatch: true,
    nouns: {
      headphones: 'pair of headphones', headphone: 'pair of headphones', earbuds: 'set of earbuds', earbud: 'set of earbuds',
      earphones: 'pair of earphones', earphone: 'pair of earphones',
    },
    test: /\b(?:headphones?|earbuds?|earphones?|speakers?|soundbars?)\b/i,
    categories: ['Electronics'], tag: 'Audio',
    purpose: 'made for music, calls and everything in between',
    features: ['clear, balanced sound', 'controls that are easy to find', 'a design that fits the way you listen'],
    subtitle: 'Clear sound, wherever you listen', typicalPrice: '149',
  },
  {
    id: 'electronics', code: 'ELC', noun: 'tech accessory', nounFromMatch: true,
    nouns: { tv: 'smart TV', iphone: 'phone case', mice: 'mouse', smartwatch: 'smartwatch', 'smart watch': 'smartwatch', 'smart watches': 'smartwatch' },
    test: /\b(?:chargers?|charging hubs?|cables?|keyboards?|mouse|mice|webcams?|power banks?|smart ?watch(?:es)?|cameras?|thermostats?|doorbells?|trackers?|phone cases?|iphone|tv)\b/i,
    categories: ['Electronics'], tag: 'Tech accessories',
    purpose: 'made to fit neatly into your setup',
    features: ['simple, quick setup', 'reliable everyday performance', 'a design that looks at home on any desk'],
    subtitle: 'Simple setup, dependable every day', typicalPrice: '89',
  },
  {
    id: 'outdoor', code: 'OUT', noun: 'piece of outdoor gear', nounFromMatch: true,
    nouns: {
      dumbbells: 'set of dumbbells', 'trekking poles': 'pair of trekking poles', 'hiking poles': 'pair of hiking poles',
    },
    test: /\b(?:tents?|sleeping bags?|yoga mats?|dumbbells?|kettlebells?|helmets?|trekking poles?|hiking poles?|coolers?|bikes?)\b/i,
    categories: ['Sports & Outdoors'], tag: 'Outdoor',
    purpose: 'built for weekends outside',
    features: ['tough, weather-ready materials', 'a design that packs down small', 'details that make setup quick'],
    subtitle: 'Ready for weekends outside', typicalPrice: '99',
  },
  {
    id: 'tools', code: 'TLS', noun: 'tool', nounFromMatch: true,
    nouns: { wrenches: 'wrench', shears: 'pair of shears', pruners: 'pair of pruners' },
    test: /\b(?:drills?|hammers?|wrench(?:es)?|screwdrivers?|trowels?|watering cans?|pruners?|shears|tool ?kits?|saws?)\b/i,
    categories: ['Tools & Garden'], tag: 'Tools',
    purpose: 'made for jobs around the house and garden',
    features: ['a comfortable, secure grip', 'tough materials that last', 'a size that is easy to store'],
    subtitle: 'Built for jobs big and small', typicalPrice: '39',
  },
]

const GENERIC: Kind = {
  id: 'generic', code: 'GEN', noun: 'product', test: /$^/, categories: [], tag: '',
  purpose: 'made for everyday use',
  features: ['thoughtful details', 'materials chosen to last', 'a design that is easy to live with'],
  subtitle: 'Thoughtfully made for everyday use', typicalPrice: '49',
}

interface KindMatch {
  kind: Kind
  /** The last matching word — the head noun in "better sweater fleece vest". */
  word: string
}

function detectKind(text: string): KindMatch | undefined {
  const kind = KINDS.find((k) => k.test.test(text))
  if (!kind) return undefined
  const matches = [...text.matchAll(new RegExp(kind.test.source, 'gi'))]
  return { kind, word: (matches[matches.length - 1]?.[0] ?? '').toLowerCase() }
}

function nounFor(match: KindMatch | undefined): string {
  if (!match) return GENERIC.noun
  const { kind, word } = match
  return kind.nouns?.[word] ?? (kind.nounFromMatch && word ? singular(word) : kind.noun)
}

// ── Brief parsing ────────────────────────────────────────────────────────────

type Audience = 'men' | 'women' | 'kids' | 'unisex'
type Tone = 'default' | 'playful' | 'premium' | 'short'

const QUOTE_RE = /["“”]([^"“”]+)["“”]/g
// Stops before the next clause so "called Cedar & Smoke by Local Artisan" yields the name only.
const CALLED_RE = /\b(?:called|named|titled|call it|name it|rename it to)\s+(.+?)(?=\s*(?:[,.;!?]|$)|\s+(?:by|with|in|for|priced|at|costing|sizes?|colou?rs?)\b)/gi
const FRESH_NAME_RE = /["“”][^"“”]+["“”]|\b(?:called|named|titled)\s+\S/i
const CREATE_VERB_RE = /\b(?:create|add|draft|make|write|list|build|new)\b/i
const AUDIENCE_RE = /\b(women|ladies|men|kids|children|boys|girls|unisex)(?:['’]?s)?['’]?(?![a-z])/gi
const TONE_RE = /\b(playful|fun|cheeky|premium|luxur(?:y|ious)|elevated|refined|short(?:er)?|concise|brief|punchy)\b/gi
const PRICE_RE = /\$\s?(\d{1,6}(?:\.\d{1,2})?)|\b(\d{1,6}(?:\.\d{1,2})?)\s?(?:dollars|usd|aud|nzd)\b|\bpriced?\s+(?:at\s+)?(\d{1,6}(?:\.\d{1,2})?)\b/gi
const SIZE_RANGE_RE = /\bsizes?\s+(?:from\s+)?([a-z0-9.]+)\s*(?:-|–|to|through)\s*([a-z0-9.]+)/gi
const SIZE_LIST_RE = /\bsizes?\s+((?:[a-z0-9.]+\s*(?:,|and|&|\/)\s*)+[a-z0-9.]+)/gi
const SIZE_MENTION_RE = /\bsizes?\b|\bsized\b/i
const COLOUR_LEAD_RE = /\b(?:colou?rs?|colou?rways?|in)\s+/gi
const LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const COLOURS = new Set([
  'black', 'white', 'navy', 'grey', 'gray', 'charcoal', 'red', 'blue', 'green', 'sage', 'olive', 'khaki',
  'sand', 'beige', 'cream', 'ivory', 'brown', 'tan', 'pink', 'purple', 'yellow', 'orange', 'teal', 'silver',
  'gold', 'natural', 'clay', 'stone', 'oat', 'forest', 'burgundy', 'maroon', 'coral', 'mint', 'lavender',
  'indigo', 'rust', 'denim',
])

function lastMatch(re: RegExp, text: string): RegExpExecArray | undefined {
  let last: RegExpExecArray | undefined
  re.lastIndex = 0
  for (let m = re.exec(text); m; m = re.exec(text)) last = m
  re.lastIndex = 0
  return last
}

function parseName(text: string): string | undefined {
  const quoted = lastMatch(QUOTE_RE, text)?.[1]?.trim()
  if (quoted) return quoted
  const called = lastMatch(CALLED_RE, text)?.[1]?.trim()
  if (called) return called
  // "Create a men's trail running shoe, Trail Runner Pro, with sizes" — a Title Case
  // clause after the first one is the product's name.
  const clauses = text.split(/[,;]/).map((s) => s.trim().replace(/[.!?]+$/, ''))
  for (const clause of clauses.slice(1).reverse()) {
    const words = clause.split(/\s+/).filter(Boolean)
    if (words.length < 1 || words.length > 5) continue
    if (words.every((w) => /^[A-Z0-9&]/.test(w)) && /[a-z]/.test(clause)) return clause
  }
  return undefined
}

/** One clause of the brief, minus the ask, the name and the trailing details. */
function cleanClause(clause: string, name: string | undefined): string {
  let s = clause.replace(/["“”][^"“”]*["“”]/g, ' ')
  s = s.replace(/^\s*(?:please\s+)?(?:(?:can|could) you\s+)?(?:(?:create|add|draft|make|write|list|set ?up|build|new)\b\s*)?(?:me\s+)?(?:(?:a|an|the|some|my|our)\b\s*)?(?:new\s+)?(?:product\s+(?:for\s+)?)?/i, '')
  s = s.replace(/(?:^|\s+)(?:called|named|titled|call it|name it)\b.*$/i, '')
  s = s.replace(/(?:^|\s+)(?:with|in|by|for|priced|at|costing|sizes?|colou?rs?)\b.*$/i, '')
  s = s.replace(AUDIENCE_RE, ' ')
  s = s.replace(/\s+/g, ' ').trim().toLowerCase()
  if (name && s === name.toLowerCase()) s = ''
  return s.split(' ').filter(Boolean).slice(-6).join(' ')
}

/**
 * What the product is, in the merchant's words: the brief's first clause, or — when
 * that clause only names it ("Add a product called Aurora Mug, a stoneware mug") —
 * the first later clause that says what kind of product it is.
 */
function parseDescriptor(text: string, name: string | undefined): string {
  const clauses = text.split(/[,.;]/)
  const first = cleanClause(clauses[0] ?? '', name)
  if (first) return first
  for (const clause of clauses.slice(1)) {
    const descriptor = cleanClause(clause, name)
    if (descriptor && detectKind(descriptor)) return descriptor
  }
  return ''
}

function parseAudience(text: string): Audience | undefined {
  const word = lastMatch(AUDIENCE_RE, text)?.[1]?.toLowerCase()
  if (!word) return undefined
  if (word === 'women' || word === 'ladies') return 'women'
  if (word === 'men') return 'men'
  if (word === 'unisex') return 'unisex'
  return 'kids'
}

function parseTone(text: string): Tone {
  const word = lastMatch(TONE_RE, text)?.[1]?.toLowerCase()
  if (!word) return 'default'
  if (/^(playful|fun|cheeky)$/.test(word)) return 'playful'
  if (/^(short|shorter|concise|brief|punchy)$/.test(word)) return 'short'
  return 'premium'
}

function parsePrice(text: string): string | undefined {
  const m = lastMatch(PRICE_RE, text)
  const raw = m?.[1] ?? m?.[2] ?? m?.[3]
  return raw ? Number(raw).toFixed(2) : undefined
}

function parseBrand(text: string, vocab: CatalogVocab): string | undefined {
  const lower = text.toLowerCase()
  const known = vocab.brands.filter((b) => b && b !== '—' && lower.includes(`by ${b.toLowerCase()}`))
  if (known.length) return known.sort((a, b) => lower.lastIndexOf(b.toLowerCase()) - lower.lastIndexOf(a.toLowerCase()))[0]
  const m = lastMatch(/\bby\s+([A-Z][\w&'’.-]*(?:\s+(?:&\s+)?[A-Z][\w&'’.-]*)*)/g, text)
  return m?.[1]?.trim()
}

function expandSizeRange(from: string, to: string): string[] | undefined {
  const a = LETTER_SIZES.indexOf(from.toUpperCase())
  const b = LETTER_SIZES.indexOf(to.toUpperCase())
  if (a >= 0 && b > a) return LETTER_SIZES.slice(a, b + 1)
  const x = Number(from)
  const y = Number(to)
  if (!Number.isFinite(x) || !Number.isFinite(y) || y <= x) return undefined
  const step = Number.isInteger(x) && Number.isInteger(y) ? 1 : 0.5
  if ((y - x) / step > 20) return undefined
  const out: string[] = []
  for (let v = x; v <= y + 1e-9; v += step) out.push(String(v))
  return out
}

function parseSizes(text: string): string[] | undefined {
  const range = lastMatch(SIZE_RANGE_RE, text)
  const list = lastMatch(SIZE_LIST_RE, text)
  // Whichever explicit mention comes last wins, so a refinement can override the brief.
  if (range && (!list || range.index >= list.index)) {
    const values = expandSizeRange(range[1]!, range[2]!)
    if (values) return values
  }
  if (list) {
    const values = list[1]!.split(/\s*(?:,|\band\b|&|\/)\s*/).map((v) => v.trim().toUpperCase()).filter(Boolean)
    if (values.length > 1) return values
  }
  return undefined
}

function defaultSizes(kind: Kind, audience: Audience | undefined): string[] | undefined {
  if (kind.sizes === 'shoe') {
    if (audience === 'women') return ['5', '6', '7', '8', '9', '10']
    if (audience === 'kids') return ['11', '12', '13', '1', '2', '3']
    if (audience === 'men') return ['7', '8', '9', '10', '11', '12', '13']
    return ['6', '7', '8', '9', '10', '11', '12']
  }
  if (kind.sizes === 'apparel') return audience === 'kids' ? ['XS', 'S', 'M', 'L'] : ['S', 'M', 'L', 'XL']
  return undefined
}

function parseColours(text: string): string[] {
  const lower = text.toLowerCase()
  let best: string[] = []
  COLOUR_LEAD_RE.lastIndex = 0
  for (let m = COLOUR_LEAD_RE.exec(lower); m; m = COLOUR_LEAD_RE.exec(lower)) {
    const found: string[] = []
    for (const word of lower.slice(m.index + m[0].length).split(/[^a-z]+/)) {
      if (!word || word === 'and' || word === 'or') continue
      if (!COLOURS.has(word)) break
      if (!found.includes(word)) found.push(word)
    }
    if (found.length) best = found
  }
  COLOUR_LEAD_RE.lastIndex = 0
  return best.map(capitalize)
}

function parseAreas(prompt: string): Set<CatalogFieldKey> | null {
  const areas = new Set<CatalogFieldKey>()
  if (/\bdescri(?:ption|be)\b|\bcopy\b/i.test(prompt)) areas.add('description')
  if (/\bseo\b|\bmeta\b|\bsearch\b|\bgoogle\b/i.test(prompt)) { areas.add('seoTitle'); areas.add('seoMetaDescription') }
  if (/\btags?\b/i.test(prompt)) areas.add('tag')
  if (/\bcategor(?:y|ies)\b/i.test(prompt)) areas.add('categories')
  if (/\bsubtitle\b|\btagline\b/i.test(prompt)) areas.add('subtitle')
  if (/\bcollections?\b/i.test(prompt)) areas.add('collection')
  return areas.size ? areas : null
}

/**
 * Create-mode refinement: a follow-up that doesn't name a new product ("make it for
 * women", "set the price to $129") is read together with the brief it refines.
 */
export function mergeBrief(previous: string | undefined, next: string): string {
  const text = next.trim()
  if (!previous) return text
  const fresh = FRESH_NAME_RE.test(text) || (CREATE_VERB_RE.test(text) && detectKind(text) !== undefined)
  return fresh ? text : `${previous.trim().replace(/[.\s]+$/, '')}. ${text}`
}

// ── Copy helpers ─────────────────────────────────────────────────────────────

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

const MINOR_WORDS = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

function titleCase(text: string): string {
  return text
    .split(' ')
    .filter(Boolean)
    .map((word, i) => (i > 0 && MINOR_WORDS.has(word) ? word : capitalize(word)))
    .join(' ')
}

function article(phrase: string): string {
  if (/^(?:uni|one|eu|use)/i.test(phrase)) return 'a'
  return /^[aeiou]/i.test(phrase) ? 'an' : 'a'
}

function listOf(values: string[]): string {
  if (values.length <= 1) return values[0] ?? ''
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`
}

function sizeRange(values: string[]): string {
  return values.length >= 3 ? `${values[0]}–${values[values.length - 1]}` : listOf(values)
}

function withAudience(descriptor: string, audience: Audience | undefined): string {
  if (!audience || audience === 'unisex') return descriptor
  const possessive = audience === 'kids' ? 'kids’' : `${audience}’s`
  return `${possessive} ${descriptor}`
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function hash(text: string): number {
  let h = 5381
  for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0
  return h
}

function buildSku(title: string, kind: Kind): string {
  const initials = title
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .join('')
    .slice(0, 4) || 'NEW'
  return `${initials}-${kind.code}-${100 + (hash(title.toLowerCase()) % 900)}`
}

function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:\s]+$/, '')}…`
}

function availability(options: ProductOption[], kind: Kind, singleColour?: string): string | undefined {
  const size = options.find((o) => /size/i.test(o.name))
  const colour = options.find((o) => /colou?r/i.test(o.name))
  const parts: string[] = []
  if (size?.values.length) {
    const numeric = size.values.every((v) => /^\d/.test(v))
    parts.push(`${kind.sizes === 'shoe' && numeric ? 'US sizes' : 'sizes'} ${sizeRange(size.values)}`)
  }
  const colours = colour?.values.length ? colour.values : singleColour ? [singleColour] : []
  if (colours.length) parts.push(listOf(colours))
  return parts.length ? `Available in ${parts.join(', in ')}.` : undefined
}

interface CopyInput {
  name?: string
  descriptor: string
  kind: Kind
  tone: Tone
  availability?: string
}

function buildDescription({ name, descriptor, kind, tone, availability: avail }: CopyInput): string {
  const aDesc = `${article(descriptor)} ${descriptor}`
  const [f1, f2, f3] = kind.features
  // An unrecognised product isn't called "a product" — the sentence just says what it's for.
  const generic = kind === GENERIC
  const subject = name ?? 'This product'
  const lead: Record<Tone, string> = generic
    ? {
        default: `${subject} is ${kind.purpose}.`,
        premium: `${subject} is carefully ${kind.purpose}.`,
        playful: `Say hello to ${name ?? 'your new favourite'}, ${kind.purpose}.`,
        short: `${subject} is ${kind.purpose}.`,
      }
    : name
    ? {
        default: `${name} is ${aDesc} ${kind.purpose}.`,
        premium: `${name} is a considered ${descriptor}, ${kind.purpose}.`,
        playful: `Say hello to ${name}, ${aDesc} ${kind.purpose}.`,
        short: `${name} is ${aDesc} ${kind.purpose}.`,
      }
    : {
        default: `This ${descriptor} is ${kind.purpose}.`,
        premium: `This considered ${descriptor} is ${kind.purpose}.`,
        playful: `Say hello to your new ${descriptor}, ${kind.purpose}.`,
        short: `This ${descriptor} is ${kind.purpose}.`,
      }
  const detail: Record<Tone, string> = {
    default: `It has ${f1}, ${f2} and ${f3}.`,
    premium: `It pairs ${f1} with ${f2}, finished with ${f3}.`,
    playful: `Expect ${f1}, ${f2} and ${f3}. Go on, treat yourself.`,
    short: `It has ${f1} and ${f2}.`,
  }
  const body = `${lead[tone]} ${detail[tone]}`
  return avail ? `${body}\n\n${avail}` : body
}

function buildSeoTitle(title: string, descriptor: string, brand: string | undefined): string {
  const descTitle = titleCase(descriptor)
  const distinct = descriptor !== GENERIC.noun && descTitle.toLowerCase() !== title.toLowerCase()
  const candidates = [
    brand && distinct ? `${title} by ${brand} | ${descTitle}` : '',
    distinct ? `${title} | ${descTitle}` : '',
    brand ? `${title} by ${brand}` : '',
    title,
  ]
  return candidates.find((c) => c && c.length <= SEO_TITLE_MAX) ?? truncateWords(title, SEO_TITLE_MAX)
}

function buildSeoMeta({ name, descriptor, kind, tone, availability: avail }: CopyInput): string {
  const first = kind === GENERIC
    ? `Shop ${name ?? 'this product'}, ${kind.purpose}.`
    : name
      ? `Shop ${name}, ${article(descriptor)} ${descriptor} ${kind.purpose}.`
      : `Shop this ${descriptor}, ${kind.purpose}.`
  const [f1, f2] = kind.features
  const parts = tone === 'short' ? [avail] : [avail, `With ${f1} and ${f2}.`]
  let meta = truncateWords(first, SEO_META_MAX)
  for (const part of parts) {
    if (part && meta.length + 1 + part.length <= SEO_META_MAX) meta = `${meta} ${part}`
  }
  return meta
}

function normaliseCategories(preferred: string[], vocab: CatalogVocab): string[] {
  return preferred.map((c) => vocab.categories.find((v) => v.toLowerCase() === c.toLowerCase()) ?? c)
}

const COLLECTION_STOP = new Set([
  'the', 'and', 'of', 'for', 'all', 'products', 'product', 'over', 'door', 'free', 'standing', 'wall', 'mounted',
  'ceiling', 'home', 'office', 'feature', 'picks', 'summer', 'clearance', 'inactive', 'self', 'emptying',
])

function singular(word: string): string {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.endsWith('ses') || word.endsWith('xes')) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** A collection fits when every meaningful word of its title appears in the product text. */
function matchCollection(text: string, collections: string[]): string | undefined {
  const words = new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(singular))
  let best: string | undefined
  let bestScore = 0
  for (const title of collections) {
    const keys = title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !COLLECTION_STOP.has(w)).map(singular)
    if (!keys.length || !keys.every((k) => words.has(k))) continue
    if (keys.length > bestScore) {
      best = title
      bestScore = keys.length
    }
  }
  return best
}

function orderedKeys(draft: CatalogDraft): CatalogFieldKey[] {
  return CATALOG_FIELD_ORDER.filter((key) => {
    const value = draft[key]
    return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
  })
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? '') === JSON.stringify(b ?? '')
}

const TIMEOUT_MESSAGE = 'Nothing was applied and no credits were used. Try again in a moment.'
const CREATE_STEPS = ['Read your brief', 'Match catalog categories', 'Draft copy and SEO']

// ── Entry points ─────────────────────────────────────────────────────────────

/** Create mode: a brief (optionally merged with refinements) → a full product draft. */
export function generateCreateDraft(brief: string, vocab: CatalogVocab): CatalogGenOutcome {
  if (SIMULATED_TIMEOUT_RE.test(brief)) return { ok: false, code: 'timeout', message: TIMEOUT_MESSAGE, steps: CREATE_STEPS }

  const name = parseName(brief)
  const rawDescriptor = parseDescriptor(brief, name)
  const matched = detectKind(rawDescriptor) ?? detectKind(brief)
  if (!name && !matched) {
    return {
      ok: false,
      code: 'unclear',
      message: 'Say what the product is and what it’s called — for example “a ceramic mug called Morning Ritual, $24”.',
      steps: CREATE_STEPS,
    }
  }
  const kind = matched?.kind ?? GENERIC
  const audience = parseAudience(brief)
  const tone = parseTone(brief)
  const descriptor = withAudience(rawDescriptor || nounFor(matched), audience)
  const title = name ?? titleCase(descriptor)
  const brand = parseBrand(brief, vocab)
  const price = parsePrice(brief)

  const options: ProductOption[] = []
  const explicitSizes = parseSizes(brief)
  const sizesAsked = SIZE_MENTION_RE.test(brief)
  const sizes = explicitSizes ?? (sizesAsked ? defaultSizes(kind, audience) : undefined)
  if (sizes) options.push({ name: 'Size', values: sizes })
  const colours = parseColours(brief)
  if (colours.length > 1) options.push({ name: 'Colour', values: colours })
  const avail = availability(options, kind, colours.length === 1 ? colours[0] : undefined)

  const copy: CopyInput = { name, descriptor, kind, tone, availability: avail }
  const draft: CatalogDraft = {
    title,
    subtitle: kind.subtitle,
    sku: buildSku(title, kind),
    handle: slugify(title),
    description: buildDescription(copy),
    brand,
    tag: kind.tag || 'New',
    categories: normaliseCategories(kind.categories, vocab),
    collection: matchCollection(`${title} ${descriptor}`, vocab.collections),
    options: options.length ? options : undefined,
    price,
    seoTitle: buildSeoTitle(title, descriptor, brand),
    seoMetaDescription: buildSeoMeta(copy),
  }

  const sentences: string[] = [`I drafted ${title} as ${article(descriptor)} ${descriptor}${brand ? ` by ${brand}` : ''}.`]
  if (!name) sentences.push(`You didn’t name it, so the title is “${title}” — change it in Details.`)
  if (sizes && !explicitSizes) sentences.push(`I added a standard size run (${sizeRange(sizes)}); edit it in Variants if yours differs.`)
  else if (sizesAsked && !sizes) sentences.push('Tell me which sizes you sell and I’ll add them.')
  sentences.push(price ? `Every variant is priced at $${price}.` : 'You didn’t mention a price, so pricing is left for you in Variants.')
  if (!brand) sentences.push('Brand is blank because you didn’t name one.')

  const gaps: CatalogFieldKey[] = []
  if (!price) gaps.push('price')
  if (!brand) gaps.push('brand')
  const notes: string[] = []
  if (!name) notes.push(`“${title}” is a working title — you didn’t name the product.`)
  if (sizes && !explicitSizes) notes.push(`Standard size run (${sizeRange(sizes)}) — edit it in Variants if yours differs.`)
  else if (sizesAsked && !sizes) notes.push('No sizes yet — tell me which ones you sell.')

  const refinements: string[] = []
  if (!price) refinements.push(`Set the price to $${kind.typicalPrice}`)
  if (!sizes && kind.sizes) refinements.push(kind.sizes === 'shoe' ? 'Add sizes 7 to 12' : 'Add sizes S to XL')
  else if (colours.length < 2) refinements.push('Add colours black and white')
  refinements.push(tone === 'playful' ? 'Use a more premium tone' : 'Make it more playful')

  return {
    ok: true,
    draft,
    keys: orderedKeys(draft),
    intro: `Here’s a draft for ${title}.`,
    explanation: sentences.join(' '),
    gaps,
    notes,
    steps: options.length ? [...CREATE_STEPS, 'Build variant options'] : CREATE_STEPS,
    refinements: refinements.slice(0, 3),
  }
}

/** Enrich and field modes: the product as it stands → suggestions for the fields asked about. */
export function generateEnrichDraft(
  snapshot: ProductSnapshot,
  ask: CatalogAsk,
  prompt: string,
  vocab: CatalogVocab,
): CatalogGenOutcome {
  const steps = ask === 'description'
    ? ['Read the current product', 'Draft description']
    : ask === 'seo'
      ? ['Read the current product', 'Draft SEO listing']
      : ['Read the current product', 'Compare with your catalog', 'Draft suggestions']
  if (SIMULATED_TIMEOUT_RE.test(prompt)) return { ok: false, code: 'timeout', message: TIMEOUT_MESSAGE, steps }

  const name = snapshot.name.trim()
  if (!name && (ask === 'seo' || !snapshot.description.trim())) {
    return {
      ok: false,
      code: 'missing_title',
      message: ask === 'seo'
        ? 'A useful SEO title needs the product name, so I haven’t drafted one. Add the title in the form, then try again.'
        : 'I need the product name to write a description. Add the title in the form, then try again.',
      steps,
    }
  }

  // "Nike Air Max 270 - Black/White" reads better in copy as "Nike Air Max 270".
  const displayName = name.split(/\s+[-–|]\s+/)[0]?.trim() || name
  const matched = detectKind(snapshot.description) ?? detectKind(name)
  const kind = matched?.kind ?? GENERIC
  const audience = parseAudience(`${name} ${snapshot.description}`)
  const tone = parseTone(prompt)
  const descriptor = withAudience(nounFor(matched), audience)
  const copy: CopyInput = {
    name: displayName || undefined,
    descriptor,
    kind,
    tone,
    availability: availability(snapshot.options, kind),
  }

  const current: CatalogDraft = {
    subtitle: snapshot.subtitle,
    description: snapshot.description,
    tag: snapshot.tag,
    categories: snapshot.categories,
    collection: snapshot.collection,
    seoTitle: snapshot.seo?.title ?? '',
    seoMetaDescription: snapshot.seo?.metaDescription ?? '',
  }
  // A real model always offers another take; when the default copy is what the
  // product already says, suggest the premium rewrite instead of nothing.
  let description = buildDescription(copy)
  if (tone === 'default' && description === snapshot.description.trim()) {
    description = buildDescription({ ...copy, tone: 'premium' })
  }
  const suggested: CatalogDraft = {
    subtitle: snapshot.subtitle ? undefined : kind.subtitle,
    description,
    tag: snapshot.tag || !kind.tag ? undefined : kind.tag,
    categories: snapshot.categories.length || !kind.categories.length ? undefined : normaliseCategories(kind.categories, vocab),
    collection: snapshot.collection ? undefined : matchCollection(`${name} ${descriptor}`, vocab.collections),
    seoTitle: displayName ? buildSeoTitle(displayName, descriptor, snapshot.brand || undefined) : undefined,
    seoMetaDescription: displayName ? buildSeoMeta(copy) : undefined,
  }

  const areas = ask === 'all' ? parseAreas(prompt) : null
  const wanted = (key: CatalogFieldKey) =>
    ask === 'description' ? key === 'description'
      : ask === 'seo' ? key === 'seoTitle' || key === 'seoMetaDescription'
        : !areas || areas.has(key)
  const draft: CatalogDraft = {}
  const currentForKeys: CatalogDraft = {}
  for (const key of CATALOG_FIELD_ORDER) {
    const value = suggested[key]
    if (!wanted(key) || value === undefined || sameValue(value, current[key])) continue
    Object.assign(draft, { [key]: value })
    Object.assign(currentForKeys, { [key]: current[key] })
  }
  const keys = orderedKeys(draft)
  if (!keys.length) {
    return {
      ok: false,
      code: 'no_changes',
      message: `${displayName || 'This product'} already has what I’d suggest. Ask for something specific, like “make the description shorter”.`,
      steps,
    }
  }

  const subject = displayName || 'this product'
  const intro = ask === 'description'
    ? `A description for ${subject}.`
    : ask === 'seo'
      ? `An SEO title and meta description for ${subject}.`
      : `${keys.length === 1 ? '1 suggestion' : `${keys.length} suggestions`} for ${subject}.`
  const notes = ask === 'all' && !snapshot.description.trim() ? ['It had no description, so I wrote one.'] : []

  let explanation: string
  if (ask === 'description') {
    explanation = `Here’s a description for ${displayName || 'this product'}. Apply it to fill the Description field — you can still edit it before you save.`
  } else if (ask === 'seo') {
    explanation = `Here’s an SEO title (${draft.seoTitle?.length ?? 0} characters) and meta description (${draft.seoMetaDescription?.length ?? 0} characters) for ${displayName}.`
  } else {
    const lead = snapshot.description.trim() ? '' : 'It has no description yet, so I wrote one. '
    explanation = `${lead}Here ${keys.length === 1 ? 'is 1 suggestion' : `are ${keys.length} suggestions`} for ${displayName}. Pick the ones you want and apply them — nothing changes until you click Save. Brand, price and status stay as they are.`
  }

  const refinements = ['Make it shorter', 'Use a more premium tone', 'Make it more playful'].filter((r) =>
    !(tone === 'short' && r === 'Make it shorter') && !(tone === 'premium' && r.includes('premium')) && !(tone === 'playful' && r.includes('playful')),
  )

  return {
    ok: true,
    draft,
    keys,
    current: currentForKeys,
    intro,
    explanation,
    gaps: [],
    notes,
    steps,
    refinements: ask === 'seo' ? refinements.slice(0, 2) : refinements,
  }
}
