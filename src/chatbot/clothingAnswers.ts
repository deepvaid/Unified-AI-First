/**
 * A clothing store's answers on size and fit, fabric and care, and the fibres a
 * shopper wants to avoid. Everything is read from the store's own data, which the
 * chat widget hands in with the products: each product's fit note, fabric, care
 * and size chart. storeAssistant.ts asks here when the store's assistant profile
 * has `clothing` (assistantProfiles.ts); no other store reaches this file.
 *
 * A store that sells for the outdoors (its own products say "waterproof" or rate their
 * warmth to a temperature, or its size charts size feet or heads) also gets answers on
 * rain and wind, warmth for a temperature, layering, one piece over another, packs, and
 * boot, sock and hat sizes, read from the same fields; where they say nothing, the
 * answer says it can't promise. A style made for women and for men ("Women’s Canyon
 * Hiking Boot", "Men’s Canyon Hiking Boot") is one style to these answers (`styleName`).
 *
 * Nothing here is advice about health: an allergy to a fibre is answered with
 * what each piece is made of.
 *
 * Pure, with relative `.ts` imports only (types from storeAssistant.ts, so there
 * is no import cycle at run time), so `npm run test:chatbot` runs it in Node.
 */

import { audienceOf as audienceFrom, columnsForAudience, sharesAudience } from '../storefront/audience.ts'
import type { Audience, ChartColumn } from '../storefront/audience.ts'
import { chartInUnit } from '../storefront/sizeCharts.ts'
import type { SizeChart, SizeUnit } from '../storefront/sizeCharts.ts'
import type { AssistantFibre, AssistantProtection, ClothingKnowledge, OutdoorKnowledge } from './assistantProfiles.ts'
import { bestEntry, hits } from './previewResponder.ts'
import type { AssistantContext, AssistantProduct, AssistantReply } from './storeAssistant.ts'

/** What a clothing answer says, and the piece it was about, so a follow-up ("between M and L") needs no name. */
export interface ClothingTurn {
  replies: AssistantReply[]
  productId?: number
  /** Outdoor: a question waiting for whom it is for ("Is it the women’s or the men’s?"); the next message that says answers it. */
  asked?: string
}

/** Who a piece or a request is for (src/storefront/audience.ts, which the product page's size guide reads too). */
export type { Audience }

// ── What a message is about ──────────────────────────────────────────────────

export const CARE = /\b(wash\w*|machine|dry[- ]?clean\w*|tumble|dryers?|iron(ing)?|steam\w*|care for|look after|clean(ing)?|re-?wax\w*|bleach\w*|shrink\w*)\b/
export const FABRIC = /\b(fabrics?|materials?|made (of|from|in)|see[- ]?through|sheer|transparent|thick\w*|thin|heavy\w*|lightweight|warm enough|breathab\w*|itch\w*|scratch\w*|soft\w*|stretch\w*|lined|lining|organic|recycled|pill(s|ing)?|wrinkl\w*|creas\w*|gsm)\b/
export const SIZE = /\b(sizes?|sizing|sized|fit|fits|fitting|true to size|runs? (small|large|big|long|short)|too (small|big|tight|loose|long|short)|tight|snug|loose|baggy|oversized|measur\w*|bust|chest|waist|hips?|inseam|petite)\b/
/** A height ("5'6", "5 ft 6") or a weight ("140 lb", "64 kg"). */
export const HEIGHT_WEIGHT = /\b\d\s?(?:'|’|ft|foot|feet)\s?\d{0,2}|\b\d{2,3}\s?(?:lbs?|pounds|kg|kilos?)\b|\b1\.\d{2}\s?m\b/
const AVOID = /\b(allerg\w*|sensitiv\w*|intoleran\w*|avoid\w*|(can'?t|can’t|cannot|don'?t|don’t) (wear|have|take)|without|free of|vegan)\b|\b[a-z]+[- ]free\b|\bno (wool|merino|lambswool|cashmere|silk|linen|cotton|polyester|nylon|synthetics?)\b/
/** Words that ask for clothes for him, or for her. */
const FOR_HIM = /\b(him|his|he|men|mens|men's|men’s|man|guy|boyfriend|husband|dad|father|brother|son|grandpa|uncle)\b/
const FOR_HER = /\b(her|she|women|womens|women's|women’s|woman|lady|ladies|girlfriend|wife|mum|mom|mother|sister|daughter|grandma|aunt)\b/
const PRICE_UNDER = /\b(?:under|below|less than|up to|max(?:imum)?|no more than|within)\s*\$?\s?(\d+(?:\.\d+)?)|\$\s?(\d+(?:\.\d+)?)\s*(?:or less|or under|max|and under)/

/** Who the shopper is shopping for, when they say: "a gift for him". */
export function audienceAsked(text: string): Audience | null {
  const him = FOR_HIM.test(text)
  const her = FOR_HER.test(text)
  return him === her ? null : him ? 'him' : 'her'
}

/** The most a shopper wants to spend, and how they said it ("under $250"). */
export function priceLimit(message: string): { max: number; phrase: string } | null {
  const match = PRICE_UNDER.exec(message)
  if (!match) return null
  return { max: Number(match[1] ?? match[2]), phrase: match[0].trim().toLowerCase() }
}

/** Who a piece is for: its collections say (Men, Women), else its subtitle ("Men's boxy tee"). Null for both, or neither. */
export function audienceOf(product: AssistantProduct, clothing: ClothingKnowledge): Audience | null {
  return audienceFrom(product.collections, product.subtitle, clothing.audiences)
}

/** Keeps the pieces for that audience, and those for everyone. */
export function forAudience(products: AssistantProduct[], audience: Audience | null, clothing: ClothingKnowledge): AssistantProduct[] {
  if (!audience) return products
  return products.filter((p) => {
    const own = audienceOf(p, clothing)
    return own === null || own === audience
  })
}

// ── Which piece the shopper means ────────────────────────────────────────────

/** Words that describe a question, never a piece, so "relaxed fit" does not pick the Poplin Relaxed Shirt. */
const NOT_A_NAME = new Set([
  'the', 'and', 'for', 'are', 'you', 'your', 'our', 'can', 'what', 'how', 'doe', 'does', 'did', 'will', 'with', 'have', 'has', 'any',
  'about', 'when', 'where', 'who', 'why', 'this', 'that', 'there', 'from', 'need', 'want', 'like', 'please', 'tell', 'know', 'get',
  'much', 'many', 'long', 'take', 'size', 'sizing', 'fit', 'fitting', 'wear', 'usually', 'usual', 'normally', 'between', 'small',
  'medium', 'large', 'extra', 'run', 'measure', 'measurement', 'wash', 'washing', 'machine', 'made', 'fabric', 'material', 'care',
  'should', 'would', 'could', 'which', 'think', 'buy', 'order', 'relaxed', 'slim', 'regular', 'true', 'tight', 'loose', 'light',
  'lightweight', 'heavy', 'soft', 'warm', 'itchy', 'itch', 'see', 'through', 'thick', 'thin', 'lined', 'bust', 'chest', 'waist', 'hip',
  'inseam', 'neck', 'sleeve', 'tall', 'petite', 'inch', 'inche', 'pound', 'lb', 'allergic', 'allergy', 'sensitive', 'avoid', 'without',
  'free', 'gift', 'him', 'her', 'men', 'women', 'one', 'dry', 'clean', 'iron', 'tumble', 'big', 'too', 'also', 'just', 'then', 'them',
  'they', 'very', 'fine', 'good', 'work', 'day', 'cold', 'hot', 'okay', 'safe', 'right', 'look', 'shrink',
])

/** Lower-case words, a trailing "s" dropped from longer ones ("chinos" → "chino"), as the store's search does. */
function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
}

/** The same word, or one the start of the other when the shorter has four letters or more ("merino", "merinos"). */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.length >= 4 && long.startsWith(short)
}

/** The products whose name the message mentions most: one, several when they tie, or none. */
export function productsNamed(message: string, products: AssistantProduct[]): AssistantProduct[] {
  const asked = words(message).filter((w) => w.length >= 3 && !NOT_A_NAME.has(w))
  if (!asked.length) return []
  const scored = products
    .map((product) => ({ product, score: words(product.name).filter((w) => w.length >= 3 && asked.some((a) => sameWord(a, w))).length }))
    .filter((p) => p.score > 0)
  const best = Math.max(0, ...scored.map((p) => p.score))
  return scored.filter((p) => p.score === best).map((p) => p.product)
}

/** The piece a size answer is about; `insteadOf` is the piece the shopper asked about when a measurement moved the answer from it. */
export type MeasuredPiece = AssistantProduct & { insteadOf?: AssistantProduct }

/**
 * The piece a body measurement is about when the piece chosen cannot read it: "merino
 * sweater for a 38 inch chest" names the women's crewneck best, but its chart sizes by
 * bust, so the answer is about the men's merino piece, whose chart has a chest. Among
 * the pieces whose names share a word with the message, the best-named one whose chart
 * reads a measurement given, carrying the piece it replaces so the answer can say why;
 * otherwise the piece as chosen.
 */
export function pieceForMeasurements(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, product: AssistantProduct | undefined): MeasuredPiece | undefined {
  const measured = measurementsIn(message)
  if (!product || !measured.length) return product
  const reads = (piece: AssistantProduct) => {
    const chart = piece.sizeChartId ? ctx.sizeCharts?.find((c) => c.id === piece.sizeChartId) : undefined
    return !!chart && !!sizeForMeasurements(chart, measured, audienceOf(piece, clothing))
  }
  if (reads(product)) return product
  const asked = words(message).filter((w) => w.length >= 3 && !NOT_A_NAME.has(w))
  const hits = (text: string) => new Set(words(text).filter((w) => w.length >= 3 && asked.some((a) => sameWord(a, w)))).size
  // A word in the name counts most; its description and fabric break a tie ("merino" over "sweater").
  const fits = ctx.products
    .map((piece) => ({ piece, named: hits(piece.name), score: 2 * hits(piece.name) + hits(`${piece.subtitle} ${piece.material ?? ''}`) }))
    .filter((c) => c.named > 0 && reads(c.piece))
    .sort((a, b) => b.score - a.score)
  const moved = fits[0]?.piece
  return moved ? { ...moved, insteadOf: product } : product
}

/**
 * A piece's style: its name without whom it is for. "Women’s Canyon Hiking Boot" and
 * "Men’s Canyon Hiking Boot" are one style, the Canyon Hiking Boot; a name that says no
 * wearer is its own style.
 */
export function styleName(name: string): string {
  return name.replace(/^(?:women|men)['’]s\s+/i, '')
}

/** Two pieces of one style (the women’s and the men’s), or one piece. */
const sameStyle = (a: AssistantProduct, b: AssistantProduct): boolean => styleName(a.name) === styleName(b.name)

/** A message with the names of these pieces taken out, so their words ("organic", "linen") are not read as the question. Whom a piece is for stays. */
export function withoutNames(text: string, pieces: AssistantProduct[]): string {
  const names = new Set(pieces.flatMap((piece) => styleName(piece.name).toLowerCase().match(/[a-z0-9]+/g) ?? []))
  return text.toLowerCase().replace(/[a-z0-9]+/g, (word) => (names.has(word) || names.has(word.replace(/s$/, '')) ? ' ' : word))
}

/**
 * The piece a question is about: the one it names; else, among several it names
 * or when it names none, the piece the last answer was about, then the product
 * whose page the shopper is on.
 */
export function subjectOf(message: string, ctx: AssistantContext, previous?: number): { product?: AssistantProduct; named: AssistantProduct[] } {
  const named = productsNamed(message, ctx.products)
  if (named.length === 1) return { product: named[0], named }
  const around = [previous, ctx.currentProductId]
    .map((id) => ctx.products.find((p) => p.id === id))
    .filter((p): p is AssistantProduct => !!p)
  return { product: named.length ? around.find((p) => named.includes(p)) : around[0], named }
}

// ── Sizes ────────────────────────────────────────────────────────────────────

const SIZE_WORDS: Record<string, string> = {
  'extra small': 'XS', 'extra-small': 'XS', 'x-small': 'XS', xsmall: 'XS', xs: 'XS',
  small: 'S', s: 'S', medium: 'M', med: 'M', m: 'M', large: 'L', l: 'L',
  'extra large': 'XL', 'extra-large': 'XL', 'x-large': 'XL', xlarge: 'XL', xl: 'XL', xxl: 'XXL',
}
const LETTER_SIZE = '(extra[- ]small|x-small|xsmall|extra[- ]large|x-large|xlarge|xxl|xs|xl|small|medium|med|large|s|m|l)'
/**
 * Not a size after a number: "5'6", "140 lb", "32 in", "between 10 and 14 days".
 * "in" followed by a piece ("a 32 in your chinos") is a size, not inches.
 */
const NOT_A_SIZE = "(?![\\d.]|\\s*(?:'|’|ft|foot|feet|lbs?|pounds|kg|kilos?|in\\b(?!\\s+(?:your|the|our|these|those|that|this|my|a)\\b)|inch|cm|%|days?|weeks?|hours?|business|working|dollars?))"
/** A letter size, or a two-digit one (a waist: "32"); a one-digit size only after "size" ("a size 8"). */
const SIZE_TOKEN = `(${LETTER_SIZE.slice(1, -1)}|\\d{2}${NOT_A_SIZE}|size \\d{1,2}${NOT_A_SIZE})`
const BETWEEN = new RegExp(`\\b(?:between|either)\\s+(?:an?\\s+|size\\s+)?${SIZE_TOKEN}\\s+(?:and|or)\\s+(?:an?\\s+)?${SIZE_TOKEN}\\b`)
const OR_PAIR = new RegExp(`\\b${LETTER_SIZE}\\s+or\\s+(?:an?\\s+)?${LETTER_SIZE}\\b`)
const USUAL = new RegExp(`\\b(?:usually|normally|always|typically|generally|i\\s+wear|i\\s+take|i\\s+buy|i\\s+am|i['’]m)\\s+(?:wear\\s+|take\\s+|buy\\s+|in\\s+)?(?:an?\\s+)?${SIZE_TOKEN}\\b`)

/** A size word as a chart writes it ("medium" → "M"); numbers ("32") stay. */
function sizeLabel(word: string): string {
  const w = word.toLowerCase().replace(/\s+/g, ' ').replace(/^size /, '')
  return SIZE_WORDS[w] ?? w.toUpperCase()
}

/** The sizes a message names: two ("between M and L"), one ("I’m usually a medium") or none. */
export function sizesIn(message: string): string[] {
  const text = message.toLowerCase()
  const pair = BETWEEN.exec(text) ?? OR_PAIR.exec(text)
  if (pair) return [sizeLabel(pair[1]!), sizeLabel(pair[2]!)]
  const one = USUAL.exec(text)
  return one ? [sizeLabel(one[1]!)] : []
}

/** `foot` and `head` are read only for a chart that sizes feet or heads (outdoor: boots and hats). */
export type BodyMeasure = 'bust' | 'chest' | 'waist' | 'hip' | 'neck' | 'sleeve' | 'inseam' | 'foot' | 'head'

export interface Measured {
  what: BodyMeasure
  value: number
  /** As the shopper wrote it; null when they gave no unit. */
  unit: SizeUnit | null
}

const BODY = '(bust|chest|waist|hips?|neck|sleeve|inseam)'
const NUMBER = '(\\d{2,3}(?:\\.\\d+)?)'
const UNIT = '(cm|centimet(?:er|re)s?|inch(?:es)?|in\\b|")'
const MEASURE_AFTER = new RegExp(`\\b${BODY}\\b(?:\\s*(?:is|of|=|:|measures?|size|around|about|at))*\\s*${NUMBER}\\s*${UNIT}?`, 'g')
const MEASURE_BEFORE = new RegExp(`\\b${NUMBER}\\s*(?:-?\\s*${UNIT})?\\s*${BODY}\\b`, 'g')

/** The body measurements a message gives: "bust 36, waist 30", "a 40 inch chest", "waist 81 cm". */
export function measurementsIn(message: string): Measured[] {
  const text = message.toLowerCase()
  const found: Measured[] = []
  const add = (what: string, value: string, unit: string | undefined) => {
    const measure = (what.startsWith('hip') ? 'hip' : what) as BodyMeasure
    if (found.some((m) => m.what === measure)) return
    found.push({ what: measure, value: Number(value), unit: unit ? (unit.startsWith('c') ? 'cm' : 'in') : null })
  }
  for (const m of text.matchAll(MEASURE_AFTER)) add(m[1]!, m[2]!, m[3])
  for (const m of text.matchAll(MEASURE_BEFORE)) add(m[3]!, m[1]!, m[2])
  return found
}

/** "34-35" → [34, 35]; "30.5" → [30.5, 30.5]; text without a number → null. */
function bounds(value: string): [number, number] | null {
  const numbers = value.match(/\d+(?:\.\d+)?/g)?.map(Number)
  return numbers?.length ? [numbers[0]!, numbers[numbers.length - 1]!] : null
}

/** A range as a sentence writes it: "34–35". */
const dashed = (value: string): string => value.replace(/(\d)\s*-\s*(\d)/g, '$1–$2')

/** A chart column that names a size system ("US size"), not a measurement. */
const isSizeSystem = (name: string): boolean => /\bsize\b/i.test(name)
/** The chart's columns for this piece: a women's piece drops "Men's chest", and the rest lose their "Women's". */
function columnsFor(chart: SizeChart, audience: Audience | null): ChartColumn[] {
  return columnsForAudience(chart.columns, audience)
}

/** Columns whose value is the same in every size (every trouser has a 32 in inseam) cannot pick a size. */
function variesBySize(chart: SizeChart, column: ChartColumn): boolean {
  return new Set(chart.rows.map((row) => row.values[column.index])).size > 1
}

/** "US 8–10, bust 36–37 in, waist 29–30 in, hip 39–40 in" */
function rowCells(chart: SizeChart, rowIndex: number, audience: Audience | null): string {
  const row = chart.rows[rowIndex]!
  return columnsFor(chart, audience)
    .map((column) => {
      const value = dashed(row.values[column.index] ?? '')
      if (isSizeSystem(column.label)) return `${column.label.replace(/\s*size\b/i, '')} ${value}`
      return `${column.label.toLowerCase()} ${value}${/\d/.test(value) ? ` ${chart.unit}` : ''}`
    })
    .join(', ')
}

/** "US sizes: XS is 0-2, S is 4-6 …" in a chart's fit note: each size's US range. */
const NOTED_US_SIZE = /\b(XXL|XL|XS|S|M|L)\s+is\s+(?:US\s+)?(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?/g

/** The row of a size the shopper named: by its own label, or by a size system ("a size 8" is M, US 8–10). */
function rowOf(chart: SizeChart, size: string): number {
  const own = chart.rows.findIndex((row) => row.size.toUpperCase() === size.toUpperCase())
  if (own >= 0) return own
  // A row named for two sizes ("S/M" on a hat) is the row of either.
  if (!/^\d+$/.test(size)) return chart.rows.findIndex((row) => row.size.toUpperCase().split('/').map((s) => s.trim()).includes(size.toUpperCase()))
  const system = chart.columns.findIndex(isSizeSystem)
  if (system >= 0) {
    return chart.rows.findIndex((row) => {
      const range = bounds(row.values[system] ?? '')
      return !!range && Number(size) >= range[0] && Number(size) <= range[1]
    })
  }
  // A chart that keeps its US sizes in the fit note rather than a column.
  if (!/\bUS sizes?\b/i.test(chart.fitNote)) return -1
  for (const [, label, from, to] of chart.fitNote.matchAll(NOTED_US_SIZE)) {
    if (Number(size) >= Number(from) && Number(size) <= Number(to ?? from)) {
      return chart.rows.findIndex((row) => row.size.toUpperCase() === label)
    }
  }
  return -1
}

/**
 * The unit a measurement given without one is in: the chart's own unit when the
 * value lands within about one size of the chart's range, else the other unit when
 * it does there ("neck 39" on a chart in inches is 39 cm). A value that fits
 * neither is read in the chart's unit, so the answer says it is past the sizes.
 */
function unitOf(chart: SizeChart, column: ChartColumn, m: Measured): SizeUnit {
  if (m.unit) return m.unit
  const near = (unit: SizeUnit): boolean => {
    const ranges = chartInUnit(chart, unit).rows
      .map((row) => bounds(row.values[column.index] ?? ''))
      .filter((range): range is [number, number] => !!range)
    if (!ranges.length) return false
    const low = Math.min(...ranges.map((r) => r[0]))
    const high = Math.max(...ranges.map((r) => r[1]))
    const step = (high - low) / Math.max(ranges.length - 1, 1)
    return m.value >= low - step && m.value <= high + step
  }
  const other: SizeUnit = chart.unit === 'in' ? 'cm' : 'in'
  return near(chart.unit) || !near(other) ? chart.unit : other
}

export interface SizePick {
  row: number
  /** A measurement is beyond the largest size. */
  above: boolean
  /** The measurements that were read, with the row each one alone would pick. */
  read: Array<{ measured: Measured; label: string; unit: SizeUnit; row: number; above: boolean }>
}

/**
 * The size a shopper’s body measurements make in a chart: for each measurement,
 * the smallest size whose range reaches it (a value between two sizes takes the
 * larger), then the largest of those, so the piece is not tight anywhere. Values
 * are compared in the unit the shopper used; without one, see `unitOf`. Null when
 * nothing given can pick a size.
 */
export function sizeForMeasurements(chart: SizeChart, measured: Measured[], audience: Audience | null = null): SizePick | null {
  const columns = columnsFor(chart, audience).filter((c) => !isSizeSystem(c.label) && variesBySize(chart, c))
  const read: SizePick['read'] = []
  for (const m of measured) {
    const column = columns.find((c) => c.label.toLowerCase().includes(m.what))
    if (!column) continue
    const unit = unitOf(chart, column, m)
    const ranges = chartInUnit(chart, unit).rows.map((row) => bounds(row.values[column.index] ?? ''))
    const row = ranges.findIndex((range) => !!range && m.value <= range[1])
    // Past every size: the largest size this piece is made in (a row may be blank for this audience: "—").
    const largest = ranges.reduce((last, range, i) => (range ? i : last), ranges.length - 1)
    read.push({ measured: m, label: column.label.toLowerCase(), unit, row: row < 0 ? largest : row, above: row < 0 })
  }
  if (!read.length) return null
  return { row: Math.max(...read.map((r) => r.row)), above: read.some((r) => r.above), read }
}

/** What a fit note says about choosing a size. */
function fitRule(fitNote: string): 'true' | 'down' | 'up' | null {
  if (/\bsize down\b/i.test(fitNote)) return 'down'
  if (/\b(take the larger|size up)\b/i.test(fitNote)) return 'up'
  if (/\b(true to size|usual size)\b/i.test(fitNote)) return 'true'
  return null
}

/** The measurements a chart sizes by, for this piece: "bust", "waist", "hip". */
function sizingMeasures(chart: SizeChart, audience: Audience | null): string[] {
  return columnsFor(chart, audience).filter((c) => !isSizeSystem(c.label) && variesBySize(chart, c)).map((c) => c.label.toLowerCase())
}

/** The measurements to ask for: the first two the chart sizes by ("bust and waist", "chest and neck"). */
function measuresToAsk(chart: SizeChart, audience: Audience | null): string {
  return sizingMeasures(chart, audience).slice(0, 2).join(' and ') || 'measurements'
}

/** "bust, waist and hip" */
function listed(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? '')
}

/** Why a measurement moved the answer from the piece asked about: "The Merino Crewneck Sweater is sized by bust, waist and hip." */
function movedBecause(piece: AssistantProduct, ctx: AssistantContext, clothing: ClothingKnowledge): string {
  const chart = piece.sizeChartId ? ctx.sizeCharts?.find((c) => c.id === piece.sizeChartId) : undefined
  const measures = chart ? sizingMeasures(chart, audienceOf(piece, clothing)) : []
  return measures.length ? `The ${piece.name} is sized by ${listed(measures)}.` : `The ${piece.name} has no size chart.`
}

function sentence(text: string): string {
  const trimmed = text.trim()
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

/** Each style once: its own name for one piece, the style's name for the women’s and the men’s piece together. */
function styleNames(products: AssistantProduct[]): string[] {
  return [...new Set(products.map((p) => styleName(p.name)))].map((style) => {
    const of = products.filter((p) => styleName(p.name) === style)
    return of.length > 1 ? style : of[0]!.name
  })
}

/** The pieces' names, each style once. */
function names(products: AssistantProduct[]): string {
  return listed(styleNames(products))
}

function sizeGuideLink(product: AssistantProduct) {
  return product.url ? { link: { label: 'Open the size guide', href: `${product.url}?sizeGuide=1` } } : {}
}

/**
 * Size and fit. On a piece: its fit note, then the size the shopper's
 * measurements, usual size or two sizes make in its chart, with that size's row.
 * Without a piece: the store's own sizing page, and a question back.
 */
export function sizeAnswer(
  message: string, ctx: AssistantContext, clothing: ClothingKnowledge, product: MeasuredPiece | undefined, named: AssistantProduct[],
  /** Measurements only this piece's chart reads (outdoor: a head for a hat). */
  extra: Measured[] = [],
): ClothingTurn {
  const text = message.toLowerCase()
  const heightOrWeight = HEIGHT_WEIGHT.test(text)

  if (!product) {
    // Several pieces share the words: each one's fit, rather than a guess.
    const withNotes = named.filter((p) => p.fitNote).slice(0, 3)
    if (withNotes.length > 1) {
      return {
        replies: [{
          kind: 'text',
          topic: 'Sizing',
          text: `${withNotes.map((p) => `${p.name}: ${sentence(p.fitNote!)}`).join(' ')} Ask me about one of them with the size you usually wear, and I’ll check its size chart.`,
        }],
      }
    }
    const replies: AssistantReply[] = []
    const guide = bestEntry('finding your size guide fit measure between sizes', ctx.entries)
    if (guide && /\bsiz/i.test(`${guide.title} ${guide.text}`)) {
      const url = (guide as typeof guide & { url?: string }).url
      replies.push({ kind: 'answer', text: guide.text, source: guide.source, ...(url ? { link: { label: `Read: ${guide.title}`, href: url } } : {}) })
    }
    replies.push({
      kind: 'text',
      topic: 'Sizing',
      text: heightOrWeight ? `${clothing.heightWeight} ${clothing.askPiece}` : clothing.askPiece,
      ...(replies.length ? {} : { link: clothing.sizePage }),
    })
    return { replies }
  }

  const chart = product.sizeChartId ? ctx.sizeCharts?.find((c) => c.id === product.sizeChartId) : undefined
  const fitNote = product.fitNote ? sentence(product.fitNote) : ''
  const reply = (body: string): ClothingTurn => ({
    replies: [{ kind: 'text', topic: 'Sizing', text: body.replace(/\s+/g, ' ').trim(), ...sizeGuideLink(product) }],
    productId: product.id,
  })

  if (!chart) {
    // One size (a scarf, a bag): its fit note says so, with its dimensions.
    if (fitNote) return { replies: [{ kind: 'text', topic: 'Sizing', text: `${product.name}: ${fitNote}` }], productId: product.id }
    return { replies: [{ kind: 'text', topic: 'Sizing', text: `I don’t have sizing details for the ${product.name}. Write to us and we’ll measure it for you.`, link: { label: 'Contact us', href: '/page/contact' } }], productId: product.id }
  }

  const audience = audienceOf(product, clothing)
  const rule = fitNote ? fitRule(fitNote) : null
  const measures = measuresToAsk(chart, audience)
  // A foot or a head is read in either unit (an outdoor store's boots and hats).
  const units = FOOT_OR_HEAD.test(measures) ? 'inches or centimeters' : chart.unit === 'in' ? 'inches' : 'centimeters'
  const ask = `Tell me the size you usually wear, or your ${measures} in ${units}, and I’ll check it against the size chart.`

  // Body measurements pick the size.
  const pick = sizeForMeasurements(chart, [...measurementsIn(message), ...extra], audience)
  if (pick) {
    const size = chart.rows[pick.row]!.size
    const given = pick.read.map((r) => `${r.label} ${r.measured.value} ${r.unit}`).join(' and ')
    // The size's row in the unit the shopper's numbers were read in.
    const shown = chartInUnit(chart, pick.read[0]!.unit)
    const differ = new Set(pick.read.map((r) => r.row)).size > 1
    const larger = pick.read.find((r) => r.row === pick.row)!.label
    if (product.insteadOf) {
      // The answer moved to another piece: why comes first, then the piece, named for whom it is.
      const why = movedBecause(product.insteadOf, ctx, clothing)
      const piece = styleName(product.name) !== product.name ? product.name : `${audience === 'him' ? 'men’s ' : audience === 'her' ? 'women’s ' : ''}${product.name}`
      const measured = pick.read.map((r) => `a ${r.measured.value} ${r.unit} ${r.label}`).join(' and ')
      if (pick.above) return reply(`${why} For ${measured}, you’re above our largest size in the ${piece}. ${size} is ${rowCells(shown, pick.row, audience)}, so it may be snug. ${fitNote}`)
      if (differ) return reply(`${why} For ${measured}, take ${size} in the ${piece}: your ${larger} is in ${size}, and the larger size keeps it comfortable everywhere. ${size} is ${rowCells(shown, pick.row, audience)}. ${fitNote}`)
      return reply(`${why} For ${measured}, the ${piece} in ${size} fits: ${rowCells(shown, pick.row, audience)}. ${fitNote}`)
    }
    if (pick.above) {
      return reply(`With ${given}, you’re above our largest size in the ${product.name}. ${size} is ${rowCells(shown, pick.row, audience)}, so it may be snug. ${fitNote}`)
    }
    const lead = differ
      ? `With ${given}, take ${size} in the ${product.name}: your ${larger} is in ${size}, and the larger size keeps it comfortable everywhere.`
      : `With ${given}, ${size} is your size in the ${product.name}.`
    return reply(`${lead} ${size} is ${rowCells(shown, pick.row, audience)}. ${fitNote}`)
  }

  // Between two sizes: what the fit note says, else room to layer for knitwear and outerwear.
  const sizes = sizesIn(message).map((s) => ({ s, row: rowOf(chart, s) })).filter((s) => s.row >= 0)
  if (sizes.length === 2 && sizes[0]!.row !== sizes[1]!.row) {
    const [small, large] = [...sizes].sort((a, b) => a.row - b.row) as [typeof sizes[0], typeof sizes[0]]
    const [a, b] = [chart.rows[small.row]!.size, chart.rows[large.row]!.size]
    const piece = `${product.name} ${product.subtitle} ${product.collections.join(' ')}`.toLowerCase()
    const layers = clothing.layering.some((word) => piece.includes(word))
    let lead: string
    let row = large.row
    if (rule === 'up') lead = `Between ${a} and ${b}, take ${b}, as its fit note says.`
    else if (rule === 'down') { lead = `Between ${a} and ${b}, take ${a}: the ${product.name} is cut loose on purpose.`; row = small.row }
    else if (layers) lead = `Between ${a} and ${b}, take ${b}, so there’s room to layer underneath.`
    else if (/\bslim\b/i.test(fitNote)) lead = `Between ${a} and ${b}, take ${b}: it’s a slim fit.`
    else { lead = `Between ${a} and ${b}, take ${a} for the fit it’s cut for, or ${b} if you like more room.`; row = small.row }
    return reply(`${lead} ${chart.rows[row]!.size} is ${rowCells(chart, row, audience)}. ${fitNote}`)
  }

  // The size they usually wear.
  if (sizes.length >= 1) {
    const { row } = sizes[0]!
    const size = chart.rows[row]!.size
    const smaller = chart.rows[row - 1]?.size
    const lead = rule === 'down' && smaller
      ? `The ${product.name} is cut loose on purpose: your usual ${size} gives the relaxed look, or take ${smaller} for a closer fit.`
      : `Your usual ${size} should be right in the ${product.name}.`
    return reply(`${lead} ${size} is ${rowCells(chart, row, audience)}. ${fitNote}`)
  }

  // Height and weight alone cannot pick from a chart of body measurements.
  if (heightOrWeight) return reply(`${clothing.heightWeight} ${product.name}: ${fitNote} ${ask}`)

  // Does it run large or small? The fit note says; the answer leads with it.
  let verdict = ''
  const runs = /\b(runs?|cut|come|comes|fit|fits) (small|large|big|short|long)\b|\btrue to size\b/.exec(text)
  if (runs) {
    if (rule === 'true') verdict = /true to size/.test(runs[0]) ? 'Yes, it’s true to size.' : 'No, it runs true to size.'
    else if (rule === 'down') verdict = /large|big/.test(runs[0]) ? 'Yes, it’s cut large on purpose.' : 'No, it’s cut large on purpose.'
  }
  return reply(`${verdict} ${product.name}: ${fitNote} ${ask}`)
}

// ── Fabric and care ──────────────────────────────────────────────────────────

/** The pieces whose fabric names a word of the message ("merino"), when that is how few they are. */
function piecesInFabric(message: string, products: AssistantProduct[]): AssistantProduct[] {
  const asked = words(message).filter((w) => w.length >= 4 && !NOT_A_NAME.has(w))
  if (!asked.length) return []
  return products.filter((p) => p.material && words(p.material).some((w) => asked.some((a) => sameWord(a, w))))
}

/**
 * How to wash a piece, or the pieces of one fabric ("How do I wash merino?"),
 * grouped where their care is the same. Null when the question names no piece
 * and no fabric few enough pieces share: the store's own care page answers it.
 */
export function careAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, product: AssistantProduct | undefined, named: AssistantProduct[]): ClothingTurn | null {
  // A fabric the message names ("merino") is every piece made of it, not only those named after it.
  const inFabric = product ? [] : piecesInFabric(message, ctx.products)
  const pieces = (product ? [product] : inFabric.length ? inFabric : named).filter((p) => p.care)
  if (!pieces.length || styleNames(pieces).length > 3) return null
  const text = message.toLowerCase()
  if (pieces.length === 1) {
    const care = sentence(pieces[0]!.care!)
    let verdict = ''
    // A yes or no only to a yes/no question: "How should I wash it?" asks how.
    if (!/^\s*(how|what)\b/.test(text) && /\b(can|could|should|is it (ok|okay|safe))\b[^?]*\b(wash|machine)/.test(text)) {
      if (/\b(do not|don’t|don't|never) wash\b|\bdry clean only\b/i.test(care)) verdict = 'No. '
      else if (/\bmachine wash\b/i.test(care)) verdict = 'Yes. '
      else if (/\bhand wash\b/i.test(care)) verdict = /\bwool cycle\b/i.test(care) ? 'Yes, by hand or on a wool cycle. ' : 'Yes, by hand. '
    }
    return { replies: [{ kind: 'text', topic: 'Fabric and care', text: `${verdict}${pieces[0]!.name}: ${care}`, link: clothing.fabricPage }], productId: pieces[0]!.id }
  }
  const groups = new Map<string, AssistantProduct[]>()
  for (const piece of pieces) groups.set(sentence(piece.care!), [...(groups.get(sentence(piece.care!)) ?? []), piece])
  const said = [...groups].map(([care, group]) => `${names(group)}: ${care}`).join(' ')
  return { replies: [{ kind: 'text', topic: 'Fabric and care', text: said, link: clothing.fabricPage }] }
}

/** What a piece is made of, and how it is described ("Is the linen see-through?"). Null without a piece to answer for. */
export function fabricAnswer(clothing: ClothingKnowledge, product: AssistantProduct | undefined, named: AssistantProduct[]): ClothingTurn | null {
  if (product?.material) {
    return {
      replies: [{ kind: 'text', topic: 'Fabric and care', text: `${product.name}: ${sentence(product.material)} ${product.description}`.trim(), link: clothing.fabricPage }],
      productId: product.id,
    }
  }
  const pieces = named.filter((p) => p.material)
  if (pieces.length < 2 || pieces.length > 3) return null
  return { replies: [{ kind: 'text', topic: 'Fabric and care', text: pieces.map((p) => `${p.name}: ${sentence(p.material!)}`).join(' '), link: clothing.fabricPage }] }
}

// ── A fibre to avoid ─────────────────────────────────────────────────────────

export interface FibreAvoidance {
  fibre: AssistantFibre
  /** Whether a piece has the fibre in it, by its fabric or its name. */
  contains: (product: AssistantProduct) => boolean
  /** The pieces with a known fabric that has none of it. */
  without: AssistantProduct[]
}

/**
 * "I’m allergic to wool", "anything without silk?": the fibre to leave out and
 * the pieces made without it. Null when the message names no fibre to avoid.
 */
export function fibreAvoidance(message: string, ctx: AssistantContext, clothing: ClothingKnowledge): FibreAvoidance | null {
  const text = message.toLowerCase()
  if (!AVOID.test(text)) return null
  const fibre = clothing.fibres.find((f) => f.says.test(text))
  if (!fibre) return null
  const contains = (product: AssistantProduct) => {
    const said = `${product.material ?? ''} ${product.name}`.toLowerCase()
    return fibre.in.some((word) => said.includes(word))
  }
  return { fibre, contains, without: ctx.products.filter((p) => !!p.material && !contains(p)) }
}

// ── Outdoor clothing and gear ────────────────────────────────────────────────
// A store whose own products say how they stand up to the weather ("waterproof",
// "water-resistant", a temperature), or whose size charts size feet or heads. Each
// answer reads the piece's own fields and charts; where they say nothing, it says
// it can't promise. Another clothing store never reaches this: it answers above.

/** A size chart column that sizes feet, heads or shoes: an outdoor store's boots, hats and socks. */
const FOOT_OR_HEAD = /\b(foot|feet|head|shoe)\b/i
const FOOT_COLUMN = /\b(foot|feet)\b/i
const SHOE_COLUMN = /\bshoe\b/i

/**
 * Everything a piece's page says about it, in the order an answer quotes it. The
 * subtitle ("Women’s waterproof rain shell") last, and only when asked for: it names
 * whom the piece is for, which an answer about a style for women and men must not.
 */
function factsOf(product: AssistantProduct, subtitle = true): string[] {
  return [
    product.material, product.description, product.fitNote,
    ...(product.specs ?? []).map((s) => `${s.label}: ${s.value}`),
    product.care, subtitle ? product.subtitle : '',
  ].filter((text): text is string => !!text?.trim())
}

/** Those facts, a sentence at a time. */
function sentencesOf(product: AssistantProduct, subtitle = true): string[] {
  return factsOf(product, subtitle).flatMap((text) => text.split(/(?<=[.!?])\s+(?=[A-Z0-9"“‘'])/)).map((s) => sentence(s))
}

/**
 * The outdoor knowledge, when the store's own data is outdoor; null for any other clothing
 * store. A care line is never read for it: "Machine wash at 30°C" is laundry, not weather.
 */
export function outdoorStore(ctx: AssistantContext, clothing: ClothingKnowledge): OutdoorKnowledge | null {
  const outdoor = clothing.outdoor
  if (!outdoor) return null
  const said = ctx.products.some((p) => outdoor.signals.test(factsOf(p).filter((fact) => fact !== p.care).join(' ')))
  const sized = (ctx.sizeCharts ?? []).some((chart) => chart.columns.some((column) => FOOT_OR_HEAD.test(column)))
  return said || sized ? outdoor : null
}

// ── Temperatures ─────────────────────────────────────────────────────────────

export interface Temperature {
  /** In °F. */
  f: number
  /** The unit the shopper wrote; null when they gave none (read as °F, as the store's US customers write it). */
  said: 'F' | 'C' | null
}

const DEGREES = /(?:(?<![\w.])(-)|\b(minus)\s+)?(\d{1,3}(?:\.\d+)?)\s?(?:°|º|˚|degrees?\b|deg\b)\s?(fahrenheit|celsius|centigrade|f\b|c\b)?/
const SHORT_DEGREES = /(?:(?<![\w.])(-)|\b(minus)\s+)?\b(\d{1,3})(f|c)\b/
const MINUS = /\bminus\s+(\d{1,3})\b/
const BELOW_ZERO = /\b(\d{1,3})\s+below(?:\s+zero)?\b/

/** The temperature a message gives: "20°F", "-5°C", "45 degrees", "minus 10", "10 below", "below freezing". */
export function temperatureIn(message: string): Temperature | null {
  const text = message.toLowerCase().replace(/[−–]/g, '-')
  const read = (sign: boolean, value: string, unit: string | undefined): Temperature => {
    const n = (sign ? -1 : 1) * Number(value)
    const said = unit ? (unit.startsWith('c') ? 'C' : 'F') : null
    return { f: said === 'C' ? (n * 9) / 5 + 32 : n, said }
  }
  const degrees = DEGREES.exec(text) ?? SHORT_DEGREES.exec(text)
  if (degrees) return read(!!(degrees[1] || degrees[2]), degrees[3]!, degrees[4])
  const minus = MINUS.exec(text)
  if (minus) return read(true, minus[1]!, undefined)
  const below = BELOW_ZERO.exec(text)
  if (below) return read(true, below[1]!, undefined)
  if (/\bfreezing\b/.test(text)) return { f: 32, said: null }
  return null
}

const signed = (n: number): string => (n < 0 ? `−${Math.abs(n)}` : `${n}`)

/** "20°F (−7°C)", or "−5°C (23°F)" when the shopper wrote Celsius. */
export function temperatureText(t: Temperature): string {
  const f = `${signed(Math.round(t.f))}°F`
  const c = `${signed(Math.round(((t.f - 32) * 5) / 9))}°C`
  return t.said === 'C' ? `${c} (${f})` : `${f} (${c})`
}

/** How warm a piece is rated, when its page says: "Warm to about 14°F (−10°C) over a base layer and a fleece." */
function ratingOf(product: AssistantProduct): { temperature: Temperature; sentence: string } | null {
  for (const said of sentencesOf(product)) {
    if (!/\b(warm|comfortable|rated|rating|temperatures?|cold|cozy|cosy)\b/i.test(said)) continue
    const to = /\b(?:to|as low as|rated for|rating of)\s+(?:about\s+|around\s+|roughly\s+|approximately\s+)?([−-]|minus\s*)?(\d{1,3})\s?°\s?([FC])\b/i.exec(said)
    if (to) {
      const n = (to[1] ? -1 : 1) * Number(to[2])
      const celsius = to[3]!.toUpperCase() === 'C'
      return { temperature: { f: celsius ? (n * 9) / 5 + 32 : n, said: celsius ? 'C' : 'F' }, sentence: said }
    }
  }
  return null
}

// ── Whose piece, and which ───────────────────────────────────────────────────

const AUDIENCE_WORD: Record<Audience, string> = { her: 'women’s', him: 'men’s' }

/**
 * A message as it names a piece: without the shoes and socks the shopper wears ("a 9 in
 * sneakers", "with thick socks"), their measurements ("my head is 57 cm") or the weather
 * ("in the rain", "rainy"), whose words would name the Rain Shell or the Headlamp.
 */
function forNaming(message: string, outdoor: OutdoorKnowledge): string {
  let text = message.toLowerCase().replace(WORN_SHOES, ' ').replace(WITH_SOCKS, ' ')
    .replace(/\b(head|foot|feet)(\s+(circumference|size|length|measurement))?\b/g, ' ').replace(/\b(rainy|snowy|windy)\b/g, ' ')
  for (const protection of outdoor.protections) text = text.replace(new RegExp(protection.asks.source, 'g'), ' ')
  return text
}

/** The shoes and socks a shopper says they wear, which are not the piece asked about: "a 9 in sneakers", "with thick socks". */
const WORN_SHOES = /\b(?:(?:a|an|my)\s+)?(?:(?:size|us)\s*)?\d{1,2}(?:\.5|½)?\s*(?:in\s+)?(?:(?:my|the)\s+)?(?:sneakers|shoes|trainers|runners|running shoes|street shoes)\b/g
const WITH_SOCKS = /\bwith\s+(?:my\s+|a\s+|some\s+)?(?:(?:thick\w*|hiking|wool|merino|warm|heavy|cushioned)\s+)*socks?\b/g
const SIZED_BOOT = /\b(?:(?:a|an|my)\s+)?(?:(?:size|us)\s*)?\d{1,2}(?:\.5|½)?\s+(?:hiking\s+)?boots?\b/g

export interface OutdoorSubject {
  product?: AssistantProduct
  named: AssistantProduct[]
  /** One piece made for women and for men ("Summit Down Jacket"), when the message doesn't say whose. */
  pair: AssistantProduct[]
}

/**
 * The piece an outdoor question is about. As `subjectOf`, but the shoes and socks the
 * shopper already wears are not a piece asked about, and a piece the store makes for
 * women and for men is the one for whom the message asks; else, without it, the pair.
 * A message for the other wearer than the last answer's piece, or the page's, is about
 * that wearer's piece of the same style: "and the women’s?" after the men’s boot.
 */
export function outdoorSubject(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, previous?: number): OutdoorSubject {
  let text = forNaming(message, outdoor)
  if (/\bsocks?\b/.test(text)) text = text.replace(SIZED_BOOT, ' ')
  const wanted = audienceAsked(message.toLowerCase())
  const theirs = (id?: number): number | undefined => {
    const piece = ctx.products.find((p) => p.id === id)
    const own = piece ? audienceOf(piece, clothing) : null
    if (!wanted || !piece || !own || own === wanted) return id
    return ctx.products.find((p) => sameStyle(p, piece) && audienceOf(p, clothing) === wanted)?.id
  }
  const found = subjectOf(text, { ...ctx, currentProductId: theirs(ctx.currentProductId) }, theirs(previous))
  const { product } = found
  let { named } = found
  if (product || named.length < 2) return { product, named, pair: [] }
  // "Is the pack waterproof?": the packs, not the "3-pack" of socks or the Packable Sun Hat.
  const means = outdoor.needs.filter((need) => need.kind === 'piece' && need.says.test(text)).flatMap((need) => need.means)
  const ofKind = means.length ? named.filter((p) => hits(means, `${p.name} ${p.subtitle} ${p.collections.join(' ')}`) > 0) : []
  if (ofKind.length) named = ofKind
  if (named.length === 1) return { product: named[0], named, pair: [] }
  const own = named.map((p) => audienceOf(p, clothing))
  const audience = audienceAsked(message.toLowerCase())
  if (audience) {
    const theirs = named.filter((_, i) => own[i] === audience)
    if (theirs.length === 1) return { product: theirs[0], named, pair: [] }
    const kept = named.filter((_, i) => own[i] !== (audience === 'him' ? 'her' : 'him'))
    return kept.length === 1 ? { product: kept[0], named, pair: [] } : { named: kept, pair: [] }
  }
  const oneStyle = styleNames(named).length === 1
  const forBoth = own.every(Boolean) && own.includes('her') && own.includes('him')
  return { named, pair: forBoth && (oneStyle || named.length === 2) ? named : [] }
}

/**
 * The pair as one style, named for it ("Summit Down Jacket"): one style, fabric and care
 * (their descriptions may be worded for each). Undefined when they differ.
 */
function styleOf(pair: AssistantProduct[]): AssistantProduct | undefined {
  const [first] = pair
  if (!first) return undefined
  const same = (p: AssistantProduct) => sameStyle(p, first) && p.material === first.material && p.care === first.care
  return pair.every(same) ? { ...first, name: styleName(first.name) } : undefined
}

/** "the Ridgeline Rain Shell", "the Alpine Fleece Pullover or the Alpine Fleece Jacket" */
function theNames(products: AssistantProduct[], joiner = 'or'): string {
  const unique = styleNames(products).map((name) => `the ${name}`)
  return unique.length > 1 ? `${unique.slice(0, -1).join(', ')} ${joiner} ${unique[unique.length - 1]}` : (unique[0] ?? '')
}

/** "Is it the women’s or the men’s Canyon Hiking Boot?" */
function whoseQuestion(pair: AssistantProduct[], clothing: ClothingKnowledge): string {
  const her = styleName(pair.find((p) => audienceOf(p, clothing) === 'her')!.name)
  const him = styleName(pair.find((p) => audienceOf(p, clothing) === 'him')!.name)
  return her === him ? `Is it the women’s or the men’s ${her}?` : `Is it the women’s ${her} or the men’s ${him}?`
}

/**
 * A reply as it reads aloud: a piece named for its wearer reads "the women’s Canyon
 * Hiking Boot" mid-sentence, as the shopper would say it; at the start of a line it
 * keeps its name ("Women’s Canyon Hiking Boot: True to size…").
 */
function spoken(turn: ClothingTurn): ClothingTurn {
  const lower = (text: string) => text.replace(/\b(the|The) (Women|Men)(['’])s\b/g, (_, the: string, who: string, mark: string) => `${the} ${who.toLowerCase()}${mark}s`)
  return { ...turn, replies: turn.replies.map((reply) => ({ ...reply, text: lower(reply.text) })) }
}

// ── Rain and wind ────────────────────────────────────────────────────────────

type ProtectionLevel = 'yes' | 'partly' | 'no' | 'unknown'

/** How far a piece keeps out the rain (or wind), by what its page says, with the sentences that say it. */
function protectionOf(product: AssistantProduct, protection: AssistantProtection): { level: ProtectionLevel; evidence: string[] } {
  const full = new RegExp(`\\b${protection.word}\\b`, 'i')
  const denied = new RegExp(`\\b(not|isn['’]t|aren['’]t|never|no longer)\\s+(?:fully\\s+|completely\\s+|totally\\s+)?${protection.word}\\b`, 'i')
  // The page's own sentences; the subtitle only when they say nothing.
  const said = sentencesOf(product, false)
  const sentences = said.some((s) => full.test(s) || protection.partly.test(s)) ? said : sentencesOf(product)
  const yes = sentences.filter((s) => full.test(s) && !denied.test(s))
  if (yes.length) return { level: 'yes', evidence: yes.slice(0, 2) }
  const partly = sentences.filter((s) => protection.partly.test(s))
  const no = sentences.filter((s) => denied.test(s))
  if (partly.length) return { level: 'partly', evidence: [...new Set([...partly, ...no])].slice(0, 2) }
  if (no.length) return { level: 'no', evidence: no.slice(0, 2) }
  return { level: 'unknown', evidence: [] }
}

/** A question about a piece, not a request for some: "Is the shell waterproof?", not "waterproof boots" or "Which jacket is waterproof?". */
const ASKS_ABOUT = /^\s*(is|are|does|do|did|will|would|can|could|should|how|was|has|have)\b|\?\s*$/
const LISTING = /\b(which|any|anything|something|do you (have|sell|carry)|show me|looking for|recommend\w*|need|want)\b/
/** "it", "this", "they": a piece the shopper has in mind. */
const POINTED = /\b(it|this|that|they|them|these|those)\b/

/** The kinds of piece a product is, by the store's piece needs ("a jacket", "boots"); not a gift or gear, which are any kind. */
function kindsOf(product: AssistantProduct, outdoor: OutdoorKnowledge): string[] {
  return outdoor.needs
    .filter((need) => need.kind === 'piece' && need.label !== 'a gift' && need.label !== 'gear' && hits(need.means, `${product.name} ${product.subtitle} ${product.collections.join(' ')}`) > 0)
    .map((need) => need.label)
}

/**
 * "For steady rain, the Ridgeline Rain Shell is waterproof." for a piece that isn't, with a
 * link to it: a shell over a layer, else a piece of the same kind (boots for boots). Null
 * when the store has none: a pack is never answered with a boot.
 */
function protectedInstead(product: AssistantProduct, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, protection: AssistantProtection, audience = audienceOf(product, clothing)): AssistantReply | null {
  const layer = layerOf(product, outdoor)
  const kinds = kindsOf(product, outdoor)
  const pick = ctx.products.filter((p) => p.id !== product.id && !sameStyle(p, product) && sharesAudience(audience, audienceOf(p, clothing))
    && protectionOf(p, protection).level === 'yes'
    && (layer && layer !== 'shell' ? layerOf(p, outdoor) === 'shell' : kindsOf(p, outdoor).some((kind) => kinds.includes(kind))))
  if (!pick.length) return null
  const named = pick.filter((p) => sameStyle(p, pick[0]!))
  return {
    kind: 'text',
    topic: 'Weather and warmth',
    text: `${protection.when}, ${theNames(named)} is ${protection.word}.`,
    ...(pick[0]!.url ? { link: { label: `See the ${pick[0]!.name}`, href: pick[0]!.url } } : {}),
  }
}

/**
 * "Is the rain shell waterproof?": yes, partly or no, from the piece's own page, with the
 * sentence that says it; a piece whose page says nothing is never promised. Asked for
 * pieces rather than about one ("waterproof boots", "Which jacket is waterproof?"), the
 * pieces that are, of the kind, for whom and under the price asked.
 */
function protectionAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, protection: AssistantProtection, subject: OutdoorSubject): ClothingTurn {
  const turn = protectionTurn(message, ctx, clothing, outdoor, protection, subject)
  // "Do you have Gore-Tex jackets?": that brand isn't sold, then what is.
  const brand = protection.brand?.says.test(message.toLowerCase()) ? protection.brand : null
  return brand ? { ...turn, replies: [{ kind: 'text', topic: 'Weather and warmth', text: brand.text }, ...turn.replies] } : turn
}

function protectionTurn(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, protection: AssistantProtection, subject: OutdoorSubject): ClothingTurn {
  const text = message.toLowerCase()
  const about = ASKS_ABOUT.test(text) && !LISTING.test(text)
  const piece = subject.product ?? styleOf(subject.pair)
  const reply = (body: string, link?: { label: string; href: string }): AssistantReply => ({ kind: 'text', topic: 'Weather and warmth', text: body, ...(link ? { link } : {}) })

  if (about && piece) {
    const { level, evidence } = protectionOf(piece, protection)
    // Clothing points to the store's fabric page; gear (a headlamp, a pack) to its own page.
    const page = piece.sizeChartId || !subject.product || !piece.url ? clothing.fabricPage : { label: `See the ${piece.name}`, href: piece.url }
    const said = `${piece.name}: ${evidence.join(' ')}`
    const instead = level === 'yes' ? null : protectedInstead(piece, ctx, clothing, outdoor, protection, subject.product ? audienceOf(piece, clothing) : null)
    // "Does it have a membrane?": what the page says, without a yes to a word it may not use.
    const yes = protection.proxies?.test(text) ? '' : 'Yes. '
    const replies: AssistantReply[] =
      level === 'yes' ? [reply(`${yes}${said}`, page)]
        : level === 'partly' ? [reply(`Not fully: it’s ${protection.partlyName}, not ${protection.word}. ${said}`, instead ? undefined : page)]
          : level === 'no' ? [reply(`No. ${said}`, instead ? undefined : page)]
            : [reply(`I can’t promise the ${piece.name} keeps out the ${protection.word === 'windproof' ? 'wind' : 'rain'}: we don’t list it as ${protection.word}.${piece.material ? ` ${piece.name}: ${sentence(piece.material)}` : ''}`, instead ? undefined : { label: 'Contact us', href: '/page/contact' })]
    if (instead) replies.push(instead)
    return { replies, ...(subject.product ? { productId: subject.product.id } : {}) }
  }

  // Several pieces named: what each one's page says, grouped.
  const several = subject.named.length >= 2 && subject.named.length <= 3 ? subject.named : []
  if (about && several.length) {
    const levels = several.map((p) => ({ p, level: protectionOf(p, protection).level }))
    const of = (level: ProtectionLevel) => levels.filter((l) => l.level === level).map((l) => l.p)
    const are = (ps: AssistantProduct[]) => (styleNames(ps).length > 1 ? 'are' : 'is')
    const lines = [
      of('yes').length ? `${capital(theNames(of('yes'), 'and'))} ${are(of('yes'))} ${protection.word}.` : '',
      of('partly').length ? `${capital(theNames(of('partly'), 'and'))} ${are(of('partly'))} ${protection.partlyName}, not ${protection.word}.` : '',
      of('no').length ? `${capital(theNames(of('no'), 'and'))} ${are(of('no'))} not ${protection.word}.` : '',
      of('unknown').length ? `I can’t promise ${theNames(of('unknown'))} ${are(of('unknown')) === 'is' ? 'keeps' : 'keep'} out the ${protection.word === 'windproof' ? 'wind' : 'rain'}: we don’t list ${are(of('unknown')) === 'is' ? 'it' : 'them'} as ${protection.word}.` : '',
    ].filter(Boolean)
    const short = several.find((p) => protectionOf(p, protection).level !== 'yes')
    const instead = short ? protectedInstead(short, ctx, clothing, outdoor, protection, null) : null
    return { replies: [reply(lines.join(' '), instead ? undefined : clothing.fabricPage), ...(instead ? [instead] : [])] }
  }

  // "Is it waterproof?" with no piece in mind the chat knows: which one.
  if (about && POINTED.test(text)) return { replies: [reply(clothing.askPiece)] }

  // Asked for pieces: those that are, of the kind, for whom and under the price asked.
  const audience = audienceAsked(text)
  const price = priceLimit(message)
  const kinds = outdoor.needs.filter((need) => need.kind === 'piece' && need.says.test(text.replace(protection.asks, ' ')))
  const means = kinds.flatMap((need) => need.means)
  const pool = forAudience(ctx.products, audience, clothing)
    .filter((p) => !means.length || hits(means, `${p.name} ${p.subtitle} ${p.collections.join(' ')}`) > 0)
  const full = pool.filter((p) => protectionOf(p, protection).level === 'yes')
  const partly = pool.filter((p) => protectionOf(p, protection).level === 'partly')
  const affordable = price ? full.filter((p) => p.price === undefined || p.price <= price.max) : full
  const kind = kinds[0]?.label.replace(/^an? /, '') ?? 'piece'
  const replies: AssistantReply[] = []
  const shown = affordable.length ? affordable : full
  if (shown.length) {
    const lead = affordable.length
      ? `${shown.length === 1 ? 'This one is' : 'These are'} ${protection.word}${price ? ` and ${price.phrase}` : ''}:`
      : `Nothing ${protection.word} ${price!.phrase} right now. These come closest:`
    replies.push(ctx.shoppingEnabled
      ? { kind: 'products', text: lead, productIds: shown.slice(0, 4).map((p) => p.id) }
      : reply(`${lead.replace(/:$/, '.')} ${capital(theNames(shown, 'and'))}.`))
  } else {
    replies.push(reply(`We don’t list any ${kind}${audience ? ` for ${audience === 'him' ? 'men' : 'women'}` : ''} as ${protection.word}, so I can’t promise one keeps out the ${protection.word === 'windproof' ? 'wind' : 'rain'}.`, { label: 'Contact us', href: '/page/contact' }))
  }
  if (partly.length) {
    const are = styleNames(partly).length > 1 ? 'are' : 'is'
    replies.push(reply(`${capital(theNames(partly.slice(0, 3), 'and'))} ${are} ${protection.partlyName}, not ${protection.word}.`))
  }
  return { replies }
}

const capital = (text: string): string => (text ? `${text[0]!.toUpperCase()}${text.slice(1)}` : text)

// ── Warmth and layers ────────────────────────────────────────────────────────

/** A question about how warm a piece is. A temperature in the message counts too. */
const WARMTH = /\b(how warm|warm enough|keeps? (me|you|us|him|her|them|my \w+) warm|warmth|how cold|cold enough|too cold|temperature|temp rating|degrees?|freezing|below zero|sub-?zero)\b/
/** A question about what to wear, or how to layer. */
const LAYERS = /\blayer(s|ing|ed)?\b|\bwhat (should|do|can|would) (i|we|he|she|you) wear\b|\bwhat to wear\b|\bdress(ed)? for\b|\bwear (under|underneath|beneath)\b/
const WET = /\b(rain\w*|wet|showers?|drizzle|storm\w*|sleet|snow\w*)\b/
const WINDY = /\bwind\w*\b/
const COLD_WORDS = /\b(cold|winter\w*|snow\w*|freez\w*|chilly|frost\w*|icy|ski\w*)\b/
const WARM_WORDS = /\b(summer|hot|heat|warm (day|days|weather))\b/

type Layer = keyof OutdoorKnowledge['layers']

/** A layer worn on the body is a garment with a size chart: an "Insulated Trail Bottle" is not a warm layer. Hats and socks may be one size. */
const isGarment = (layer: Layer, product: AssistantProduct): boolean => layer === 'hat' || layer === 'socks' || !!product.sizeChartId

/** The store's pieces for a layer, for this audience (or for everyone, null). */
function layerPieces(layer: Layer, outdoor: OutdoorKnowledge, ctx: AssistantContext, clothing: ClothingKnowledge, audience: Audience | null, not?: AssistantProduct): AssistantProduct[] {
  return ctx.products.filter((p) => (!not || (p.id !== not.id && !sameStyle(p, not)))
    && outdoor.layers[layer].test(`${p.name} ${p.subtitle}`) && isGarment(layer, p)
    && (audience ? sharesAudience(audience, audienceOf(p, clothing)) : true))
}

/** The layer a piece is, by its own name and subtitle. */
function layerOf(product: AssistantProduct, outdoor: OutdoorKnowledge): Layer | null {
  const said = `${product.name} ${product.subtitle}`
  return (['base', 'shell', 'warm', 'mid'] as const).find((layer) => outdoor.layers[layer].test(said) && isGarment(layer, product)) ?? null
}

/**
 * How to wear a piece in the cold with the store's other layers. Empty when there is
 * nothing to add, or when it would name a layer in `skip` (one its rating already counts).
 */
function layerHint(product: AssistantProduct, audience: Audience | null, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, temperature: Temperature | null, skip: Layer[] = []): string {
  if (temperature && temperature.f >= 50) return ''
  const the = (layer: Layer) => (skip.includes(layer) ? '' : theNames(layerPieces(layer, outdoor, ctx, clothing, audience, product)))
  const [base, mid, warm, shell] = [the('base'), the('mid'), the('warm'), the('shell')]
  const cold = temperature ? `For ${temperatureText(temperature)}` : 'For the cold'
  switch (layerOf(product, outdoor)) {
    case 'base': return mid ? `${cold}, wear it under ${mid}${warm ? ` and ${warm}` : ''}.` : ''
    case 'mid': return base ? `${cold}, wear it over ${base}${warm || shell ? `, under ${warm || shell}` : ''}.` : ''
    case 'warm': return base && mid ? `${cold}, wear it over ${base} and ${mid}.` : ''
    case 'shell': return mid || warm ? `It’s a shell, for wind and rain: for warmth, wear ${[mid, warm].filter(Boolean).join(' and ')} under it.` : ''
    default: return ''
  }
}

/**
 * "Is the down jacket warm enough for 20°F?": against the temperature the piece's page
 * rates it to, when it gives one; otherwise it says it can't promise, with what the
 * piece is made of and how to layer it. Colder than its rating, it says no, and adds
 * only layers the rating doesn't already count, with what no answer can promise.
 */
function warmthAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, piece: AssistantProduct, remember: boolean): ClothingTurn {
  const temperature = temperatureIn(message)
  const rating = ratingOf(piece)
  // A style for women and men (not remembered) is answered for both.
  const hint = (skip: Layer[] = []) => layerHint(piece, remember ? audienceOf(piece, clothing) : null, ctx, clothing, outdoor, temperature, skip)
  let text: string
  if (rating && temperature) {
    // "over a base layer and a fleece": those layers are in the rating already.
    const counted = (['base', 'mid', 'warm', 'shell'] as const).filter((layer) => outdoor.layers[layer].test(rating.sentence))
    text = temperature.f >= rating.temperature.f
      ? `Yes, ${temperatureText(temperature)} is within its rating. ${piece.name}: ${rating.sentence}`
      : `No, ${temperatureText(temperature)} is colder than its rating. ${piece.name}: ${rating.sentence} ${hint([...counted])} ${outdoor.layerNote}`
  } else if (rating) {
    text = `${piece.name}: ${rating.sentence}`
  } else {
    const warm = sentencesOf(piece, false).filter((s) => /\b(warm\w*|insulat\w*|\d+[- ]fill|loft\w*)\b/i.test(s)).slice(0, 2)
    const what = warm.length ? warm.join(' ') : piece.material ? sentence(piece.material) : ''
    text = `${temperature
      ? `I can’t promise the ${piece.name} keeps you warm at ${temperatureText(temperature)}: we don’t give it a temperature rating.`
      : `We don’t give the ${piece.name} a temperature rating, so I can’t promise how cold it can go.`}${what ? ` ${piece.name}: ${what}` : ''} ${hint()}`
  }
  return { replies: [{ kind: 'text', topic: 'Weather and warmth', text: text.replace(/\s+/g, ' ').trim(), link: clothing.fabricPage }], ...(remember ? { productId: piece.id } : {}) }
}

/**
 * "How should I layer for a cold hike?", "What should I wear at 30°F?": the store's own
 * base layer, mid layer, warm layer and shell, as many as the weather asks for, for whom
 * the shopper says. Without saying, and where the store makes each for women and men,
 * the layers by name and a question back. Null when the store sells no layers.
 */
function layeringAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, subject: OutdoorSubject, previous?: number): ClothingTurn | null {
  const text = withoutNames(message.toLowerCase(), subject.named)
  const temperature = temperatureIn(text)
  const wet = WET.test(text)
  const windy = WINDY.test(text)
  const f = temperature?.f ?? (COLD_WORDS.test(text) ? 30 : WARM_WORDS.test(text) ? 65 : null)
  const tier = f === null ? 'any' : f >= 60 ? 'warm' : f >= 45 ? 'cool' : f >= 25 ? 'cold' : 'freezing'
  const around = [previous, ctx.currentProductId].map((id) => ctx.products.find((p) => p.id === id)).find(Boolean)
  const audience = audienceAsked(text) ?? (around ? audienceOf(around, clothing) : null)
  const pick = (layer: Layer) => layerPieces(layer, outdoor, ctx, clothing, audience)
  const one = (pieces: AssistantProduct[]) => (audience ? pieces.slice(0, 1) : pieces)

  // "What do I wear under the rain shell?": the layers inside it.
  const outer = subject.product ?? styleOf(subject.pair)
  const under = outer && /\b(under|underneath|beneath)\b/.test(text) ? layerOf(outer, outdoor) : null
  const inside: Record<Layer, Layer[]> = { shell: ['base', 'mid', 'warm'], warm: ['base', 'mid'], mid: ['base'], base: [], hat: [], socks: [] }
  const wanted: Layer[] = under
    ? inside[under].filter((layer) => layer !== 'warm' || tier === 'cold' || tier === 'freezing')
    : tier === 'warm' ? ['base'] : tier === 'cool' || tier === 'any' ? ['base', 'mid'] : ['base', 'mid', 'warm']
  const layers = wanted.map((layer) => ({ layer, pieces: one(pick(layer)) })).filter((l) => l.pieces.length)
  if (!layers.length && !under) return null
  const shell = one(pick('shell'))
  const shellOver = !under && shell.length && (tier === 'freezing' || wet)
  const shellCarried = !under && shell.length && !shellOver
  const where = (layer: Layer, i: number) => (i === 0 ? 'next to your skin' : layer === 'warm' ? 'on top' : 'over it')

  const scene = temperature ? temperatureText(temperature) : tier === 'warm' ? 'a warm day' : tier === 'any' ? 'the trail' : 'the cold'
  const parts: string[] = []
  if (under && outer) {
    parts.push(layers.length
      ? `Under ${theNames([outer])}, wear ${listed(layers.map((l, i) => `${theNames(l.pieces)} ${where(l.layer, i)}`))}.`
      : `${capital(theNames([outer]))} is a base layer: wear it next to your skin.`)
  } else {
    parts.push(`For ${scene}, layer up: ${listed(layers.map((l, i) => `${theNames(l.pieces)} ${where(l.layer, i)}`))}.`)
  }
  if (shellOver) parts.push(`Put ${theNames(shell)} over everything to keep out the ${wet ? 'rain' : 'wind'}.`)
  else if (shellCarried) parts.push(`Keep ${theNames(shell)} in your pack for wind or rain${windy ? ', and put it on when the wind picks up' : ''}.`)
  if (!under && tier === 'freezing') {
    const extras = [...one(pick('hat')), ...one(pick('socks'))]
    if (extras.length) parts.push(`Add ${theNames(extras, 'and')}.`)
  }
  const warmPieces = layers.find((l) => l.layer === 'warm')?.pieces ?? []
  const warm = warmPieces[0]
  const rating = warm ? ratingOf(warm) : null
  // Named as the layers above name it: the style, unless the shopper said whose.
  if (rating && temperature && temperature.f < rating.temperature.f) parts.push(`That’s colder than we rate ${theNames(warmPieces.filter((p) => sameStyle(p, warm!)))} for: ${temperatureText(rating.temperature)}.`)
  parts.push(outdoor.layerNote)

  const chosen = [...layers.flatMap((l) => l.pieces), ...(shellOver || shellCarried ? shell : [])]
  const gendered = !audience && chosen.some((p) => audienceOf(p, clothing) !== null)
  const replies: AssistantReply[] = [{ kind: 'text', topic: 'Layering', text: parts.join(' ') }]
  if (gendered) {
    replies.push({ kind: 'text', topic: 'Layering', text: outdoor.askAudience.layers })
    return { replies, asked: message }
  }
  if (ctx.shoppingEnabled && chosen.length) replies.push({ kind: 'products', text: 'Here are the layers:', productIds: chosen.map((p) => p.id) })
  return { replies }
}

// ── Packs ────────────────────────────────────────────────────────────────────

const VOLUME = /\b(\d{1,3})\s?(?:l|liters?|litres?)\b/i
const PACK_ASKS = /\b(how (big|large)|how much (does|will|can) (it|they) (hold|carry|fit)|capacity|volume|liters?|litres?|hold\w*|fits?|enough|carry-?on|laptop|room|day ?hikes?|overnights?|weekends?|multi-?day|trips?|sizes?|bigger|smaller|largest|smallest|difference)\b/
const PACK_THINGS = /\b(laptop|bladder|hydration|reservoir|sleeping bag|tent|stove|carry-?on|cabin bag|overhead)\b/
const TRIPS = /\b(day ?hikes?|overnights?|weekends?|multi-?day|week-?long|thru-?hikes?)\b/

/** How many liters a pack holds, by its name ("Daybreak 24L Pack") or its specifications (Volume, Capacity). */
function volumeOf(product: AssistantProduct): number | null {
  const named = VOLUME.exec(product.name)
  if (named) return Number(named[1])
  const spec = product.specs?.find((s) => /\b(volume|capacity)\b/i.test(s.label))
  const value = spec ? /(\d{1,3}(?:\.\d+)?)/.exec(spec.value) : null
  return value ? Number(value[1]) : null
}

/**
 * "How big is the Daybreak pack?", "Which pack for an overnight trip?": each pack's
 * volume, with what its page says about the trip or the thing asked about ("laptop"),
 * and an honest line where it says nothing.
 */
function packAnswer(message: string, ctx: AssistantContext, subject: OutdoorSubject): ClothingTurn | null {
  const text = message.toLowerCase()
  let packs = (subject.product ? [subject.product] : subject.named).filter((p) => volumeOf(p) !== null)
  // "the daypack", "a backpack": the store's packs, those whose subtitle says the word first.
  if (!packs.length && !subject.product && /\b(back|day)?packs?\b|\brucksacks?\b/.test(text)) {
    const all = ctx.products.filter((p) => volumeOf(p) !== null)
    const word = /\b(daypack|backpack)s?\b/.exec(text)?.[1]
    const said = word ? all.filter((p) => new RegExp(`\\b${word}`, 'i').test(p.subtitle)) : []
    packs = said.length ? said : all
  }
  if (!packs.length || !PACK_ASKS.test(withoutNames(text, packs))) return null
  const thing = PACK_THINGS.exec(text)?.[1]
  const trip = TRIPS.exec(text)?.[1]
  const says = (p: AssistantProduct, word: string) => sentencesOf(p).filter((s) => new RegExp(`\\b${word.replace(/\s+/g, '\\s*').replace(/s$/, '')}`, 'i').test(s))
  const holds = (p: AssistantProduct) => `The ${p.name} holds ${volumeOf(p)} ${volumeOf(p) === 1 ? 'liter' : 'liters'}.`
  /** What the packs' pages say about the thing asked ("laptop"); those that say nothing are not promised. */
  const about = (ps: AssistantProduct[], word: string): string[] => {
    const silent = ps.filter((p) => !says(p, word).length)
    const what = word.startsWith('carry') ? 'is carry-on size' : `takes a ${word}`
    return [
      ...ps.filter((p) => says(p, word).length).map((p) => `${ps.length > 1 ? `${p.name}: ` : ''}${says(p, word).slice(0, 2).join(' ')}`),
      ...(silent.length ? [`I can’t promise ${theNames(silent)} ${what}: ${silent.length > 1 ? 'their pages don’t' : 'its page doesn’t'} say.`] : []),
    ]
  }
  if (packs.length === 1) {
    const pack = packs[0]!
    const body = [
      holds(pack),
      pack.fitNote ? sentence(pack.fitNote) : '',
      ...(thing ? about([pack], thing) : []),
      trip ? (says(pack, trip.split(/[\s-]/)[0]!).slice(0, 1)[0] ?? `I can’t promise it’s enough for ${/^(day|week)/.test(trip) ? 'a' : 'an'} ${trip}: that depends on what you carry.`) : '',
    ].filter(Boolean).join(' ')
    return { replies: [{ kind: 'text', topic: 'Packs', text: body, ...(pack.url ? { link: { label: `See the ${pack.name}`, href: pack.url } } : {}) }], productId: pack.id }
  }
  const bySize = [...packs].sort((a, b) => volumeOf(a)! - volumeOf(b)!)
  const lines = bySize.map((p) => holds(p))
  if (trip) {
    const word = trip.split(/[\s-]/)[0]!
    const made = bySize.filter((p) => says(p, word).length)
    lines.push(made.length
      ? `For ${/^(day|week)/.test(trip) ? 'a' : 'an'} ${trip}: ${made.map((p) => says(p, word)[0]).join(' ')}`
      : `Which is enough for ${/^(day|week)/.test(trip) ? 'a' : 'an'} ${trip} depends on what you carry, so I can’t promise one.`)
  }
  if (thing) lines.push(...about(bySize, thing))
  const replies: AssistantReply[] = [{ kind: 'text', topic: 'Packs', text: lines.join(' ') }]
  if (ctx.shoppingEnabled) replies.push({ kind: 'products', text: bySize.length === 1 ? 'Here it is:' : 'Here they are:', productIds: bySize.map((p) => p.id) })
  return { replies }
}

// ── Boots, socks and hats ────────────────────────────────────────────────────

const FOOT_AFTER = /\b(?:foot|feet)(?:\s+length)?\b(?:\s*(?:is|are|of|=|:|measures?|about|around|at))*\s*(\d{1,2}(?:\.\d+)?)\s*(cm|centimet(?:er|re)s?|inch(?:es)?|in\b|")?/
const FOOT_BEFORE = /\b(\d{1,2}(?:\.\d+)?)\s*-?\s*(cm|centimet(?:er|re)s?|inch(?:es)?|in\b|")\s*(?:long\s+)?(?:foot|feet)\b/
const HEAD_AFTER = /\bhead(?:\s+(?:circumference|size|measurement))?\b(?:\s*(?:is|of|=|:|measures?|about|around))*\s*(\d{2}(?:\.\d+)?)\s*(cm|centimet(?:er|re)s?|inch(?:es)?|in\b|")?/
const HEAD_BEFORE = /\b(\d{2}(?:\.\d+)?)\s*-?\s*(cm|centimet(?:er|re)s?|inch(?:es)?|in\b|")?\s*head\b/

/** A foot length ("my foot is 26 cm") or a head ("a 23 inch head") the message gives. */
export function footAndHeadIn(message: string): Measured[] {
  const text = message.toLowerCase()
  const found: Measured[] = []
  const add = (what: 'foot' | 'head', match: RegExpExecArray | null) => {
    if (match) found.push({ what, value: Number(match[1]), unit: match[2] ? (match[2].startsWith('c') ? 'cm' : 'in') : null })
  }
  add('foot', FOOT_AFTER.exec(text) ?? FOOT_BEFORE.exec(text))
  add('head', HEAD_AFTER.exec(text) ?? HEAD_BEFORE.exec(text))
  return found
}

/** A length with its unit and no word for what it measures: "I’m 26.5 cm", "10.5 inches". Not a height (5'10"). */
const BARE_LENGTH = /(?<![\d.'’])(\d{1,2}(?:\.\d+)?)\s*(cm|centimet(?:er|re)s?|inch(?:es)?|"|in\b(?=\s*(?:$|[.,;:!?)]|long\b)))/
const MEASURED_PART = new RegExp(`\\b${BODY}\\b|\\b(head|height|tall|torso)\\b`)

/**
 * The foot length a boot question gives, with or without the word "foot": a lone length
 * reads as the foot when the message measures nothing else and the value is a foot's
 * (6 to 14 in, 15 to 35 cm). Undefined otherwise.
 */
function footIn(message: string): Measured | undefined {
  const said = footAndHeadIn(message).find((m) => m.what === 'foot')
  if (said) return said
  const text = message.toLowerCase()
  const bare = BARE_LENGTH.exec(text)
  if (!bare || MEASURED_PART.test(text) || HEIGHT_WEIGHT.test(text)) return undefined
  const value = Number(bare[1])
  const unit: SizeUnit = bare[2]!.startsWith('c') ? 'cm' : 'in'
  return (unit === 'cm' ? value >= 15 && value <= 35 : value >= 6 && value <= 14) ? { what: 'foot', value, unit } : undefined
}

/**
 * The shoe sizes a message gives: "I wear a 9", "between 8.5 and 9", "a men's 10".
 * Not a length ("10.5 in"), a temperature, a price, a volume ("24L") or a pack ("3-pack").
 */
export function shoeSizesIn(message: string): number[] {
  const text = message.toLowerCase().replace(/½/g, '.5')
  const sizes: number[] = []
  // "in" is inches only where a length ends ("10.5 in", "10 in long"): "a 9 in sneakers" and "9 in men's boots" are sizes.
  const SHOE_SIZE = /(?<![\d.$£€'’-])(\d{1,2}(?:\.5)?)(?![\d.]|\s*(?:cm|centimet|mm|inch|in\b(?=\s*(?:$|[.,;:!?)]|long\b|foot\b|feet\b|head\b|wide\b|around\b))|["”'’°º˚]|degrees?|deg\b|f\b|c\b|l\b|liters?|litres?|lbs?|oz|%|kg|days?|weeks?|hours?|years?|months?|-?pack\b|x\b|×))/g
  for (const match of text.matchAll(SHOE_SIZE)) {
    const n = Number(match[1])
    if (n >= 3 && n <= 16 && !sizes.includes(n)) sizes.push(n)
  }
  return sizes
}

/** "an 8", "an 11", "a 9". */
const an = (n: number): string => `${/^(8|11|18)/.test(String(n)) ? 'an' : 'a'} ${n}`

/** A size's number: "9" → 9, "US 9.5" → 9.5. */
const sizeNumber = (size: string): number | null => {
  const match = /(\d{1,2}(?:\.\d+)?)/.exec(size.replace(/½/g, '.5'))
  return match ? Number(match[1]) : null
}
/** How a sentence names a shoe size: "size 9", or the row as written ("US 9"). */
const sizeWord = (size: string): string => (/^\d/.test(size.trim()) ? `size ${size.trim()}` : size.trim())

/** The chart a piece's size guide shows. */
function chartOf(product: AssistantProduct, ctx: AssistantContext): SizeChart | undefined {
  return product.sizeChartId ? ctx.sizeCharts?.find((c) => c.id === product.sizeChartId) : undefined
}

/** "EU 42, foot length 10.4 in": sizes as the chart writes them (not the row's own again), lengths in the unit asked. */
function footCells(chart: SizeChart, shown: SizeChart, row: number, columns: ChartColumn[]): string {
  const own = sizeNumber(chart.rows[row]!.size)
  return columns
    .filter((column) => !isSizeSystem(column.label) || sizeNumber(chart.rows[row]!.values[column.index] ?? '') !== own)
    .map((column) => {
      if (isSizeSystem(column.label)) return `${column.label.replace(/\s*size\b/i, '')} ${dashed(chart.rows[row]!.values[column.index] ?? '')}`
      const value = dashed(shown.rows[row]!.values[column.index] ?? '')
      return `${column.label.toLowerCase()} ${value}${/\d/.test(value) ? ` ${shown.unit}` : ''}`
    })
    .join(', ')
}

/**
 * Boots: the size a foot length makes in the piece's chart (the next size up when it
 * falls between two), the shopper's usual size, or between two sizes what the fit note
 * says, else a measured foot. A size the boot isn't made in is said plainly.
 */
function bootAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, piece: AssistantProduct, chart: SizeChart): ClothingTurn {
  const audience = audienceOf(piece, clothing)
  // "the men’s Canyon Hiking Boot" when the store makes it for women too: a size 11 is the men’s.
  const twin = audience && ctx.products.some((p) => p.id !== piece.id && sameStyle(p, piece) && audienceOf(p, clothing) !== audience)
  const product = twin ? { ...piece, name: `${AUDIENCE_WORD[audience]} ${styleName(piece.name)}` } : piece
  const columns = columnsFor(chart, audience)
  const foot = columns.find((c) => FOOT_COLUMN.test(c.label))!
  const made = chart.rows.map((_, i) => i).filter((i) => !!bounds(chart.rows[i]!.values[foot.index] ?? ''))
  if (!made.length) return sizeAnswer(message, ctx, clothing, piece, [piece])
  const fitNote = product.fitNote ? sentence(product.fitNote) : ''
  const rule = fitNote ? fitRule(fitNote) : null
  const reply = (body: string): ClothingTurn => ({ replies: [{ kind: 'text', topic: 'Sizing', text: body.replace(/\s+/g, ' ').trim(), ...sizeGuideLink(product) }], productId: product.id })
  const word = (i: number) => sizeWord(chart.rows[i]!.size)
  const is = (i: number, shown: SizeChart = chart) => `${capital(word(i))} is ${footCells(chart, shown, i, columns)}.`
  const numberOf = (i: number) => sizeNumber(chart.rows[i]!.size)
  const first = made[0]
  const last = made[made.length - 1]
  const range = first !== undefined && last !== undefined ? `${word(first)} to ${chart.rows[last]!.size}` : ''

  const length = footIn(message)
  if (length && made.length) {
    const unit = unitOf(chart, foot, length)
    const shown = chartInUnit(chart, unit)
    const given = `${length.value} ${unit}`
    // Compared with the lengths as the size guide shows them in the shopper's unit, so the answer
    // and the guide agree: a size the guide lists at 26.5 cm is the size for a 26.5 cm foot.
    const shownLength = (i: number) => bounds(shown.rows[i]!.values[foot.index] ?? '')!
    const at = made.find((i) => length.value <= shownLength(i)[1])
    if (at === undefined) return reply(`With a ${given} foot, you’re past our largest size in the ${product.name}. ${capital(word(last!))} is ${footCells(chart, shown, last!, columns)}, so it may be snug. ${fitNote}`)
    // Not "the next size up" when the size's length, as shown, is the one given.
    const exact = length.value >= shownLength(at)[0]
    return reply(`With a ${given} foot, take ${word(at)} in the ${product.name}${exact ? '' : ': it’s the next size up from your foot length'}. ${is(at, shown)} ${fitNote}`)
  }

  const sizes = shoeSizesIn(message)
  const rowFor = (n: number) => made.find((i) => numberOf(i) === n)
  const up = (n: number) => made.find((i) => (numberOf(i) ?? 0) >= n)
  const down = (n: number) => [...made].reverse().find((i) => (numberOf(i) ?? 99) <= n)
  const inRange = (n: number) => first !== undefined && n >= (numberOf(first) ?? 0) && n <= (numberOf(last!) ?? 0)
  const measure = 'Measure your foot from heel to longest toe, tell me its length, and I’ll check it against the size chart.'

  if (sizes.length >= 2) {
    const [a, b] = [Math.min(sizes[0]!, sizes[1]!), Math.max(sizes[0]!, sizes[1]!)]
    const between = made.filter((i) => (numberOf(i) ?? 0) > a && (numberOf(i) ?? 0) < b)
    if (between.length === 1) return reply(`Between ${a} and ${b}, the ${product.name} comes in ${word(between[0]!)}. ${is(between[0]!)} ${fitNote}`)
    const pick = rule === 'up' ? up(b) : rule === 'down' ? down(a) : undefined
    if (pick !== undefined) return reply(`Between ${a} and ${b}, take ${word(pick)}, as its fit note says. ${is(pick)} ${fitNote}`)
    return reply(`Between ${a} and ${b}, I can’t promise which fits better in the ${product.name}. ${measure} ${fitNote}`)
  }
  if (sizes.length === 1) {
    const n = sizes[0]!
    const at = rowFor(n)
    if (at !== undefined) {
      const smaller = made[made.indexOf(at) - 1]
      const lead = rule === 'down' && smaller !== undefined
        ? `The ${product.name} is cut roomy: your usual ${n} gives room for a thick sock, or take ${word(smaller)} for a closer fit.`
        : `Your usual ${n} should be right in the ${product.name}.`
      return reply(`${lead} ${is(at)} ${fitNote}`)
    }
    if (inRange(n)) {
      const pick = rule === 'up' ? up(n) : rule === 'down' ? down(n) : undefined
      return reply(`We don’t make the ${product.name} in ${an(n)}: it comes in ${range}. ${pick !== undefined ? `Take ${word(pick)}, as its fit note says. ${is(pick)}` : `I can’t promise whether ${numberOf(down(n)!)} or ${numberOf(up(n)!)} fits better. ${measure}`} ${fitNote}`)
    }
    // Past this boot's sizes: the same boot for the other audience, when it's made in that size.
    const other = ctx.products.find((p) => p.id !== piece.id && sameStyle(p, piece) && audienceOf(p, clothing) !== audience
      && (() => { const c = chartOf(p, ctx); const col = c && columnsFor(c, audienceOf(p, clothing)).find((x) => FOOT_COLUMN.test(x.label)); return !!c && !!col && c.rows.some((r) => sizeNumber(r.size) === n && !!bounds(r.values[col.index] ?? '')) })())
    const theirs = other ? audienceOf(other, clothing) : null
    return reply(`We don’t make the ${product.name} in ${an(n)}: it comes in ${range}.${theirs ? ` The ${AUDIENCE_WORD[theirs]} ${styleName(piece.name)} comes in ${an(n)}.` : ''} ${fitNote}`)
  }
  return sizeAnswer(message, ctx, clothing, piece, [piece])
}

/** "For a men’s 10, take L": socks sized by shoe size, from the chart's shoe size columns. */
function sockAnswer(message: string, clothing: ClothingKnowledge, product: AssistantProduct, chart: SizeChart): ClothingTurn {
  const text = message.toLowerCase()
  const asked = audienceAsked(text)
  const columns = columnsFor(chart, asked ?? audienceOf(product, clothing)).filter((c) => SHOE_COLUMN.test(c.label))
  const fitNote = product.fitNote ? sentence(product.fitNote) : ''
  const reply = (body: string): ClothingTurn => ({ replies: [{ kind: 'text', topic: 'Sizing', text: body.replace(/\s+/g, ' ').trim(), ...sizeGuideLink(product) }], productId: product.id })
  const whose = (column: ChartColumn) => {
    const original = chart.columns[column.index] ?? ''
    return /^women/i.test(original) ? 'women’s ' : /^men/i.test(original) ? 'men’s ' : ''
  }
  const fitsRow = (row: number) => columns
    .filter((c) => /\d/.test(chart.rows[row]!.values[c.index] ?? ''))
    .map((c) => `${/^[A-Z][a-z]/.test(c.label) ? c.label.charAt(0).toLowerCase() + c.label.slice(1) : c.label} ${dashed(chart.rows[row]!.values[c.index]!)}`)
  const n = shoeSizesIn(message)[0]
  if (n === undefined) {
    const both = new Set(columns.map(whose)).size > 1
    return reply(`${product.name}: ${fitNote} Tell me your shoe size${both ? ', and whether it’s a women’s or men’s size,' : ''} and I’ll check it against the size chart.`)
  }
  const picks = columns
    .map((column) => ({ column, row: chart.rows.findIndex((r) => { const range = bounds(r.values[column.index] ?? ''); return !!range && n >= range[0] && n <= range[1] }) }))
    .filter((p) => p.row >= 0)
  const rows = [...new Set(picks.map((p) => p.row))]
  if (!rows.length) return reply(`We don’t make the ${product.name} in a size for ${an(n)} shoe. ${chart.rows.map((r, i) => `${r.size} fits ${listed(fitsRow(i))}`).join('; ')}. ${fitNote}`)
  if (rows.length === 1) {
    const row = rows[0]!
    const who = asked ? AUDIENCE_WORD[asked] + ' ' : picks.length === 1 ? whose(picks[0]!.column) : ''
    return reply(`For ${who ? `a ${who}${n}` : an(n)} shoe, take ${chart.rows[row]!.size} in the ${product.name}. ${chart.rows[row]!.size} fits ${listed(fitsRow(row))}. ${fitNote}`)
  }
  return reply(`For ${an(n)} shoe, ${picks.map((p) => `take ${chart.rows[p.row]!.size} if it’s a ${whose(p.column)}size`).join(', or ')}. ${fitNote}`)
}

/** Whether a piece's chart reads what the message gives: a measurement, a size it's made in, a foot or a shoe size. */
function readsSizeOf(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, product: AssistantProduct): boolean {
  const chart = chartOf(product, ctx)
  if (!chart) return false
  const audience = audienceOf(product, clothing)
  const foot = columnsFor(chart, audience).find((c) => FOOT_COLUMN.test(c.label))
  // A lone length ("I’m 26.5 cm") is a foot only on a chart that sizes feet.
  const bare = foot ? footIn(message) : undefined
  const measured = [...measurementsIn(message), ...footAndHeadIn(message), ...(bare ? [bare] : [])]
  if (measured.some((m) => !!sizeForMeasurements(chart, [m], audience))) return true
  const letters = sizesIn(message)
  if (letters.length && letters.every((s) => rowOf(chart, s) >= 0)) return true
  const shoes = shoeSizesIn(message)
  if (foot && shoes.length) {
    const numbers = chart.rows.filter((r) => !!bounds(r.values[foot.index] ?? '')).map((r) => sizeNumber(r.size) ?? 0)
    return shoes.every((n) => n >= Math.min(...numbers) && n <= Math.max(...numbers))
  }
  return false
}

/**
 * Size and fit on an outdoor store: boots by foot length and shoe size, socks by shoe
 * size, hats by head, the rest as any clothing store. A piece made for women and men is
 * the one the measurement or size fits; when both do, a question back.
 */
function outdoorSizeAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge, subject: OutdoorSubject): ClothingTurn {
  let product = subject.product
  if (!product && subject.pair.length) {
    const fits = subject.pair.filter((p) => readsSizeOf(message, ctx, clothing, p))
    if (fits.length !== 1) {
      // What both pieces' fit notes say, without whose model wears what.
      const notes = subject.pair.map((p) => (p.fitNote ?? '').split(/(?<=[.!?])\s+/).filter((s) => s && !/\bmodel\b/i.test(s)).join(' '))
      const oneStyle = styleNames(subject.pair).length === 1
      const shared = oneStyle && new Set(notes).size === 1 && notes[0] ? `${styleName(subject.pair[0]!.name)}: ${sentence(notes[0])} ` : ''
      return { replies: [{ kind: 'text', topic: 'Sizing', text: `${shared}${whoseQuestion(subject.pair, clothing)} ${outdoor.askAudience.size}` }], asked: message }
    }
    product = fits[0]
  }
  if (!product) return sizeAnswer(message, ctx, clothing, undefined, subject.named)
  const chart = chartOf(product, ctx)
  if (chart?.columns.some((c) => FOOT_COLUMN.test(c))) return bootAnswer(message, ctx, clothing, product, chart)
  if (chart?.columns.some((c) => SHOE_COLUMN.test(c))) return sockAnswer(message, clothing, product, chart)
  const heads = chart?.columns.some((c) => /\bhead\b/i.test(c)) ? footAndHeadIn(message).filter((m) => m.what === 'head') : []
  return sizeAnswer(message, ctx, clothing, pieceForMeasurements(message, ctx, clothing, product), subject.named, heads)
}

// ── An outdoor store's answers ───────────────────────────────────────────────

/** "it", "this", "the boots": what a yes/no question about a piece asks, without its name and the words of any question. */
const QUESTION_WORDS = new Set(['does', 'will', 'would', 'could', 'should', 'this', 'that', 'they', 'them', 'have', 'good', 'need', 'come', 'with', 'into', 'your', 'make', 'much', 'well', 'ever', 'still', 'also'])

/**
 * A yes/no question about one piece that nothing above answers ("Does the bottle keep
 * drinks cold?"): the sentences of its page that share a word with the question. Null
 * when none does, so a question about its colour or stock is answered as before.
 */
function pageSays(message: string, piece: AssistantProduct, remember: boolean): ClothingTurn | null {
  const asked = words(withoutNames(message, [piece])).filter((w) => w.length >= 3 && !NOT_A_NAME.has(w) && !QUESTION_WORDS.has(w))
  if (!asked.length) return null
  const said = sentencesOf(piece).filter((s) => words(s).some((w) => asked.some((a) => sameWord(a, w))))
  if (!said.length) return null
  return { replies: [{ kind: 'text', topic: 'Product question', text: `${piece.name}: ${said.slice(0, 2).join(' ')}` }], ...(remember ? { productId: piece.id } : {}) }
}

const WIDTH = /\b(wide|wider|narrow|narrower|width|high[- ]arch\w*|high[- ]volume|low[- ]volume|toe ?box)\b/

/** "Are the boots good for wide feet?": what the fit note says about width, else that we don't list one. */
function widthAnswer(boot: AssistantProduct): ClothingTurn {
  const said = (boot.fitNote ?? '').split(/(?<=[.!?])\s+/).filter((s) => /\b(wide|narrow|width|roomy|toe ?box|volume)\b/i.test(s))
  const text = said.length
    ? `${boot.name}: ${said.map((s) => sentence(s)).join(' ')}`
    : `I can’t promise how the ${boot.name} fits a wide or narrow foot: we don’t list a width for it.${boot.fitNote ? ` ${boot.name}: ${sentence(boot.fitNote)}` : ''}`
  return { replies: [{ kind: 'text', topic: 'Sizing', text, ...(said.length ? sizeGuideLink(boot) : { link: { label: 'Contact us', href: '/page/contact' } }) }], productId: boot.id }
}

/** A message gives a size, a measurement, a foot (a lone length too: "26.5 cm") or a shoe size. */
function givesSize(message: string): boolean {
  return sizesIn(message).length > 0 || measurementsIn(message).length > 0 || footAndHeadIn(message).length > 0 || !!footIn(message) || shoeSizesIn(message).length > 0
}

// ── One piece over another ───────────────────────────────────────────────────

const OVER_UNDER = /\b(over|on top of|under|underneath|beneath)\b/
const FITS_ON = /\b(fit|fits|go|goes|wear|layer|room|work|works)\b/
/** Thinnest first: a fit note with room for a fleece has room for a base layer. */
const LAYER_ORDER: Layer[] = ['base', 'mid', 'warm', 'shell']
const ROOM_FOR = /\broom for (an? [^.,;]+?)(?:\s+(?:underneath|under\w*|beneath))?(?=[.,;]|$)/i

/**
 * "Will the rain shell fit over the down jacket?", "Can I wear the fleece under the
 * shell?": what the outer piece's fit note leaves room for ("room for a fleece
 * underneath"). A layer no thicker than that is a yes; a thicker one, or a fit note that
 * names no room, can't be promised. Null unless the message names a garment on each side
 * of "over" or "under": one style outside, one layer inside ("the fleece" is two styles).
 */
function layeredAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge): ClothingTurn | null {
  const text = forNaming(message, outdoor)
  const split = OVER_UNDER.exec(text)
  if (!split || !FITS_ON.test(text)) return null
  const audience = audienceAsked(message.toLowerCase())
  const side = (part: string): AssistantProduct[] => {
    const named = productsNamed(part, ctx.products).filter((p) => layerOf(p, outdoor) && (!audience || sharesAudience(audience, audienceOf(p, clothing))))
    return new Set(named.map((p) => layerOf(p, outdoor))).size === 1 ? named : []
  }
  const before = side(text.slice(0, split.index))
  const after = side(text.slice(split.index + split[0].length))
  const [outer, inner] = split[1] === 'over' || split[1] === 'on top of' ? [before, after] : [after, before]
  if (!outer.length || !inner.length || styleNames(outer).length > 1 || layerOf(outer[0]!, outdoor) === layerOf(inner[0]!, outdoor)) return null
  const rooms = [...new Set(outer.map((p) => ROOM_FOR.exec(p.fitNote ?? '')?.[1]?.toLowerCase() ?? ''))]
  const room = rooms.length === 1 ? rooms[0]! : ''
  const roomLayer = LAYER_ORDER.find((layer) => outdoor.layers[layer].test(room))
  const fits = !!roomLayer && LAYER_ORDER.indexOf(layerOf(inner[0]!, outdoor)!) <= LAYER_ORDER.indexOf(roomLayer)
  const remember = outer.length === 1 ? { productId: outer[0]!.id } : {}
  if (fits) return { replies: [{ kind: 'text', topic: 'Sizing', text: `Yes: ${theNames(outer)} is cut with room for ${room} underneath.` }], ...remember }
  const why = room ? `it’s cut with room for ${room} underneath.` : `its fit note doesn’t say. ${styleNames(outer)[0]}: ${sentence(outer[0]!.fitNote ?? '')}`
  return {
    replies: [{ kind: 'text', topic: 'Sizing', text: `I can’t promise ${theNames(inner)} fits under ${theNames(outer)}: ${why}`, link: { label: 'Contact us', href: '/page/contact' } }],
    ...remember,
  }
}

/**
 * A clothing store's answers when it sells for the outdoors: rain and wind, warmth for a
 * temperature, layering, packs, and boot, sock and hat sizes; then care, fabric and size
 * as any clothing store, about the piece in question (a piece made for women and men is
 * the one for whom the shopper asks); and a yes/no question its page answers. Null when
 * the message asks none of these. A piece named for its wearer reads as it's said (`spoken`).
 */
export function outdoorAnswer(message: string, ctx: AssistantContext, previous: { productId?: number; asked?: string }, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge): ClothingTurn | null {
  const turn = outdoorTurn(message, ctx, previous, clothing, outdoor)
  return turn && spoken(turn)
}

function outdoorTurn(message: string, ctx: AssistantContext, previous: { productId?: number; asked?: string }, clothing: ClothingKnowledge, outdoor: OutdoorKnowledge): ClothingTurn | null {
  const text = message.toLowerCase()
  // A question waiting for whom it is for: "women's", or a size ("a 9"), answers it.
  if (previous.asked && (audienceAsked(text) || givesSize(message)) && !productsNamed(message, ctx.products).length) {
    return outdoorTurn(`${previous.asked} ${message}`, ctx, { productId: previous.productId }, clothing, outdoor)
  }
  const wearing: ClothingKnowledge = { ...clothing, layering: [...clothing.layering, ...outdoor.layering] }
  // "Will the shell fit over the down jacket?": the outer piece's fit note.
  const layered = layeredAnswer(message, ctx, clothing, outdoor)
  if (layered) return layered
  const subject = outdoorSubject(message, ctx, clothing, outdoor, previous.productId)
  const plain = text.replace(WORN_SHOES, ' ').replace(WITH_SOCKS, ' ')
  const asked = withoutNames(plain, subject.named)
  const piece = subject.product ?? styleOf(subject.pair)
  /** An answer about a pair as one style remembers neither piece: a size question next needs to know whose. */
  const kept = (turn: ClothingTurn | null): ClothingTurn | null => (turn && !subject.product ? { ...turn, productId: undefined } : turn)
  const temperature = temperatureIn(asked)
  const yesNo = ASKS_ABOUT.test(text) && /^\s*(is|are|does|do|will|would|can|could)\b/.test(text)

  // What to wear: unless it's a yes/no question about one piece's warmth ("Will the down jacket keep me warm at 20°F?").
  if (LAYERS.test(plain.replace(/\b(base|mid)[- ]?layers?\b/g, ' ')) && !(piece && yesNo && WARMTH.test(asked))) {
    const layers = layeringAnswer(message, ctx, wearing, outdoor, subject, previous.productId)
    if (layers) return layers
  }
  const protection = outdoor.protections.find((p) => p.asks.test(asked))
  if (protection) return protectionAnswer(message, ctx, clothing, outdoor, protection, subject)
  if (piece && (WARMTH.test(asked) || temperature)) return warmthAnswer(message, ctx, clothing, outdoor, piece, !!subject.product)
  if (temperature && !piece) {
    const layers = layeringAnswer(message, ctx, wearing, outdoor, subject, previous.productId)
    if (layers) return layers
  }
  const pack = packAnswer(message, ctx, subject)
  if (pack) return pack
  if (CARE.test(asked)) {
    const care = careAnswer(message, ctx, clothing, piece, subject.named)
    if (care) return kept(care)
  }
  if (FABRIC.test(asked)) {
    const fabric = fabricAnswer(clothing, piece, subject.named)
    if (fabric) return kept(fabric)
  }
  const footwear = [subject.product, ...subject.pair].some((p) => p && chartOf(p, ctx)?.columns.some((c) => FOOT_OR_HEAD.test(c)))
  const boot = piece && chartOf(piece, ctx)?.columns.some((c) => FOOT_COLUMN.test(c))
  if (boot && WIDTH.test(plain)) return kept(widthAnswer(piece))
  if (SIZE.test(asked) || HEIGHT_WEIGHT.test(text) || sizesIn(message).length || measurementsIn(message).length || footAndHeadIn(message).length || (footwear && (shoeSizesIn(message).length || footIn(message)))) {
    return outdoorSizeAnswer(message, ctx, wearing, outdoor, subject)
  }
  return yesNo && piece ? pageSays(message, piece, !!subject.product) : null
}
