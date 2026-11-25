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

/** One way a plan sold by delivery options is delivered: how often, and what that takes off the price. */
export interface PlanOption {
  id: string
  intervalCount: number
  intervalUnit: IntervalUnit
  /** Percent off the one-time unit price. */
  discountPct: number
  /** Selected first among the plan's options. One per plan. */
  isDefault: boolean
}

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
  /**
   * Delivery options, for a plan sold by frequency ("Subscribe and save": every 1, 2
   * or 3 months): the shopper picks one, each with its own discount. The plan's own
   * interval and discount then mirror its default option, and a delivery is one unit.
   * Absent: the plan is one fixed delivery (a "3-month supply").
   */
  options?: PlanOption[]
  /** What shoppers read over a plan's delivery options. `name` is then for the merchant only. */
  shopperLabel?: string
  /** On a delivery option as a shopper is offered it (offeredRows): the plan it is an option of. */
  optionOf?: string
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

/** A delivery option, as a plan row (`optionOf`) or on a cart line, an order or a subscription (`byFrequency`). */
type FrequencyMark = { optionOf?: string; byFrequency?: boolean }
const soldByFrequency = (plan: FrequencyMark): boolean => !!plan.optionOf || !!plan.byFrequency

/** "every month", "every 3 months", "every 2 weeks". */
export function intervalLabel(plan: Interval): string {
  return plan.intervalCount === 1 ? `every ${plan.intervalUnit}` : `every ${plan.intervalCount} ${plan.intervalUnit}s`
}

/** "3 units every 3 months", "1 unit every month". A delivery option is its frequency alone: "every 3 months". */
export function deliverySummary(plan: Interval & Pick<SubscriptionPlan, 'unitsPerDelivery'> & FrequencyMark): string {
  if (soldByFrequency(plan)) return intervalLabel(plan)
  return `${plan.unitsPerDelivery} ${plan.unitsPerDelivery === 1 ? 'unit' : 'units'} ${intervalLabel(plan)}`
}

/** What a plan row is called where a shopper or the merchant picks one: a delivery option by its frequency, another plan by its name. */
export function planTitle(plan: Interval & Pick<SubscriptionPlan, 'name'> & FrequencyMark): string {
  return soldByFrequency(plan) ? `Deliver ${intervalLabel(plan)}` : plan.name
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

/** The id a delivery option goes by on a cart line, an order and a subscription. */
export const optionRowId = (planId: string, optionId: string): string => `${planId}~${optionId}`

/** Whether a line's plan id is this plan, or one of its delivery options. */
export const isOnPlan = (linePlanId: string, planId: string): boolean => linePlanId === planId || linePlanId.startsWith(`${planId}~`)

/**
 * A plan as shoppers are offered it. A plan sold by delivery options gives one row
 * per option, named by the plan's shopper label, so a cart line, an order and a
 * subscription hold an option exactly as they hold any other plan. Another plan is
 * its own row.
 */
export function offeredRows(plan: SubscriptionPlan): SubscriptionPlan[] {
  const { options, ...rest } = plan
  if (!options?.length) return [plan]
  return options.map((option): SubscriptionPlan => ({
    ...rest,
    id: optionRowId(plan.id, option.id),
    name: plan.shopperLabel?.trim() || plan.name,
    intervalCount: option.intervalCount,
    intervalUnit: option.intervalUnit,
    discountPct: option.discountPct,
    unitsPerDelivery: 1,
    isDefault: option.isDefault,
    optionOf: plan.id,
  }))
}

/** A plan row by its id: a plan, or one of a plan's delivery options. */
export function planRow(plans: SubscriptionPlan[], id: string): SubscriptionPlan | undefined {
  return plans.flatMap(offeredRows).find((row) => row.id === id) ?? plans.find((plan) => plan.id === id)
}

/**
 * The plans a shopper can pick for a product in a store: active ones, the
 * preselected one first, a plan sold by delivery options as its options.
 */
export function plansForProduct(plans: SubscriptionPlan[], channelId: string, productId: number): SubscriptionPlan[] {
  return plans
    .filter((p) => p.channelId === channelId && p.status === 'Active' && p.productIds.includes(productId))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .flatMap(offeredRows)
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
  /** For a delivery option: the shopper label it sits under ("Subscribe and save"). */
  group?: string
}

/** A product's options: its plans (a plan sold by delivery options as its options), then buying once. */
export function purchaseOptions(unit: Money, plans: SubscriptionPlan[]): PurchaseOption[] {
  const subscribed = plans.map((plan): PurchaseOption => ({
    id: plan.id,
    plan,
    name: planTitle(plan),
    price: pricePerDelivery(unit, plan),
    compareAt: plan.discountPct > 0 ? fullPricePerDelivery(unit, plan) : null,
    ...(plan.optionOf ? { group: plan.name } : {}),
  }))
  return [...subscribed, { id: ONE_TIME, plan: null, name: 'One-time purchase', price: unit, compareAt: null }]
}

/** The delivery options of one plan, as the product page shows them: under the plan's label, with the most they save. */
export interface OptionGroup {
  /** The plan they belong to. */
  planId: string
  label: string
  /** The largest discount among them; 0 when none takes anything off. */
  maxDiscountPct: number
  options: PurchaseOption[]
}

/**
 * How a product's options are laid out. `single` holds the plans of one fixed
 * delivery and buying once, in the order given; each plan sold by delivery
 * options follows as a group. A store with only such plans therefore reads
 * "One-time purchase" first, then "Subscribe and save" with its frequencies.
 */
export function optionLayout(options: PurchaseOption[]): { single: PurchaseOption[]; groups: OptionGroup[] } {
  const groups: OptionGroup[] = []
  for (const option of options) {
    const planId = option.plan?.optionOf
    if (!planId || !option.group) continue
    let group = groups.find((g) => g.planId === planId)
    if (!group) groups.push(group = { planId, label: option.group, maxDiscountPct: 0, options: [] })
    group.options.push(option)
    group.maxDiscountPct = Math.max(group.maxDiscountPct, option.plan!.discountPct)
  }
  return { single: options.filter((option) => !option.group), groups }
}

/**
 * The option chosen when the page opens. A plan of one fixed delivery that is
 * preselected leads, as it always did. Delivery options wait behind buying once
 * unless the store's theme puts the subscription first (`subscriptionFirst`):
 * then the plan's default option is chosen.
 */
export function defaultOptionId(options: PurchaseOption[], subscriptionFirst = false): string {
  const grouped = options.filter((o) => o.group)
  if (subscriptionFirst && grouped.length) return (grouped.find((o) => o.plan?.isDefault) ?? grouped[0]!).id
  return options.find((o) => o.plan?.isDefault && !o.group)?.id ?? ONE_TIME
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
  /** The line is a delivery option of a plan: it reads by its frequency ("every 2 months"), not by units. */
  byFrequency?: true
}

export function linePlan(plan: SubscriptionPlan): LinePlan {
  const { id, name, intervalCount, intervalUnit, unitsPerDelivery, freeShipping } = plan
  return { id, name, intervalCount, intervalUnit, unitsPerDelivery, freeShipping, ...(plan.optionOf ? { byFrequency: true as const } : {}) }
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

// ── Plans sold by delivery options ───────────────────────────────────────────

/** What the merchant fills in for a plan sold by delivery options. */
export interface OptionPlanInput {
  /** For the merchant only; unique in the store. */
  name: string
  /** What shoppers read on the product page and in the cart. */
  shopperLabel: string
  status: PlanStatus
  options: PlanOption[]
  productIds: number[]
}

/** A product can be on this many plans. */
export const MAX_PLANS_PER_PRODUCT = 3
/** A plan can offer this many delivery options. */
export const MAX_PLAN_OPTIONS = 6

/** "Every 3, 6 or 12 months", "Every month", "Every 2 weeks or every month". */
export function optionsSummary(options: PlanOption[]): string {
  if (!options.length) return 'No options'
  const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
  const list = (parts: (string | number)[]) => (parts.length > 1 ? `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}` : String(parts[0]))
  const unit = options[0]!.intervalUnit
  if (options.length === 1 || options.some((o) => o.intervalUnit !== unit)) return sentence(list(options.map(intervalLabel)))
  return `Every ${list(options.map((o) => o.intervalCount))} ${unit}s`
}

/** "10–30%", "20%", or "—" when no option takes anything off. A plan of one fixed delivery reads its own discount. */
export function discountRange(plan: Pick<SubscriptionPlan, 'discountPct' | 'options'>): string {
  const all = plan.options?.length ? plan.options.map((o) => o.discountPct) : [plan.discountPct]
  const low = Math.min(...all)
  const high = Math.max(...all)
  if (high <= 0) return '—'
  return low === high ? `${high}%` : `${low}–${high}%`
}

/** The options with exactly one default: the first one marked, else the first. */
export function withOneDefault(options: PlanOption[]): PlanOption[] {
  const lead = options.find((o) => o.isDefault) ?? options[0]
  return options.map((option) => ({ ...option, isDefault: option === lead }))
}

export interface OptionPlanErrors {
  name?: string
  shopperLabel?: string
  /** About the options as a whole: none, too many, or two the same. */
  options?: string
  /** By option id. */
  rows: Record<string, { intervalCount?: string; discountPct?: string }>
  productIds?: string
}

/**
 * What stops a plan sold by delivery options from being saved. `others` are the
 * store's other plans, with each product's name for the message about its limit.
 */
export function optionPlanErrors(
  input: OptionPlanInput,
  others: Pick<SubscriptionPlan, 'name' | 'productIds'>[] = [],
  productName: (id: number) => string = (id) => `Product ${id}`,
): OptionPlanErrors {
  const errors: OptionPlanErrors = { rows: {} }
  const name = input.name.trim().toLowerCase()
  if (!name) errors.name = 'Give the plan a name. Only you see it.'
  else if (others.some((plan) => plan.name.trim().toLowerCase() === name)) errors.name = 'Another plan in this store has this name.'
  if (!input.shopperLabel.trim()) errors.shopperLabel = 'Say what shoppers read, for example “Subscribe and save”.'

  if (!input.options.length) errors.options = 'Add at least one delivery option.'
  else if (input.options.length > MAX_PLAN_OPTIONS) errors.options = `A plan can offer up to ${MAX_PLAN_OPTIONS} delivery options.`
  const seen = new Set<string>()
  for (const option of input.options) {
    const row: { intervalCount?: string; discountPct?: string } = {}
    if (!isWhole(option.intervalCount, 1, 12)) row.intervalCount = 'Enter a whole number from 1 to 12.'
    if (!(option.discountPct >= 0 && option.discountPct <= 90)) row.discountPct = 'Enter a discount from 0 to 90.'
    if (Object.keys(row).length) errors.rows[option.id] = row
    const frequency = intervalLabel(option)
    if (seen.has(frequency) && !errors.options) errors.options = `Two options deliver ${frequency}. Keep one of them.`
    seen.add(frequency)
  }

  const full = input.productIds.find((id) => others.filter((plan) => plan.productIds.includes(id)).length >= MAX_PLANS_PER_PRODUCT)
  if (full !== undefined) errors.productIds = `${productName(full)} is already on ${MAX_PLANS_PER_PRODUCT} plans. A product can have up to ${MAX_PLANS_PER_PRODUCT}.`
  return errors
}

export function hasOptionPlanErrors(errors: OptionPlanErrors): boolean {
  return !!(errors.name || errors.shopperLabel || errors.options || errors.productIds || Object.keys(errors.rows).length)
}

/**
 * The plan to save for what the merchant filled in. Its own interval and discount
 * mirror the default option, so every list that reads a plan as one delivery still
 * shows something true.
 */
export function planFromOptions(input: OptionPlanInput): PlanInput {
  const options = withOneDefault(input.options)
  const lead = options.find((o) => o.isDefault)
  return {
    name: input.name.trim(),
    shopperLabel: input.shopperLabel.trim(),
    options,
    intervalCount: lead?.intervalCount ?? 1,
    intervalUnit: lead?.intervalUnit ?? 'month',
    discountPct: lead?.discountPct ?? 0,
    unitsPerDelivery: 1,
    freeShipping: false,
    benefits: [],
    productIds: [...input.productIds],
    isDefault: false,
    status: input.status,
  }
}
