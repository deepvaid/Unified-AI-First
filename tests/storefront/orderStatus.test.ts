import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shopperOrderStatus } from '../../src/storefront/orderStatus.ts'
import type { ShopperOrder } from '../../src/storefront/orderStatus.ts'

// An order as checkout places it: Processing, not ready, paid.
const placed: ShopperOrder = { status: 'Processing', fulfillmentStatus: 'Not Ready', paymentStatus: 'Paid', trackingNumber: null, courier: null }
const status = (over: Partial<ShopperOrder>) => shopperOrderStatus({ ...placed, ...over })

test('a new order is being prepared', () => {
  const s = status({})
  assert.deepEqual([s.key, s.label, s.tracking], ['preparing', 'Preparing', null])
  assert.match(s.message, /packing your order/)
  for (const fulfillmentStatus of ['Ready For Fulfillment', 'Unapproved']) assert.equal(status({ fulfillmentStatus }).key, 'preparing')
  assert.equal(status({ status: 'On Hold' }).key, 'preparing')
})

test('a shipped order is on its way, with its tracking when it has one', () => {
  const s = status({ fulfillmentStatus: 'Shipped', trackingNumber: '1Z999', courier: 'UPS' })
  assert.deepEqual([s.key, s.label], ['shipped', 'Shipped'])
  assert.deepEqual(s.tracking, { number: '1Z999', courier: 'UPS' })
  assert.equal(s.message, 'On its way with UPS, tracking number 1Z999.')
  assert.equal(status({ fulfillmentStatus: 'Shipped', trackingNumber: '1Z999' }).message, 'On its way, tracking number 1Z999.')
  assert.equal(status({ fulfillmentStatus: 'Shipped' }).message, 'This order has shipped.')
})

test('a completed order that shipped has been delivered, and so has one being returned', () => {
  const s = status({ status: 'Completed', fulfillmentStatus: 'Shipped', trackingNumber: '1Z1' })
  assert.deepEqual([s.key, s.label], ['delivered', 'Delivered'])
  assert.deepEqual(s.tracking, { number: '1Z1', courier: null })
  assert.equal(status({ fulfillmentStatus: 'Return Requested' }).key, 'delivered')
  // Completed but never shipped (a seed can say so) is still being prepared.
  assert.equal(status({ status: 'Completed' }).key, 'preparing')
})

test('a cancelled order says so first, and whether the payment came back', () => {
  assert.equal(status({ status: 'Cancelled', fulfillmentStatus: 'Cancelled', paymentStatus: 'Voided' }).message, 'This order was cancelled, so nothing will be sent.')
  const refunded = status({ status: 'Cancelled', paymentStatus: 'Refunded' })
  assert.equal(refunded.key, 'cancelled')
  assert.match(refunded.message, /Your payment has been refunded\.$/)
  assert.equal(status({ fulfillmentStatus: 'Cancelled' }).label, 'Cancelled')
})

test('an order whose payment failed or was voided is not being packed: it waits on the payment', () => {
  for (const paymentStatus of ['Failed', 'Voided']) {
    const s = status({ paymentStatus })
    assert.deepEqual([s.key, s.label, s.tracking], ['payment-problem', 'Payment not received', null], paymentStatus)
    assert.match(s.message, /will not be sent until it is paid\. Please contact us\.$/)
  }
  // A cancel still says so first, and a parcel already sent is still on its way.
  assert.equal(status({ status: 'Cancelled', paymentStatus: 'Failed' }).key, 'cancelled')
  assert.equal(status({ fulfillmentStatus: 'Shipped', paymentStatus: 'Failed' }).key, 'shipped')
})

test('an order still waiting for its money says so, except cash on delivery, which is paid on arrival', () => {
  for (const paymentProvider of ['bank_deposit', 'cheque', 'maropay', undefined]) {
    const s = status({ paymentStatus: 'Pending', paymentProvider })
    assert.deepEqual([s.key, s.label, s.tracking], ['awaiting-payment', 'Awaiting payment', null], String(paymentProvider))
    assert.match(s.message, /as soon as your payment arrives/)
  }
  assert.equal(status({ paymentStatus: 'Pending', paymentProvider: 'cod' }).key, 'preparing')
  assert.equal(status({ fulfillmentStatus: 'Shipped', paymentStatus: 'Pending', paymentProvider: 'cod' }).key, 'shipped')
  // An authorised payment is taken when the order ships, and a dispute leaves the order where it is.
  assert.equal(status({ paymentStatus: 'Authorised' }).key, 'preparing')
  assert.equal(status({ paymentStatus: 'Disputed' }).key, 'preparing')
})

test('a fully refunded order is refunded; a partial refund leaves the order where it was', () => {
  assert.equal(status({ status: 'Refunded', paymentStatus: 'Refunded' }).key, 'refunded')
  assert.equal(status({ status: 'Completed', fulfillmentStatus: 'Shipped', paymentStatus: 'Refunded' }).label, 'Refunded')
  assert.equal(status({ status: 'Completed', fulfillmentStatus: 'Shipped', paymentStatus: 'Partially Refunded' }).key, 'delivered')
})
