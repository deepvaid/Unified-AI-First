// A subscription bought on a dearer variant, as the app keeps it (src/stores/useSubscriptions.ts):
// the checkout starts it with the variant's title, a plan change is priced on that
// variant, and a renewal's order line names it too.
// The stores import each other with '@/', so the resolve hook is registered first.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { setMaxListeners } from 'node:events'

register('../support/appImports.mjs', import.meta.url)

const memory = new Map<string, string>()
// The payments store keeps a clock on window; a test charges now, so it never needs to tick.
const window = Object.assign(new EventTarget(), { setInterval: () => 0, clearInterval: () => {} })
setMaxListeners(0, window)
const localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, String(value)) },
  removeItem: (key: string) => { memory.delete(key) },
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() { return memory.size },
  clear: () => memory.clear(),
}
Object.assign(window, { localStorage })
Object.assign(globalThis, { localStorage, window })

const { createPinia, setActivePinia } = await import('pinia')
const { useCommerceStore } = await import('@/stores/useCommerce')
const { useSubscriptionsStore } = await import('@/stores/useSubscriptions')
const { VITAHEAL_CHANNEL_ID, VITAHEAL_PLANS } = await import('@/storefront/vitahealDemo')
const { linePlan } = await import('@/subscriptions/plans')

const ELECTROLYTES = 2005
const THREE_MONTH = VITAHEAL_PLANS.find((p) => p.id === 'plan-3-month')!

type Subscriptions = ReturnType<typeof useSubscriptionsStore>

/** A checkout on the store: Electrolytes Starter Pack on the 3-month supply, as the product page adds it. */
function checkOutStarterPack(subscriptions: Subscriptions, commerce: ReturnType<typeof useCommerceStore>): string {
  const product = commerce.products.find((p) => p.id === ELECTROLYTES)!
  const starter = product.detail!.variantsList.find((v) => v.sku === 'VTH-ELE-STA')!
  subscriptions.startFromCheckout({
    channelId: VITAHEAL_CHANNEL_ID, methodId: 'card', amount: { currency: 'SEK' },
    customer: { name: 'Linnea Berg', email: 'linnea.berg@example.com' },
    order: { id: 990101, orderNumber: '#990101', date: '2026-11-25' },
    lineItems: [{
      product: product.name, productId: product.id, sku: starter.sku, variantId: starter.id, variantTitle: starter.title,
      qty: 1, price: '1047.90', plan: linePlan(THREE_MONTH),
    }],
  } as unknown as Parameters<Subscriptions['startFromCheckout']>[0], { methodLabel: 'Visa •••• 4242' } as Parameters<Subscriptions['startFromCheckout']>[1])
  return subscriptions.contracts[0]!.id
}

test('a plan change keeps the variant the shopper subscribed to, and its price', () => {
  setActivePinia(createPinia())
  const subscriptions = useSubscriptionsStore()
  const id = checkOutStarterPack(subscriptions, useCommerceStore())
  const started = subscriptions.contractById(id)!
  assert.deepEqual([started.sku, started.variantTitle, started.price], ['VTH-ELE-STA', 'Starter Pack (both flavours)', '1047.90'])

  assert.equal(subscriptions.changePlan(id, 'plan-monthly', 'customer'), true)
  const moved = subscriptions.contractById(id)!
  assert.equal(moved.plan.id, 'plan-monthly')
  assert.equal(moved.price, '399.20', '499 kr at 20% off, not Lemon & Ginger’s 223.20')
  assert.equal(moved.variantTitle, 'Starter Pack (both flavours)')
})

test('a renewal’s order line names the variant the subscription was bought on', () => {
  setActivePinia(createPinia())
  const subscriptions = useSubscriptionsStore()
  const commerce = useCommerceStore()
  const id = checkOutStarterPack(subscriptions, commerce)
  const charged = subscriptions.chargeNow(id, 'merchant')
  assert.equal(charged.ok, true, charged.ok ? '' : charged.message)
  const order = commerce.orders.find((o) => charged.ok && o.id === charged.order.id)!
  assert.deepEqual(order.lineItems.map((l) => [l.sku, l.variantTitle, l.price]), [['VTH-ELE-STA', 'Starter Pack (both flavours)', '1047.90']])
})

test('a seeded subscriber on the cheapest variant moves plans at the price it always had', () => {
  setActivePinia(createPinia())
  const subscriptions = useSubscriptionsStore()
  // S-1002: Electrolytes Lemon & Ginger, monthly at 223.20.
  const seeded = subscriptions.contracts.find((c) => c.number === 'S-1002')!
  assert.equal(seeded.variantTitle, undefined)
  assert.equal(subscriptions.changePlan(seeded.id, 'plan-3-month', 'customer'), true)
  assert.equal(subscriptions.contractById(seeded.id)!.price, '585.90')
})
