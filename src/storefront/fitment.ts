// Which vehicles a part fits, and the shopper's vehicle: the Year → Make → Model
// choices, how a vehicle reads, whether a part fits it, and a vehicle named in a
// chat message. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:storefront` runs them in Node.

import { VEHICLES } from './vehicles.ts'
import type { VehicleModel } from './vehicles.ts'
import { optionValuesOf } from './variants.ts'

/** The shopper's vehicle. One at a time; there is no garage. */
export interface Vehicle {
  year: number
  make: string
  model: string
}

/** One line of a part's fitment: a model over a run of years ("Ford F-150, 2015-2020, Front"). */
export interface FitmentRow {
  make: string
  model: string
  yearFrom: number
  yearTo: number
  /** Where on the vehicle, when it matters: "Front", "Rear". */
  position?: string
  /** Anything the fit depends on: "Without trailer tow package". */
  note?: string
}

/** A part's fitment, on `product.detail.fitment`. A universal part fits every vehicle and needs no rows. */
export interface Fitment {
  universal: boolean
  rows: FitmentRow[]
}

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface FitmentProduct {
  detail?: { fitment?: Fitment }
}

/**
 * How a part stands against the shopper's vehicle: it fits, it doesn't, it fits
 * anything, or it can't be told (no vehicle chosen, or the part has no fitment).
 */
export type FitState = 'fits' | 'no-fit' | 'universal' | 'unknown'

/** Lowercase letters and digits only, so "CR-V", "cr v" and "CRV" are one name. */
function compact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function sameName(a: string, b: string): boolean {
  return compact(a) === compact(b)
}

/** "2019 Ford F-150". */
export function vehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
}

/** The row covers this vehicle: same make and model, and the year in its run. */
export function rowFits(row: FitmentRow, vehicle: Vehicle): boolean {
  return sameName(row.make, vehicle.make) && sameName(row.model, vehicle.model) && vehicle.year >= row.yearFrom && vehicle.year <= row.yearTo
}

/** The part's rows that cover the vehicle, for what they say about position and notes. */
export function fittingRows(product: FitmentProduct, vehicle: Vehicle): FitmentRow[] {
  return (product.detail?.fitment?.rows ?? []).filter((row) => rowFits(row, vehicle))
}

/** Whether the part fits the shopper's vehicle. A universal part is 'universal' with or without one. */
export function fitState(product: FitmentProduct, vehicle: Vehicle | null | undefined): FitState {
  const fitment = product.detail?.fitment
  if (fitment?.universal) return 'universal'
  if (!vehicle || !fitment?.rows.length) return 'unknown'
  return fittingRows(product, vehicle).length ? 'fits' : 'no-fit'
}

/**
 * What a fit badge or banner says, the same words on the card, the product page,
 * quick add and the cart: "Fits your 2019 Ford F-150", "Doesn’t fit your 2019 Ford
 * F-150", "Universal fit", or "Check fit" (no vehicle chosen, or the part lists none).
 */
export function fitLabel(state: FitState, vehicle: Vehicle | null | undefined): string {
  if (state === 'universal') return 'Universal fit'
  if (state === 'unknown' || !vehicle) return 'Check fit'
  return `${state === 'fits' ? 'Fits' : 'Doesn’t fit'} your ${vehicleLabel(vehicle)}`
}

/**
 * What the rows that fit the vehicle say about the fit, for the line under "Fits
 * your …": their position and note ("Front", "Driver 22 in, passenger 22 in"),
 * each once. Empty when the rows say nothing more, or nothing fits.
 */
export function fitDetail(product: FitmentProduct, vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return ''
  const said = fittingRows(product, vehicle).map((row) => [row.position, row.note].filter(Boolean).join(' · ')).filter(Boolean)
  return [...new Set(said)].join('; ')
}

/** A part the shopper's vehicle can take: it fits, or it fits anything. What "parts that fit" lists. */
export function fitsVehicle(product: FitmentProduct, vehicle: Vehicle | null | undefined): boolean {
  const state = fitState(product, vehicle)
  return state === 'fits' || state === 'universal'
}

/** The fields the variant rules read from a product. A commerce `Product` satisfies it. */
export interface VariantFitmentProduct extends FitmentProduct {
  detail?: { fitment?: Fitment; options?: readonly { name: string; values: readonly string[] }[] }
}

/** The fields the variant rules read from a variant. A commerce `ProductVariant` satisfies it. */
export interface FitVariant {
  title: string
  optionValues?: string[]
}

const lower = (text: string): string => text.trim().toLowerCase()

/** The note names this value as a whole ("22 in" in "Driver 22 in, passenger 20 in", never in "122 in"). */
function names(note: string, value: string): boolean {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(note)
}

/**
 * How one choice of a part stands against the shopper's vehicle, for what goes on
 * a cart line and what the product page says once a choice is made. The part has to
 * fit, and one of the rows that fit has to take this choice: a row's position
 * ("Front") must be the choice's, when the part is sold by position, and a note that
 * names some of the part's choices ("Driver 22 in, passenger 22 in") takes only
 * those. A part that fits with no choice made, or with none to make, is the part's
 * own state.
 */
export function variantFitState(product: VariantFitmentProduct, variant: FitVariant | null | undefined, vehicle: Vehicle | null | undefined): FitState {
  const state = fitState(product, vehicle)
  const options = product.detail?.options ?? []
  if (state !== 'fits' || !variant || !options.length) return state
  const chosen = optionValuesOf(variant, options).map(lower)
  const offered = options.flatMap((option) => option.values.map(lower))
  const takes = fittingRows(product, vehicle!).some((row) => {
    const position = row.position ? lower(row.position) : ''
    if (position && offered.includes(position) && !chosen.includes(position)) return false
    const note = lower(row.note ?? '')
    const named = offered.filter((value) => names(note, value))
    return !named.length || chosen.some((value) => named.includes(value))
  })
  return takes ? 'fits' : 'no-fit'
}

/** The vehicle a cart line carries ("2019 Ford F-150"): the shopper's, when this choice of the part fits it. */
export function lineVehicle(product: VariantFitmentProduct, variant: FitVariant | null | undefined, vehicle: Vehicle | null | undefined): string | undefined {
  return vehicle && variantFitState(product, variant, vehicle) === 'fits' ? vehicleLabel(vehicle) : undefined
}

/** The store sells parts: one of its products carries fitment, so its pages offer a vehicle selector. */
export function sellsParts(products: readonly FitmentProduct[]): boolean {
  return products.some((product) => product.detail?.fitment !== undefined)
}

/**
 * A vehicle the table offers, read back from storage: anything else (an old
 * shape, a model dropped from the table, a year out of its run) reads as no vehicle.
 */
export function isVehicle(value: unknown, table: readonly VehicleModel[] = VEHICLES): value is Vehicle {
  if (!value || typeof value !== 'object') return false
  const { year, make, model } = value as Record<string, unknown>
  return typeof year === 'number' && typeof make === 'string' && typeof model === 'string'
    && table.some((row) => row.make === make && row.model === model && year >= row.yearFrom && year <= row.yearTo)
}

// ── Choosing a vehicle: Year, then Make, then Model ──────────────────────────

/** Every model year offered, newest first. */
export function yearsOf(table: readonly VehicleModel[] = VEHICLES): number[] {
  const years = new Set<number>()
  for (const row of table) for (let year = row.yearFrom; year <= row.yearTo; year++) years.add(year)
  return [...years].sort((a, b) => b - a)
}

/** The makes offered in a year, A to Z. */
export function makesFor(year: number, table: readonly VehicleModel[] = VEHICLES): string[] {
  return [...new Set(table.filter((row) => year >= row.yearFrom && year <= row.yearTo).map((row) => row.make))].sort((a, b) => a.localeCompare(b))
}

/** The models of a make offered in a year, A to Z. */
export function modelsFor(year: number, make: string, table: readonly VehicleModel[] = VEHICLES): string[] {
  return table
    .filter((row) => sameName(row.make, make) && year >= row.yearFrom && year <= row.yearTo)
    .map((row) => row.model)
    .sort((a, b) => a.localeCompare(b))
}

// ── A vehicle named in a message ─────────────────────────────────────────────

/** Names shoppers use for a make. */
const MAKE_ALIASES: Record<string, string[]> = { Chevrolet: ['chevy'] }

/** Makes that are also everyday words in a parts chat ("the ram air intake"). Said only that way, they give way to a model of another make. */
const EVERYDAY_MAKES = new Set(['Ram'])

/** Words that can follow a make without naming a model ("my 2018 Jeep and…"). Any other word there reads as a model the table doesn't list. */
const NOT_A_MODEL = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'with', 'w', 'without', 'for', 'from', 'in', 'on', 'at', 'to', 'of', 'by', 'if', 'so',
  'is', 'was', 'has', 'had', 'does', 'do', 'did', 'will', 'would', 'can', 'that', 'which', 'it', 'i', 'im', 's',
  'too', 'also', 'please', 'pls', 'thanks', 'thank', 'thx',
])

const YEAR = /\b(19\d{2}|20\d{2})\b/

function wordsOf(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

/** A mention of the make is followed, in the same clause, by a word that could be a model ("Jeep Grand Cherokee", "Ram 2500"). */
function modelAfterMake(text: string, make: string): boolean {
  const names = [make, ...(MAKE_ALIASES[make] ?? [])].map(compact)
  return text.split(/[.,;:!?()\n]/).some((clause) => {
    const words = wordsOf(clause)
    return words.some((word, i) => {
      // The make may be written in two pieces, like a model.
      const end = names.includes(word) ? i : names.includes(word + (words[i + 1] ?? '')) ? i + 1 : -1
      const next = end < 0 ? undefined : words[end + 1]
      return next !== undefined && !NOT_A_MODEL.has(next) && !YEAR.test(next)
    })
  })
}

/**
 * The vehicle a message names ("does this fit my 2019 F-150?"), as the table
 * writes it, or null when the year, or which model, can't be told. A model may
 * be written with or without its dash or spaces ("CRV", "f 150"), and the make
 * may be left out when the model says it. A make with one model in the table is
 * enough on its own ("my 2018 Jeep"), but not when a word after it names a model
 * the table doesn't have ("my 2018 Jeep Grand Cherokee"): a vehicle the table
 * doesn't list reads as nothing, never as its make's other model.
 */
export function parseVehicle(text: string, table: readonly VehicleModel[] = VEHICLES): Vehicle | null {
  const year = Number(YEAR.exec(text)?.[1])
  if (!year) return null
  const words = wordsOf(text)
  // A model written in two pieces ("cr v", "f-150") is also tried joined.
  const pieces = new Set([...words, ...words.slice(1).map((word, i) => words[i] + word)])
  const said = (name: string) => [name, ...(MAKE_ALIASES[name] ?? [])].some((n) => pieces.has(compact(n)))
  const offered = table.filter((row) => year >= row.yearFrom && year <= row.yearTo)
  // A model spelled out with letters names itself, whatever make is said ("F-150", "crv", and "Silverado", a long first word).
  const spelled = offered.filter((row) => {
    const whole = compact(row.model)
    if (/[a-z]/.test(whole) && pieces.has(whole)) return true
    const first = compact(row.model.split(/\s+/)[0] ?? '')
    return row.model.includes(' ') && first.length >= 4 && /[a-z]/.test(first) && pieces.has(first)
  })
  const makes = new Set(offered.filter((row) => said(row.make)).map((row) => row.make))
  for (const make of makes) if (EVERYDAY_MAKES.has(make) && spelled.some((row) => row.make !== make)) makes.delete(make)
  // A bare number ("1500") only counts beside its make.
  const numbered = offered.filter((row) => makes.has(row.make) && !/[a-z]/.test(compact(row.model)) && pieces.has(compact(row.model)))
  const named = [...spelled, ...numbered].filter((row) => !makes.size || makes.has(row.make))
  const vehicle = (row: VehicleModel): Vehicle => ({ year, make: row.make, model: row.model })
  if (named.length) return named.length === 1 ? vehicle(named[0]!) : null
  // A model of another make ("2019 Toyota Civic") leaves it unclear which was meant.
  if (spelled.length || makes.size !== 1) return null
  const [make] = makes
  const models = offered.filter((row) => row.make === make)
  return models.length === 1 && !modelAfterMake(text, make!) ? vehicle(models[0]!) : null
}
