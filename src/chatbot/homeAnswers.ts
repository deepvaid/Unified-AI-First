/**
 * A furniture and home store's answers: a piece's size, whether it fits the
 * shopper's space, what it is made of and how to look after it, how it arrives,
 * its warranty, what it comes in and what is sold out, how many it seats, delivery,
 * and pieces for a room. Everything is read from the store's own data, which the chat
 * widget hands in with the products: each product's specifications (Width, Depth,
 * Height, Seat height, Weight, Materials, Care, Assembly), its warranty and its
 * choices, and the store's own pages for delivery. storeAssistant.ts asks here when
 * the store's assistant profile has `home` (assistantProfiles.ts); no other store
 * reaches this file.
 *
 * It never guesses. A measurement the store doesn't list is said to be missing. A
 * space is compared side by side with the piece's own measurements, and the answer
 * says which side was compared; a doorway or stairs are not, for a piece that arrives
 * in parts or rolled. A sold-out colour is never said to be available. A delivery
 * service the store's pages don't mention is never promised.
 *
 * Pure, with relative `.ts` imports only (types from storeAssistant.ts, so there
 * is no import cycle at run time), so `npm run test:chatbot` runs it in Node.
 */

import type { AssistantProfile, HomeKnowledge } from './assistantProfiles.ts'
import { bestEntry, keywords } from './previewResponder.ts'
import type { PreviewEntry } from './previewResponder.ts'
import type { AssistantContext, AssistantProduct, AssistantReply, AssistantState } from './storeAssistant.ts'

/** What a home answer says, and what the conversation keeps from it. */
export interface HomeTurn {
  replies: AssistantReply[]
  /** The piece the answer was about, so a follow-up ("will it fit 80 inches?") needs no name. */
  productId?: number
  /** A question waiting for the piece it is about: the piece named next answers it. */
  asked?: string
}

/** Where to write to the store: its own contact page, from its knowledge ("Contact and hours"), else /page/contact. */
export function contact(ctx: AssistantContext): { label: string; href: string } {
  const page = ctx.entries.find((e) => e.url && /\bcontact\b/i.test(e.title))
  return { label: 'Contact us', href: page?.url ?? '/page/contact' }
}

// ── Reading the message ──────────────────────────────────────────────────────

/** The message as the assistant reads it: lower case, straight quotes, and the store's word for a piece ("couch" → "sofa"). */
function readMessage(message: string, home: HomeKnowledge): string {
  let text = message.toLowerCase().replace(/[’‘′]/g, "'").replace(/[“”″]/g, '"')
  for (const phrase of Object.keys(home.synonyms).sort((a, b) => b.length - a.length)) {
    text = text.replace(new RegExp(`\\b${phrase}\\b`, 'g'), home.synonyms[phrase]!)
  }
  return text
}

/** "a, b and c" */
function listed(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? '')
}

function sentence(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

const capital = (text: string): string => (text ? `${text[0]!.toUpperCase()}${text.slice(1)}` : text)

/** A number as an answer writes it: 84, 6.5. */
const fmt = (value: number): string => String(Math.round(value * 10) / 10)

/** "a 90 in wall", "an 82 in wall", "an 11 ft room". */
const withArticle = (said: string): string => (/^(8|11(?![\d])|18(?![\d]))/.test(said) ? `an ${said}` : `a ${said}`)

// ── Which piece the shopper means ────────────────────────────────────────────

/** Words that describe a question, a space or a room, never a piece, so "how wide is my wall" names nothing. */
const NOT_A_NAME = new Set([
  'the', 'and', 'for', 'are', 'you', 'your', 'our', 'can', 'what', 'how', 'doe', 'does', 'did', 'will', 'with', 'have', 'has', 'any',
  'about', 'when', 'where', 'who', 'why', 'this', 'that', 'these', 'those', 'there', 'from', 'need', 'want', 'like', 'please', 'tell',
  'know', 'get', 'got', 'much', 'many', 'take', 'one', 'they', 'them', 'then', 'also', 'just', 'would', 'could', 'should', 'which',
  'think', 'buy', 'order', 'wide', 'width', 'deep', 'depth', 'tall', 'high', 'height', 'long', 'length', 'big', 'large', 'small',
  'smaller', 'size', 'sized', 'dimension', 'measure', 'measurement', 'inch', 'inche', 'feet', 'foot', 'space', 'wall', 'door',
  'doorway', 'fit', 'fitting', 'weigh', 'weight', 'heavy', 'made', 'material', 'care', 'clean', 'cleaning', 'assemble', 'assembly',
  'assembled', 'warranty', 'deliver', 'delivery', 'delivered', 'arrive', 'people', 'person', 'sit', 'room', 'home', 'house',
  'apartment', 'spare', 'enough', 'into', 'through', 'under', 'between', 'next', 'against', 'come', 'color', 'colour', 'finish',
])

/**
 * Ordinary words some product names use ("Stone Side Table", "Orbit Floor Lamp"):
 * they count half, so "is the sofa wool?" is about the sofas, not the wool rug, and
 * they alone never move a question away from the piece the shopper is looking at.
 */
const WEAK = new Set([
  'set', 'side', 'floor', 'light', 'frame', 'media', 'task', 'seat', 'trio', 'stone', 'cloud', 'fold', 'grid', 'weave', 'orbit',
  'outdoor', 'dining', 'coffee', 'lounge', 'wool', 'linen', 'ceramic',
])

/** Phrases made of words some product names use that name no piece: "seat height", "set up", "the 3rd floor". */
const NOT_A_PIECE = /\b(seat height|set ?up|floor space|floor plan|(\d+(st|nd|rd|th)|first|second|third|fourth|fifth|top|ground|upper|lower) floor|on the floor|side by side|light ?weight|how light)\b/g

/** Lower-case words, made singular ("shelves" → "shelf", "pieces" → "piece", "chairs" → "chair"). */
function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map((w) => {
    if (w.length > 4 && w.endsWith('ves')) return `${w.slice(0, -3)}f`
    if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`
    return w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w
  })
}

/** The same word, or one the start of the other when the shorter has four letters or more. */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.length >= 4 && long.startsWith(short)
}

/** How many of the words a text mentions, in any form ("lamps", "lighting"), never by a stem of three letters ("com" is not "compact"). */
function mentions(tokens: string[], text: string): number {
  const said = words(text)
  return tokens.filter((t) => said.some((w) => sameWord(words(t)[0] ?? t, w))).length
}

/** A measurement said before a thing: "72 inch ", "30 in ", "6-ft ". */
const MEASURED = String.raw`(\d+(\.\d+)?\s*-?\s*(inch(es)?|in|ft|feet|foot|cm|"|'')?\s+)?`

/** The shopper's own things ("next to my bed", "my old sofa", "my 72 inch table"): never the piece asked about. */
const THEIRS = new RegExp(String.raw`\b(my|our) (old |current |existing )?${MEASURED}[a-z]+`, 'g')

/**
 * A thing the piece goes under, over or beside ("over a 30 in table", "under the dining
 * table"): where the piece goes, never the piece asked about.
 */
const BESIDE = new RegExp(String.raw`\b(under|underneath|beneath|below|over|above|beside|behind|next to|alongside|against|on top of) (a|an|the|my|our) ${MEASURED}[a-z0-9-]+( [a-z0-9-]+){0,2}`, 'g')

/**
 * The products whose names the message mentions most: one, several when they tie, or
 * none. One of a product's choices said in the message ("the king bed", "the 8-seat")
 * counts half. `strong` is false when only ordinary words matched ("the set", "the floor").
 * The shopper's own things and the things a piece goes under, over or beside are left
 * out, unless nothing else is named.
 */
export function piecesNamed(text: string, products: AssistantProduct[]): { products: AssistantProduct[]; strong: boolean } {
  const plain = text.replace(NOT_A_PIECE, ' ')
  for (const tried of [plain.replace(BESIDE, ' ').replace(THEIRS, ' '), plain.replace(THEIRS, ' ')]) {
    const found = namedIn(tried, products)
    if (found.products.length) return found
  }
  return namedIn(plain, products)
}

function namedIn(text: string, products: AssistantProduct[]): { products: AssistantProduct[]; strong: boolean } {
  const asked = words(text).filter((w) => w.length >= 3 && !NOT_A_NAME.has(w))
  if (!asked.length) return { products: [], strong: false }
  const said = ` ${text.replace(/[^a-z0-9]+/g, ' ')} `
  const scored = products
    .map((product) => {
      const matched = words(product.name).filter((w) => w.length >= 3 && asked.some((a) => sameWord(a, w)))
      const choice = (product.options ?? []).some((o) => o.values.some((v) => {
        const value = v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
        return value.length >= 3 && said.includes(` ${value} `)
      }))
      const score = matched.reduce((sum, w) => sum + (WEAK.has(w) ? 0.5 : 1), 0)
      // Words said in full, not only as the start of a longer one ("cove" in "covered").
      const whole = matched.filter((w) => asked.includes(w)).length
      return { product, score: score ? score + (choice ? 0.5 : 0) : 0, whole, strong: matched.some((w) => !WEAK.has(w)) }
    })
    .filter((p) => p.score > 0)
  const best = Math.max(0, ...scored.map((p) => p.score))
  // A tie goes to the pieces whose name words were said in full: "the Arlo sofa covered by…" is the Arlo, not the Cove.
  const most = Math.max(0, ...scored.filter((p) => p.score === best).map((p) => p.whole))
  const top = scored.filter((p) => p.score === best && p.whole === most)
  return { products: top.map((p) => p.product), strong: top.some((p) => p.strong) }
}

/** A message with the names of these pieces taken out, so their words ("stone", "linen") are not read as the question. */
function withoutNames(text: string, pieces: AssistantProduct[]): string {
  const names = new Set(pieces.flatMap((piece) => words(piece.name)))
  return text.replace(/[a-z0-9]+/g, (word) => (names.has(words(word)[0] ?? word) ? ' ' : word)).replace(/\s+/g, ' ')
}

/**
 * The piece a question is about: the one it names; else, among several it names or
 * when it names none, the piece the last answer was about, then the product whose
 * page the shopper is on. Ordinary words alone ("does it seat 8?") never move the
 * question away from that piece.
 */
function subjectOf(text: string, ctx: AssistantContext, previous?: number): { product?: AssistantProduct; named: AssistantProduct[] } {
  const found = piecesNamed(text, ctx.products)
  const around = [previous, ctx.currentProductId]
    .map((id) => ctx.products.find((p) => p.id === id))
    .filter((p): p is AssistantProduct => !!p)
  const named = !found.strong && around.length ? [] : found.products
  if (named.length === 1) return { product: named[0], named }
  return { product: named.length ? around.find((p) => named.includes(p)) : around[0], named }
}

// ── Lengths ──────────────────────────────────────────────────────────────────

type Unit = 'in' | 'ft' | 'cm' | 'mm' | 'm'
const PER_INCH: Record<Unit, number> = { in: 1, ft: 12, cm: 1 / 2.54, mm: 1 / 25.4, m: 100 / 2.54 }

/** "in" after a number, unless it starts a phrase ("2 in stock", "3 in a row"). */
const IN_UNIT = String.raw`(?:inch(?:es)?\b|in\b(?!\s+(?:stock|store|a|an|the|my|your|our|it|them|total|each|every|black|white|grey|gray|oak|walnut|brass|natural|colou?rs?|one|two|three|person|line|time|cart|basket|use|mind|there|here|this|that|these|those)\b)|"|'')`
const FT_UNIT = String.raw`(?:ft\b\.?|feet\b|foot\b|'(?!s\b|'))`
const OTHER_UNIT = String.raw`(?:cm\b|centimet(?:er|re)s?\b|mm\b|m\b|met(?:er|re)s?\b)`
const UNIT = `(${IN_UNIT}|${FT_UNIT}|${OTHER_UNIT})`
const NUMBER = String.raw`(\d+(?:\.\d+)?)(?![\d.])`

const unitOf = (said: string): Unit => {
  if (said.startsWith('in') || said === '"' || said === "''") return 'in'
  if (said.startsWith('f') || said.startsWith("'")) return 'ft'
  if (said.startsWith('c')) return 'cm'
  return said === 'mm' ? 'mm' : 'm'
}

const pairRe = () => new RegExp(String.raw`(?<![\d.])${NUMBER}\s*${UNIT}?\s*(?:x|×|by)\s*${NUMBER}\s*${UNIT}?`, 'g')
const feetInchesRe = () => new RegExp(String.raw`(?<![\d.])${NUMBER}\s*${FT_UNIT}\s*(?:and\s+)?(\d{1,2}(?:\.\d+)?)(?![\d.])\s*(?:${IN_UNIT})?(?!\s*(?:${FT_UNIT}|${OTHER_UNIT}|x\b|×|by\b|%))`, 'g')
const lengthRe = () => new RegExp(String.raw`(?<![\d.])${NUMBER}\s*-?\s*${UNIT}`, 'g')
/** A number without a unit, said with what it measures: "90 wide", "the width is 90". */
const bareAfterRe = () => /(?<![\d.$#])(\d+(?:\.\d+)?)(?![\d.])\s*-?\s*(?=(wide|deep|tall|high|long|across)\b)/g
const bareBeforeRe = () => /\b(?:width|depth|height|length|wall|alcove|nook|gap|opening|door(?:way)?|hall(?:way)?|ceiling)s?\b(?:\s+(?:is|of|=|:|about|around|only|just|measures?|at|that's|which is))*\s*(?<![$#])(\d+(?:\.\d+)?)(?![\d.])(?!\s*(?:%|seats?|people|persons?|guests?|years?|days?|weeks?|months?|lbs?|pounds|kg))/g

/** A range a store writes for an adjustable piece: "38–42 in". */
const rangeRe = () => new RegExp(String.raw`(?<![\d.])${NUMBER}\s*(?:–|—|-|to)\s*${NUMBER}\s*${UNIT}`, 'g')

/**
 * The first length in a text, in inches, and how it was written ("84 in", "7 ft 2 in").
 * A range ("38–42 in") is read at its largest, so a fit is never said on its smallest.
 */
function firstLength(text: string): { inches: number; least?: number; raw: string; index: number } | null {
  const found: Array<{ inches: number; least?: number; raw: string; index: number }> = []
  for (const m of text.matchAll(rangeRe())) {
    const per = PER_INCH[unitOf(m[3]!)]
    found.push({ inches: Number(m[2]) * per, least: Number(m[1]) * per, raw: m[0], index: m.index! })
  }
  for (const m of text.matchAll(feetInchesRe())) {
    if (Number(m[2]) < 12) found.push({ inches: Number(m[1]) * 12 + Number(m[2]), raw: m[0], index: m.index! })
  }
  for (const m of text.matchAll(lengthRe())) found.push({ inches: Number(m[1]) * PER_INCH[unitOf(m[2]!)], raw: m[0], index: m.index! })
  return found.sort((a, b) => a.index - b.index || b.raw.length - a.raw.length)[0] ?? null
}

// ── The shopper's space ──────────────────────────────────────────────────────

type SpaceKind = 'width' | 'depth' | 'height' | 'length' | 'opening' | 'room' | 'any'

/** A measurement the shopper gave of their space. */
export interface Space {
  kind: SpaceKind
  /** In inches; a room's first side. */
  inches: number
  /** A room's second side, in inches. */
  other?: number
  /** As the answer writes it: "90 in", "7 ft (84 in)", "10 × 12 ft (120 × 144 in)". */
  said: string
  /** What the shopper called it: "wall", "alcove", "doorway". */
  noun?: string
  /** A number without a unit too small to read as inches ("7 wide"): the answer asks for the unit. */
  unclear?: boolean
}

interface Found { start: number; end: number; inches: number; other?: number; said: string; unclear?: boolean; room?: true }

const SPACE_NOUNS = /\b(wall|alcove|nook|niche|recess|gap|space|spot|area|corner|room|ceiling|window|desk|counter|shelf|sill|door\w*|entr\w*|hall\w*|stair\w*|opening|elevator|corridor)\b/
const OPENING = /^(door\w*|entr\w*|hall\w*|stair\w*|opening|gate|elevator|lift|corridor|passage\w*)$/

/** The words of a measurement's surroundings that say what it measures. */
function kindAround(before: string, after: string): { kind: SpaceKind; noun?: string } {
  const nounAfter = /^\s*-?\s*(?:(?:wide|deep|tall|high|long)\s+)?([a-z]+)/.exec(after)?.[1]
  const nounBefore = [...before.matchAll(new RegExp(SPACE_NOUNS.source, 'g'))].pop()?.[1]
  const noun = [nounAfter, nounBefore].find((w) => !!w && SPACE_NOUNS.test(w))
  if (noun && OPENING.test(noun)) return { kind: 'opening', noun }
  const a = after.trimStart().replace(/^-\s*/, '')
  if (/^(wide|width|across)\b/.test(a)) return { kind: 'width', noun }
  if (/^(deep|depth)\b/.test(a)) return { kind: 'depth', noun }
  if (/^(tall|high|height|ceilings?)\b/.test(a)) return { kind: 'height', noun: noun ?? (/^ceiling/.test(a) ? 'ceiling' : undefined) }
  if (/^(long|length)\b/.test(a)) return { kind: 'length', noun }
  // Under a window or a shelf, or a ceiling: how high it can be. ("Under 50 inches wide" is a width, said above.)
  if (/\b(under|below|beneath|underneath) (a|an|my|the|our)\b/.test(before) || (noun && /^(ceiling|window)$/.test(noun))) return { kind: 'height', noun }
  const word = [...before.matchAll(/\b(width|wide|depth|deep|height|tall|high|ceiling|length|long|wall|alcove|nook|gap)\b/g)].pop()?.[1]
  if (word && /^(width|wide|wall|alcove|nook|gap)$/.test(word)) return { kind: 'width', noun }
  if (word && /^(depth|deep)$/.test(word)) return { kind: 'depth', noun }
  if (word && /^(height|tall|high|ceiling)$/.test(word)) return { kind: 'height', noun: noun ?? (word === 'ceiling' ? 'ceiling' : undefined) }
  if (word && /^(length|long)$/.test(word)) return { kind: 'length', noun }
  // A wall or an alcove is measured along: a piece's width goes against it.
  if (noun && /^(wall|alcove|nook|niche|recess|gap)$/.test(noun)) return { kind: 'width', noun }
  return { kind: 'any', noun }
}

const saidAs = (value: number, unit: Unit): string => (unit === 'in' ? `${fmt(value)} in` : `${fmt(value)} ${unit} (${fmt(value * PER_INCH[unit])} in)`)

/**
 * The measurements a message gives of a space: "a 90 inch wall", "7 ft wide",
 * "6'6\"", "200 cm", "a 10 by 12 room", "my doorway is 30 inches". A pair that names
 * one of the piece's own sizes ("the 8 × 10 rug") is not a space.
 */
export function spacesIn(text: string, sizesOfPiece: string[] = []): Space[] {
  let rest = text
  const found: Found[] = []
  const take = (start: number, end: number, entry: Omit<Found, 'start' | 'end'>) => {
    found.push({ start, end, ...entry })
    rest = `${rest.slice(0, start)}${' '.repeat(end - start)}${rest.slice(end)}`
  }
  const pieceSizes = sizesOfPiece.map((label) => (label.match(/\d+(?:\.\d+)?/g) ?? []).join('x')).filter((s) => s.includes('x'))
  for (const m of [...rest.matchAll(pairRe())]) {
    const [a, b] = [Number(m[1]), Number(m[3])]
    const after = rest.slice(m.index! + m[0].length)
    if (pieceSizes.includes(`${m[1]}x${m[3]}`) || /^\s*(rug|carpet)\b/.test(after)) {
      // The piece's own size: not a space, and not read again as two lengths.
      rest = `${rest.slice(0, m.index!)}${' '.repeat(m[0].length)}${rest.slice(m.index! + m[0].length)}`
      continue
    }
    const said = m[2] ?? m[4]
    const unit: Unit = said ? unitOf(said) : Math.max(a, b) < 30 ? 'ft' : 'in'
    const shown = `${fmt(a)} × ${fmt(b)} ${unit}${unit === 'in' ? '' : ` (${fmt(a * PER_INCH[unit])} × ${fmt(b * PER_INCH[unit])} in)`}`
    take(m.index!, m.index! + m[0].length, { inches: a * PER_INCH[unit], other: b * PER_INCH[unit], said: shown, room: true })
  }
  for (const m of [...rest.matchAll(feetInchesRe())]) {
    if (Number(m[2]) >= 12) continue
    const inches = Number(m[1]) * 12 + Number(m[2])
    take(m.index!, m.index! + m[0].length, { inches, said: `${fmt(Number(m[1]))} ft ${fmt(Number(m[2]))} in (${fmt(inches)} in)` })
  }
  for (const m of [...rest.matchAll(lengthRe())]) {
    const unit = unitOf(m[2]!)
    take(m.index!, m.index! + m[0].length, { inches: Number(m[1]) * PER_INCH[unit], said: saidAs(Number(m[1]), unit) })
  }
  for (const re of [bareAfterRe(), bareBeforeRe()]) {
    for (const m of [...rest.matchAll(re)]) {
      const value = Number(m[1])
      const start = m.index! + m[0].lastIndexOf(m[1]!)
      take(start, start + m[1]!.length, { inches: value, said: `${fmt(value)} in`, unclear: value < 12 })
    }
  }
  found.sort((a, b) => a.start - b.start)
  return found.map((f, i) => {
    if (f.room) return { kind: 'room', inches: f.inches, other: f.other, said: f.said, noun: 'room' }
    const before = text.slice(Math.max(found[i - 1]?.end ?? 0, f.start - 40), f.start)
    const after = text.slice(f.end, f.end + 30)
    const { kind, noun } = kindAround(before, after)
    return { kind, inches: f.inches, said: f.said, ...(noun ? { noun } : {}), ...(f.unclear ? { unclear: true } : {}) }
  })
}

// ── A piece's own measurements ───────────────────────────────────────────────

/**
 * One side of a piece and how the store writes it. `text` is its length ("84 in",
 * "38 to 42 in"), or the whole value when it lists several pieces' lengths ("8 in,
 * 11 in and 14 in"), read at the largest. `least` is an adjustable side's smallest
 * length. `note` is what the store adds about it ("shade", "at the headboard").
 */
interface Side { inches: number; text: string; least?: number; note?: string }

/** A piece in one of its sizes ("Queen"), or its only one (label ""). */
export interface PieceSize { label: string; width?: Side; depth?: Side; height?: Side }

/** A specification's value by its label ("Width" → "84 in"), or undefined when the store lists none. */
function specOf(product: AssistantProduct, label: string): string | undefined {
  const value = product.specs?.find((s) => s.label.trim().toLowerCase() === label.toLowerCase())?.value.replace(/\s+/g, ' ').trim()
  return value || undefined
}

const plainLabel = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** The piece's choices that are sizes: "Size": Queen, King; "6-seat", "8-seat"; "5 × 8 ft". */
function sizeChoices(product: AssistantProduct): string[] {
  return (product.options ?? []).find((o) => o.values.length > 1 && (/\b(size|length|width|seat)/i.test(o.name) || o.values.every((v) => /\d/.test(v))))?.values ?? []
}

/**
 * A specification's lengths: one side for every size, or one side for the piece.
 * "84 in" is one side; "72 in (6-seat), 94 in (8-seat)" is one per size, named by the
 * piece's own choices. A length in brackets after another ("84 in (213 cm)") is the
 * same one. Anything else the store adds is a note ("14 in (shade)"). Several lengths
 * that name no size ("8 in, 11 in and 14 in") are the pieces of a set: the whole value
 * is said, and the largest is checked.
 */
function sidesIn(value: string | undefined, choices: string[]): Map<string, Side> {
  const sides = new Map<string, Side>()
  if (!value) return sides
  const written = value.replace(/[’′]/g, "'").replace(/[”″]/g, '"')
  const parts = written.split(/\s*(?:[,;/]|\bor\b|\band\b)\s*/).map((part) => {
    const outside = part.replace(/\([^)]*\)/g, ' ')
    const found = firstLength(outside) ?? firstLength(part)
    if (!found) return null
    const bracketed = [...part.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]!.trim()).filter((inside) => {
      const length = firstLength(inside)
      return !length || inside.replace(length.raw, '').trim() !== ''
    })
    const left = outside.replace(found.raw, ' ').replace(/^[\s:–—-]+|[\s:–—-]+$/g, '').trim()
    const words = [...bracketed, left].filter(Boolean)
    const side: Side = { inches: found.inches, text: found.raw.trim(), ...(found.least !== undefined ? { least: found.least } : {}) }
    return { side, words, choice: choices.find((c) => words.some((w) => plainLabel(w) === plainLabel(c))) }
  }).filter((p): p is NonNullable<typeof p> => !!p)
  if (!parts.length) return sides
  const named = parts.filter((p) => p.choice)
  if (named.length > 1) {
    for (const p of named) sides.set(p.choice!, p.side)
    return sides
  }
  // Several bare lengths, as many as the piece has sizes: one each, in order.
  if (parts.length > 1 && parts.every((p) => !p.words.length) && parts.length === choices.length) {
    parts.forEach((p, i) => sides.set(choices[i]!, p.side))
    return sides
  }
  if (parts.length > 1 && parts.every((p) => !p.words.length)) {
    sides.set('', { inches: Math.max(...parts.map((p) => p.side.inches)), text: written })
    return sides
  }
  const first = parts[0]!
  const note = parts.length > 1
    ? written.replace(first.side.text, ' ').replace(/^[\s,;:–—-]+/, '').replace(/\s+/g, ' ').trim()
    : first.words.join(', ')
  sides.set('', { ...first.side, ...(note ? { note } : {}) })
  return sides
}

/** A size choice that is itself a floor size ("5 × 8 ft"): its width and depth. */
function choiceFloor(choice: string): { width: Side; depth: Side } | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(?:ft|')?\s*[×x]\s*(\d+(?:\.\d+)?)\s*(ft|in|cm|'|")?\s*$/i.exec(choice)
  if (!m) return null
  const unit: Unit = m[3] ? unitOf(m[3].toLowerCase()) : 'ft'
  const side = (n: string): Side => ({ inches: Number(n) * PER_INCH[unit], text: `${n} ${unit}` })
  return { width: side(m[1]!), depth: side(m[2]!) }
}

/**
 * The piece's sizes from its Width, Depth and Height: one, or one per size choice
 * the specifications name. A rug sold by floor size ("5 × 8 ft") takes its width and
 * depth from that choice when the store lists neither.
 */
export function sizesOf(product: AssistantProduct): PieceSize[] {
  const choices = sizeChoices(product)
  const width = sidesIn(specOf(product, 'Width'), choices)
  const depth = sidesIn(specOf(product, 'Depth'), choices)
  const height = sidesIn(specOf(product, 'Height'), choices)
  const floors = !width.size && !depth.size ? choices.map(choiceFloor) : []
  const labels = floors.length && floors.every(Boolean)
    ? choices
    : [...new Set([...width.keys(), ...depth.keys(), ...height.keys()].filter(Boolean))]
  // A side the store gives once is the same in every size.
  const pick = (sides: Map<string, Side>, label: string): Side | undefined => sides.get(label) ?? sides.get('')
  if (!labels.length) {
    if (!width.size && !depth.size && !height.size) return []
    return [{ label: '', width: width.get(''), depth: depth.get(''), height: height.get('') }]
  }
  return labels.map((label, i) => ({
    label,
    width: floors[i]?.width ?? pick(width, label),
    depth: floors[i]?.depth ?? pick(depth, label),
    height: pick(height, label),
  }))
}

/** The sizes a message names ("the king", "the 8-seat"), or every size when it names none. */
function sizesAsked(sizes: PieceSize[], text: string): PieceSize[] {
  if (sizes.length < 2) return sizes
  const said = ` ${text.replace(/[^a-z0-9]+/g, ' ')} `
  const chosen = sizes.filter((size) => {
    // "8 × 10 ft" is chosen by "the 8x10", "8 by 10" or "8' x 10'"; "Queen" and "6-seat" by their words.
    const [a, b, more] = size.label.match(/\d+(?:\.\d+)?/g) ?? []
    if (a && b && !more && /[×x]|\bby\b/.test(size.label)) return new RegExp(`(?<![\\d.])${a}\\s*(?:ft|')?\\s*(?:x|×|by)\\s*${b}(?![\\d.])`).test(text)
    const label = plainLabel(size.label)
    return !!label && said.includes(` ${label} `)
  })
  return chosen.length ? chosen : sizes
}

const heightWord = (size: PieceSize): string => {
  if (!size.height) return 'high'
  if (size.height.inches < 3) return 'thick'
  return size.height.inches >= Math.max(size.width?.inches ?? 0, size.depth?.inches ?? 0) ? 'tall' : 'high'
}
/** A rug's depth is its length. */
const depthWord = (size: PieceSize): string => (size.height && size.height.inches >= 3 ? 'deep' : 'long')

/** "84 in", or "84 in (213 cm)" when the shopper asked in centimeters. */
const show = (side: Side, cm: boolean): string => (cm && !/cm/.test(side.text) && !/,/.test(side.text) ? `${side.text} (${Math.round(side.inches * 2.54)} cm)` : side.text)

/** A side as a phrase: "84 in wide", "14 in wide (shade)". */
const sidePhrase = (side: Side, word: string, cm: boolean, note = true): string => `${show(side, cm)} ${word}${note && side.note ? ` (${side.note})` : ''}`

/** "84 in wide, 36 in deep and 33 in high"; a note every side shares is said once ("… and 29 in high (table)"). */
function sidesText(size: PieceSize, cm: boolean, leave: Array<keyof PieceSize> = []): string {
  const sides: Array<[Side, string]> = []
  if (size.width && !leave.includes('width')) sides.push([size.width, 'wide'])
  if (size.depth && !leave.includes('depth')) sides.push([size.depth, depthWord(size)])
  if (size.height && !leave.includes('height')) sides.push([size.height, heightWord(size)])
  const shared = sides.length > 1 && sides.every(([side]) => side.note && side.note === sides[0]![0].note) ? sides[0]![0].note : undefined
  const said = listed(sides.map(([side, word]) => sidePhrase(side, word, cm, !shared)))
  return shared ? `${said} (${shared})` : said
}

/** The piece's smallest side, the one that goes through a door first: "33 in high". Null unless all three are known. */
function smallestSide(size: PieceSize): { side: Side; word: string } | null {
  if (!size.width || !size.depth || !size.height) return null
  return [
    { side: size.width, word: 'wide' },
    { side: size.depth, word: depthWord(size) },
    { side: size.height, word: heightWord(size) },
  ].sort((a, b) => a.side.inches - b.side.inches)[0]!
}

/** The floor a piece takes, in square inches, for "a small space"; null without a width and a depth. */
function footprint(product: AssistantProduct): number | null {
  const size = sizesOf(product)[0]
  return size?.width && size.depth ? size.width.inches * size.depth.inches : null
}

const COUNT_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six']

// ── What a message asks ──────────────────────────────────────────────────────

/** Asks whether a piece fits a space. */
const FIT = /\b(fit|fits|fitting|go (in|into|through|under|against|between|up)|squeeze|enough (room|space)|(big|wide|long|deep|tall|high|small|short|narrow|low) enough|enough for|room for|space for|too (big|large|wide|long|deep|tall|high)|clearance)\b/
/** Asks how many it seats, or whether it seats a number. */
const SEATS = /\bhow many (people|persons|guests|adults|seats)\b|\bseats? (\d+|two|three|four|five|six|seven|eight|ten)\b|\b(sit|fit)s? (\d+|two|three|four|five|six|seven|eight|ten) (people|persons|guests|adults)\b|\bseating (capacity|for)\b|\benough for (\d+|two|three|four|five|six|seven|eight|ten)\b|\b(is|are) (it|they|the \w+) (a )?(\d+|two|three|four|five|six|seven|eight|ten)[- ]?seat(s|er)?\b/
/** The number a seat question asks about: "does it seat 8?", "is it a 3 seater?". */
const SEATS_ASKED = [/\b(?:seats?|sits?|fits?|enough for) (\d+|two|three|four|five|six|seven|eight|ten)\b/, /\b(\d+|two|three|four|five|six|seven|eight|ten)[- ]?seat(?:s|er)?\b/]
const SEAT_HEIGHT = /\bseat height\b|\bhow (high|tall|low) is (the |its |it's )?seat\b|\bseat (is )?(how )?(high|low|tall)\b/
const SIZE = /\b(dimensions?|measurements?|measure\w*|how (big|large|small|wide|deep|tall|high)|how long(?!\s+(does|do|did|will|would|until|till|before|to|for|is (the |your |its )?(warranty|guarantee|delivery|shipping|wait|return)))|width|depth|height|length|wide|deep(?!\s+clean)|tall|footprint|sizes?|sized|how much (room|space|floor space))\b/
const WEIGHT = /\b(weigh\w*|weight|heavy|heavier|how light|light ?weight)\b/
const MATERIALS = /\b(materials?|made (of|from|with|out of)|what('s| is) it made|fabrics?|upholster\w*|wood(en)?|solid|real wood|hardwood|oak|walnut|veneer|mdf|particle ?board|plywood|metal|steel|iron|alumin\w*|brass|leather|velvet|boucl[eé]|linen|cotton|wool|polyester|teak|acacia|marble|stone|glass|ceramic|rattan|wicker|foam|feathers?)\b/
const CARE = /\b(care|clean\w*|wash\w*|dishwasher\w*|dryer|tumble dr\w*|spills?|stains?|wipe|vacuum\w*|polish\w*|re-?oil\w*|oil (it|the)|maintain\w*|maintenance|look after|protect\w*|removable|scratch\w*|water ?(proof|resistant|rings?|marks?)|weather\w*|rain|uv|fad(e|es|ing)|sunlight|direct sun|stay outside|leave (it )?outside|in winter|pets?|cats?|dogs?|claws?)\b/
const ASSEMBLY = /\b(assembl\w*|put (it |them )?together|set ?up|setup|tools?|screws?|allen key|flat[- ]?pack\w*|(arrive|arrives|come|comes) (fully )?(assembled|in (a )?box(es)?|in (pieces|parts)|flat|ready)|ready to use|how (does|do|will) (it|they|the|this|that)?\s*(arrive|come)|in (one|a single|two|several|multiple|\d) (box(es)?|packages?|pieces|parts)|legs? (attach\w*|come off|screw\w*|removable|detach\w*)|remove the legs)\b/
const WARRANTY = /\b(warrant\w*|guarantee\w*|if it breaks|breaks|defects?|defective|faulty)\b/
const OPTIONS = /\b(colou?rs?|finish(es)?|shades?|swatch(es)?)\b/
/** Asks what it comes in, without saying colour or finish: about its sizes when sizes are asked too. */
const CHOICES = /\b((come|comes) in(?!\s+(a |one |two |several |\d+ )?(box|boxes|pieces|parts|packages?|flat))|available in|options?|choices)\b/
/** Asks whether it, or one of its choices, can be bought now: "Is the Ergo chair in stock in black?" */
const STOCK = /\b(in stock|out of stock|sold out|back in stock|stock|available|availability)\b/
const DELIVERY = /\b(deliver\w*|shipping|ships?|shipped|arriv\w*|freight|courier)\b/
/** Something arrived damaged or wrong: the store's pages answer it, not the delivery times. */
const DAMAGED = /\b(damag\w*|broken|dent\w*|missing (a )?(part|piece|screw)s?|wrong (item|piece|color|colour|size))\b/
/** A question rather than a request: on one piece named alone, its description answers it. */
const QUESTION = /\?\s*$|^(is|are|does|do|can|will|would|how|what|which|why)\b/
const OPENING_WORDS = /\b(door\w*|entr(y|ance)\w*|hall\w*|stair\w*|elevator|lift|corridor)\b/

/**
 * Asking when their own piece arrives ("When will my sofa arrive?"): an order
 * question, so storeAssistant.ts looks up the order instead of the delivery times.
 */
export const MY_DELIVERY = /\b(when|where)\b[^.?!]*\bmy\b[^.?!]*\b(deliver\w*|arriv\w*|com(e|ing)|get here|ship\w*)\b|\bmy\b[^.?!]*\b(deliver\w*|arriv\w*)\b[^.?!]*\b(when|yet|status|date)\b/

/** Words that make a message about an order, even when it names a piece. */
const ORDER_WORDS = /\b(my|mine|order|orders|track\w*|tracking|where('s| is)|has (it|the \w+) (shipped|arrived)|been (shipped|delivered)|shipped yet|dispatch\w*)\b/

/**
 * A message that names one of the store's pieces and reads as a question about it,
 * not about an order: "Does the bed come in one package?" storeAssistant.ts asks
 * here before taking "package" or "shipment" as an order question.
 */
export function aboutPieceNotOrder(message: string, ctx: AssistantContext, home: HomeKnowledge): boolean {
  const text = readMessage(message, home)
  return !ORDER_WORDS.test(text) && piecesNamed(text, ctx.products).strong
}

type Topic = 'size' | 'seat-height' | 'weight' | 'seats' | 'options' | 'materials' | 'care' | 'assembly' | 'warranty'

/** What the message asks about a piece, in the order an answer says it. `named`: it names a piece. */
function topicsIn(text: string, asked: string, named: boolean): Topic[] {
  const topics: Topic[] = []
  const plain = asked.replace(new RegExp(SEAT_HEIGHT.source, 'g'), ' ')
  const size = SIZE.test(plain)
  if (size) topics.push('size')
  if (SEAT_HEIGHT.test(text)) topics.push('seat-height')
  if (WEIGHT.test(plain)) topics.push('weight')
  if (SEATS.test(text)) topics.push('seats')
  if (OPTIONS.test(plain) || (CHOICES.test(plain) && !size)) topics.push('options')
  if (MATERIALS.test(plain)) topics.push('materials')
  if (CARE.test(plain)) topics.push('care')
  if (ASSEMBLY.test(plain)) topics.push('assembly')
  if (WARRANTY.test(plain)) topics.push('warranty')
  // "Is it in stock?", "Is the Ergo chair available?": what it can be bought in now.
  // Not "Is delivery available?", nor "Is anything available under $500?", which names no piece.
  if (!topics.length && STOCK.test(plain) && !DELIVERY.test(plain) && (named || /\b(it|this|that|they|them|these|those)\b/.test(plain))) topics.push('options')
  return topics
}

const TOPIC_NAMES: Record<Topic, string> = {
  size: 'Size and fit', 'seat-height': 'Size and fit', weight: 'Size and fit', seats: 'Size and fit', options: 'Product advice',
  materials: 'Materials and care', care: 'Materials and care', assembly: 'Assembly', warranty: 'Warranty',
}

// ── Facts about a piece ──────────────────────────────────────────────────────

/** How a fact is written: leading the answer and naming the piece, after another fact ("It weighs…"), or on a line after the piece's name. */
type Style = 'first' | 'more' | 'line'

const NUMBER_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, ten: 10 }

/** How many a piece seats, from its name ("3-Seat"), its choices ("6-seat", "8-seat") or its description ("seats six"). */
function seatCounts(product: AssistantProduct): Array<{ label: string; count: number }> {
  const own = /(\d+)[- ]seat(er)?\b/i.exec(product.name)
  if (own) return [{ label: '', count: Number(own[1]) }]
  const choices = (product.options ?? []).flatMap((o) => o.values)
    .map((value) => ({ label: value, count: Number(/(\d+)[- ]seat(er)?\b/i.exec(value)?.[1] ?? 0) }))
    .filter((c) => c.count > 0)
  if (choices.length) return choices
  const said = /\bseats? (?:up to )?(\d+|two|three|four|five|six|seven|eight|ten)\b/i.exec(`${specOf(product, 'Seats') ? `seats ${specOf(product, 'Seats')}` : ''} ${product.description}`)
  const count = said ? Number(said[1]) || NUMBER_WORDS[said[1]!.toLowerCase()] || 0 : 0
  return count ? [{ label: '', count }] : []
}

const valueTopics: Partial<Record<Topic, { label: string; missing: (name: string) => string }>> = {
  materials: { label: 'Materials', missing: (name) => `I don’t have what the ${name} is made of.` },
  care: { label: 'Care', missing: (name) => `I don’t have care instructions for the ${name}.` },
  assembly: { label: 'Assembly', missing: (name) => `I don’t have assembly details for the ${name}.` },
  warranty: { label: 'Warranty', missing: (name) => `I don’t have a warranty listed for the ${name}.` },
}

function valueOf(product: AssistantProduct, topic: Topic): string | undefined {
  if (topic === 'warranty') return product.warranty?.replace(/\s*\n+\s*/g, ' ').trim() || undefined
  return specOf(product, valueTopics[topic]!.label)
}

/** One fact about a piece as a sentence, and whether the store lists it. */
function factFor(topic: Topic, product: AssistantProduct, style: Style, text: string): { said: string; known: boolean } {
  const name = product.name
  const cm = /\b(cm|centimet\w*|metric)\b/.test(text)
  const lead = (subject: string, pronoun: string): string => (style === 'first' ? subject : pronoun)
  switch (topic) {
    case 'size': {
      const sizes = sizesAsked(sizesOf(product), text)
      if (!sizes.length) return { said: `I don’t have the ${name}’s measurements.`, known: false }
      if (sizes.length === 1) {
        const size = sizes[0]!
        const piece = size.label ? `${name} in ${size.label}` : name
        if (style === 'line') return { said: `${size.label ? `${size.label}: ` : ''}${sidesText(size, cm)}.`, known: true }
        // The side asked about first, then the rest.
        const focus = /\b(wide|width|across)\b/.test(text) ? 'width' : /\b(deep(?!\s+clean)|depth)\b/.test(text) ? 'depth' : /\b(tall|high|height|how high)\b/.test(text) && !SEAT_HEIGHT.test(text) ? 'height' : null
        const side = focus ? size[focus] : undefined
        if (focus && side) {
          const word = focus === 'width' ? 'wide' : focus === 'depth' ? depthWord(size) : heightWord(size)
          const rest = sidesText(size, cm, [focus])
          return { said: `${lead(`The ${piece} is`, 'It’s')} ${sidePhrase(side, word, cm)}.${rest ? ` It’s ${rest}.` : ''}`, known: true }
        }
        return { said: `${lead(`The ${piece} is`, 'It’s')} ${sidesText(size, cm)}.`, known: true }
      }
      const each = sizes.map((size) => `${size.label}: ${sidesText(size, cm)}.`).join(' ')
      if (style === 'line') return { said: each, known: true }
      return { said: `${lead(`The ${name} comes`, 'It comes')} in ${COUNT_WORDS[sizes.length] ?? sizes.length} sizes. ${each}`, known: true }
    }
    case 'seat-height': {
      const value = specOf(product, 'Seat height')
      if (!value) return { said: `I don’t have the ${name}’s seat height.`, known: false }
      return { said: style === 'line' ? `seat ${value} high.` : `${lead(`The ${name}’s`, 'Its')} seat is ${value} high.`, known: true }
    }
    case 'weight': {
      const value = specOf(product, 'Weight')
      if (!value) return { said: `I don’t have the ${name}’s weight.`, known: false }
      return { said: style === 'line' ? `${sentence(value)}` : `${lead(`The ${name}`, 'It')} weighs ${value}.`, known: true }
    }
    case 'seats': {
      const counts = seatCounts(product)
      if (!counts.length) return { said: `I don’t have a seat count for the ${name}.`, known: false }
      // The piece's own name ("Arlo 3-Seat Sofa") is not a number asked.
      const asked = SEATS_ASKED.map((re) => re.exec(text.replace(product.name.toLowerCase(), ' '))?.[1]).find(Boolean)
      const wanted = asked ? Number(asked) || NUMBER_WORDS[asked] || 0 : 0
      const most = Math.max(...counts.map((c) => c.count))
      if (counts.length === 1 && !counts[0]!.label) {
        const count = counts[0]!.count
        if (style === 'line') return { said: `seats ${count}.`, known: true }
        if (wanted) return { said: `${wanted <= count ? 'Yes' : 'No'}, ${lead(`the ${name}`, 'it')} seats ${count}.`, known: true }
        return { said: `${lead(`The ${name}`, 'It')} seats ${count}.`, known: true }
      }
      if (style === 'line') return { said: `${listed(counts.map((c) => c.label))}.`, known: true }
      if (wanted) {
        const enough = counts.filter((c) => c.count >= wanted)
        return {
          said: enough.length
            ? `Yes, ${lead(`the ${name}`, 'it')} in ${enough[0]!.label} seats ${enough[0]!.count}.`
            : `No, ${lead(`the ${name}`, 'it')} seats up to ${most}.`,
          known: true,
        }
      }
      return { said: `${lead(`The ${name}`, 'It')} comes in ${listed(counts.map((c) => c.label))}.`, known: true }
    }
    case 'options': return choicesFact(product, style, text)
    default: {
      const value = valueOf(product, topic)
      const { label, missing } = valueTopics[topic]!
      if (!value) return { said: missing(name), known: false }
      if (style === 'first') return { said: `${verdict(topic, value, text)}${name}: ${sentence(value)}`, known: true }
      return { said: style === 'line' ? sentence(value) : `${label}: ${sentence(value)}`, known: true }
    }
  }
}

/** A question a yes or a no answers: "Is it…?", "Does it…?" */
const YES_NO = /^\s*(is|are|does|do|can|could|will|would|has|have)\b/

/**
 * What a piece comes in, and what it can be bought in now: a value the store has sold
 * out of says so ("Grey and Black (sold out right now)"). Asked whether it comes in, or
 * is in stock in, a value it has ("Is the Ergo chair available in black?"), the answer
 * says yes or no first. A piece the chat is handed can be bought, unless all of its
 * values are sold out.
 */
function choicesFact(product: AssistantProduct, style: Style, text: string): { said: string; known: boolean } {
  const name = product.name
  const stock = STOCK.test(text)
  const asksYesNo = style === 'first' && YES_NO.test(text)
  // "Yes, the Ergo Task Chair is …" (or "The Ergo Task Chair is …"), "It is …" after another fact, "In stock …" on a line after its name.
  const lead = (answer: 'Yes' | 'No' | null, rest: string): string => {
    if (style === 'line') return capital(rest.replace(/^is /, ''))
    if (style === 'more') return `It ${rest}`
    return answer && asksYesNo ? `${answer}, the ${name} ${rest}` : `The ${name} ${rest}`
  }
  const choices = (product.options ?? []).filter((o) => o.values.length > 1)
  if (!choices.length) return { said: stock ? `${lead('Yes', 'is in stock')}.` : `${style === 'first' ? `The ${name}` : 'It'} comes in one style.`, known: true }
  const out = new Set(choices.flatMap((o) => o.soldOut ?? []))
  const marked = (value: string): string => (out.has(value) ? `${value} (sold out right now)` : value)
  const soldOut = (some: string[]): string => `${listed(some)} ${some.length > 1 ? 'are' : 'is'} sold out right now`
  const values = choices.flatMap((o) => o.values)
  const inStock = values.filter((v) => !out.has(v))
  // The values the message names, not counting the words of the piece's own name.
  const said = ` ${withoutNames(text, [product]).replace(/[^a-z0-9]+/g, ' ')} `
  const asked = values.filter((v) => {
    const plain = v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    return plain.length >= 3 && said.includes(` ${plain} `)
  })
  const askedOut = asked.filter((v) => out.has(v))
  const askedIn = asked.filter((v) => !out.has(v))
  let answer: string
  if (askedOut.length && !askedIn.length) {
    const head = style === 'first' ? `${asksYesNo ? 'No, the' : 'The'} ${name} in ${soldOut(askedOut)}` : capital(soldOut(askedOut))
    answer = `${head}.${inStock.length ? ` It’s in stock in ${listed(inStock)}.` : ''}`
  } else if (askedOut.length) {
    answer = `${lead(null, `is in stock in ${listed(askedIn)}`)}; ${soldOut(askedOut)}.`
  } else if (askedIn.length && stock) {
    answer = `${lead('Yes', `is in stock in ${listed(askedIn)}`)}.`
  } else if (askedIn.length) {
    const others = values.filter((v) => !askedIn.includes(v)).map(marked)
    answer = `${lead('Yes', `comes in ${listed(askedIn)}`)}.${others.length && style === 'first' ? ` It also comes in ${listed(others)}.` : ''}`
  } else if (stock) {
    const sold = values.filter((v) => out.has(v))
    answer = inStock.length
      ? `${lead('Yes', `is in stock in ${listed(inStock)}`)}${sold.length ? `; ${soldOut(sold)}` : ''}.`
      : `${lead('No', 'is sold out right now')}.`
  } else {
    const all = choices.map((o) => listed(o.values.map(marked))).join(', and in ')
    answer = style === 'line' ? `${all}.` : `${style === 'first' ? `The ${name}` : 'It'} comes in ${all}.`
  }
  return { said: answer, known: true }
}

/** A yes or a no before an answer that settles the question asked: "Does it need assembly?" "No." */
function verdict(topic: Topic, value: string, text: string): string {
  // "How do I set it up?" is not a yes-or-no question.
  if (topic === 'assembly' && !/\bhow\b/.test(text)) {
    const assembled = /\b(arrives?|comes?|delivered) (fully )?assembled\b|\bno assembly\b|\bready to use\b/i.test(value)
    const work = /\bassembly (is )?(required|needed)\b|\b(attach|screw|bolt)\w*\b|\btools?\b/i.test(value)
    if (/\b(need|needs|require\w*|have to|has to)\b[^.?!]*\b(assembl\w*|put (it |them )?together|set ?up)\b/.test(text)) return assembled ? 'No. ' : work ? 'Yes. ' : ''
    if (/\b(come|comes|arrive|arrives)( fully)? assembled\b/.test(text)) return assembled ? 'Yes. ' : work ? 'No. ' : ''
  }
  // "Is the vase trio dishwasher safe?", "Can I put it in the dishwasher?"
  if (topic === 'care' && YES_NO.test(text) && /\bdishwasher/.test(text)) {
    if (/\b(not|never|no)\b[^.]*\bdishwasher|\bhand[- ]wash/i.test(value)) return 'No. '
    if (/\bdishwasher[- ]safe\b/i.test(value)) return 'Yes. '
  }
  if (topic === 'care' && /\b(can|could|should|is it (ok|okay|safe))\b[^?]*\b(wash|machine)/.test(text)) {
    if (/\b(do not|don't|don’t|never) (machine )?wash\b|\bdry clean only\b|\bspot clean only\b/i.test(value)) return 'No. '
    if (/\bmachine wash\w*\b/i.test(value)) return 'Yes. '
    if (/\bmachine\b/.test(text) && /\bhand[- ]wash/i.test(value)) return 'No. '
  }
  return ''
}

/** The store's own page on a subject, from its knowledge: "Read: Care guide". */
function pageLink(entries: Array<PreviewEntry & { url?: string }>, about: RegExp): { label: string; href: string } | undefined {
  const page = entries.find((e) => e.url && about.test(e.title)) ?? entries.find((e) => e.url && about.test(e.text))
  return page ? { label: `Read: ${page.title}`, href: page.url! } : undefined
}

/** The link a facts answer carries: a way to ask when something is missing, else the store's page on it. */
function factsLink(topics: Topic[], known: boolean, ctx: AssistantContext) {
  if (!known) return { link: contact(ctx) }
  const link = topics.includes('warranty') ? pageLink(ctx.entries, /\bwarrant/i)
    : topics.some((t) => t === 'materials' || t === 'care') ? pageLink(ctx.entries, /\bcar(e|ing)\b/i)
      : undefined
  return link ? { link } : {}
}

/** Facts about the piece in question, or about the few pieces the message names. */
function factsAnswer(topics: Topic[], text: string, product: AssistantProduct | undefined, named: AssistantProduct[], ctx: AssistantContext, home: HomeKnowledge, message: string): HomeTurn | null {
  const topic = TOPIC_NAMES[topics[0]!]
  if (product) {
    const facts = topics.map((t, i) => factFor(t, product, i === 0 ? 'first' : 'more', text))
    const known = facts.every((f) => f.known)
    const said = facts.map((f) => f.said).join(' ')
    return {
      replies: [{ kind: 'text', topic, text: known ? said : `${said} ${home.unknown}`, ...factsLink(topics, known, ctx) }],
      productId: product.id,
    }
  }
  if (named.length > 1 && named.length <= 3) {
    // Each piece on its own line; pieces whose facts are the same share one ("… and …: 5-year frame warranty.").
    const lines = new Map<string, AssistantProduct[]>()
    let known = true
    for (const piece of named) {
      const facts = topics.map((t) => ({ t, ...factFor(t, piece, 'line', text) }))
      known &&= facts.every((f) => f.known)
      // With more than one thing asked, each value says what it is ("Care: …").
      const line = facts
        .filter((f) => f.known)
        .map((f) => (topics.length > 1 && valueTopics[f.t] ? `${valueTopics[f.t]!.label}: ${f.said}` : f.said))
        .join(' ')
      if (line) lines.set(line, [...(lines.get(line) ?? []), piece])
    }
    const said = [...lines].map(([line, pieces]) => `${listed(pieces.map((p) => p.name))}: ${capital(line)}`).join(' ')
    if (!said) return { replies: [{ kind: 'text', topic, text: `I don’t have that for the ${listed(named.map((p) => p.name))}. ${home.unknown}`, link: contact(ctx) }] }
    return { replies: [{ kind: 'text', topic, text: said, ...factsLink(topics, known, ctx) }] }
  }
  // Which piece? Asked only for what a piece's own page answers.
  if (named.length > 3 || topics.some((t) => t === 'size' || t === 'seat-height' || t === 'weight' || t === 'seats')) {
    return { replies: [{ kind: 'text', topic, text: home.askPiece }], asked: message }
  }
  // Care, assembly or a warranty in general: the store's own page on it ("Caring for wood, fabric and rugs").
  const about = topics.includes('care') ? /\bcar(e|ing)\b/i : topics.includes('assembly') ? /\bassembl/i : topics.includes('warranty') ? /\bwarrant/i : null
  const page = about ? ctx.entries.find((e) => about.test(e.title)) : undefined
  if (page) {
    const url = (page as PreviewEntry & { url?: string }).url
    return { replies: [{ kind: 'answer', text: page.text, source: page.source, ...(url ? { link: { label: `Read: ${page.title}`, href: url } } : {}) }] }
  }
  return null
}

// ── Does it fit ──────────────────────────────────────────────────────────────

interface Check {
  space: Space
  /** True or false; null when the store doesn't list the side it needs. */
  ok: boolean | null
  side?: Side
  /** "wide", "deep", "high": what the side is. */
  word: string
  /** A room's check: the piece's width and depth. */
  floor?: [Side, Side]
}

/** A piece in one size against one measurement of the space. */
function check(size: PieceSize, space: Space): Check {
  // An adjustable side fits when its least does; the answer says it has to be set to fit.
  // A side whose note adds another length ("12 in shade, on a 60 in cord") can't be checked on its own.
  const against = (side: Side | undefined, word: string): Check => ({
    space,
    ok: side && !/\d/.test(side.note ?? '') ? (side.least ?? side.inches) <= space.inches + 0.05 : null,
    ...(side ? { side } : {}),
    word,
  })
  switch (space.kind) {
    case 'depth': return against(size.depth, depthWord(size))
    case 'height': return against(size.height, heightWord(size))
    case 'length': {
      const longer = [size.width, size.depth].filter((s): s is Side => !!s).sort((a, b) => b.inches - a.inches)[0]
      return against(longer, 'long')
    }
    case 'opening': {
      const smallest = smallestSide(size)
      return smallest ? against(smallest.side, smallest.word) : { space, ok: null, word: 'smallest side' }
    }
    case 'room': {
      if (!size.width || !size.depth) return { space, ok: null, word: 'wide and deep' }
      const [w, d, a, b] = [size.width.inches, size.depth.inches, space.inches, space.other ?? space.inches]
      return { space, ok: (w <= a && d <= b) || (w <= b && d <= a), word: '', floor: [size.width, size.depth] }
    }
    default: return against(size.width, 'wide')
  }
}

const spaceNoun = (space: Space): string => space.noun && space.noun !== 'room' ? space.noun : 'space'
const by = (c: Check): number => Math.abs(c.space.inches - (c.side?.inches ?? 0))

/** One check as a sentence: "It’s 84 in wide, 6 in less than your 90 in wall." */
function checkSentence(c: Check, size: PieceSize): string {
  const space = c.space
  if (c.ok === null && c.side) return `It’s ${sidePhrase(c.side, c.word, false)}, so I can’t check it against your ${space.said} ${spaceNoun(space)} from that alone.`
  if (c.ok === null) {
    const missing = { width: 'width', any: 'width', depth: 'depth', height: 'height', length: 'length', opening: 'measurements', room: 'width and depth' }[space.kind]
    return `I don’t have its ${missing}, so I can’t check your ${space.said} ${space.kind === 'room' ? 'room' : spaceNoun(space)}.`
  }
  if (space.kind === 'room') {
    const [w, d] = c.floor!
    return `At ${w.text} wide and ${d.text} ${depthWord(size)}, it ${c.ok ? 'fits' : 'won’t fit'} ${withArticle(space.said)} room.`
  }
  const diff = fmt(by(c))
  if (space.kind === 'opening') {
    const through = space.noun ?? 'doorway'
    if (!c.ok) return `Even its smallest side, ${sidePhrase(c.side!, c.word, false)}, is ${diff} in more than your ${space.said} ${through}.`
    return by(c) < 0.05
      ? `Its smallest side, ${sidePhrase(c.side!, c.word, false)}, is exactly your ${space.said} ${through}, with nothing to spare.`
      : `Its smallest side, ${sidePhrase(c.side!, c.word, false)}, is ${diff} in less than your ${space.said} ${through}.`
  }
  // A rug under a table or a bed: it lies flat, so the height left over says nothing.
  if (c.ok && c.word === 'thick') return `It lies flat, at ${sidePhrase(c.side!, c.word, false)}.`
  const least = c.side!.least
  if (least !== undefined && !c.ok) return `It’s ${sidePhrase(c.side!, c.word, false)}: even at ${fmt(least)} in, it’s ${fmt(least - space.inches)} in more than your ${space.said} ${spaceNoun(space)}.`
  if (least !== undefined && c.side!.inches > space.inches) return `It’s ${sidePhrase(c.side!, c.word, false)}, so it fits your ${space.said} ${spaceNoun(space)} when set to ${fmt(space.inches)} in or less.`
  if (!c.ok) return `It’s ${sidePhrase(c.side!, c.word, false)}, ${diff} in more than your ${space.said} ${spaceNoun(space)}.`
  return by(c) < 0.05
    ? `It’s ${sidePhrase(c.side!, c.word, false)}, exactly your ${space.said} ${spaceNoun(space)}, with nothing to spare.`
    : `It’s ${sidePhrase(c.side!, c.word, false)}, ${diff} in less than your ${space.said} ${spaceNoun(space)}.`
}

/** One check in a list of sizes: "72 in wide (18 in to spare)", "96 in wide (6 in too wide)". */
function checkShort(c: Check): string {
  if (c.ok === null) return 'measurements not listed'
  if (c.space.kind === 'room') return `${c.floor![0].text} × ${c.floor![1].text}${c.ok ? '' : ', too big for the room'}`
  const what = c.space.kind === 'opening' ? `smallest side ${c.side!.text}` : `${sidePhrase(c.side!, c.word, false)}`
  const too = c.space.kind === 'opening' ? 'big' : c.word
  if (c.ok && c.side!.inches > c.space.inches) return `${what} (fits when set to ${fmt(c.space.inches)} in or less)`
  if (!c.ok && c.side!.least !== undefined) return `${what} (${fmt(c.side!.least - c.space.inches)} in too ${too} at its least)`
  if (c.ok && c.word === 'thick' && c.space.kind !== 'opening') return `${what} (lies flat)`
  return `${what} (${c.ok ? (by(c) < 0.05 ? 'nothing to spare' : `${fmt(by(c))} in to spare`) : `${fmt(by(c))} in too ${too}`})`
}

const verdictOf = (checks: Check[]): boolean | null => (checks.some((c) => c.ok === false) ? false : checks.every((c) => c.ok) ? true : null)

type Arrives = 'rolled' | 'in parts'

/**
 * How a piece arrives when it is put together in the room, from its Assembly spec: rolled
 * (a rug), or in parts (two people, tools, putting it together). A doorway or stairs
 * never have to take its assembled size. Null for a piece that arrives whole, legs or
 * arms aside ("Arrives assembled; screw on the four legs"): its sides are checked.
 */
function arrivesAs(product: AssistantProduct): Arrives | null {
  const value = specOf(product, 'Assembly') ?? ''
  if (/\b(arrives?|comes?) rolled\b|\brolled up\b/i.test(value)) return 'rolled'
  return /\b(two people|tools? included|no tools|assembly (is )?required|flat[- ]?pack\w*|(arrives?|comes?) (flat|in (parts|pieces|boxes))|together)\b/i.test(value) ? 'in parts' : null
}

/** A doorway or stairs, for a piece that arrives in parts or rolled: they never take it whole. */
function throughReply(product: AssistantProduct, how: Arrives, openings: Space[], ctx: AssistantContext): AssistantReply {
  const routes = openings.map((s) => `${/^stair/.test(s.noun ?? '') ? 'up' : 'through'} your ${s.said} ${s.noun ?? 'doorway'}`)
  const where = routes.length ? listed(routes) : 'through a doorway or up the stairs'
  // "Assembly required: about 45 minutes…" is said "Assembly: About 45 minutes…".
  const assembly = capital(specOf(product, 'Assembly')?.replace(/^assembly (is )?required\s*[:;,.]?\s*/i, '') ?? '')
  const link = how === 'in parts' ? pageLink(ctx.entries, /\bassembl/i) : undefined
  const text = how === 'rolled'
    ? `The ${product.name} arrives rolled, so its full size doesn’t have to go ${where}.`
    : `The ${product.name} arrives in parts and is put together in the room, so its assembled size doesn’t have to go ${where}.${assembly ? ` Assembly: ${sentence(assembly)}` : ''}`
  return { kind: 'text', topic: 'Size and fit', text, ...(link ? { link } : {}) }
}

/** Whether one piece fits the space, size by size, saying each side it compared. */
function fitOne(product: AssistantProduct, given: Space[], text: string, ctx: AssistantContext, home: HomeKnowledge): HomeTurn {
  // A piece that arrives in parts or rolled is never checked against a doorway or stairs: it says so instead.
  const how = arrivesAs(product)
  const openings = how ? given.filter((s) => s.kind === 'opening') : []
  const through = openings.length ? throughReply(product, how!, openings, ctx) : null
  const spaces = through ? given.filter((s) => s.kind !== 'opening') : given
  if (through && !spaces.length) return { replies: [through], productId: product.id }
  const sizes = sizesAsked(sizesOf(product), text)
  const reply = (said: string, known = true): HomeTurn => ({
    replies: [
      { kind: 'text', topic: 'Size and fit', text: known ? said : `${said} ${home.unknown}`, ...(known ? {} : { link: contact(ctx) }) },
      ...(through ? [through] : []),
    ],
    productId: product.id,
  })
  if (!sizes.length) return reply(`I don’t have the ${product.name}’s measurements, so I can’t check your space.`, false)
  if (sizes.length === 1) {
    const size = sizes[0]!
    const piece = size.label ? `${product.name} in ${size.label}` : product.name
    const checks = spaces.map((space) => check(size, space))
    const result = verdictOf(checks)
    const lead = result === true ? `Yes, the ${piece} fits.` : result === false ? `No, the ${piece} won’t fit.` : `Here’s what I can check for the ${piece}.`
    // The sides it wasn't checked on, so the shopper can measure those too.
    // A room is a floor, and a door takes every side: nothing more to measure then.
    const compared = new Set(spaces.flatMap((s) => (s.kind === 'opening' || s.kind === 'room' ? ['width', 'depth', 'height'] : s.kind === 'length' ? ['width', 'depth'] : s.kind === 'any' ? ['width'] : [s.kind])))
    const others = result === true ? sidesText(size, false, [...compared] as Array<keyof PieceSize>) : ''
    const also = others ? `It’s also ${others}, so check ${others.includes(' and ') ? 'those' : 'that'} too.` : ''
    const said = [lead, ...checks.map((c) => checkSentence(c, size)), also].filter(Boolean).join(' ')
    return reply(said, checks.every((c) => c.ok !== null))
  }
  const results = sizes.map((size) => ({ size, checks: spaces.map((space) => check(size, space)) }))
  const fits = results.filter((r) => verdictOf(r.checks) === true).map((r) => r.size.label)
  const fails = results.filter((r) => verdictOf(r.checks) === false).map((r) => r.size.label)
  const lead = fits.length === results.length ? `Yes, the ${product.name} fits in every size.`
    : fails.length === results.length ? `No, the ${product.name} won’t fit in any size.`
      : fits.length && fails.length ? `The ${product.name} fits in ${listed(fits)}, not in ${listed(fails)}.`
        : `Here’s what I can check for the ${product.name}.`
  const each = results.map((r) => `${r.size.label}: ${r.checks.map(checkShort).join(' and ')}.`)
  return reply([lead, ...each].join(' '), results.every((r) => r.checks.every((c) => c.ok !== null)))
}

/** "a 90 in wall", "a space 90 in wide and 40 in deep", "a 10 × 12 ft (120 × 144 in) room", "through a 30 in doorway" */
function spaceText(spaces: Space[]): string {
  const sides = spaces.filter((s) => s.kind !== 'room' && s.kind !== 'opening')
  const parts: string[] = []
  const one = sides.length === 1 ? sides[0]! : null
  if (one && one.noun && one.noun !== 'room' && one.noun !== 'space' && (one.kind === 'width' || one.kind === 'any')) parts.push(`${withArticle(one.said)} ${one.noun}`)
  else if (one && one.kind === 'height' && one.noun) parts.push(`under ${withArticle(one.said)} ${one.noun}`)
  else if (sides.length) parts.push(`a space ${listed(sides.map((s) => `${s.said} ${s.kind === 'any' ? 'across' : s.kind === 'width' ? 'wide' : s.kind === 'depth' ? 'deep' : s.kind === 'height' ? 'high' : 'long'}`))}`)
  for (const room of spaces.filter((s) => s.kind === 'room')) parts.push(`${withArticle(room.said)} room`)
  for (const opening of spaces.filter((s) => s.kind === 'opening')) parts.push(`through ${withArticle(opening.said)} ${opening.noun ?? 'doorway'}`)
  return listed(parts)
}

/** Which of several pieces fit the space: the ones that do as cards, and a line on the ones that don't. */
function fitMany(candidates: AssistantProduct[], spaces: Space[], text: string, ctx: AssistantContext): HomeTurn {
  const fits: AssistantProduct[] = []
  const fails: string[] = []
  const unknown: string[] = []
  const through: AssistantReply[] = []
  for (const product of candidates) {
    // A piece that arrives in parts or rolled is checked only against the space it goes in, never a doorway.
    const how = arrivesAs(product)
    const against = how ? spaces.filter((s) => s.kind !== 'opening') : spaces
    if (!against.length) { through.push(throughReply(product, how!, spaces, ctx)); continue }
    const results = sizesAsked(sizesOf(product), text).map((size) => against.map((space) => check(size, space)))
    if (!results.length) { unknown.push(product.name); continue }
    const verdicts = results.map(verdictOf)
    if (verdicts.includes(true)) fits.push(product)
    else if (verdicts.every((v) => v === false)) {
      const failed = results[0]!.find((c) => c.ok === false)!
      fails.push(`the ${product.name} (${failed.space.kind === 'room' ? `${failed.floor![0].text} × ${failed.floor![1].text}` : `${sidePhrase(failed.side!, failed.word, false)}`})`)
    } else unknown.push(product.name)
  }
  const where = spaceText(spaces)
  const replies: AssistantReply[] = []
  const shown = fits.slice(0, 3)
  if (shown.length) {
    const lead = `${shown.length === 1 ? 'This fits' : 'These fit'} ${where}:`
    replies.push(ctx.shoppingEnabled
      ? { kind: 'products', text: lead, productIds: shown.map((p) => p.id) }
      : { kind: 'text', topic: 'Size and fit', text: `${lead.slice(0, -1)}: ${listed(shown.map((p) => `the ${p.name}`))}.` })
  }
  if (fails.length) {
    const list = listed(fails.slice(0, 3))
    replies.push({ kind: 'text', topic: 'Size and fit', text: shown.length ? `${capital(list)} ${fails.length === 1 ? 'doesn’t' : 'don’t'}.` : `None of them fit ${where}: ${list}.` })
  }
  if (unknown.length && !shown.length && !fails.length) {
    replies.push({ kind: 'text', topic: 'Size and fit', text: `I don’t have the measurements of the ${listed(unknown.slice(0, 3))}. Write to us and we’ll find out for you.`, link: contact(ctx) })
  }
  replies.push(...through.slice(0, 3))
  return { replies }
}

/** The pieces a room asks for ("my living room"): those the room's words name best. */
function inRoom(means: string[], products: AssistantProduct[]): AssistantProduct[] {
  const scored = products
    .map((product, index) => ({ product, index, score: mentions(means, product.name) * 3 + mentions(means, product.collections.join(' ')) * 2 + mentions(means, product.description) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
  const best = scored[0]?.score ?? 0
  return scored.filter((p) => p.score * 2 >= best).map((p) => p.product)
}

/** Whether a piece fits: against the space the message gives, or a question back for it. */
function fitAnswer(text: string, spaces: Space[], product: AssistantProduct | undefined, named: AssistantProduct[], ctx: AssistantContext, profile: AssistantProfile, message: string): HomeTurn {
  const home = profile.home!
  const unclear = spaces.find((s) => s.unclear)
  if (unclear) {
    const n = unclear.said.replace(/ in$/, '')
    return { replies: [{ kind: 'text', topic: 'Size and fit', text: `Is that ${n} ft or ${n} in? Tell me again with the unit, like ${n} ft, and I’ll check it.` }], ...(product ? { productId: product.id } : {}) }
  }
  if (product && spaces.length) return fitOne(product, spaces, text, ctx, home)
  if (product) {
    // No space given: the piece's own size, and a question back.
    const size = sizesAsked(sizesOf(product), text)
    if (!size.length) return { replies: [{ kind: 'text', topic: 'Size and fit', text: `I don’t have the ${product.name}’s measurements. ${home.unknown}`, link: contact(ctx) }], productId: product.id }
    // The measurement the shopper gives next answers this question.
    if (OPENING_WORDS.test(text)) {
      // A piece that arrives in parts or rolled needs no doorway's width.
      const how = arrivesAs(product)
      if (how) return { replies: [throughReply(product, how, [], ctx)], productId: product.id }
      const smallest = size.length === 1 ? smallestSide(size[0]!) : null
      const lead = smallest ? `The ${product.name}’s smallest side is ${sidePhrase(smallest.side, smallest.word, false)}.` : factFor('size', product, 'first', text).said
      return { replies: [{ kind: 'text', topic: 'Size and fit', text: `${lead} ${home.askOpening}` }], productId: product.id, asked: message }
    }
    return { replies: [{ kind: 'text', topic: 'Size and fit', text: `${factFor('size', product, 'first', text).said} ${home.askSpace}` }], productId: product.id, asked: message }
  }
  // Several pieces, or the pieces for a room: those that fit.
  const rooms = profile.needs.filter((need) => !need.smallest && need.says.test(text))
  const candidates = named.length > 1 ? named : rooms.length ? inRoom(rooms.flatMap((need) => need.means), ctx.products) : []
  if (candidates.length && spaces.length) {
    const many = fitMany(candidates, spaces, text, ctx)
    if (many.replies.length) return many
  }
  if (candidates.length > 1 && !spaces.length) {
    return { replies: [{ kind: 'text', topic: 'Size and fit', text: home.askSpace }], asked: message }
  }
  return { replies: [{ kind: 'text', topic: 'Size and fit', text: home.askPiece }], asked: message }
}

// ── Delivery ─────────────────────────────────────────────────────────────────

/**
 * Delivery, from the store's own pages: the one that answers best, then, for a
 * service they don't mention (carrying it upstairs, a time slot), a line that it
 * can't be promised. Null when the store has no page on delivery, or something
 * arrived damaged: its other pages answer that.
 */
function deliveryAnswer(text: string, asked: string, ctx: AssistantContext, home: HomeKnowledge): AssistantReply[] | null {
  if (DAMAGED.test(text)) return null
  const pages = ctx.entries.filter((e) => /\b(deliver\w*|shipping|ships?)\b/i.test(`${e.title} ${e.text}`))
  const services = home.services.filter((s) => s.says.test(text))
  const covered = services.filter((s) => ctx.entries.some((e) => s.covered.test(e.text)))
  // "Do you assemble?": the store's own page on assembly, not its delivery times.
  const assembly = services.length > 0 && services.every((s) => s.assembly)
  // A page that mentions the service asked about answers first; else the delivery page that fits the question best.
  const page = covered.length
    ? ctx.entries.find((e) => covered[0]!.covered.test(e.text))!
    : assembly
      ? ctx.entries.find((e) => /\bassembl/i.test(e.title)) ?? ctx.entries.find((e) => /\bassembl/i.test(e.text))
      : bestEntry(`${asked} delivery`, pages)
  const replies: AssistantReply[] = []
  if (page) {
    const url = (page as PreviewEntry & { url?: string }).url
    replies.push({ kind: 'answer', text: page.text, source: page.source, ...(url ? { link: { label: `Read: ${page.title}`, href: url } } : {}) })
  }
  const missing = services.filter((s) => !covered.includes(s))
  if (missing.length) {
    replies.push({
      kind: 'text',
      topic: 'Delivery',
      text: `Our delivery details don’t mention ${listed(missing.map((s) => s.label))}, so I can’t promise ${missing.length === 1 ? 'it' : 'them'}. Write to us before you order and we’ll tell you what’s possible.`,
      link: contact(ctx),
    })
  }
  return replies.length ? replies : null
}

// ── The answer ───────────────────────────────────────────────────────────────

/**
 * A furniture and home store's answer to a message, or null when it is about
 * something else (a suggestion, an order, the store's other pages). `policy`: the
 * message also reads as a question for the store's pages (returns, shipping cost,
 * a guarantee), so only a fact about a piece or a delivery service is answered here.
 */
export function homeAnswer(message: string, ctx: AssistantContext, state: AssistantState, profile: AssistantProfile, policy = false): HomeTurn | null {
  const home = profile.home!
  const text = readMessage(message, home)
  const { product, named } = subjectOf(text, ctx, state.productId)
  // The question without the pieces' names; "set up" and "seat height" stay, though "set" and "seat" are in names.
  const asked = `${withoutNames(text, named)} ${(text.match(NOT_A_PIECE) ?? []).join(' ')}`
  const topics = topicsIn(text, asked, named.length > 0)
  const own = product ? sizesOf(product).map((s) => s.label) : []
  // "Is the table 72 inches wide?" asks about the piece: the length is its, not a space.
  const spaces = /^\s*(is|are)\b/.test(text) && !FIT.test(asked) ? [] : spacesIn(text, own)

  // ── The answer to a question back ("Which piece is it for?", "How wide is the doorway?") answers the question that was waiting ──
  if (state.asked && (named.length || spaces.length) && !topics.length && !FIT.test(asked)) {
    const answer = homeAnswer(`${state.asked} ${message}`, ctx, { ...state, asked: undefined }, profile, policy)
    if (answer) return answer
  }

  const seats = SEATS.test(text)
  const fitAsked = (FIT.test(asked) && !seats) || spaces.length > 0
  const services = home.services.filter((s) => s.says.test(text))
  const deliveryAsked = DELIVERY.test(asked) || services.length > 0
  if (policy && !services.length && !(topics.length && (product || named.length))) return null
  if (!fitAsked && !topics.length && !deliveryAsked) return null

  const parts: HomeTurn[] = []
  if (fitAsked) parts.push(fitAnswer(text, spaces, product, named, ctx, profile, message))
  // A fit answer already gives the size; assembling it for you is a delivery service, said below.
  const shown = topics.filter((t) => !(fitAsked && t === 'size') && !(t === 'assembly' && services.some((s) => s.assembly)))
  if (shown.length) {
    const facts = factsAnswer(shown, text, product, named, ctx, home, message)
    if (facts) parts.push(facts)
  }
  if (deliveryAsked) {
    const delivery = deliveryAnswer(text, asked, ctx, home)
    if (delivery) parts.push({ replies: delivery })
  }
  if (!parts.length) return null
  // One "Which piece?" is enough.
  const replies = parts.flatMap((p) => p.replies).filter((r, i, all) => all.findIndex((o) => o.text === r.text) === i)
  const productId = parts.find((p) => p.productId)?.productId ?? product?.id
  const waiting = parts.find((p) => p.asked)?.asked
  return { replies, ...(productId ? { productId } : {}), ...(waiting ? { asked: waiting } : {}) }
}

// ── Suggestions ──────────────────────────────────────────────────────────────

/** The most a shopper wants to spend: "under $1,500", "budget of 800", "$500 or less", "under 2k". */
const PRICE = /\b(?:under|below|less than|up to|max(?:imum)?|no more than|within|budget(?: is| of)?|at most|cheaper than)\s*\$?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?![\d.,])\s*(k\b)?(?!\s*(?:in\b|inch|"|''|ft\b|feet|foot|'|cm\b|mm\b|m\b|wide|deep|tall|high|long|lbs?\b|pounds|kg|people|persons|seats?|%))|\$\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?![\d.,])\s*(k\b)?\s*(?:or less|or under|max|and under|tops)\b/

/** Words of a request that say nothing about what to suggest ("anything under $500?"), as `keywords` stems them. */
const FILLER = new Set(['anyth', 'someth', 'thing', 'under', 'below', 'les', 'than', 'budget', 'cheap', 'cheaper', 'max', 'price', 'dollar', 'show', 'see', 'suggest', 'recommend', 'recommendation', 'look', 'pick', 'help', 'choose', 'find', 'sell', 'best', 'good', 'nice', 'piec', 'item', 'product', 'furniture'])

function homePrice(text: string): { max: number; phrase: string } | null {
  const m = PRICE.exec(text)
  if (!m) return null
  const max = Number((m[1] ?? m[3])!.replace(/,/g, '')) * ((m[2] ?? m[4]) ? 1000 : 1)
  return { max, phrase: `under $${max.toLocaleString('en-US')}` }
}

/**
 * Pieces for what the shopper asks: the pieces it names ("a sofa"), kept to the
 * rooms it names; else the pieces for those rooms; for a small space, the ones that
 * take the least floor; under a price when it gives one. `wanted`: the message asks
 * for a suggestion (storeAssistant.ts decides), so its own words are tried too.
 * Null when there is nothing to suggest.
 */
export function homeSuggestion(message: string, ctx: AssistantContext, profile: AssistantProfile, wanted: boolean): AssistantReply | null {
  const home = profile.home!
  const text = readMessage(message, home)
  const price = homePrice(text)
  const found = piecesNamed(text, ctx.products)
  const pieces = found.strong ? found.products : []
  // A room said only as part of a piece's name ("the dining table") is not a room asked for.
  const needs = profile.needs.filter((need) => need.says.test(withoutNames(text, pieces)))
  // A colour or finish the store's pieces come in ("anything in walnut?").
  const choice = pieces.length || needs.length || !(wanted || LOOKING.test(text)) ? null : choiceAsked(text, ctx.products)
  if (!wanted && !price && !pieces.length && !choice) return null

  const rooms = needs.filter((need) => !need.smallest)
  const small = needs.find((need) => need.smallest)
  let pool: AssistantProduct[] = pieces
  if (rooms.length) {
    const means = rooms.flatMap((need) => need.means)
    // Pieces named for a room keep to that room's collection ("a sofa for the living room" is not the outdoor one).
    pool = pieces.length ? pieces.filter((p) => mentions(means, p.collections.join(' ')) > 0) : inRoom(means, ctx.products)
    // Two needs ("lighting for the dining room"): the pieces that answer both, when there are any.
    const both = rooms.length > 1 ? pool.filter((p) => rooms.every((need) => mentions(need.means, `${p.name} ${p.collections.join(' ')}`) > 0)) : []
    if (both.length) pool = both
    if (!pool.length) pool = pieces
  }
  if (small) {
    if (!pool.length) {
      // Pieces made for small spaces, then the pieces of furniture that take the least floor (not the vases).
      const said = inRoom(small.means, ctx.products)
      const furniture = ctx.products.filter((p) => (footprint(p) ?? 0) >= 200 && !said.includes(p))
      pool = [...said, ...furniture.sort((a, b) => footprint(a)! - footprint(b)!)]
    } else {
      pool = [...pool].sort((a, b) => (footprint(a) ?? Infinity) - (footprint(b) ?? Infinity))
    }
  }
  if (!pool.length && choice) pool = choice.products
  if (!pool.length && !needs.length) {
    // Nothing named and no room: the words it uses, else (for a price alone) the store's own order.
    const words = keywords(price ? text.replace(PRICE, ' ') : text).filter((t) => !/^\d/.test(t) && !FILLER.has(t))
    const ranked = words.length ? inRoom(words, ctx.products) : []
    pool = ranked.length ? ranked : price ? ctx.products : []
  }
  if (!pool.length) return null

  const affordable = price ? pool.filter((p) => p.price === undefined || p.price <= price.max) : pool
  const ids = affordable.slice(0, 3).map((p) => p.id)
  if (!ids.length) {
    const cheapest = [...pool].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)).slice(0, 3).map((p) => p.id)
    return { kind: 'products', text: `Nothing ${price!.phrase} fits that. These come closest:`, productIds: cheapest }
  }
  const lead = ids.length === 1 ? profile.suggestionLead.one : profile.suggestionLead.many
  let said: string
  if (needs.length) said = `For ${listed(needs.map((need) => need.label))}${price ? ` ${price.phrase}` : ''}, ${lead}:`
  else if (price) said = `${capital(price.phrase)}, ${lead}:`
  else if (choice && pool === choice.products) said = `${ids.length === 1 ? 'This comes' : 'These come'} in ${choice.value}:`
  // One piece asked about: its description answers, unless it's the price, which its card shows.
  else if (pieces.length === 1 && QUESTION.test(text.trim()) && !PRICE_ASKED.test(text) && pieces[0]!.description) said = `${pieces[0]!.name}: ${sentence(pieces[0]!.description)}`
  else if (pieces.length) said = ids.length === 1 ? 'Here it is:' : 'Here’s what we have:'
  else said = 'These look like the closest match:'
  return { kind: 'products', text: said, productIds: ids }
}

/** Asks to see pieces: "anything in walnut?", "do you have …", "show me …". */
const LOOKING = /\b(anything|something|do you (have|sell|carry|make)|have you got|got any|show me|any)\b/

/** Asks what a piece costs. */
const PRICE_ASKED = /\b(how much (is|are|does .* cost|do .* cost)|price|prices|cost|costs)\b/

/** A colour or finish the message names that some of the store's pieces come in now, and those pieces (not the ones sold out in it). */
function choiceAsked(text: string, products: AssistantProduct[]): { value: string; products: AssistantProduct[] } | null {
  const said = ` ${text.replace(/[^a-z0-9]+/g, ' ')} `
  for (const product of products) {
    for (const value of (product.options ?? []).flatMap((o) => o.values)) {
      const plain = value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (plain.length < 3 || /\d/.test(plain) || !said.includes(` ${plain} `)) continue
      const having = products.filter((p) => (p.options ?? []).some((o) => o.values.some((v) => v.toLowerCase() === value.toLowerCase() && !(o.soldOut ?? []).includes(v))))
      if (having.length) return { value: plain, products: having }
    }
  }
  return null
}
