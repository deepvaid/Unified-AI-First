// Editing a part on its page in Products. Its fitment: the vehicles a row can name
// (Make, then Model, then the model's years), what stops a row being added (a
// field left empty, or a row the part already lists), and the list's edits. Rows
// are kept in one order: make, model, then year. And its specifications: the
// name and value rows the product page's Specifications table shows. Pure rules:
// no Vue, no Pinia, no `@/` imports, so `npm run test:storefront` runs them in Node.

import { VEHICLES } from './vehicles.ts'
import type { VehicleModel } from './vehicles.ts'
import type { Fitment, FitmentRow } from './fitment.ts'

/** The positions a row may name; a row without one fits the vehicle wherever it goes. */
export const FITMENT_POSITIONS = ['Front', 'Rear'] as const

/**
 * The positions a part's rows can name: the values of its Position option that
 * are front or rear. None for a part sold without one, so its form asks no position.
 */
export function positionsFor(options: readonly { name: string; values: readonly string[] }[]): string[] {
  const option = options.find((entry) => entry.name.trim().toLowerCase() === 'position')
  return FITMENT_POSITIONS.filter((position) => option?.values.includes(position))
}

/** The longest note a row takes; the table shows it in one line. */
export const NOTE_MAX = 80

/** A row as the Add vehicle form holds it, before it is checked. */
export interface FitmentDraft {
  make: string
  model: string
  yearFrom: number | null
  yearTo: number | null
  /** '' for none. */
  position: string
  note: string
}

export type FitmentDraftErrors = Partial<Record<keyof FitmentDraft, string>>

export function emptyDraft(): FitmentDraft {
  return { make: '', model: '', yearFrom: null, yearTo: null, position: '', note: '' }
}

// ── How a row reads ──────────────────────────────────────────────────────────

/** "2015–2020", or "2019" for a single year. */
export function yearsLabel(row: Pick<FitmentRow, 'yearFrom' | 'yearTo'>): string {
  return row.yearFrom === row.yearTo ? String(row.yearFrom) : `${row.yearFrom}–${row.yearTo}`
}

/** "2015–2020 Ford F-150". */
export function rowLabel(row: FitmentRow): string {
  return `${yearsLabel(row)} ${row.make} ${row.model}`
}

/** The row's label with its position, so a front row and a rear row never read the same: "2015–2020 Ford F-150 (Front)". */
export function rowName(row: FitmentRow): string {
  return row.position ? `${rowLabel(row)} (${row.position})` : rowLabel(row)
}

/** "1 row", "11 rows". A row is one model over a run of years, so a model can take several. */
export function rowsLabel(count: number): string {
  return `${count} ${count === 1 ? 'row' : 'rows'}`
}

/** How many models the rows name, and in how many rows: "5 models · 11 rows". */
export function fitmentSummary(rows: readonly FitmentRow[]): string {
  const models = new Set(rows.map((row) => `${row.make}|${row.model}`)).size
  return `${models} ${models === 1 ? 'model' : 'models'} · ${rowsLabel(rows.length)}`
}

// ── The choices: Make, then Model, then years ────────────────────────────────

/** Every make in the vehicle table, A to Z. */
export function fitmentMakes(table: readonly VehicleModel[] = VEHICLES): string[] {
  return [...new Set(table.map((row) => row.make))].sort((a, b) => a.localeCompare(b))
}

/** The models of a make, A to Z. */
export function fitmentModels(make: string, table: readonly VehicleModel[] = VEHICLES): string[] {
  return table.filter((row) => row.make === make).map((row) => row.model).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/** The years a model is offered in, oldest first; none for a model the table doesn't list. */
export function modelYears(make: string, model: string, table: readonly VehicleModel[] = VEHICLES): number[] {
  const entry = table.find((row) => row.make === make && row.model === model)
  if (!entry) return []
  return Array.from({ length: entry.yearTo - entry.yearFrom + 1 }, (_, i) => entry.yearFrom + i)
}

// ── Order and overlap ────────────────────────────────────────────────────────

const POSITION_ORDER = ['', ...FITMENT_POSITIONS] as string[]
const positionRank = (row: FitmentRow) => {
  const rank = POSITION_ORDER.indexOf(row.position ?? '')
  return rank < 0 ? POSITION_ORDER.length : rank
}

/** Make, then model, then the first and last year, then position (none, front, rear). */
export function compareRows(a: FitmentRow, b: FitmentRow): number {
  return a.make.localeCompare(b.make)
    || a.model.localeCompare(b.model, undefined, { numeric: true })
    || a.yearFrom - b.yearFrom
    || a.yearTo - b.yearTo
    || positionRank(a) - positionRank(b)
    || (a.note ?? '').localeCompare(b.note ?? '')
}

export function sortRows(rows: readonly FitmentRow[]): FitmentRow[] {
  return [...rows].sort(compareRows)
}

/** A row with no position fits either end, so it meets a front row and a rear row; front and rear never meet. */
function positionsMeet(a: FitmentRow, b: FitmentRow): boolean {
  return !a.position || !b.position || a.position === b.position
}

/** Two rows say the same thing twice: same make and model, positions that meet, and years that meet. */
export function rowsOverlap(a: FitmentRow, b: FitmentRow): boolean {
  return a.make === b.make && a.model === b.model && positionsMeet(a, b)
    && a.yearFrom <= b.yearTo && b.yearFrom <= a.yearTo
}

/** The row already listed that this one would repeat, if any. */
export function overlapping(rows: readonly FitmentRow[], row: FitmentRow): FitmentRow | undefined {
  return rows.find((listed) => rowsOverlap(listed, row))
}

// ── Checking a new row ───────────────────────────────────────────────────────

/** The row the draft makes: note trimmed, and no position or note when they are blank. */
export function rowFromDraft(draft: FitmentDraft): FitmentRow {
  const note = draft.note.trim()
  return {
    make: draft.make,
    model: draft.model,
    yearFrom: draft.yearFrom ?? 0,
    yearTo: draft.yearTo ?? 0,
    ...(draft.position ? { position: draft.position } : {}),
    ...(note ? { note } : {}),
  }
}

/**
 * What stops the draft being added, by field; empty when it can be. A row the
 * part already lists, or one whose years and position meet a listed row of the
 * same model (no position meets front and rear), is refused on its model: "This part already lists the 2015–2020 Ford F-150"
 * (the model field is the form's full width, so the message reads on one line).
 */
export function draftErrors(draft: FitmentDraft, rows: readonly FitmentRow[], table: readonly VehicleModel[] = VEHICLES): FitmentDraftErrors {
  const errors: FitmentDraftErrors = {}
  if (!draft.make) errors.make = 'Choose a make'
  else if (!fitmentMakes(table).includes(draft.make)) errors.make = 'Choose a make from the list'

  const years = draft.make && draft.model ? modelYears(draft.make, draft.model, table) : []
  if (!draft.model) errors.model = 'Choose a model'
  else if (!errors.make && !years.length) errors.model = `Choose a ${draft.make} model from the list`

  const first = years[0]
  const last = years[years.length - 1]
  const inRun = (year: number) => first !== undefined && last !== undefined && year >= first && year <= last
  if (draft.yearFrom === null) errors.yearFrom = 'Choose the first year'
  else if (years.length && !inRun(draft.yearFrom)) errors.yearFrom = `Choose a year from ${first} to ${last}`
  if (draft.yearTo === null) errors.yearTo = 'Choose the last year'
  else if (years.length && !inRun(draft.yearTo)) errors.yearTo = `Choose a year from ${first} to ${last}`
  else if (draft.yearFrom !== null && draft.yearTo < draft.yearFrom) errors.yearTo = `Choose ${draft.yearFrom} or later`

  if (draft.position && !(FITMENT_POSITIONS as readonly string[]).includes(draft.position)) errors.position = 'Choose Front, Rear or no position'
  if (draft.note.trim().length > NOTE_MAX) errors.note = `Keep the note to ${NOTE_MAX} characters`

  if (!Object.keys(errors).length) {
    const repeated = overlapping(rows, rowFromDraft(draft))
    if (repeated) errors.model = `This part already lists the ${rowName(repeated)}`
  }
  return errors
}

// ── The list's edits ─────────────────────────────────────────────────────────
// Each returns a new list, in order.

/** A row's identity in the list: everything it says. */
export function rowKey(row: FitmentRow): string {
  return [row.make, row.model, row.yearFrom, row.yearTo, row.position ?? '', row.note ?? ''].join('|')
}

export function addRow(rows: readonly FitmentRow[], row: FitmentRow): FitmentRow[] {
  return sortRows([...rows, row])
}

/** The list without the rows whose keys are given. */
export function removeRows(rows: readonly FitmentRow[], keys: Iterable<string>): FitmentRow[] {
  const gone = new Set(keys)
  return sortRows(rows.filter((row) => !gone.has(rowKey(row))))
}

/** Lowercase letters and digits only, so "F-150", "f150" and "F 150" match. */
function compact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** The rows whose make and model hold every word searched for ("ford", "f150", "toyota rav"). */
export function searchRows(rows: readonly FitmentRow[], query: string): FitmentRow[] {
  const words = query.split(/\s+/).map(compact).filter(Boolean)
  if (!words.length) return [...rows]
  return rows.filter((row) => {
    const name = compact(`${row.make} ${row.model}`)
    return words.every((word) => name.includes(word))
  })
}

/** A part that fits every vehicle lists none. */
export function universalFitment(): Fitment {
  return { universal: true, rows: [] }
}

/** A part that fits the vehicles listed. */
export function listedFitment(rows: readonly FitmentRow[]): Fitment {
  return { universal: false, rows: sortRows(rows) }
}

// ── A part's specifications ──────────────────────────────────────────────────
// Facts that hold whatever the vehicle ("Friction material: Ceramic"), shown as
// the product page's Specifications table.

/** One specification row, as `detail.specs` holds it. */
export interface PartSpec {
  label: string
  value: string
}

/** What each row is missing: a name beside a value, or a value beside a name. A row left empty is dropped, not refused. */
export function specErrors(specs: readonly PartSpec[]): { label: string; value: string }[] {
  return specs.map((spec) => {
    const label = spec.label.trim()
    const value = spec.value.trim()
    return {
      label: !label && value ? 'Add a name' : '',
      value: label && !value ? 'Add a value' : '',
    }
  })
}

/** The rows as they are saved: trimmed, and the empty ones dropped. */
export function cleanSpecs(specs: readonly PartSpec[]): PartSpec[] {
  return specs
    .map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() }))
    .filter((spec) => spec.label || spec.value)
}
