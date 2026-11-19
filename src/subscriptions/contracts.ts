// Subscriptions after the checkout: what one is, what a shopper or a merchant can
// do with it, and what each action changes. Pure rules, like plans.ts beside it:
// no Vue, no Pinia, no `@/` imports, so `npm run test:subscriptions` runs them.
//
// A checkout line bought on a plan starts one subscription ("contract" in the
// build prompt, S8). Every action returns a changed copy with a line added to its
// history, so the shopper's page and the admin show the same story. Renewals are
// charged by hand ("Charge now"): there is no scheduler and no retry schedule yet.

import { fromDecimal, money, toDecimal } from '../maropay/money.ts'
import type { Money } from '../maropay/money.ts'
import { deliverySummary, linePlan, nextChargeDate, pricePerDelivery } from './plans.ts'
import type { LinePlan, SubscriptionPlan } from './plans.ts'

export type ContractStatus = 'Active' | 'Paused' | 'Cancelled' | 'Payment failed'
export const CONTRACT_STATUSES: readonly ContractStatus[] = ['Active', 'Paused', 'Cancelled', 'Payment failed']

/** Who did it: the subscriber on the store, or the merchant in the admin. */
export type ContractActor = 'customer' | 'merchant'

export interface ContractOrder {
  id: number
  number: string
}

export interface ContractEvent {
  /** "YYYY-MM-DD" */
  date: string
  text: string
  actor: ContractActor
  /** The order this event placed: the first one, or a renewal. */
  order?: ContractOrder
}

export interface ContractAddress {
  line1: string
  city: string
  region: string
  postalCode: string
  country: string
}

export interface SubscriptionContract {
  id: string
  /** As people say it: "S-1001". */
  number: string
  channelId: string
  customer: { name: string; email: string; address?: ContractAddress }
  productId: number | null
  product: string
  sku: string
  /** How many of the plan's deliveries each charge buys; almost always 1. */
  qty: number
  /** The plan as it was bought or last changed. A later edit of the plan does not reach back. */
  plan: LinePlan
  /** One delivery, exact, as a decimal string ("585.90"). */
  price: string
  currency: string
  /** "Visa •••• 4242" */
  paymentMethod: string
  methodId: string
  status: ContractStatus
  startedOn: string
  /** The next charge. Kept while paused (it comes back on resume); null once cancelled. */
  nextChargeOn: string | null
  cancelReason?: string
  /** Newest first. */
  history: ContractEvent[]
}

export const CANCEL_REASONS = ['Too expensive', 'I have too much left', 'I no longer need it', 'Delivery problems', 'Something else'] as const

export type ContractAction = 'skip' | 'reschedule' | 'pause' | 'resume' | 'changePlan' | 'charge' | 'retry' | 'cancel'

/** What a subscription's status lets anyone do with it. The shopper's page offers the ones a shopper may. */
export function allowedActions(contract: Pick<SubscriptionContract, 'status'>): ContractAction[] {
  switch (contract.status) {
    case 'Active': return ['skip', 'reschedule', 'pause', 'changePlan', 'charge', 'cancel']
    case 'Paused': return ['resume', 'cancel']
    case 'Payment failed': return ['retry', 'cancel']
    case 'Cancelled': return []
  }
}

/** "2027-02-18" → "18 Feb 2027". */
export function dayLabel(date: string): string {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** What one charge takes: the price of a delivery times the quantity. */
export function chargeAmount(contract: Pick<SubscriptionContract, 'price' | 'qty' | 'currency'>): Money {
  return money(fromDecimal(contract.price, contract.currency).amount * contract.qty, contract.currency)
}

function withEvent(contract: SubscriptionContract, changes: Partial<SubscriptionContract>, event: ContractEvent): SubscriptionContract {
  return { ...contract, ...changes, history: [event, ...contract.history] }
}

// ── Starting one ─────────────────────────────────────────────────────────────

export interface ContractStart {
  id: string
  number: string
  channelId: string
  customer: SubscriptionContract['customer']
  productId: number | null
  line: { product: string; sku: string; qty: number; price: string; plan: LinePlan }
  currency: string
  paymentMethod: string
  methodId: string
  order: ContractOrder
  /** The day of the checkout, which is also the first charge. */
  date: string
}

/** The subscription a checkout line bought on a plan starts. */
export function contractFromLine(start: ContractStart): SubscriptionContract {
  return {
    id: start.id,
    number: start.number,
    channelId: start.channelId,
    customer: start.customer,
    productId: start.productId,
    product: start.line.product,
    sku: start.line.sku,
    qty: start.line.qty,
    plan: { ...start.line.plan },
    price: start.line.price,
    currency: start.currency,
    paymentMethod: start.paymentMethod,
    methodId: start.methodId,
    status: 'Active',
    startedOn: start.date,
    nextChargeOn: nextChargeDate(start.date, start.line.plan),
    history: [{ date: start.date, text: `Subscription started with order ${start.order.number}`, actor: 'customer', order: start.order }],
  }
}

/** The number after the highest one in use: "S-1009" after "S-1008". */
export function nextContractNumber(contracts: Pick<SubscriptionContract, 'number'>[]): string {
  const highest = contracts.reduce((max, c) => Math.max(max, Number(/^S-(\d+)$/.exec(c.number)?.[1] ?? 0)), 1000)
  return `S-${highest + 1}`
}

// ── Actions ──────────────────────────────────────────────────────────────────

/** Skips the coming delivery: the next charge moves one interval on. */
export function skipNext(contract: SubscriptionContract, today: string, actor: ContractActor): SubscriptionContract {
  if (contract.status !== 'Active' || !contract.nextChargeOn) return contract
  const next = nextChargeDate(contract.nextChargeOn, contract.plan)
  return withEvent(contract, { nextChargeOn: next }, {
    date: today, actor, text: `Skipped the delivery of ${dayLabel(contract.nextChargeOn)}. Next charge ${dayLabel(next)}`,
  })
}

/** Why a new charge date can't be used, or null when it can. */
export function rescheduleError(date: string, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return 'Choose a date.'
  return date > today ? null : 'Choose a date after today.'
}

/** Moves the next charge to a chosen day. Later charges follow from it. */
export function reschedule(contract: SubscriptionContract, date: string, today: string, actor: ContractActor): SubscriptionContract {
  if (contract.status !== 'Active' || rescheduleError(date, today) || date === contract.nextChargeOn) return contract
  return withEvent(contract, { nextChargeOn: date }, { date: today, actor, text: `Next charge moved to ${dayLabel(date)}` })
}

export function pause(contract: SubscriptionContract, today: string, actor: ContractActor): SubscriptionContract {
  if (contract.status !== 'Active') return contract
  return withEvent(contract, { status: 'Paused' }, { date: today, actor, text: 'Paused. Nothing is charged or sent until it is resumed' })
}

/** Resumes a paused subscription. A charge date that passed while it was paused becomes today. */
export function resume(contract: SubscriptionContract, today: string, actor: ContractActor): SubscriptionContract {
  if (contract.status !== 'Paused') return contract
  const next = contract.nextChargeOn && contract.nextChargeOn > today ? contract.nextChargeOn : today
  return withEvent(contract, { status: 'Active', nextChargeOn: next }, { date: today, actor, text: `Resumed. Next charge ${dayLabel(next)}` })
}

/** Moves the subscription to another plan of the same product, at that plan's price for the product's unit price today. */
export function changePlan(contract: SubscriptionContract, plan: SubscriptionPlan, unit: Money, today: string, actor: ContractActor): SubscriptionContract {
  if (contract.status !== 'Active' || plan.id === contract.plan.id) return contract
  return withEvent(contract, { plan: linePlan(plan), price: toDecimal(pricePerDelivery(unit, plan)) }, {
    date: today, actor, text: `Plan changed from ${contract.plan.name} to ${plan.name} (${deliverySummary(plan)})`,
  })
}

export function cancel(contract: SubscriptionContract, reason: string, today: string, actor: ContractActor): SubscriptionContract {
  if (contract.status === 'Cancelled' || !reason.trim()) return contract
  return withEvent(contract, { status: 'Cancelled', nextChargeOn: null, cancelReason: reason.trim() }, {
    date: today, actor, text: `Cancelled. Reason: ${reason.trim()}`,
  })
}

/**
 * A renewal was charged and its order placed. Charged early, the following charge
 * keeps its place (one interval after the date that was due); charged late, after
 * a failed payment, it counts from the day the money was taken.
 */
export function recordRenewal(contract: SubscriptionContract, order: ContractOrder, chargedOn: string, actor: ContractActor): SubscriptionContract {
  if (contract.status === 'Cancelled' || contract.status === 'Paused') return contract
  const due = contract.nextChargeOn && contract.nextChargeOn > chargedOn ? contract.nextChargeOn : chargedOn
  const next = nextChargeDate(due, contract.plan)
  return withEvent(contract, { status: 'Active', nextChargeOn: next }, {
    date: chargedOn, actor, order, text: `Renewal charged to ${contract.paymentMethod}: order ${order.number}. Next charge ${dayLabel(next)}`,
  })
}

// ── Lists ────────────────────────────────────────────────────────────────────

const SHOPPER_ORDER: Record<ContractStatus, number> = { 'Payment failed': 0, Active: 1, Paused: 2, Cancelled: 3 }

/** One shopper's subscriptions in a store: what needs them first, cancelled ones last. */
export function contractsFor(contracts: SubscriptionContract[], channelId: string, email: string): SubscriptionContract[] {
  const wanted = email.trim().toLowerCase()
  return contracts
    .filter((c) => c.channelId === channelId && c.customer.email.toLowerCase() === wanted)
    .sort((a, b) => SHOPPER_ORDER[a.status] - SHOPPER_ORDER[b.status])
}

export function statusCounts(contracts: Pick<SubscriptionContract, 'status'>[]): Record<ContractStatus, number> {
  const counts: Record<ContractStatus, number> = { Active: 0, Paused: 0, Cancelled: 0, 'Payment failed': 0 }
  for (const c of contracts) counts[c.status] += 1
  return counts
}

/** The subscription an order started or renewed, if any. */
export function contractOfOrder(contracts: SubscriptionContract[], orderId: number): SubscriptionContract | undefined {
  return contracts.find((c) => c.history.some((e) => e.order?.id === orderId))
}
