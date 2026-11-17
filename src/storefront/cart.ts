// A storefront cart's lines. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:storefront` runs them in Node.

import type { LinePlan } from '../subscriptions/plans.ts'

export interface CartLine {
  productId: number
  name: string
  sku: string
  /** Unit price as a decimal string, as added. On a plan: the price of one delivery. */
  price: string
  qty: number
  /** The subscription plan the shopper chose. Absent: bought once. */
  plan?: LinePlan
}

/** The most of one line a cart holds. */
export const MAX_QTY = 99

/**
 * What tells two lines apart. The same product bought once and on a plan, or on
 * two plans, are separate lines: they cost differently and renew differently.
 */
export function lineKey(line: Pick<CartLine, 'productId' | 'plan'>): string {
  return line.plan ? `${line.productId}:${line.plan.id}` : String(line.productId)
}

/** The cart after adding a line: more of the same line, or a new one at the end. */
export function addLine(lines: CartLine[], added: CartLine): CartLine[] {
  const key = lineKey(added)
  const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(added.qty)))
  if (!lines.some((l) => lineKey(l) === key)) return [...lines, { ...added, qty }]
  return lines.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
}
