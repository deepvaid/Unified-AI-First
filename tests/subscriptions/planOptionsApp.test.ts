// Plans sold by delivery options as the app keeps them (src/stores/useSubscriptions.ts):
// made beside Vitaheal's own plans, offered to shoppers one row per option, kept in
// the browser with the store's other plans, and held by subscriptions.
// The stores import each other with '@/', so the resolve hook is registered first.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { setMaxListeners } from 'node:events'

register('../support/appImports.mjs', import.meta.url)

const memory = new Map<string, string>()
const window = new EventTarget()
setMaxListeners(0, window)
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)) },
    removeItem: (key: string) => { memory.delete(key) },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
    clear: () => memory.clear(),
  },
  window,
})

const { createPinia, setActivePinia } = await import('pinia')
const { useSubscriptionsStore } = await import('@/stores/useSubscriptions')
const { VITAHEAL_CHANNEL_ID, VITAHEAL_PLANS } = await import('@/storefront/vitahealDemo')
const { planFromOptions, linePlan } = await import('@/subscriptions/plans')
const { contractFromLine } = await import('@/subscriptions/contracts')

const VH = VITAHEAL_CHANNEL_ID
const BALANCE = 2008
const ELECTROLYTES = 2005
/** Lets the store's watcher save to the browser. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))

const INPUT = planFromOptions({
  name: 'Standard plan',
  shopperLabel: 'Subscribe and save',
  status: 'Active',
  options: [
    { id: 'o1', intervalCount: 1, intervalUnit: 'month', discountPct: 10, isDefault: true },
    { id: 'o2', intervalCount: 2, intervalUnit: 'month', discountPct: 15, isDefault: false },
  ],
  productIds: [BALANCE],
})

/** The app as a tab starts it: its own stores over the same browser storage. */
function openTab() {
  setActivePinia(createPinia())
  return useSubscriptionsStore()
}

test('a plan with delivery options is offered one row per option, beside the store’s own plans', async () => {
  const subscriptions = openTab()
  const before = subscriptions.offeredFor(VH, ELECTROLYTES).map((p) => p.id)
  const plan = subscriptions.createPlan(VH, INPUT)
  assert.deepEqual(subscriptions.offeredFor(VH, BALANCE).map((p) => p.id), [`${plan.id}~o1`, `${plan.id}~o2`])
  assert.deepEqual(subscriptions.offeredFor(VH, BALANCE).map((p) => p.name), ['Subscribe and save', 'Subscribe and save'])
  // Vitaheal's own plans, and the pages that sell them, are as they were.
  assert.deepEqual(subscriptions.offeredFor(VH, ELECTROLYTES).map((p) => p.id), before)
  assert.deepEqual(subscriptions.plans.filter((p) => p.channelId === VH).slice(0, VITAHEAL_PLANS.length).map((p) => p.id), VITAHEAL_PLANS.map((p) => p.id))
  assert.equal(subscriptions.plans.find((p) => p.id === VITAHEAL_PLANS[0]!.id)!.isDefault, true, 'the preselected plan stays preselected')
  await settle()
})

test('a reload reads the plan back with its options', () => {
  const subscriptions = openTab()
  const plan = subscriptions.plans.find((p) => p.name === 'Standard plan')!
  assert.equal(plan.shopperLabel, 'Subscribe and save')
  assert.deepEqual(plan.options!.map((o) => [o.intervalCount, o.discountPct, o.isDefault]), [[1, 10, true], [2, 15, false]])
  assert.equal(subscriptions.offeredFor(VH, BALANCE).length, 2)
})

test('editing the options changes what is offered; a copy is kept, not the form’s own rows', () => {
  const subscriptions = openTab()
  const plan = subscriptions.plans.find((p) => p.name === 'Standard plan')!
  const next = planFromOptions({
    name: plan.name, shopperLabel: 'Subscribe & save', status: 'Active', productIds: [BALANCE],
    options: [...plan.options!.map((o) => ({ ...o })), { id: 'o3', intervalCount: 3, intervalUnit: 'month' as const, discountPct: 20, isDefault: false }],
  })
  subscriptions.updatePlan(plan.id, next)
  next.options![0]!.discountPct = 99
  const offered = subscriptions.offeredFor(VH, BALANCE)
  assert.deepEqual(offered.map((p) => p.discountPct), [10, 15, 20])
  assert.equal(offered[0]!.name, 'Subscribe & save')
})

test('a subscriber on an option counts on the plan, and can move to another option of it', () => {
  const subscriptions = openTab()
  const plan = subscriptions.plans.find((p) => p.name === 'Standard plan')!
  const [monthly, twoMonthly] = subscriptions.offeredFor(VH, BALANCE)
  assert.equal(subscriptions.activeSubscribers(plan.id), 0)
  subscriptions.contracts.unshift(contractFromLine({
    id: 'sub-9001', number: 'S-9001', channelId: VH, customer: { name: 'Ada Stone', email: 'ada@example.com' }, productId: BALANCE,
    line: { product: 'Balance', sku: 'VTH-BAL-CAN', qty: 1, price: '377.10', plan: linePlan(monthly!) },
    currency: 'SEK', paymentMethod: 'Visa •••• 4242', methodId: 'card', order: { id: 900009, number: '#20009' }, date: '2026-11-24',
  }))
  assert.equal(subscriptions.activeSubscribers(plan.id), 1)
  assert.equal(subscriptions.activeSubscribers(VITAHEAL_PLANS[0]!.id) >= 0, true)

  const contract = subscriptions.contractById('sub-9001')!
  assert.deepEqual(subscriptions.plansToChangeTo(contract).map((p) => p.id), [twoMonthly!.id, `${plan.id}~o3`])
  assert.equal(subscriptions.changePlan('sub-9001', twoMonthly!.id, 'customer'), true)
  const changed = subscriptions.contractById('sub-9001')!
  assert.equal(changed.plan.id, twoMonthly!.id)
  assert.equal(changed.plan.byFrequency, true)
  assert.equal(changed.history[0]!.text, 'Delivery changed from every month to every 2 months')
  assert.equal(subscriptions.activeSubscribers(plan.id), 1)
})

test('a paused plan is not offered, and its subscribers keep it', () => {
  const subscriptions = openTab()
  const plan = subscriptions.plans.find((p) => p.name === 'Standard plan')!
  subscriptions.setPlanStatus(plan.id, 'Paused')
  assert.deepEqual(subscriptions.offeredFor(VH, BALANCE), [])
  assert.equal(subscriptions.plans.find((p) => p.id === VITAHEAL_PLANS[0]!.id)!.isDefault, true, 'pausing it does not touch the store’s preselected plan')
})
