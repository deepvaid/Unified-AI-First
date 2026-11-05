import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cancelState,
  formatOrderDate,
  itemsLabel,
  lineTotal,
  money,
  orderSummaryText,
  productsLabel,
  refundState,
  type OrderFacts,
} from '../../src/service/orderSummary.ts'

const item = (product: string, qty: number, price: string, discountPct = 0) => ({
  product, sku: 'SKU-1', qty, price, status: 'Processing', coupon: discountPct ? 'WELCOME20' : null, discountPct,
})

const order = (patch: Partial<OrderFacts> = {}): OrderFacts => ({
  orderNumber: '#10000', date: '2026-11-06', status: 'Processing', fulfillmentStatus: 'Not Ready',
  paymentStatus: 'Paid', total: '129.00', courier: null, trackingNumber: null,
  lineItems: [item('Nike Air Max', 1, '89.00'), item('Hydro Flask', 2, '20.00')],
  ...patch,
})

test('money, dates and item counts read the way a customer would', () => {
  assert.equal(money('12.5'), '$12.50')
  assert.equal(money(1180), '$1,180.00', 'thousands are grouped')
  assert.equal(formatOrderDate('2026-11-06'), 'Nov 6, 2026', 'a day key is a local date, not UTC midnight')
  assert.equal(formatOrderDate('not a date'), 'not a date')
  assert.equal(itemsLabel(order()), '3 items', 'units, not lines')
  assert.equal(itemsLabel(order({ lineItems: [item('Mug', 1, '9.00')] })), '1 item')
  assert.equal(lineTotal(item('Mug', 2, '10.00', 20)), 16)
  assert.equal(productsLabel(order()), 'Nike Air Max + 1 more', 'other lines, not units')
  assert.equal(productsLabel(order({ lineItems: [item('Mug', 3, '9.00')] })), 'Mug')
  assert.equal(productsLabel(order({ lineItems: [] })), 'No items')
})

test('an order can be cancelled only before it ships', () => {
  assert.deepEqual(cancelState(order()), { allowed: true, reason: '' })
  assert.equal(cancelState(order({ fulfillmentStatus: 'Shipped', status: 'Completed' })).reason, 'Already shipped — refund it instead')
  assert.equal(cancelState(order({ status: 'Completed', fulfillmentStatus: 'Return Requested' })).reason, 'Completed — refund it instead')
  assert.equal(cancelState(order({ status: 'Cancelled' })).allowed, false)
  assert.equal(cancelState(order({ status: 'Refunded' })).reason, 'Already refunded')
})

test('only a paid order can be refunded', () => {
  assert.equal(refundState(order()).allowed, true)
  assert.equal(refundState(order({ paymentStatus: 'Refunded' })).reason, 'Already refunded')
  assert.equal(refundState(order({ paymentStatus: 'Voided' })).reason, 'Nothing to refund — payment voided')
})

test('the reply summary lists items, total, status and tracking', () => {
  const text = orderSummaryText(order({ courier: 'UPS', trackingNumber: '1Z900000000' }))
  assert.equal(text, [
    'Order #10000 — placed Nov 6, 2026',
    '• Nike Air Max × 1 — $89.00',
    '• Hydro Flask × 2 — $40.00',
    'Total $129.00 · Processing · Payment paid',
    'Tracking: UPS 1Z900000000',
  ].join('\n'))
  const discounted = orderSummaryText(order({ lineItems: [item('Mug', 2, '10.00', 20)] }))
  assert.ok(discounted.includes('• Mug × 2 — $16.00 (20% off)'), 'a line shows what it cost after its discount')
  assert.ok(!orderSummaryText(order()).includes('Tracking'), 'no tracking line before it ships')
})
