/**
 * What a support agent reads about an order from a ticket, and what they may do
 * to it — shared by the ticket's Orders panel and its tests.
 *
 * Pure: type-only imports, so `node --test` runs it (`npm run test:service`).
 */
import type { Order, OrderLineItem } from '../stores/useCommerce.ts'

export type OrderFacts = Pick<
  Order,
  'orderNumber' | 'date' | 'status' | 'fulfillmentStatus' | 'paymentStatus' | 'total' | 'courier' | 'trackingNumber' | 'lineItems'
>

export const money = (value: string | number) =>
  Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

/** Order dates are local day keys (YYYY-MM-DD); read them as local midnight, not UTC. */
export function formatOrderDate(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dayKey
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Price × quantity after the line's discount. */
export function lineTotal(item: Pick<OrderLineItem, 'qty' | 'price' | 'discountPct'>): number {
  return item.qty * parseFloat(item.price) * (1 - item.discountPct / 100)
}

export function itemsLabel(order: Pick<Order, 'lineItems'>): string {
  const units = order.lineItems.reduce((sum, item) => sum + item.qty, 0)
  return `${units} item${units === 1 ? '' : 's'}`
}

/** What they bought, in one line: the first product, then how many other lines. */
export function productsLabel(order: Pick<Order, 'lineItems'>): string {
  const [first, ...rest] = order.lineItems
  if (!first) return 'No items'
  return rest.length ? `${first.product} + ${rest.length} more` : first.product
}

export interface ActionState {
  allowed: boolean
  /** Why not — shown on the disabled menu item. */
  reason: string
}

/** Cancelling stops an order before it ships; anything later is a refund. */
export function cancelState(order: Pick<Order, 'status' | 'fulfillmentStatus'>): ActionState {
  if (order.status === 'Cancelled') return { allowed: false, reason: 'Already cancelled' }
  if (order.status === 'Refunded') return { allowed: false, reason: 'Already refunded' }
  if (order.fulfillmentStatus === 'Shipped') return { allowed: false, reason: 'Already shipped — refund it instead' }
  if (order.status === 'Completed') return { allowed: false, reason: 'Completed — refund it instead' }
  return { allowed: true, reason: '' }
}

/** Only money that was taken can go back. */
export function refundState(order: Pick<Order, 'paymentStatus'>): ActionState {
  if (order.paymentStatus === 'Refunded') return { allowed: false, reason: 'Already refunded' }
  if (order.paymentStatus !== 'Paid') return { allowed: false, reason: `Nothing to refund — payment ${order.paymentStatus.toLowerCase()}` }
  return { allowed: true, reason: '' }
}

/**
 * The block "Insert in reply" puts into the composer (plain text — the
 * composer isn't rich text yet). Written for the customer, not for the agent.
 */
export function orderSummaryText(order: OrderFacts): string {
  const lines = [
    `Order ${order.orderNumber} — placed ${formatOrderDate(order.date)}`,
    // What each line cost the customer, after its discount, so the lines add up to the total.
    ...order.lineItems.map(item =>
      `• ${item.product} × ${item.qty} — ${money(lineTotal(item))}${item.discountPct ? ` (${item.discountPct}% off)` : ''}`),
    `Total ${money(order.total)} · ${order.status} · Payment ${order.paymentStatus.toLowerCase()}`,
  ]
  if (order.trackingNumber) lines.push(`Tracking: ${[order.courier, order.trackingNumber].filter(Boolean).join(' ')}`)
  return lines.join('\n')
}
