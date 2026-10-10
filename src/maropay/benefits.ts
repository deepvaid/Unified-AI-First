/**
 * What Maropay offers a merchant — one list behind the sell card on a store's
 * Payments page and the overview's "What you get". The first four are the card's.
 *
 * Pure module — no imports.
 */
export interface MaropayBenefit {
  /** Lucide icon name. */
  icon: string
  title: string
  desc: string
}

export const MAROPAY_BENEFITS: readonly MaropayBenefit[] = [
  { icon: 'receipt', title: 'Refund from the order', desc: 'Capture, refund or investigate a payment without leaving the order.' },
  { icon: 'landmark', title: 'Payouts you can trace', desc: 'Every deposit breaks down to the payments, fees and refunds inside it.' },
  { icon: 'store', title: 'Verify once', desc: 'One business check covers every store you add.' },
  { icon: 'zap', title: 'One-tap checkout', desc: 'Apple Pay, Google Pay and PayPal on product pages, the cart and checkout.' },
  { icon: 'shield-alert', title: 'Disputes with the deadline up front', desc: 'Respond with an evidence checklist before the shopper’s bank decides.' },
  { icon: 'life-buoy', title: 'Maropost support first', desc: 'One place to ask about an order and the payment behind it.' },
]

/** The sell card shows these; the overview shows them all. */
export const CARD_BENEFITS = MAROPAY_BENEFITS.slice(0, 4)
