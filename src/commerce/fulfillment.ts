// How an order gets from the shelf to the shopper: the steps a fulfillment takes
// in the back office, and what each one changes on its order. Pure rules: no Vue,
// no Pinia, no `@/` imports, so `npm run test:commerce` runs them in Node.

import { checkoutProfile } from '../storefront/checkoutProfile.ts'

/**
 * A fulfillment's status, in the order it moves through them. A new one is
 * Picked: its items are allocated to the location that ships them.
 */
export const FULFILLMENT_STATUSES = ['Picked', 'Packed', 'Label Created', 'Shipped', 'Delivered'] as const
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number]

/** The steps the back office shows, as on the live Fulfillment page. */
export const FULFILLMENT_STEPS = ['Pick', 'Pack', 'Pick carrier', 'Ship'] as const

/** The parcel a packed fulfillment leaves in. */
export interface Parcel {
  carrier: string
  /** The carrier's service: "Standard", "Express". */
  service: string
  trackingNumber: string
  /** Centimetres and grams; absent when the merchant left them out. */
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  weightG?: number
}

export interface FulfillmentEvent {
  text: string
  /** ISO date and time. */
  at: string
}

/** What moves as a fulfillment is worked. For a store order it is kept in the browser. */
export interface FulfillmentProgress {
  status: FulfillmentStatus
  parcel: Parcel | null
  shippedAt: string | null
  deliveredAt: string | null
  events: FulfillmentEvent[]
}

export type FulfillmentStep = 'pack' | 'carrier' | 'ship' | 'deliver'

export const STEP_LABELS: Record<FulfillmentStep, string> = {
  pack: 'Pack',
  carrier: 'Pick carrier',
  ship: 'Mark shipped',
  deliver: 'Mark delivered',
}

/** The number a fulfillment goes by in the back office: FF-0007, FF-20001. */
export function fulfillmentNumber(id: number): string {
  return `FF-${String(id).padStart(4, '0')}`
}

/** A fulfillment as the system creates it for a new order. */
export function startProgress(location: string, at: string): FulfillmentProgress {
  return {
    status: 'Picked',
    parcel: null,
    shippedAt: null,
    deliveredAt: null,
    events: [{ text: `Fulfillment created, items picked at ${location}`, at }],
  }
}

/** The one step that can be taken next, or `null` once the parcel is delivered. */
export function nextStep(status: FulfillmentStatus): FulfillmentStep | null {
  switch (status) {
    case 'Picked': return 'pack'
    case 'Packed': return 'carrier'
    case 'Label Created': return 'ship'
    case 'Shipped': return 'deliver'
    default: return null
  }
}

/** Where the step indicator stands (1-based): the step to do next; past the last one when everything is done. */
export function stepPosition(status: FulfillmentStatus): number {
  return Math.min(FULFILLMENT_STATUSES.indexOf(status) + 2, FULFILLMENT_STEPS.length + 1)
}

function moved(progress: FulfillmentProgress, change: Partial<FulfillmentProgress>, text: string, at: string): FulfillmentProgress {
  return { ...progress, ...change, events: [...progress.events, { text, at }] }
}

/** Items are in the box. `null` when packing is not the next step. */
export function pack(progress: FulfillmentProgress, at: string): FulfillmentProgress | null {
  if (nextStep(progress.status) !== 'pack') return null
  return moved(progress, { status: 'Packed' }, 'Items packed', at)
}

/** What is wrong with a parcel's details, field by field. Empty when it can go out. */
export function parcelProblems(parcel: Parcel): Partial<Record<keyof Parcel, string>> {
  const problems: Partial<Record<keyof Parcel, string>> = {}
  if (!parcel.carrier.trim()) problems.carrier = 'Choose a carrier.'
  if (!parcel.trackingNumber.trim()) problems.trackingNumber = 'Enter the tracking number from the label.'
  for (const key of ['lengthCm', 'widthCm', 'heightCm', 'weightG'] as const) {
    const value = parcel[key]
    if (value !== undefined && !(value > 0)) problems[key] = 'Enter a number above 0, or leave it empty.'
  }
  return problems
}

/** A carrier is chosen and the label is made. `null` when that is not the next step or the parcel has a problem. */
export function pickCarrier(progress: FulfillmentProgress, parcel: Parcel, at: string): FulfillmentProgress | null {
  if (nextStep(progress.status) !== 'carrier' || Object.keys(parcelProblems(parcel)).length) return null
  const clean: Parcel = { ...parcel, carrier: parcel.carrier.trim(), service: parcel.service.trim() || 'Standard', trackingNumber: parcel.trackingNumber.trim() }
  return moved(progress, { status: 'Label Created', parcel: clean }, `Label created with ${clean.carrier}, tracking ${clean.trackingNumber}`, at)
}

/** The carrier has the parcel. `null` when shipping is not the next step. */
export function ship(progress: FulfillmentProgress, at: string): FulfillmentProgress | null {
  if (nextStep(progress.status) !== 'ship' || !progress.parcel) return null
  return moved(progress, { status: 'Shipped', shippedAt: at }, `Shipped with ${progress.parcel.carrier}`, at)
}

/**
 * Ships a fulfillment in one go from wherever it stands, for "Mark shipped" on a
 * list: the steps not yet taken are recorded on the way. `null` when it has
 * already shipped or the parcel has a problem.
 */
export function shipNow(progress: FulfillmentProgress, parcel: Parcel, at: string): FulfillmentProgress | null {
  let current: FulfillmentProgress | null = progress
  if (current.status === 'Picked') current = pack(current, at)
  if (current?.status === 'Packed') current = pickCarrier(current, parcel, at)
  return current?.status === 'Label Created' ? ship(current, at) : null
}

/** The shopper has the parcel. `null` when it has not shipped yet or was already delivered. */
export function deliver(progress: FulfillmentProgress, at: string): FulfillmentProgress | null {
  if (nextStep(progress.status) !== 'deliver') return null
  return moved(progress, { status: 'Delivered', deliveredAt: at }, 'Delivered', at)
}

/** What a fulfillment's status means on its order. */
export interface OrderFulfillmentView {
  /** The order's fulfillment status: Not Ready, Ready For Fulfillment, Shipped. */
  fulfillmentStatus: 'Not Ready' | 'Ready For Fulfillment' | 'Shipped'
  /** The order page's step: Picked, Pack, Carrier, Shipped. */
  fulfillmentStage: 'Picked' | 'Pack' | 'Carrier' | 'Shipped'
  /** Each line's status. */
  lineStatus: 'Processing' | 'Shipped'
  /** A delivered order is complete. */
  completed: boolean
  trackingNumber: string | null
  courier: string | null
}

export function orderView(progress: FulfillmentProgress): OrderFulfillmentView {
  const sent = progress.status === 'Shipped' || progress.status === 'Delivered'
  return {
    fulfillmentStatus: sent ? 'Shipped' : progress.status === 'Label Created' ? 'Ready For Fulfillment' : 'Not Ready',
    fulfillmentStage: sent ? 'Shipped' : progress.status === 'Label Created' ? 'Carrier' : progress.status === 'Packed' ? 'Pack' : 'Picked',
    lineStatus: sent ? 'Shipped' : 'Processing',
    completed: progress.status === 'Delivered',
    // The number is on the order once the label exists, but the shopper is only told when it ships.
    trackingNumber: progress.parcel?.trackingNumber ?? null,
    courier: progress.parcel?.carrier ?? null,
  }
}

/** An order that was cancelled or fully refunded is not sent. */
export function canFulfill(orderStatus: string): boolean {
  return !/^(cancelled|refunded)$/i.test(orderStatus)
}

/** The order fulfillment statuses a fulfillment's progress stands for: the ones `orderView` gives. */
const PROGRESS_STATUSES = new Set<string>(['Not Ready', 'Ready For Fulfillment', 'Shipped'])

/** What an order's page shows of its fulfillment. */
export interface ShownFulfillment {
  /** The chip: "Picked", "Label Created", or the order's own "Not Ready". */
  status: string
  stage: OrderFulfillmentView['fulfillmentStage']
  /** Each line's status; `null` shows the line's own. */
  lineStatus: OrderFulfillmentView['lineStatus'] | null
  tracking: { number: string; courier: string | null } | null
}

/**
 * What an order shows of its fulfillment. Where it has one, the order reads as its
 * fulfillment does (order #20001 is Picked, as FF-20001 is), and so do its step,
 * its lines and its tracking. Only the display follows: the order keeps its data.
 * A cancelled or refunded order, an order whose own status is one a fulfillment
 * does not track (Unapproved, Return Requested, Cancelled), and an order with no
 * fulfillment show their own.
 */
export function shownFulfillment(
  order: { status: string; fulfillmentStatus: string; fulfillmentStage: OrderFulfillmentView['fulfillmentStage']; trackingNumber: string | null; courier: string | null },
  fulfillment?: FulfillmentProgress | null,
): ShownFulfillment {
  if (!fulfillment || !canFulfill(order.status) || !PROGRESS_STATUSES.has(order.fulfillmentStatus)) {
    return {
      status: order.fulfillmentStatus,
      stage: order.fulfillmentStage,
      lineStatus: null,
      tracking: order.trackingNumber ? { number: order.trackingNumber, courier: order.courier } : null,
    }
  }
  const view = orderView(fulfillment)
  return {
    status: fulfillment.status,
    stage: view.fulfillmentStage,
    lineStatus: view.lineStatus,
    tracking: view.trackingNumber ? { number: view.trackingNumber, courier: view.courier } : null,
  }
}

/** The account's warehouses outside the United States, by the country each is in. */
export const WAREHOUSES_ABROAD: Readonly<Record<string, string>> = { Sweden: 'Stockholm warehouse' }

/**
 * Where a store order ships from. A store whose checkout is at home in a country
 * where the account has a warehouse ships from it: a store that sells in Swedish
 * kronor has a Swedish checkout, so its orders leave Stockholm. Any other store
 * ships from where the product is stocked, else from `fallback`.
 *
 * @param currency What the shopper paid in: the store's currency, which sets its checkout.
 * @param stockedAt Where the product bought is stocked, when the store has products of its own.
 */
export function shipsFrom(currency: string | undefined, stockedAt: string | undefined, fallback: string): string {
  const home = checkoutProfile(currency).countries[0]
  return (home && WAREHOUSES_ABROAD[home]) || stockedAt || fallback
}

const CARRIERS_BY_COUNTRY: Record<string, string[]> = {
  Sweden: ['PostNord', 'DHL', 'Budbee', 'DB Schenker'],
  'United States': ['UPS', 'USPS', 'FedEx', 'DHL'],
}
const CARRIERS_ELSEWHERE = ['DHL', 'UPS', 'FedEx']

/** The carriers offered for a destination country, the usual one first. */
export function carriersFor(country: string): string[] {
  return CARRIERS_BY_COUNTRY[country] ?? CARRIERS_ELSEWHERE
}

/**
 * A tracking number to start from, so the merchant need not invent one in a
 * demo. The same order and carrier always give the same number.
 */
export function suggestedTracking(carrier: string, orderId: number): string {
  const digits = String((orderId * 7919 + 104729) % 1_000_000_000).padStart(9, '0')
  if (carrier === 'UPS') return `1Z${digits}`
  if (carrier === 'PostNord') return `${digits}SE`
  return `${carrier.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}${digits}`
}

/** The parcel "Mark shipped" sends when the merchant gave no details. */
export function defaultParcel(country: string, orderId: number, trackingNumber?: string): Parcel {
  const carrier = carriersFor(country)[0]!
  return { carrier, service: 'Standard', trackingNumber: trackingNumber?.trim() || suggestedTracking(carrier, orderId) }
}

function isParcel(value: unknown): value is Parcel {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return typeof p.carrier === 'string' && typeof p.service === 'string' && typeof p.trackingNumber === 'string'
}

export function isFulfillmentProgress(value: unknown): value is FulfillmentProgress {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (FULFILLMENT_STATUSES as readonly unknown[]).includes(p.status)
    && (p.parcel === null || isParcel(p.parcel))
    && (p.shippedAt === null || typeof p.shippedAt === 'string')
    && (p.deliveredAt === null || typeof p.deliveredAt === 'string')
    && Array.isArray(p.events)
    && p.events.every((e) => typeof e === 'object' && e !== null && typeof (e as FulfillmentEvent).text === 'string' && typeof (e as FulfillmentEvent).at === 'string')
}

/** The saved progress of store orders, by `<account>:<order id>`. */
export function isProgressMap(value: unknown): value is Record<string, FulfillmentProgress> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every(isFulfillmentProgress)
}
