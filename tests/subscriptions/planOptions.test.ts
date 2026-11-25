// Plans sold by delivery options ("Subscribe and save": every 1, 2 or 3 months, each
// with its own discount), beside the plans of one fixed delivery Vitaheal sells.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromDecimal, toDecimal } from '../../src/maropay/money.ts'
import { VITAHEAL_CHANNEL_ID, VITAHEAL_PLANS } from '../../src/storefront/vitahealDemo.ts'
import { changePlan, contractFromLine } from '../../src/subscriptions/contracts.ts'
import {
  ONE_TIME, defaultOptionId, deliverySummary, discountRange, hasOptionPlanErrors, isOnPlan, linePlan, offeredRows,
  optionLayout, optionPlanErrors, optionsSummary, planFromOptions, planRow, planTitle, plansForProduct, purchaseOptions,
  recurringCharges, withOneDefault,
} from '../../src/subscriptions/plans.ts'
import type { OptionPlanInput, PlanOption, SubscriptionPlan } from '../../src/subscriptions/plans.ts'

const usd = (value: string) => fromDecimal(value, 'USD')
const STORE = 'calm-store'
const MAGNESIUM = 501

const OPTIONS: PlanOption[] = [
  { id: 'o1', intervalCount: 1, intervalUnit: 'month', discountPct: 20, isDefault: true },
  { id: 'o2', intervalCount: 2, intervalUnit: 'month', discountPct: 20, isDefault: false },
  { id: 'o3', intervalCount: 3, intervalUnit: 'month', discountPct: 30, isDefault: false },
]
const INPUT: OptionPlanInput = { name: 'Standard plan', shopperLabel: 'Subscribe and save', status: 'Active', options: OPTIONS, productIds: [MAGNESIUM] }
const PLAN: SubscriptionPlan = { ...planFromOptions(INPUT), id: 'plan-7', channelId: STORE }

// ── What is saved ────────────────────────────────────────────────────────────

test('the saved plan mirrors its default option, and a delivery is one unit', () => {
  assert.equal(PLAN.intervalCount, 1)
  assert.equal(PLAN.discountPct, 20)
  assert.equal(PLAN.unitsPerDelivery, 1)
  assert.equal(PLAN.isDefault, false, 'whether the subscription leads is the theme’s setting, not the plan’s')
  assert.deepEqual(PLAN.options, OPTIONS)
  const later = planFromOptions({ ...INPUT, options: OPTIONS.map((o) => ({ ...o, isDefault: o.id === 'o3' })) })
  assert.equal(later.intervalCount, 3)
  assert.equal(later.discountPct, 30)
})

test('a plan has exactly one default option', () => {
  assert.deepEqual(withOneDefault(OPTIONS.map((o) => ({ ...o, isDefault: false }))).map((o) => o.isDefault), [true, false, false])
  assert.deepEqual(withOneDefault(OPTIONS.map((o) => ({ ...o, isDefault: true }))).map((o) => o.isDefault), [true, false, false])
  assert.deepEqual(withOneDefault([]), [])
})

// ── What a shopper is offered ────────────────────────────────────────────────

test('a shopper is offered one row per delivery option, under the shopper label', () => {
  const rows = offeredRows(PLAN)
  assert.deepEqual(rows.map((r) => r.id), ['plan-7~o1', 'plan-7~o2', 'plan-7~o3'])
  assert.deepEqual(rows.map((r) => r.name), ['Subscribe and save', 'Subscribe and save', 'Subscribe and save'])
  assert.deepEqual(rows.map((r) => r.discountPct), [20, 20, 30])
  assert.deepEqual(rows.map((r) => r.optionOf), ['plan-7', 'plan-7', 'plan-7'])
  assert.equal(rows[0]!.options, undefined)
  assert.deepEqual(plansForProduct([PLAN], STORE, MAGNESIUM).map((r) => r.id), rows.map((r) => r.id))
  assert.deepEqual(plansForProduct([{ ...PLAN, status: 'Paused' }], STORE, MAGNESIUM), [])
  assert.deepEqual(plansForProduct([PLAN], STORE, 999), [])
})

test('a plan of one fixed delivery is still its own row', () => {
  const [threeMonth] = VITAHEAL_PLANS as [SubscriptionPlan]
  assert.deepEqual(offeredRows(threeMonth), [threeMonth])
  assert.equal(planRow([threeMonth, PLAN], threeMonth.id), threeMonth)
  assert.equal(planRow([threeMonth, PLAN], 'plan-7~o2')!.intervalCount, 2)
  assert.equal(planRow([threeMonth, PLAN], 'plan-7'), PLAN)
  assert.equal(planRow([PLAN], 'plan-9'), undefined)
})

test('a $29.00 product is $23.20 a month and $20.30 every 3 months', () => {
  const options = purchaseOptions(usd('29.00'), plansForProduct([PLAN], STORE, MAGNESIUM))
  assert.deepEqual(options.map((o) => o.name), ['Deliver every month', 'Deliver every 2 months', 'Deliver every 3 months', 'One-time purchase'])
  assert.deepEqual(options.map((o) => toDecimal(o.price)), ['23.20', '23.20', '20.30', '29.00'])
  assert.deepEqual(options.slice(0, 3).map((o) => toDecimal(o.compareAt!)), ['29.00', '29.00', '29.00'])
  assert.deepEqual(options.map((o) => o.group), ['Subscribe and save', 'Subscribe and save', 'Subscribe and save', undefined])
})

test('the page reads buying once first, then the delivery options under their label', () => {
  const layout = optionLayout(purchaseOptions(usd('29.00'), plansForProduct([PLAN], STORE, MAGNESIUM)))
  assert.deepEqual(layout.single.map((o) => o.id), [ONE_TIME])
  assert.equal(layout.groups.length, 1)
  assert.equal(layout.groups[0]!.label, 'Subscribe and save')
  assert.equal(layout.groups[0]!.maxDiscountPct, 30)
  assert.deepEqual(layout.groups[0]!.options.map((o) => o.id), ['plan-7~o1', 'plan-7~o2', 'plan-7~o3'])
})

test('Vitaheal’s page is laid out as before: its plans, then buying once, and no group', () => {
  const options = purchaseOptions(fromDecimal('279.00', 'SEK'), plansForProduct(VITAHEAL_PLANS, VITAHEAL_CHANNEL_ID, 2005))
  const layout = optionLayout(options)
  assert.deepEqual(layout.single, options)
  assert.deepEqual(layout.groups, [])
  assert.equal(options.every((o) => !('group' in o)), true)
  assert.equal(defaultOptionId(options), options[0]!.id)
  assert.equal(defaultOptionId(options, true), options[0]!.id, 'the theme setting only moves delivery options')
})

test('delivery options wait behind buying once, unless the theme puts the subscription first', () => {
  const options = purchaseOptions(usd('29.00'), plansForProduct([PLAN], STORE, MAGNESIUM))
  assert.equal(defaultOptionId(options), ONE_TIME)
  assert.equal(defaultOptionId(options, true), 'plan-7~o1')
  const later = { ...PLAN, options: OPTIONS.map((o) => ({ ...o, isDefault: o.id === 'o3' })) }
  assert.equal(defaultOptionId(purchaseOptions(usd('29.00'), plansForProduct([later], STORE, MAGNESIUM)), true), 'plan-7~o3')
})

// ── On a cart line, an order and a subscription ──────────────────────────────

test('a line bought on a delivery option reads by its frequency', () => {
  const row = offeredRows(PLAN)[1]!
  const line = linePlan(row)
  assert.deepEqual(line, { id: 'plan-7~o2', name: 'Subscribe and save', intervalCount: 2, intervalUnit: 'month', unitsPerDelivery: 1, freeShipping: false, byFrequency: true })
  assert.equal(deliverySummary(line), 'every 2 months')
  assert.equal(deliverySummary(row), 'every 2 months')
  assert.equal(planTitle(row), 'Deliver every 2 months')
  assert.equal(planTitle(line), 'Deliver every 2 months')
  assert.deepEqual(recurringCharges([{ price: '23.20', qty: 2, plan: line }], () => usd('46.40')), [{ interval: 'every 2 months', amount: usd('46.40') }])
})

test('a Vitaheal line keeps its wording and its shape', () => {
  const [threeMonth] = VITAHEAL_PLANS as [SubscriptionPlan]
  const line = linePlan(threeMonth)
  assert.equal('byFrequency' in line, false)
  assert.equal(deliverySummary(line), '3 units every 3 months')
  assert.equal(planTitle(threeMonth), threeMonth.name)
})

test('a line is on a plan when it holds the plan or one of its options', () => {
  assert.equal(isOnPlan('plan-7~o2', 'plan-7'), true)
  assert.equal(isOnPlan('plan-7', 'plan-7'), true)
  assert.equal(isOnPlan('plan-70~o1', 'plan-7'), false)
  assert.equal(isOnPlan('plan-1', 'plan-7'), false)
})

test('changing between two options of one plan reads as a change of delivery, at the new price', () => {
  const [monthly, , quarterly] = offeredRows(PLAN) as [SubscriptionPlan, SubscriptionPlan, SubscriptionPlan]
  const contract = contractFromLine({
    id: 'sub-1', number: 'S-1001', channelId: STORE, customer: { name: 'Ada Stone', email: 'ada@example.com' }, productId: MAGNESIUM,
    line: { product: 'Magnesium', sku: 'MAG-60', qty: 1, price: '23.20', plan: linePlan(monthly) },
    currency: 'USD', paymentMethod: 'Visa •••• 4242', methodId: 'card', order: { id: 1, number: '#20001' }, date: '2026-11-24',
  })
  const changed = changePlan(contract, quarterly, usd('29.00'), '2026-11-25', 'shopper')
  assert.equal(changed.plan.id, 'plan-7~o3')
  assert.equal(changed.price, '20.30')
  assert.equal(changed.history[0]!.text, 'Delivery changed from every month to every 3 months')
  assert.equal(changePlan(contract, monthly, usd('29.00'), '2026-11-25', 'shopper'), contract)
})

// ── How the merchant's list reads ────────────────────────────────────────────

test('the plan list sums up the options and their discounts', () => {
  assert.equal(optionsSummary(OPTIONS), 'Every 1, 2 or 3 months')
  assert.equal(optionsSummary([OPTIONS[0]!]), 'Every month')
  assert.equal(optionsSummary([{ ...OPTIONS[0]!, intervalCount: 2, intervalUnit: 'week' }, OPTIONS[0]!]), 'Every 2 weeks or every month')
  assert.equal(optionsSummary([]), 'No options')
  assert.equal(discountRange(PLAN), '20–30%')
  assert.equal(discountRange({ discountPct: 20, options: [OPTIONS[0]!] }), '20%')
  assert.equal(discountRange({ discountPct: 0, options: [{ ...OPTIONS[0]!, discountPct: 0 }] }), '—')
  assert.equal(discountRange({ discountPct: 30 }), '30%')
})

// ── What stops a plan from being saved ───────────────────────────────────────

test('a complete plan can be saved', () => {
  const errors = optionPlanErrors(INPUT)
  assert.deepEqual(errors, { rows: {} })
  assert.equal(hasOptionPlanErrors(errors), false)
  // No product yet is fine: the plan waits, as a paused trial does.
  assert.equal(hasOptionPlanErrors(optionPlanErrors({ ...INPUT, productIds: [] })), false)
})

test('a plan needs a name of its own, a shopper label and an option', () => {
  const errors = optionPlanErrors({ ...INPUT, name: ' ', shopperLabel: '', options: [] })
  assert.equal(errors.name, 'Give the plan a name. Only you see it.')
  assert.equal(errors.shopperLabel, 'Say what shoppers read, for example “Subscribe and save”.')
  assert.equal(errors.options, 'Add at least one delivery option.')
  assert.equal(hasOptionPlanErrors(errors), true)
  assert.equal(optionPlanErrors(INPUT, [{ name: ' standard PLAN', productIds: [] }]).name, 'Another plan in this store has this name.')
})

test('each option needs a sensible frequency and discount, and no two the same', () => {
  const errors = optionPlanErrors({
    ...INPUT,
    options: [
      { ...OPTIONS[0]!, intervalCount: 0 },
      { ...OPTIONS[1]!, discountPct: 95 },
      { ...OPTIONS[2]!, intervalCount: 2 },
    ],
  })
  assert.deepEqual(errors.rows, { o1: { intervalCount: 'Enter a whole number from 1 to 12.' }, o2: { discountPct: 'Enter a discount from 0 to 90.' } })
  assert.equal(errors.options, 'Two options deliver every 2 months. Keep one of them.')
  const many = Array.from({ length: 7 }, (_, i): PlanOption => ({ id: `x${i}`, intervalCount: i + 1, intervalUnit: 'month', discountPct: 10, isDefault: i === 0 }))
  assert.equal(optionPlanErrors({ ...INPUT, options: many }).options, 'A plan can offer up to 6 delivery options.')
})

test('a product can be on up to 3 plans', () => {
  const others = [1, 2, 3].map((n) => ({ name: `Plan ${n}`, productIds: [MAGNESIUM] }))
  assert.equal(optionPlanErrors(INPUT, others.slice(0, 2)).productIds, undefined)
  assert.equal(optionPlanErrors(INPUT, others, () => 'Magnesium').productIds, 'Magnesium is already on 3 plans. A product can have up to 3.')
})
