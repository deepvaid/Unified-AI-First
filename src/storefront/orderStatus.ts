// An order's status as its shopper sees it, on the account page, the order page
// and in the chat: seven plain states instead of the admin's order, fulfilment and
// payment statuses. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:storefront` runs them in Node.

/** The fields these rules read from an order. A commerce `Order` satisfies it. */
export interface ShopperOrder {
  /** Processing, Completed, Cancelled, Refunded, On Hold. */
  status: string
  /** Not Ready, Ready For Fulfillment, Shipped, Return Requested, Cancelled, Unapproved. */
  fulfillmentStatus: string
  /** Pending, Authorised, Paid, Partially Refunded, Refunded, Failed, Voided, Disputed (src/maropay/model.ts). */
  paymentStatus: string
  /** Who takes the payment, when Maropay tracks it: 'cod' is cash on delivery, paid after the order arrives. */
  paymentProvider?: string
  trackingNumber: string | null
  courier: string | null
}

export type ShopperOrderStatusKey = 'preparing' | 'awaiting-payment' | 'payment-problem' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface ShopperOrderStatus {
  key: ShopperOrderStatusKey
  /** "Preparing", "Awaiting payment", "Payment not received", "Shipped", "Delivered", "Cancelled", "Refunded". */
  label: string
  /** One sentence on what it means for the shopper. */
  message: string
  /** Where the parcel is, once it has shipped and has a tracking number. */
  tracking: { number: string; courier: string | null } | null
}

/**
 * What the shopper is told about an order. A cancelled order says so before
 * anything else, then a fully refunded one. A completed order that shipped, or
 * one the shopper has asked to return, has been delivered; a shipped one is on its
 * way with its tracking. One not sent yet waits on its payment when the payment
 * failed or was voided, or is still pending (a bank deposit, a cheque, a bank
 * debit that has not cleared; cash on delivery is paid on arrival, so it is not
 * waiting); everything else is being prepared. A partial refund leaves the order
 * where it is.
 */
export function shopperOrderStatus(order: ShopperOrder): ShopperOrderStatus {
  const refunded = /^refunded$/i.test(order.status) || /^refunded$/i.test(order.paymentStatus)
  if (/^cancel/i.test(order.status) || /^cancel/i.test(order.fulfillmentStatus)) {
    return {
      key: 'cancelled',
      label: 'Cancelled',
      message: `This order was cancelled, so nothing will be sent.${refunded ? ' Your payment has been refunded.' : ''}`,
      tracking: null,
    }
  }
  if (refunded) return { key: 'refunded', label: 'Refunded', message: 'This order has been refunded.', tracking: null }
  const returning = /^return requested$/i.test(order.fulfillmentStatus)
  const shipped = returning || /^shipped$/i.test(order.fulfillmentStatus)
  const tracking = shipped && order.trackingNumber ? { number: order.trackingNumber, courier: order.courier } : null
  if (returning || (shipped && /^completed$/i.test(order.status))) {
    return { key: 'delivered', label: 'Delivered', message: 'This order has been delivered.', tracking }
  }
  if (shipped) {
    const by = tracking?.courier ? ` with ${tracking.courier}` : ''
    return {
      key: 'shipped',
      label: 'Shipped',
      message: tracking ? `On its way${by}, tracking number ${tracking.number}.` : 'This order has shipped.',
      tracking,
    }
  }
  if (/^(failed|voided)$/i.test(order.paymentStatus)) {
    return {
      key: 'payment-problem',
      label: 'Payment not received',
      message: 'We have not received your payment, so this order will not be sent until it is paid. Please contact us.',
      tracking: null,
    }
  }
  if (/^pending$/i.test(order.paymentStatus) && order.paymentProvider !== 'cod') {
    return { key: 'awaiting-payment', label: 'Awaiting payment', message: 'We will pack your order as soon as your payment arrives.', tracking: null }
  }
  return { key: 'preparing', label: 'Preparing', message: 'We are packing your order. You will get an email as soon as it ships.', tracking: null }
}
