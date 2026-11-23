/**
 * A clothing store's answers on size and fit, fabric and care, and the fibres a
 * shopper wants to avoid. Everything is read from the store's own data, which the
 * chat widget hands in with the products: each product's fit note, fabric, care
 * and size chart. storeAssistant.ts asks here when the store's assistant profile
 * has `clothing` (assistantProfiles.ts); no other store reaches this file.
 *
 * Nothing here is advice about health: an allergy to a fibre is answered with
 * what each piece is made of.
 *
 * Pure, with relative `.ts` imports only (types from storeAssistant.ts, so there
 * is no import cycle at run time), so `npm run test:chatbot` runs it in Node.
 */

import { audienceOf as audienceFrom, columnsForAudience } from '../storefront/audience.ts'
import type { Audience, ChartColumn } from '../storefront/audience.ts'
import { chartInUnit } from '../storefront/sizeCharts.ts'
import type { SizeChart, SizeUnit } from '../storefront/sizeCharts.ts'
import type { AssistantFibre, ClothingKnowledge } from './assistantProfiles.ts'
import { bestEntry } from './previewResponder.ts'
import type { AssistantContext, AssistantProduct, AssistantReply } from './storeAssistant.ts'

/** What a clothing answer says, and the piece it was about, so a follow-up ("between M and L") needs no name. */
export interface ClothingTurn {
  replies: AssistantReply[]
  productId?: number
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

/** A message with the names of these pieces taken out, so their words ("organic", "linen") are not read as the question. */
export function withoutNames(text: string, pieces: AssistantProduct[]): string {
  const names = new Set(pieces.flatMap((piece) => piece.name.toLowerCase().match(/[a-z0-9]+/g) ?? []))
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

export type BodyMeasure = 'bust' | 'chest' | 'waist' | 'hip' | 'neck' | 'sleeve' | 'inseam'

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
  if (own >= 0 || !/^\d+$/.test(size)) return own
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
    read.push({ measured: m, label: column.label.toLowerCase(), unit, row: row < 0 ? ranges.length - 1 : row, above: row < 0 })
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

function names(products: AssistantProduct[]): string {
  return listed(products.map((p) => p.name))
}

function sizeGuideLink(product: AssistantProduct) {
  return product.url ? { link: { label: 'Open the size guide', href: `${product.url}?sizeGuide=1` } } : {}
}

/**
 * Size and fit. On a piece: its fit note, then the size the shopper's
 * measurements, usual size or two sizes make in its chart, with that size's row.
 * Without a piece: the store's own sizing page, and a question back.
 */
export function sizeAnswer(message: string, ctx: AssistantContext, clothing: ClothingKnowledge, product: MeasuredPiece | undefined, named: AssistantProduct[]): ClothingTurn {
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
  const ask = `Tell me the size you usually wear, or your ${measuresToAsk(chart, audience)} in ${chart.unit === 'in' ? 'inches' : 'centimeters'}, and I’ll check it against the size chart.`

  // Body measurements pick the size.
  const pick = sizeForMeasurements(chart, measurementsIn(message), audience)
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
      const piece = `${audience === 'him' ? 'men’s ' : audience === 'her' ? 'women’s ' : ''}${product.name}`
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
  if (!pieces.length || pieces.length > 3) return null
  const text = message.toLowerCase()
  if (pieces.length === 1) {
    const care = sentence(pieces[0]!.care!)
    let verdict = ''
    if (/\b(can|could|should|is it (ok|okay|safe))\b[^?]*\b(wash|machine)/.test(text)) {
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
