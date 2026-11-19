// Subscription plans: what a plan is, what a delivery costs, how it reads, and
// when it is charged. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:subscriptions` runs them in Node.
//
// This is the plans half of subscriptions. Contracts, renewals, skipping and the
// subscriber's own page come later (docs/store-builder/bkm-build-prompt.md, S8).

import { exponentOf, money } from '../maropay/money.ts'
import type { Money } from '../maropay/money.ts'

export type IntervalUnit = 'week' | 'month'
export type PlanStatus = 'Active' | 'Paused'

export interface SubscriptionPlan {
  id: string
  /** The store that sells it. */
  channelId: string
  name: string
  /** A delivery every `intervalCount` weeks or months. */
  intervalCount: number
  intervalUnit: IntervalUnit
  /** Units of the product in each delivery: a 3-month supply sends 3. */
  unitsPerDelivery: number
  /** Percent off the one-time unit price. */
  discountPct: number
  /** Shown as a badge. Shipping is free on every order until rates exist (S10). */
  freeShipping: boolean
  /** Short lines under the option on the product page. */
  benefits: string[]
  /** The products it can be bought for. */
  productIds: number[]
  /** Preselected on the product page. One per store. */
  isDefault: boolean
  /** A paused plan is not offered to shoppers. */
  status: PlanStatus
}

/** What the merchant fills in: a plan without its id and store. */
export type PlanInput = Omit<SubscriptionPlan, 'id' | 'channelId'>

/** The id of the option that is not a plan. */
export const ONE_TIME = 'one-time'

// ── Price ────────────────────────────────────────────────────────────────────

/**
 * What one delivery costs. The discount comes off one unit and is rounded to
 * the currency's smallest unit; a delivery is that price times its units.
 * 279,00 kr at 30% off is 195,30 kr, so three units are 585,90 kr.
 */
export function pricePerDelivery(unit: Money, plan: Pick<SubscriptionPlan, 'discountPct' | 'unitsPerDelivery'>): Money {
  const discounted = Math.round((unit.amount * (100 - plan.discountPct)) / 100)
  return money(discounted * plan.unitsPerDelivery, unit.currency)
}

/** The same units bought one at a time: the price a plan's saving is measured against. */
export function fullPricePerDelivery(unit: Money, plan: Pick<SubscriptionPlan, 'unitsPerDelivery'>): Money {
  return money(unit.amount * plan.unitsPerDelivery, unit.currency)
}

/** Currencies that shops write without decimals, whatever the amount. */
const WHOLE_UNIT_CURRENCIES = ['SEK']

/**
 * An amount as a shop shows it. Swedish shops show whole kronor, so 585,90 kr
 * reads "586 kr". Only the display is rounded: the order keeps the exact amount.
 */
export function roundForDisplay(amount: Money): Money {
  if (!WHOLE_UNIT_CURRENCIES.includes(amount.currency)) return amount
  const scale = 10 ** exponentOf(amount.currency)
  return money(Math.round(amount.amount / scale) * scale, amount.currency)
}

// ── Wording ──────────────────────────────────────────────────────────────────

type Interval = Pick<SubscriptionPlan, 'intervalCount' | 'intervalUnit'>

/** "every month", "every 3 months", "every 2 weeks". */
export function intervalLabel(plan: Interval): string {
  return plan.intervalCount === 1 ? `every ${plan.intervalUnit}` : `every ${plan.intervalCount} ${plan.intervalUnit}s`
}

/** "3 units every 3 months", "1 unit every month". */
export function deliverySummary(plan: Interval & Pick<SubscriptionPlan, 'unitsPerDelivery'>): string {
  return `${plan.unitsPerDelivery} ${plan.unitsPerDelivery === 1 ? 'unit' : 'units'} ${intervalLabel(plan)}`
}

// ── Dates ────────────────────────────────────────────────────────────────────

/**
 * The charge after the one on `from` (a date, or the start of an ISO timestamp),
 * as "YYYY-MM-DD". The first charge is the checkout itself. A month that is too
 * short ends the charge on its last day: 31 January, monthly, is 28 February.
 */
export function nextChargeDate(from: string, plan: Interval): string {
  const [year = 1970, month = 1, day = 1] = from.slice(0, 10).split('-').map(Number)
  if (plan.intervalUnit === 'week') {
    return new Date(Date.UTC(year, month - 1, day + 7 * plan.intervalCount)).toISOString().slice(0, 10)
  }
  const target = month - 1 + plan.intervalCount
  const lastDay = new Date(Date.UTC(year, target + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, target, Math.min(day, lastDay))).toISOString().slice(0, 10)
}

// ── What a shopper is offered ────────────────────────────────────────────────

/** The plans a shopper can pick for a product in a store: active ones, the preselected one first. */
export function plansForProduct(plans: SubscriptionPlan[], channelId: string, productId: number): SubscriptionPlan[] {
  return plans
    .filter((p) => p.channelId === channelId && p.status === 'Active' && p.productIds.includes(productId))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

export interface PurchaseOption {
  /** The plan's id, or ONE_TIME. */
  id: string
  plan: SubscriptionPlan | null
  name: string
  /** What the shopper pays per delivery; the unit price for a one-time purchase. */
  price: Money
  /** The same units at full price, when the plan is cheaper. */
  compareAt: Money | null
}

/** A product's options in the order a shopper reads them: its plans, then buying once. */
export function purchaseOptions(unit: Money, plans: SubscriptionPlan[]): PurchaseOption[] {
  const subscribed = plans.map((plan): PurchaseOption => ({
    id: plan.id,
    plan,
    name: plan.name,
    price: pricePerDelivery(unit, plan),
    compareAt: plan.discountPct > 0 ? fullPricePerDelivery(unit, plan) : null,
  }))
  return [...subscribed, { id: ONE_TIME, plan: null, name: 'One-time purchase', price: unit, compareAt: null }]
}

/** The option chosen when the page opens: the preselected plan, else buying once. */
export function defaultOptionId(options: PurchaseOption[]): string {
  return options.find((o) => o.plan?.isDefault)?.id ?? ONE_TIME
}

// ── What a cart line and an order line keep ──────────────────────────────────

/** The plan as it was when the shopper chose it. A later edit to the plan does not change an order. */
export interface LinePlan {
  id: string
  name: string
  intervalCount: number
  intervalUnit: IntervalUnit
  unitsPerDelivery: number
  freeShipping: boolean
}

export function linePlan(plan: SubscriptionPlan): LinePlan {
  const { id, name, intervalCount, intervalUnit, unitsPerDelivery, freeShipping } = plan
  return { id, name, intervalCount, intervalUnit, unitsPerDelivery, freeShipping }
}

/** A line bought on a plan. `price` is the unit price as a decimal string: here, the price of one delivery. */
export interface PlanLine {
  price: string
  qty: number
  plan?: LinePlan
}

/** What is charged again and how often, one entry per interval, in the order the lines appear. */
export function recurringCharges(lines: PlanLine[], lineTotal: (line: PlanLine) => Money): { interval: string; amount: Money }[] {
  const charges: { interval: string; amount: Money }[] = []
  for (const line of lines) {
    if (!line.plan) continue
    const interval = intervalLabel(line.plan)
    const total = lineTotal(line)
    const same = charges.find((c) => c.interval === interval)
    if (same) same.amount = money(same.amount.amount + total.amount, total.currency)
    else charges.push({ interval, amount: total })
  }
  return charges
}

// ── Validation ───────────────────────────────────────────────────────────────

export type PlanField = 'name' | 'intervalCount' | 'unitsPerDelivery' | 'discountPct' | 'productIds'

const isWhole = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max

/** What stops a plan from being saved, by field. Empty when it can be. */
export function planErrors(plan: PlanInput): Partial<Record<PlanField, string>> {
  const errors: Partial<Record<PlanField, string>> = {}
  if (!plan.name.trim()) errors.name = 'Give the plan a name shoppers will recognise.'
  if (!isWhole(plan.intervalCount, 1, 12)) errors.intervalCount = 'Enter a whole number from 1 to 12.'
  if (!isWhole(plan.unitsPerDelivery, 1, 12)) errors.unitsPerDelivery = 'Enter a whole number from 1 to 12.'
  if (!(plan.discountPct >= 0 && plan.discountPct <= 90)) errors.discountPct = 'Enter a discount from 0 to 90.'
  if (!plan.productIds.length) errors.productIds = 'Pick at least one product.'
  return errors
}
