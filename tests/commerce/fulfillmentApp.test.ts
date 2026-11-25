// Fulfillments as the app keeps them (src/stores/useCommerce.ts): an order placed
// at a store's checkout gets one, each step shows on the order, and what the
// merchant did is kept in the browser under `mp.commerce.fulfillments.v1`, so it
// survives a reload and reaches the storefront tab.
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
const { useCommerceStore } = await import('@/stores/useCommerce')
const { useAccountsStore } = await import('@/stores/useAccounts')
const { shopperOrderStatus } = await import('@/storefront/orderStatus')

const KEY = 'mp.commerce.fulfillments.v1'
/** Lets the store's watcher save to the browser. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
const saved = () => JSON.parse(memory.get(KEY) ?? '{}') as Record<string, { status: string }>

/** An order as Maropay hands it over after a checkout on the Vitaheal (demo) store. */
function checkoutOrder(id: number) {
  return {
    id,
    orderNumber: `#${id}`,
    date: '2026-11-24',
    channelId: 'vitaheal-demo',
    salesChannel: 'Vitaheal (demo)',
    customer: { name: 'Linnea Berg', email: 'linnea@example.com', address: { line1: 'Storgatan 12', city: 'Stockholm', region: '', postalCode: '111 51', country: 'Sweden' } },
    lineItems: [{ product: 'Unwind', sku: 'VH-UNW-30', qty: 2, price: '292.95' }],
    shipping: '0.00',
    total: '585.90',
    currency: 'SEK',
    payment: { provider: 'maropay' as const, paymentId: `pay_${id}`, paymentStatus: 'Paid' as const, paymentMethod: 'Visa •••• 4242' },
    timeline: [{ text: 'Order placed via Vitaheal (demo) checkout', date: '2026-11-24' }],
  }
}

/** The app as a tab starts it: its own stores over the same browser storage. */
function openTab() {
  setActivePinia(createPinia())
  return useCommerceStore()
}

test('a store order gets a fulfillment, and each step shows on the order', async () => {
  const commerce = openTab()
  const order = commerce.createCheckoutOrder(checkoutOrder(20001))
  const item = commerce.fulfillmentById(20001)!
  assert.equal(item.orderId, order.id)
  assert.equal(item.status, 'Picked')
  assert.equal(item.currency, 'SEK')
  assert.equal(item.salesChannel, 'Vitaheal (demo)')
  assert.equal(commerce.fulfillments[0]!.id, 20001, 'the newest order is first in the queue')
  const live = () => commerce.getOrderById(20001)!
  assert.equal(live().fulfillmentStatus, 'Not Ready')

  // Steps go in order: a parcel cannot ship before it has a label.
  assert.equal(commerce.shipFulfillment(20001), false)
  assert.equal(commerce.packFulfillment(20001), true)
  assert.equal(live().fulfillmentStage, 'Pack')
  assert.equal(commerce.pickFulfillmentCarrier(20001, { carrier: 'PostNord', service: 'Standard', trackingNumber: '123456789SE' }), true)
  assert.equal(live().fulfillmentStatus, 'Ready For Fulfillment')
  assert.equal(shopperOrderStatus(live()).key, 'preparing')

  assert.equal(commerce.shipFulfillment(20001), true)
  assert.equal(live().fulfillmentStatus, 'Shipped')
  assert.equal(live().lineItems[0]!.status, 'Shipped')
  assert.deepEqual(shopperOrderStatus(live()).tracking, { number: '123456789SE', courier: 'PostNord' })

  assert.equal(commerce.deliverFulfillment(20001), true)
  assert.equal(live().status, 'Completed')
  assert.equal(commerce.fulfillmentById(20001)!.orderStatus, 'Completed')
  assert.equal(shopperOrderStatus(live()).key, 'delivered')
  assert.deepEqual(live().timeline.map((e) => e.text), [
    'Order placed via Vitaheal (demo) checkout',
    'Items packed',
    'Label created with PostNord, tracking 123456789SE',
    'Shipped with PostNord',
    'Delivered',
  ])

  await settle()
  assert.equal(saved()[`${useAccountsStore().activeId}:20001`]!.status, 'Delivered')
})

test('a reload puts the order and its fulfillment back where the merchant left them', () => {
  const commerce = openTab()
  commerce.createCheckoutOrder(checkoutOrder(20001))
  const item = commerce.fulfillmentById(20001)!
  assert.equal(item.status, 'Delivered')
  assert.equal(item.orderStatus, 'Completed', 'the queue row shows the order as it now stands')
  assert.equal(item.parcel!.trackingNumber, '123456789SE')
  const order = commerce.getOrderById(20001)!
  assert.equal(order.status, 'Completed')
  assert.equal(order.trackingNumber, '123456789SE')
  assert.equal(order.timeline.filter((e) => e.text === 'Items packed').length, 1)
})

test('Mark fulfilled on the orders list ships through the fulfillment', () => {
  const commerce = openTab()
  commerce.createCheckoutOrder(checkoutOrder(20002))
  commerce.markOrderFulfilled(20002)
  const item = commerce.fulfillmentById(20002)!
  assert.equal(item.status, 'Shipped')
  assert.equal(item.parcel!.carrier, 'PostNord', 'Sweden ships with PostNord unless the merchant chose another carrier')
  const order = commerce.getOrderById(20002)!
  assert.equal(order.trackingNumber, item.parcel!.trackingNumber)
  assert.equal(order.courier, 'PostNord')
})

test('a cancelled order is not sent', () => {
  const commerce = openTab()
  commerce.createCheckoutOrder(checkoutOrder(20003))
  commerce.cancelOrder(20003)
  assert.equal(commerce.packFulfillment(20003), false)
  assert.equal(commerce.fulfillmentById(20003)!.status, 'Picked')
  assert.equal(commerce.getOrderById(20003)!.fulfillmentStatus, 'Cancelled')
})

test('the storefront tab follows a step taken in the admin tab', async () => {
  const storefront = openTab()
  storefront.createCheckoutOrder(checkoutOrder(20004))
  assert.equal(shopperOrderStatus(storefront.getOrderById(20004)!).key, 'preparing')

  // The admin tab ships it: the browser tells every other tab that the saved value changed.
  const admin = openTab()
  admin.createCheckoutOrder(checkoutOrder(20004))
  admin.markShipped([20004], 'SE-TRACK-1')
  await settle()
  window.dispatchEvent(Object.assign(new Event('storage'), { key: KEY }))

  const seen = storefront.getOrderById(20004)!
  assert.equal(seen.fulfillmentStatus, 'Shipped')
  assert.equal(shopperOrderStatus(seen).tracking!.number, 'SE-TRACK-1')
  assert.equal(storefront.fulfillmentById(20004)!.status, 'Shipped')
})

test('a seeded fulfillment can be worked too, and is not kept in the browser', async () => {
  const commerce = openTab()
  const picked = commerce.fulfillments.find((f) => f.status === 'Picked' && !f.savedAs)!
  const before = Object.keys(saved()).length
  assert.equal(commerce.packFulfillment(picked.id), true)
  assert.equal(commerce.fulfillmentById(picked.id)!.status, 'Packed')
  await settle()
  assert.equal(Object.keys(saved()).length, before)
})

test('a payments reset forgets what was done to the store orders, and removes their fulfillments', async () => {
  const commerce = openTab()
  commerce.createCheckoutOrder(checkoutOrder(20001))
  commerce.clearPaymentSummary(20001)
  assert.equal(commerce.getOrderById(20001), undefined)
  assert.equal(commerce.fulfillmentById(20001), undefined)

  commerce.forgetCheckoutFulfillments(useAccountsStore().activeId)
  await settle()
  assert.deepEqual(saved(), {})
  // The next order to take the number starts from the beginning.
  commerce.createCheckoutOrder(checkoutOrder(20001))
  assert.equal(commerce.fulfillmentById(20001)!.status, 'Picked')
  assert.equal(commerce.getOrderById(20001)!.status, 'Processing')
})

test('a Swedish store order ships from the Stockholm warehouse; another store ships from where its stock is', () => {
  const commerce = openTab()
  // Unwind, Bag: Vitaheal keeps its stock under "Oxford Warehouse", but its checkout is Swedish.
  const swedish = commerce.createCheckoutOrder({ ...checkoutOrder(20005), lineItems: [{ product: 'Unwind', sku: 'VTH-UNW-BAG', qty: 1, price: '399.00' }] })
  assert.equal(swedish.fulfilledFromLocation, 'Stockholm warehouse')
  const item = commerce.fulfillmentById(20005)!
  assert.equal(item.location, 'Stockholm warehouse')
  assert.equal(item.events[0]!.text, 'Fulfillment created, items picked at Stockholm warehouse')

  // Daybloom sells in US dollars: its order still leaves from where the product is stocked.
  const daybloom = commerce.createCheckoutOrder({
    ...checkoutOrder(20006),
    channelId: 'daybloom-demo',
    salesChannel: 'Daybloom (demo)',
    currency: 'USD',
    customer: { name: 'Ava Brown', email: 'ava.brown@example.com', address: { line1: '200 Market Street', city: 'San Francisco', region: 'CA', postalCode: '94105', country: 'United States' } },
    lineItems: [{ product: 'Magnesium Glycinate', sku: 'DB-MAG-60', qty: 1, price: '24.00' }],
  })
  assert.equal(daybloom.fulfilledFromLocation, 'Oxford Warehouse')
  assert.equal(commerce.fulfillmentById(20006)!.location, 'Oxford Warehouse')
})

test('an order page reads as its fulfillment does, and the order keeps its own data', async () => {
  const { shownFulfillment } = await import('@/commerce/fulfillment')
  const commerce = openTab()
  const order = commerce.createCheckoutOrder(checkoutOrder(20007))
  const record = () => commerce.fulfillments.find((f) => f.orderId === order.id)!
  assert.equal(shownFulfillment(order, record()).status, 'Picked', 'FF-20007 is Picked, so the order says Picked, not Not Ready')
  assert.equal(order.fulfillmentStatus, 'Not Ready')
  commerce.packFulfillment(20007)
  assert.equal(shownFulfillment(commerce.getOrderById(20007)!, record()).status, 'Packed')

  // Seeded order #10000 and its FF-0001: the order's data stays, the page follows the fulfillment.
  const seeded = commerce.getOrderById(1)!
  const seededRecord = commerce.fulfillments.find((f) => f.orderId === 1)!
  assert.equal(seeded.fulfillmentStatus, 'Not Ready')
  assert.equal(seededRecord.status, 'Picked')
  assert.equal(shownFulfillment(seeded, seededRecord).status, 'Picked')
})
