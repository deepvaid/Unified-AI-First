/**
 * An auto parts store's answers: whether a part fits a vehicle, a part found by
 * its part number, the parts of a kind that fit a vehicle, and setting the
 * shopper's vehicle for the store. Everything is read from the store's own data,
 * which the chat widget hands in with the products: each part's fitment rows, and
 * its variants' part numbers, prices and stock. storeAssistant.ts asks here when
 * the store's assistant profile has `parts` (assistantProfiles.ts); no other store
 * reaches this file.
 *
 * It never guesses. A vehicle the store's table doesn't list is answered with the
 * vehicles it does. The store's vehicle changes only when the shopper asks for it
 * or says yes to the assistant's offer, and the reply says so ("Showing parts for
 * your 2019 Ford F-150."). Brake, steering, suspension and airbag work, and
 * handling fluids and batteries, get a careful answer instead of a product.
 *
 * Pure, with relative `.ts` imports only (types from storeAssistant.ts, so there
 * is no import cycle at run time), so `npm run test:chatbot` runs it in Node.
 */

import { fitState as fitStateOf, fittingRows as fittingRowsOf, fitsVehicle, lineVehicle, parseVehicle, variantFitState, vehicleLabel, yearsOf } from '../storefront/fitment.ts'
import type { FitVariant, FitmentRow, FitState, VariantFitmentProduct, Vehicle } from '../storefront/fitment.ts'
import { toHandle } from '../storefront/handles.ts'
import { LOW_STOCK, optionKey } from '../storefront/variants.ts'
import { VEHICLES } from '../storefront/vehicles.ts'
import type { AssistantNeed, AssistantProfile, PartsKnowledge } from './assistantProfiles.ts'
import { hits } from './previewResponder.ts'
import type { PreviewEntry } from './previewResponder.ts'
import type { AssistantAction, AssistantContext, AssistantProduct, AssistantReply, AssistantState, AssistantVariant } from './storeAssistant.ts'

/** What a parts answer says, and what the conversation keeps from it. */
export interface PartsTurn {
  replies: AssistantReply[]
  /** The part the answer was about, so a follow-up ("what about a 2017 CR-V?") needs no name. */
  productId?: number
  /** A vehicle offered to the shopper: their "yes" sets it for the store. */
  offer?: Vehicle
  /** The question waiting for the shopper's vehicle. */
  asked?: string
  /** Set the store's vehicle now: the shopper asked for it, or said yes. */
  vehicle?: Vehicle
  /** The vehicle the answer was about, when it isn't the store's: a follow-up ("and the rotors?") is about it too. */
  named?: { vehicle: Vehicle; theirs: boolean }
  /** The parts the answer said fit, so a part a mechanic should fit gets that line after it. */
  fitted?: number[]
}

/** How a part stands against a vehicle (src/storefront/fitment.ts reads fitment from a product's detail). */
function fitState(product: AssistantProduct, vehicle: Vehicle | null | undefined): FitState {
  return fitStateOf({ detail: { fitment: product.fitment } }, vehicle)
}

/** The part's fitment rows that cover the vehicle. */
function fittingRows(product: AssistantProduct, vehicle: Vehicle): FitmentRow[] {
  return fittingRowsOf({ detail: { fitment: product.fitment } }, vehicle)
}

/** A part as the store's variant rules read it: its options, rebuilt from its variants' values. */
function asFitment(product: AssistantProduct): VariantFitmentProduct {
  const variants = product.variants ?? []
  const names = Object.keys(variants[0]?.values ?? {})
  return { detail: { fitment: product.fitment, options: names.map((name) => ({ name, values: [...new Set(variants.map((v) => v.values[name] ?? ''))] })) } }
}

/** One choice of a part as the store's variant rules read it. */
function asVariant(variant: AssistantVariant): FitVariant {
  return { title: variant.label, optionValues: Object.values(variant.values) }
}

/**
 * The vehicle a line the chat adds to the cart carries ("2019 Ford F-150"): the
 * shopper's, when the part fits it, by the store's own rule for cart lines. The chat
 * adds only parts without a choice to make; one with a choice is chosen on its page.
 */
export function chatLineVehicle(product: VariantFitmentProduct & { detail?: { variantsList?: FitVariant[] } }, vehicle: Vehicle | null | undefined): string | undefined {
  return lineVehicle(product, product.detail?.variantsList?.[0], vehicle)
}

// ── What a message is about ──────────────────────────────────────────────────

/** Asks whether a part fits. */
const FIT = /\b(fit|fits|fitting|fitment|compatib\w*|work (with|on|for|in)|right (one |part )?for|go (on|in)|suits?)\b/
/** Asks which parts: a list rather than a yes or no. */
const WHICH = /\b(what|which|show|list|find|any|got|need|looking for|recommend\w*|suggest\w*|options?|do you (have|sell|carry|stock|make))\b/
/**
 * Asks to set the store's vehicle, done right away: "set my vehicle to…", "change my
 * truck to…", "set vehicle 2019 F-150", "show parts for my…". The vehicle word has to
 * end the phrase or lead to the vehicle, so "change my car wipers" or "update my truck
 * battery" asks about a part, and "show parts for my friend's…" sets nothing.
 */
const SET_VEHICLE = /\b(set|save|change|switch|update|select)\s+(my |the |our )?(vehicle|car|truck|suv|van|ride)(\s+(to|as)\b|\s*([.,!?;:]|$)|\s+(?=(a |an |the )?(19|20)\d{2}\b))|\bshow (me )?(the )?parts for (my|our)\b(?!\s+\w+['’]s\b)|\bshop (for|by) (my|our)\b(?!\s+\w+['’]s\b)/
/** The vehicle is the shopper's own, so the assistant offers to set it. */
const MINE = /\b(my|our|mine|i (drive|have|own|got|bought)|we (drive|have|own))\b/
/** The vehicle is someone else's: "my friend's 2019 F-150", "my dad drives…". Never offered or set as the shopper's. */
const SOMEONE_ELSES = /\b(friend|dad|mom|mum|father|mother|son|daughter|brother|sister|wife|husband|partner|boss|neighbou?r|kid|uncle|aunt|grandpa|grandma|cousin|coworker|colleague|roommate|boyfriend|girlfriend|parents?|someone|somebody)(['’]s)?\b/
/** A follow-up about the part just discussed, with another vehicle: "what about a 2017 CR-V?" */
const WHAT_ABOUT = /\b(what|how) about\b|^\s*(and|or)\b|\?\s*$/
/** Words an answer to "Want me to set your vehicle…?" is made of, and how a yes or a no starts. */
const YES_WORDS = new Set(['yes', 'yeah', 'yep', 'yup', 'yea', 'sure', 'ok', 'okay', 'please', 'do', 'it', 'go', 'ahead', 'sounds', 'good', 'great', 'perfect', 'set', 'that', 'thanks', 'thank', 'you', 'absolutely', 'definitely', 'of', 'course', 'y', 'thx'])
const NO_WORDS = new Set(['no', 'nope', 'nah', 'not', 'now', 'thanks', 'thank', 'you', 'don’t', 'dont', 'leave', 'it', 'maybe', 'later', 'i’m', 'im', 'fine', 'good', 'thx', 'n'])
const YES_FIRST = /^(yes|yeah|yep|yup|yea|sure|ok|okay|please|absolutely|definitely|y|go|do|set|sounds|perfect)$/
const NO_FIRST = /^(no|nope|nah|not|don’t|dont|leave|n|maybe)$/

/** The message is a short yes (or no) and nothing more: "yes please", "no thanks". "Please show me wipers" is a question. */
function only(message: string, first: RegExp, vocabulary: Set<string>): boolean {
  const said = message.toLowerCase().replace(/'/g, '’').match(/[a-z’]+/g) ?? []
  return said.length > 0 && said.length <= 6 && first.test(said[0]!) && said.every((word) => vocabulary.has(word))
}
/** A model year followed by a word: a vehicle named, listed or not ("2018 Jeep Grand Cherokee"). */
const YEAR_AND_WORD = /\b(19[5-9]\d|20[0-4]\d)\s+[a-z]/i
const YEAR = /\b(19[5-9]\d|20[0-4]\d)\b/
/** Asks about a part number without giving one. */
const PART_NUMBER = /\bpart (numbers?|no\.?|#)/
/** Asks whether a part can be bought now. */
const STOCK = /\b(in stock|stock|available|availability|sold out|any left|have any)\b/

/** Words that describe a question or a vehicle, never a part, so "does this fit my truck" names no part. */
const NOT_A_NAME = new Set([
  'the', 'and', 'for', 'are', 'you', 'your', 'our', 'can', 'what', 'how', 'doe', 'does', 'did', 'will', 'with', 'have', 'has', 'any',
  'about', 'when', 'where', 'who', 'why', 'this', 'that', 'these', 'those', 'there', 'from', 'need', 'want', 'like', 'please', 'tell',
  'know', 'get', 'got', 'one', 'ones', 'they', 'them', 'then', 'also', 'just', 'would', 'could', 'should', 'which', 'right', 'work',
  'fit', 'fitting', 'fitment', 'compatible', 'part', 'number', 'sell', 'stock', 'carry', 'show', 'find', 'look', 'looking', 'buy',
  'car', 'truck', 'suv', 'crossover', 'vehicle', 'pickup', 'van', 'ride', 'drive', 'own', 'model', 'year', 'make',
  // The vehicles the store lists, by make and model.
  ...VEHICLES.flatMap((row) => words(`${row.make} ${row.model}`)), 'chevy', 'crv',
])

/** Lower-case words, a plural made singular ("pads" → "pad", "batteries" → "battery"). */
function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map((w) => (
    w.length > 4 && w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w
  ))
}

/** The same word, or one the start of the other when the shorter has four letters or more. */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.length >= 4 && long.startsWith(short)
}

/** The parts whose names the message mentions most: one, several when they tie, or none. */
export function partsNamed(message: string, products: AssistantProduct[]): AssistantProduct[] {
  const asked = words(message).filter((w) => w.length >= 3 && !NOT_A_NAME.has(w) && !/^\d+$/.test(w))
  if (!asked.length) return []
  const scored = products
    .map((product) => ({ product, score: words(product.name).filter((w) => w.length >= 3 && asked.some((a) => sameWord(a, w))).length }))
    .filter((p) => p.score > 0)
  const best = Math.max(0, ...scored.map((p) => p.score))
  return scored.filter((p) => p.score === best).map((p) => p.product)
}

/** The kind of part a product is: the first need its name matches ("Ceramic Brake Pads" → brake pads). */
export function kindOf(product: AssistantProduct, profile: AssistantProfile): AssistantNeed | undefined {
  const name = product.name.toLowerCase()
  return profile.needs.find((need) => need.says.test(name))
}

/**
 * The kind of part a message asks for ("brake pads", "a battery") and the store's
 * parts of that kind: those whose name and category say it best. Null when the
 * message names no kind.
 */
export function kindAsked(message: string, products: AssistantProduct[], profile: AssistantProfile): { need: AssistantNeed; products: AssistantProduct[] } | null {
  const text = message.toLowerCase()
  const needs = profile.needs.filter((need) => need.says.test(text))
  if (!needs.length) return null
  const tokens = needs.flatMap((need) => need.means)
  const scored = products
    .map((product) => ({ product, score: hits(tokens, product.name) * 3 + hits(tokens, product.category ?? '') * 2 }))
    .filter((p) => p.score > 0)
  const best = Math.max(0, ...scored.map((p) => p.score))
  return { need: needs[0]!, products: scored.filter((p) => p.score === best).map((p) => p.product) }
}

/**
 * A message without the kinds of part and the vehicle it names, so the store's pages
 * are matched on what it asks: "Can I return brake pads that don't fit my 2019 F-150?"
 * is about returns. The message as it was when nothing is left.
 */
export function withoutPartWords(message: string, profile: AssistantProfile): string {
  let text = message.toLowerCase().replace(new RegExp(YEAR.source, 'g'), ' ')
  for (const need of profile.needs) text = text.replace(new RegExp(need.says.source, 'g'), ' ')
  text = text.replace(/[a-z0-9-]+/g, (word) => (words(word).some((w) => NOT_A_NAME.has(w)) && !/^(fit|fits|fitting|fitment)$/.test(word) ? ' ' : word))
  return /[a-z]{3}/.test(text) ? text : message
}

// ── Vehicles ─────────────────────────────────────────────────────────────────

/** A listed make and model named without a year ("my F-150"), or with a year the store doesn't list ("2012 F-150"). */
function modelWithoutYear(message: string): Vehicle | null {
  const rest = message.replace(new RegExp(YEAR.source, 'g'), ' ')
  for (const year of yearsOf()) {
    const vehicle = parseVehicle(`${year} ${rest}`)
    if (vehicle) return vehicle
  }
  return null
}

/** The years a listed model is offered for: "2015 to 2024". */
function yearsFor(vehicle: Pick<Vehicle, 'make' | 'model'>): string {
  const rows = VEHICLES.filter((row) => row.make === vehicle.make && row.model === vehicle.model)
  const from = Math.min(...rows.map((row) => row.yearFrom))
  const to = Math.max(...rows.map((row) => row.yearTo))
  return from === to ? `${from}` : `${from} to ${to}`
}

/** "Ford F-150, Chevrolet Silverado 1500 and Ram 1500" */
function listed(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? '')
}

/** The vehicles the store lists parts for, as one sentence: by their shared run of years, or each with its own. */
export function vehiclesCovered(): string {
  const runs = new Set(VEHICLES.map((row) => `${row.yearFrom}-${row.yearTo}`))
  if (runs.size === 1) {
    const [from, to] = [...runs][0]!.split('-')
    return `We list parts for ${from} to ${to} models of the ${listed(VEHICLES.map((row) => `${row.make} ${row.model}`))}.`
  }
  return `We list parts for the ${listed(VEHICLES.map((row) => `${row.make} ${row.model} (${row.yearFrom} to ${row.yearTo})`))}.`
}

const CONTACT = { label: 'Contact us', href: '/page/contact' }

/** A vehicle the store doesn't list, or a listed model in a year it doesn't: what the store covers, never a guess. */
function notListed(message: string): PartsTurn {
  const model = modelWithoutYear(message)
  const year = YEAR.exec(message)?.[1]
  if (model && year) {
    return {
      replies: [{
        kind: 'text',
        topic: 'Vehicle fit',
        text: `We list parts for the ${model.make} ${model.model} from ${yearsFor(model)}, so I can’t check a ${year}. Match the part number on your old part, or write to us and we’ll help.`,
        link: CONTACT,
      }],
    }
  }
  return {
    replies: [{
      kind: 'text',
      topic: 'Vehicle fit',
      text: `I can’t check that vehicle. ${vehiclesCovered()} For another vehicle, match the part number on your old part, or write to us and we’ll help.`,
      link: CONTACT,
    }],
  }
}

// ── Prices, stock and part numbers ───────────────────────────────────────────

function priceOf(ctx: AssistantContext, amount: number | undefined): string {
  if (amount === undefined) return ''
  return ctx.formatPrice ? ctx.formatPrice(amount) : `$${amount.toFixed(2)}`
}

/** "only 2 left", "sold out right now", or "in stock". */
function stockOf(variant: AssistantVariant): string {
  if (variant.units === null) return 'in stock'
  if (variant.units <= 0) return 'sold out right now'
  return variant.units <= LOW_STOCK ? `only ${variant.units} left` : 'in stock'
}

function canBuy(variant: AssistantVariant): boolean {
  return variant.units === null || variant.units > 0
}

/** A part with a variant the shopper can buy. */
function available(product: AssistantProduct): boolean {
  return (product.variants ?? []).some(canBuy)
}

/** The part's page with this variant chosen: "/products/ceramic-brake-pads-4001?position=front". */
function pageOf(product: AssistantProduct, variant?: AssistantVariant): string | undefined {
  if (!product.url) return undefined
  const query = Object.entries(variant?.values ?? {})
    .filter(([, value]) => value)
    .map(([name, value]) => `${optionKey(name)}=${optionKey(value)}`)
  return query.length ? `${product.url}?${query.join('&')}` : product.url
}

/** A part number as a pattern: "TQ-BRK-4471" matches "tq brk 4471", "TQBRK4471" and "tq-brk-4471". */
function skuPattern(sku: string): RegExp | null {
  const pieces = sku.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return pieces.length ? new RegExp(`(?<![a-z0-9])${pieces.join('[\\s-]*')}(?![a-z0-9])`, 'i') : null
}

/** The variant a message names by its part number, with its part. */
export function partByNumber(message: string, products: AssistantProduct[]): { product: AssistantProduct; variant: AssistantVariant } | null {
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      if (variant.sku && skuPattern(variant.sku)?.test(message)) return { product, variant }
    }
  }
  return null
}

/** Something written like one of the store's part numbers ("TQ-BRK-9999"), whether or not the store has it. */
function looksLikePartNumber(message: string, products: AssistantProduct[]): string | null {
  const prefixes = new Set(products.flatMap((p) => p.variants ?? []).map((v) => v.sku.split('-')).filter((pieces) => pieces.length >= 3).map((pieces) => pieces[0]!.toLowerCase()))
  if (!prefixes.size) return null
  const match = new RegExp(`(?<![a-z0-9])(${[...prefixes].join('|')})[\\s-]*([a-z]{2,4})[\\s-]*(\\d{3,5})(?![a-z0-9])`, 'i').exec(message)
  return match ? `${match[1]}-${match[2]}-${match[3]}`.toUpperCase() : null
}

// ── Whether a part fits ──────────────────────────────────────────────────────

/** A name that reads as several things ("Ceramic Brake Pads, Truck & SUV") takes "fit", one thing ("AGM Battery") "fits". */
function plural(name: string): boolean {
  const last = (name.split(',')[0] ?? name).trim().split(/\s+/).pop()?.toLowerCase() ?? ''
  return /[^su]s$/.test(last)
}

const fitVerb = (name: string, yes: boolean): string => (yes ? (plural(name) ? 'fit' : 'fits') : plural(name) ? 'don’t fit' : 'doesn’t fit')

/** The option a part's fitment positions choose between ("Position": Front, Rear), if it has one. */
function positionOption(product: AssistantProduct): string | undefined {
  const positions = (product.fitment?.rows ?? []).map((row) => row.position?.toLowerCase()).filter(Boolean)
  if (!positions.length) return undefined
  const names = Object.keys(product.variants?.[0]?.values ?? {})
  return names.find((name) => (product.variants ?? []).some((v) => positions.includes(v.values[name]?.toLowerCase())))
}

/** The positions a part's rows cover for a vehicle, in the order the part offers them. */
function positionsOf(product: AssistantProduct, rows: FitmentRow[]): string[] {
  const said = [...new Set(rows.map((row) => row.position).filter((p): p is string => !!p))]
  const option = positionOption(product)
  if (!option) return said
  const order = (product.variants ?? []).map((v) => v.values[option] ?? '')
  return said.sort((a, b) => order.findIndex((o) => o.toLowerCase() === a.toLowerCase()) - order.findIndex((o) => o.toLowerCase() === b.toLowerCase()))
}

/**
 * The variants of a part that fit the vehicle, by the store's own rule for one
 * choice of a part (`variantFitState`): the position a row names, the sizes a row's
 * note names, else every one. Every variant without a vehicle. A position the shopper
 * asks about ("the rear pads") narrows them to it, when the part is sold by position.
 */
function variantsFor(product: AssistantProduct, vehicle: Vehicle | null, asked?: string): AssistantVariant[] {
  const variants = product.variants ?? []
  let fitting = vehicle ? variants.filter((v) => variantFitState(asFitment(product), asVariant(v), vehicle) === 'fits') : variants
  if (asked) {
    const narrowed = fitting.filter((v) => Object.values(v.values).some((value) => value.toLowerCase() === asked))
    if (narrowed.length) fitting = narrowed
  }
  return fitting
}

/** "Front: part # TQ-BRK-4471, $64.99. Rear: part # TQ-BRK-4472, $64.99." Empty when there are more choices than a sentence holds. */
function partNumbers(fitting: AssistantVariant[], ctx: AssistantContext): string {
  const one = (variant: AssistantVariant) => {
    const stock = stockOf(variant)
    return [`part # ${variant.sku}`, priceOf(ctx, variant.price), stock === 'in stock' ? '' : stock].filter(Boolean).join(', ')
  }
  if (!fitting.length || fitting.length > 3) return ''
  return fitting.map((variant) => (variant.label ? `${variant.label}: ${one(variant)}.` : `${capitalised(one(variant))}.`)).join(' ')
}

function sentence(text: string): string {
  const trimmed = text.trim()
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

/** ", front and rear", ", front only": where the rows say it fits, when they say. */
function wherePhrase(product: AssistantProduct, positions: string[]): string {
  if (!positions.length) return ''
  const option = positionOption(product)
  const offered = option ? new Set((product.variants ?? []).map((v) => v.values[option]?.toLowerCase())) : new Set<string | undefined>()
  const only = option && offered.size > positions.length ? ' only' : ''
  return `, ${listed(positions.map((p) => p.toLowerCase()))}${only}`
}

/** "$64.99", or "from $39.99" when the variants' prices differ. */
function pricePhrase(variants: AssistantVariant[], ctx: AssistantContext): string {
  const prices = variants.map((v) => v.price).filter((p): p is number => p !== undefined)
  if (!prices.length) return ''
  const low = Math.min(...prices)
  return `${prices.some((p) => p !== low) ? 'from ' : ''}${priceOf(ctx, low)}`
}

/** The line a list's card shows for a part: how it fits and what it costs, "Front or rear · $64.99". */
function noteFor(product: AssistantProduct, state: FitState, vehicle: Vehicle | null, ctx: AssistantContext): string {
  const buyable = (product.variants ?? []).filter(canBuy)
  if (state === 'universal') return ['Universal fit', pricePhrase(buyable, ctx)].filter(Boolean).join(' · ')
  const rows = vehicle && state === 'fits' ? fittingRows(product, vehicle) : []
  const fitting = variantsFor(product, state === 'fits' ? vehicle : null)
  const pieces: string[] = []
  const positions = positionsOf(product, rows)
  if (positions.length && !positionOption(product)) pieces.push(`Fits ${listed(positions.map((p) => p.toLowerCase()))}`)
  const notes = [...new Set(rows.map((row) => row.note).filter((n): n is string => !!n))]
  pieces.push(...notes)
  // The note already names the sizes ("Driver 22 in"); otherwise the choices, when there are one or two.
  const labels = notes.length ? [] : fitting.map((v) => v.label).filter(Boolean)
  if (labels.length === 1 || labels.length === 2) pieces.push(capitalised(labels.map((l) => l.toLowerCase()).join(' or ')))
  if (fitting.length === 1 && fitting[0]!.sku) pieces.push(`Part # ${fitting[0]!.sku}`)
  pieces.push(pricePhrase(fitting.filter(canBuy), ctx))
  for (const variant of fitting) {
    if (!canBuy(variant)) pieces.push(variant.label ? `${variant.label} sold out` : 'Sold out')
    else if (fitting.length === 1 && variant.units !== null && variant.units <= LOW_STOCK) pieces.push(`Only ${variant.units} left`)
  }
  return pieces.filter(Boolean).join(' · ')
}

/** How the answer names the vehicle: "your 2019 Ford F-150", or "a 2016 Honda Civic" when it may not be theirs. */
function whose(vehicle: Vehicle, theirs: boolean): string {
  return `${theirs ? 'your' : 'a'} ${vehicleLabel(vehicle)}`
}

/** The store's parts of a kind that fit a vehicle: those that fit it first, then universal ones; only what can be bought. */
function fittingOf(products: AssistantProduct[], vehicle: Vehicle): AssistantProduct[] {
  return products
    .filter((product) => available(product) && fitsVehicle({ detail: { fitment: product.fitment } }, vehicle))
    .map((product, index) => ({ product, index, rank: fitState(product, vehicle) === 'fits' ? 0 : 1 }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((p) => p.product)
}

const capitalised = (text: string): string => `${text[0]!.toUpperCase()}${text.slice(1)}`

/** A kind of part as a plural: "brake pads", "motor oil" (a kind without a plural is said once). */
const takesFit = (label: string): string => (/s$/.test(label) ? 'fit' : 'fits')

/** The store's collection for a part's category, for "See all brakes". */
function categoryLink(product: AssistantProduct | undefined, kind: string): { label: string; href: string } | undefined {
  const category = product?.category || product?.collections[0]
  return category ? { label: `See all ${kind}`, href: `/collections/${toHandle(category)}` } : undefined
}

/**
 * Whether these parts fit the vehicle: the ones that do, with where and their part
 * numbers, and the ones that don't. When none does, the store's parts of the same
 * kind that do fit, or that none does.
 */
function fitCheck(subjects: AssistantProduct[], vehicle: Vehicle, theirs: boolean, message: string, ctx: AssistantContext, profile: AssistantProfile): PartsTurn {
  const parts = profile.parts!
  const who = whose(vehicle, theirs)
  const states = subjects.map((product) => ({ product, state: fitState(product, vehicle) }))
  const fit = states.filter((s) => s.state === 'fits' || s.state === 'universal')
  const not = states.filter((s) => s.state === 'no-fit')
  const unknown = states.filter((s) => s.state === 'unknown')
  // A position the shopper names ("the rear pads") narrows the answer to it.
  const askedPosition = /\b(front|rear|back)\b/.exec(message.toLowerCase())?.[1]?.replace('back', 'rear')

  if (fit.length) {
    const sentences: string[] = []
    let link: { label: string; href: string } | undefined
    for (const [i, { product, state }] of fit.entries()) {
      const lead = i === 0 ? 'Yes. ' : ''
      if (state === 'universal') {
        const choices = (product.variants ?? []).filter((v) => v.label)
        sentences.push(`${lead}The ${product.name} ${plural(product.name) ? 'are' : 'is'} a universal fit, so ${plural(product.name) ? 'they work' : 'it works'} with ${who}.`)
        if (choices.length > 1) sentences.push(`${plural(product.name) ? 'They come' : 'It comes'} in ${listed(choices.map((v) => v.label))}. ${parts.choiceNote}`)
        link ??= product.url ? { label: `View ${product.name}`, href: product.url } : undefined
        continue
      }
      const rows = fittingRows(product, vehicle)
      const positions = positionsOf(product, rows)
      if (askedPosition && positions.length && !positions.some((p) => p.toLowerCase() === askedPosition)) {
        sentences.push(`${lead}The ${product.name} ${fitVerb(product.name, true)} ${who}, but only the ${listed(positions.map((p) => p.toLowerCase()))}, not the ${askedPosition}.`)
      } else {
        const where = askedPosition && positions.length ? positions.filter((p) => p.toLowerCase() === askedPosition) : positions
        sentences.push(`${lead}The ${product.name} ${fitVerb(product.name, true)} ${who}${wherePhrase(product, where)}.`)
      }
      for (const note of new Set(rows.map((row) => row.note).filter((n): n is string => !!n))) sentences.push(sentence(note))
      const fitting = variantsFor(product, vehicle, askedPosition)
      const numbers = partNumbers(fitting, ctx)
      if (numbers) sentences.push(numbers)
      const href = pageOf(product, fitting.length === 1 ? fitting[0] : undefined)
      link ??= href ? { label: `View ${product.name}`, href } : undefined
    }
    if (not.length) sentences.push(`The ${listed(not.map((s) => s.product.name))} ${not.length > 1 || plural(not[0]!.product.name) ? 'don’t' : 'doesn’t'}.`)
    const productId = fit.length === 1 ? fit[0]!.product.id : undefined
    return {
      replies: [{ kind: 'text', topic: 'Vehicle fit', text: sentences.join(' '), ...(link ? { link } : {}) }],
      ...(productId ? { productId } : {}),
      fitted: fit.map((s) => s.product.id),
    }
  }

  if (!not.length) {
    const product = unknown[0]!.product
    return {
      replies: [{ kind: 'text', topic: 'Vehicle fit', text: `I don’t have fit details for the ${product.name}. Match the part number on your old part, or write to us and we’ll check it.`, link: CONTACT }],
      productId: product.id,
    }
  }

  // None of them fits: the parts of the same kind that do.
  const first = not[0]!.product
  const lead = `No. The ${listed(not.map((s) => s.product.name))} ${not.length > 1 || plural(first.name) ? 'don’t' : 'doesn’t'} fit ${who}.`
  return { replies: insteadOf(not.map((s) => s.product), lead, vehicle, who, ctx, profile), ...(not.length === 1 ? { productId: first.id } : {}) }
}

/**
 * After "it doesn't fit": the store's parts of the same kind that do, as cards, or
 * that none does, with a link to them all.
 */
function insteadOf(parts: AssistantProduct[], lead: string, vehicle: Vehicle, who: string, ctx: AssistantContext, profile: AssistantProfile): AssistantReply[] {
  const first = parts[0]!
  const kind = kindOf(first, profile)
  const sameKind = ctx.products.filter((p) => !parts.includes(p) && (kind ? kindOf(p, profile) === kind : p.category === first.category))
  const instead = fittingOf(sameKind, vehicle).slice(0, 3)
  const label = kind?.label ?? (first.category ?? 'parts').toLowerCase()
  if (instead.length) {
    return [
      { kind: 'text', topic: 'Vehicle fit', text: lead },
      { kind: 'products', text: `${capitalised(label)} that ${takesFit(label)} ${who}:`, productIds: instead.map((p) => p.id), notes: notesFor(instead, vehicle, ctx) },
    ]
  }
  const all = categoryLink(first, label)
  return [{ kind: 'text', topic: 'Vehicle fit', text: `${lead} None of our ${label} ${takesFit(label)} it.`, ...(all ? { link: all } : {}) }]
}

function notesFor(products: AssistantProduct[], vehicle: Vehicle | null, ctx: AssistantContext): Record<number, string> {
  return Object.fromEntries(products.map((p) => [p.id, noteFor(p, vehicle ? fitState(p, vehicle) : 'unknown', vehicle, ctx)]))
}

/** The parts of a kind that fit a vehicle, as cards, or that none does. Without a kind, a few of the parts that fit. */
function partsFor(kind: { need: AssistantNeed; products: AssistantProduct[] } | null, vehicle: Vehicle, theirs: boolean, ctx: AssistantContext, parts: PartsKnowledge): PartsTurn {
  const who = whose(vehicle, theirs)
  if (!kind) {
    const fitting = ctx.products.filter((p) => available(p) && fitState(p, vehicle) === 'fits')
    if (!fitting.length) return { replies: [{ kind: 'text', topic: 'Vehicle fit', text: `None of our parts are listed for ${who} yet. ${vehiclesCovered()}`, link: CONTACT }] }
    const shown = fitting.slice(0, 4)
    const chosen = sameVehicle(vehicle, ctx.vehicle)
    return {
      replies: [{
        kind: 'products',
        text: `${fitting.length} of our parts fit ${who}. Here are a few; tell me the part you need, like brake pads or a battery, and I’ll narrow it down.`,
        productIds: shown.map((p) => p.id),
        notes: notesFor(shown, vehicle, ctx),
      }, ...(chosen ? [{ kind: 'text' as const, text: '', link: { label: 'See every part that fits', href: '/collections/all' } }] : [])],
    }
  }
  const label = kind.need.label
  if (!kind.products.length) return { replies: [{ kind: 'text', topic: 'Vehicle fit', text: `We don’t carry ${label} right now.` }] }
  const fitting = fittingOf(kind.products, vehicle).slice(0, 4)
  if (!fitting.length) {
    const all = categoryLink(kind.products[0], label)
    return { replies: [{ kind: 'text', topic: 'Vehicle fit', text: `None of our ${label} ${takesFit(label)} ${who}.`, ...(all ? { link: all } : {}) }] }
  }
  // A universal part sold in grades or sizes (motor oil): which one is the owner's manual's to say.
  const choose = fitting.some((p) => fitState(p, vehicle) === 'universal' && (p.variants ?? []).filter((v) => v.label).length > 1)
  const lead = `${capitalised(label)} that ${takesFit(label)} ${who}`
  return {
    replies: [{ kind: 'products', text: choose ? `${lead}. ${parts.choiceNote}` : `${lead}:`, productIds: fitting.map((p) => p.id), notes: notesFor(fitting, vehicle, ctx) }],
    ...(fitting.length === 1 ? { productId: fitting[0]!.id } : {}),
  }
}

function sameVehicle(a: Vehicle | null | undefined, b: Vehicle | null | undefined): boolean {
  return !!a && !!b && a.year === b.year && a.make === b.make && a.model === b.model
}

/** "Showing parts for your 2019 Ford F-150." The reply that always comes with setting the vehicle. */
function showing(vehicle: Vehicle): AssistantReply {
  return { kind: 'text', topic: 'Vehicle', text: `Showing parts for your ${vehicleLabel(vehicle)}.` }
}

/** The offer to set a vehicle the shopper named as theirs: nothing changes until they say yes or press the button. */
function offerFor(vehicle: Vehicle): AssistantReply {
  const action: AssistantAction = { kind: 'set-vehicle', vehicle, label: `Show parts for my ${vehicleLabel(vehicle)}` }
  return { kind: 'text', topic: 'Vehicle', text: `Want me to set your vehicle to ${vehicleLabel(vehicle)}? The store will then show the parts that fit it.`, action }
}

function askVehicle(parts: PartsKnowledge, question: string, before: AssistantReply[] = []): PartsTurn {
  const action: AssistantAction = { kind: 'choose-vehicle', label: 'Choose your vehicle' }
  return { replies: [...before, { kind: 'text', topic: 'Vehicle fit', text: parts.askVehicle, action }], asked: question }
}

// ── The answer ───────────────────────────────────────────────────────────────

/**
 * A work or safety question: its careful answer, never a product or a how-to. In the
 * store's own words when its knowledge has the page the caution names ("Brake work").
 */
export function partsCaution(message: string, parts: PartsKnowledge, entries: Array<PreviewEntry & { url?: string }> = []): AssistantReply | null {
  const text = message.toLowerCase()
  const caution = parts.cautions.find((c) => c.says.test(text))
  if (!caution) return null
  const page = caution.page ? entries.find((entry) => caution.page!.test(entry.title)) : undefined
  if (page) return { kind: 'answer', text: page.text, source: page.source, ...(page.url ? { link: { label: `Read: ${page.title}`, href: page.url } } : {}) }
  return { kind: 'text', topic: 'Safety', text: caution.text, ...(caution.link ? { link: caution.link } : {}) }
}

/**
 * An auto parts store's answer to a message, or null when it is about something
 * else (an order, the store's pages). `elsewhere`: the message also reads as an
 * order, discount or contact question, so only a part number, a vehicle or a fit
 * question is answered here.
 */
export function partsAnswer(message: string, ctx: AssistantContext, state: AssistantState, profile: AssistantProfile, elsewhere = false, settingVehicle = false): PartsTurn | null {
  const parts = profile.parts!
  const text = message.toLowerCase()
  const keeps = ctx.vehicle !== undefined
  const productId = state.productId ? { productId: state.productId } : {}

  // ── The shopper's answer to the offer to set their vehicle ─────────
  // Only a yes or a no and nothing more: "Please show me wiper blades" is a question, and drops the offer.
  if (state.offer) {
    if (only(message, YES_FIRST, YES_WORDS) && keeps) return { replies: [showing(state.offer)], vehicle: state.offer, ...productId }
    if (only(message, NO_FIRST, NO_WORDS)) {
      return { replies: [{ kind: 'text', topic: 'Vehicle', text: 'No problem. I’ll leave your vehicle as it is.' }], named: { vehicle: state.offer, theirs: true }, ...productId }
    }
  }

  // ── A part number: checked against the vehicle the message names, the one this chat was about, or the store's ──
  const numbered = partByNumber(message, ctx.products)
  if (numbered) {
    const said = parseVehicle(message)
    const vehicle = said ? { vehicle: said, theirs: MINE.test(text) && !SOMEONE_ELSES.test(text) } : state.named ?? (ctx.vehicle ? { vehicle: ctx.vehicle, theirs: true } : null)
    return partNumberAnswer(numbered.product, numbered.variant, vehicle, message, ctx, profile)
  }
  const unknownNumber = looksLikePartNumber(message, ctx.products)
  if (unknownNumber) {
    return { replies: [{ kind: 'text', topic: 'Part number', text: `I can’t find part number ${unknownNumber}. Check the number on your old part or its box, or tell me your vehicle and the part you need.` }] }
  }

  // Only a store whose parts list the vehicles they fit answers the rest.
  if (!ctx.products.some((p) => p.fitment)) return null

  // ── What the message asks ──────────────────────────────────────────
  // A vehicle named in answer to "Which vehicle is it for?" answers that question.
  const named = parseVehicle(message) ?? (state.asked ? parseVehicle(`${message} ${state.asked}`) : null)
  const fitAsked = FIT.test(text)
  const listAsked = WHICH.test(text.replace(WHAT_ABOUT, ' '))
  const theirs = MINE.test(text) && !SOMEONE_ELSES.test(text)
  const kind = kindAsked(message, ctx.products, profile)
  const names = partsNamed(message, ctx.products)
  if (named && state.asked && !fitAsked && !kind && !names.length) {
    // Given in answer to "Which vehicle is it for?", the vehicle is the shopper's own.
    const answer = partsAnswer(`${state.asked} for my ${vehicleLabel(named)}`, ctx, { ...state, asked: undefined }, profile)
    if (answer) return answer
  }
  // Named parts that tie ("the oil") keep to the kind asked for, when that leaves any.
  const kindNames = kind ? names.filter((p) => kind.products.includes(p)) : []
  const subjects = kindNames.length ? kindNames : names
  const asksAboutParts = fitAsked || listAsked || !!kind || !!subjects.length

  // Asking to set it says the vehicle is the shopper's, unless it is someone else's.
  const setAsked = !settingVehicle && !!named && !SOMEONE_ELSES.test(text) && SET_VEHICLE.test(text)
  if (elsewhere && !fitAsked && !setAsked) return null

  // ── Asked to set the vehicle: done, and said; then the rest of the message, or the question waiting ──
  if (setAsked && keeps) {
    const set = { ...ctx, vehicle: named }
    const fresh: AssistantState = { ...state, asked: undefined, offer: undefined, named: undefined }
    const rest = partsAnswer(message, set, fresh, profile, elsewhere, true)
      ?? (state.asked ? partsAnswer(state.asked, set, fresh, profile) : null)
    return { replies: [showing(named), ...(rest?.replies ?? [])], vehicle: named, ...(rest?.productId ? { productId: rest.productId } : {}) }
  }

  // ── A vehicle the store doesn't list: what it covers, never a guess ──
  if (!named && YEAR_AND_WORD.test(message) && (asksAboutParts || theirs || !!state.asked)) return notListed(message)

  // A listed model without its year ("my F-150"): ask for the year, unless it is the model of the vehicle already chosen.
  if (!named && !YEAR.test(message) && (asksAboutParts || theirs)) {
    const model = modelWithoutYear(message)
    const chosen = ctx.vehicle && ctx.vehicle.make === model?.make && ctx.vehicle.model === model.model
    if (model && !chosen) {
      return { replies: [{ kind: 'text', topic: 'Vehicle fit', text: `Which year is your ${model.make} ${model.model}? We list parts for it from ${yearsFor(model)}.` }], asked: message }
    }
  }

  // "Look up a part number", without one: ask for it.
  if (PART_NUMBER.test(text) && !named && !kind && !names.length && !fitAsked) {
    const example = ctx.products.flatMap((p) => p.variants ?? []).find((v) => v.sku)?.sku
    return { replies: [{ kind: 'text', topic: 'Part number', text: `Type the part number here${example ? `, like ${example},` : ''} and I’ll look it up. It’s printed on your old part or its box.` }] }
  }

  // ── Which vehicle the answer is about ───────────────────────────────
  // The one the message names; else the one the last answer was about (the chat forgets it when the
  // shopper chooses a vehicle on the store); else the one chosen on the store.
  const earlier = state.named
  const vehicle = named ?? earlier?.vehicle ?? ctx.vehicle ?? null
  const isTheirs = named ? theirs : earlier ? earlier.theirs : !!ctx.vehicle
  // The shopper named their own vehicle and the store isn't showing parts for it yet: offer to.
  const offer = named && theirs && keeps && !sameVehicle(named, ctx.vehicle) ? named : undefined
  /**
   * The answer; a line recommending a mechanic when it offers parts a mechanic should
   * fit (brake pads, rotors); the offer to set the vehicle; and the vehicle it was about.
   */
  const about = (turn: PartsTurn, mechanicLine = true): PartsTurn => {
    const offered = [...(turn.fitted ?? []), ...turn.replies.flatMap((r) => (r.kind === 'products' ? r.productIds : []))]
    const fittedByMechanic = mechanicLine && offered.some((id) => {
      const product = ctx.products.find((p) => p.id === id)
      const kind = product && kindOf(product, profile)
      return !!kind && parts.mechanic.kinds.includes(kind.label)
    })
    const mechanic: AssistantReply[] = fittedByMechanic ? [{ kind: 'text', topic: 'Vehicle fit', text: parts.mechanic.text }] : []
    return {
      ...turn,
      replies: [...turn.replies, ...mechanic, ...(offer ? [offerFor(offer)] : [])],
      ...(offer ? { offer } : {}),
      ...(vehicle && !sameVehicle(vehicle, ctx.vehicle) ? { named: { vehicle, theirs: isTheirs } } : {}),
    }
  }

  // The parts it names; else the one just talked about, or this page's. Among several it names, the one on this page.
  const around = [state.productId, ctx.currentProductId].map((id) => ctx.products.find((p) => p.id === id)).find(Boolean)
  const subject = subjects.length > 1 && around && subjects.includes(around) ? [around] : subjects

  // ── Is it in stock? About one part: the one it names, or this page's ──
  const stocked = subject.length === 1 ? subject[0] : !subjects.length && !kind ? around : undefined
  if (STOCK.test(text) && !fitAsked && !named && stocked) return stockAnswer(stocked, ctx)

  // ── A list: the parts of a kind that fit ───────────────────────────
  if (kind && (listAsked || !fitAsked || !subjects.length)) {
    if (vehicle) return about(partsFor(kind, vehicle, isTheirs, ctx, parts))
    const shown = kind.products.filter(available).slice(0, 4)
    const listing: AssistantReply[] = shown.length
      ? [{ kind: 'products', text: `Here are our ${kind.need.label}.`, productIds: shown.map((p) => p.id), notes: notesFor(shown, null, ctx) }]
      : []
    return askVehicle(parts, message, listing)
  }

  // ── Whether a part fits ────────────────────────────────────────────
  // "What fits?" is a list, unless it says "this" or "it".
  const onIt = !listAsked || /\b(this|it|that)\b/.test(text)
  const checked = subject.length ? subject : around && onIt && (fitAsked || (named && WHAT_ABOUT.test(text))) ? [around] : []
  if (checked.length && (fitAsked || named)) {
    if (!vehicle) return askVehicle(parts, message)
    return about(fitCheck(checked, vehicle, isTheirs, message, ctx, profile))
  }

  // "What fits my car?": a few of the parts that fit, or a question back.
  if (fitAsked || (listAsked && /\bparts?\b/.test(text))) {
    if (!vehicle) return askVehicle(parts, message)
    // A few of everything that fits: no line about any one kind of part.
    return about(partsFor(null, vehicle, isTheirs, ctx, parts), false)
  }

  // ── A vehicle named on its own: "I drive a 2019 F-150" ─────────────
  // Just set from this message, a vehicle with nothing else asked needs no more.
  if (settingVehicle) return null
  if (named && keeps) {
    // Someone else's vehicle is never offered as the shopper's.
    if (SOMEONE_ELSES.test(text)) {
      return { replies: [{ kind: 'text', topic: 'Vehicle fit', text: `Which part are you looking for? I’ll check what fits a ${vehicleLabel(named)}.` }], named: { vehicle: named, theirs: false } }
    }
    if (sameVehicle(named, ctx.vehicle)) {
      return { replies: [{ kind: 'text', topic: 'Vehicle', text: `Your ${vehicleLabel(named)} is already set, so the store shows the parts that fit it.` }] }
    }
    return { replies: [offerFor(named)], offer: named, named: { vehicle: named, theirs: true } }
  }
  return null
}

/** "AGM Battery: only 3 left, $219.99." For a part with choices, each one that isn't plainly in stock, or that all are. */
function stockAnswer(product: AssistantProduct, ctx: AssistantContext): PartsTurn {
  const variants = product.variants ?? []
  const option = Object.keys(variants[0]?.values ?? {})[0]
  const price = pricePhrase(variants, ctx)
  let said: string
  if (variants.length <= 1 || !option) said = `${product.name}: ${stockOf(variants[0]!)}, ${price}.`
  else if (variants.every((v) => stockOf(v) === 'in stock')) said = `${product.name}: in stock in every ${option.toLowerCase()}, ${price}.`
  else said = `${product.name}: ${variants.map((v) => `${v.label} ${stockOf(v)}`).join(', ')}.`
  return {
    replies: [{ kind: 'text', topic: 'Stock', text: said, ...(product.url ? { link: { label: `View ${product.name}`, href: product.url } } : {}) }],
    productId: product.id,
  }
}

/**
 * "Part # TQ-BRK-4471 is the Ceramic Brake Pads, Truck & SUV (Front): $64.99, in
 * stock." With its fit when the vehicle is known: when it doesn't fit, the variant
 * of it that does, or the parts of its kind that do. Without a vehicle, it asks,
 * and the vehicle the shopper gives next answers the fit.
 */
function partNumberAnswer(product: AssistantProduct, variant: AssistantVariant, about: { vehicle: Vehicle; theirs: boolean } | null, message: string, ctx: AssistantContext, profile: AssistantProfile): PartsTurn {
  const sentences = [`Part # ${variant.sku} is the ${product.name}${variant.label ? ` (${variant.label})` : ''}: ${[priceOf(ctx, variant.price), stockOf(variant)].filter(Boolean).join(', ')}.`]
  const href = pageOf(product, variant)
  const link = href ? { link: { label: `View ${product.name}`, href } } : {}
  const vehicle = about?.vehicle
  const state = fitState(product, vehicle)
  const done = (more: AssistantReply[] = [], extra: Partial<PartsTurn> = {}): PartsTurn => ({
    replies: [{ kind: 'text', topic: 'Part number', text: sentences.join(' '), ...link }, ...more],
    productId: product.id,
    ...(vehicle && !sameVehicle(vehicle, ctx.vehicle) ? { named: about! } : {}),
    ...extra,
  })
  if (state === 'universal') {
    sentences.push('It’s a universal fit.')
    return done()
  }
  if (vehicle && state !== 'unknown') {
    const who = whose(vehicle, about!.theirs)
    const fitting = state === 'fits' ? variantsFor(product, vehicle) : []
    if (fitting.includes(variant)) {
      sentences.push(`It fits ${who}.`)
      return done()
    }
    // Another of its variants fits instead (the other position, the right length): its part number.
    const other = fitting[0]
    if (other) {
      sentences.push(`It doesn’t fit ${who}. The ${other.label || 'other'} one does: part # ${other.sku}.`)
      return done()
    }
    // Nothing of it fits: the parts of its kind that do.
    sentences.push(`It doesn’t fit ${who}.`)
    const [lead, ...rest] = insteadOf([product], sentences.join(' '), vehicle, who, ctx, profile)
    const first: AssistantReply = lead!.kind === 'text' && !lead!.link ? { ...lead!, topic: 'Part number', ...link } : lead!
    return { ...done(), replies: [first, ...rest] }
  }
  if (product.fitment?.rows.length) {
    const action: AssistantAction = { kind: 'choose-vehicle', label: 'Choose your vehicle' }
    return done([{ kind: 'text', topic: 'Vehicle fit', text: 'Tell me your vehicle and I’ll check the fit.', ...(ctx.vehicle !== undefined ? { action } : {}) }], { asked: message })
  }
  return done()
}
