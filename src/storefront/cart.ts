// A storefront cart's lines. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:storefront` runs them in Node.

import type { LinePlan } from '../subscriptions/plans.ts'

export interface CartLine {
  productId: number
  name: string
  /** The chosen variant's SKU, or the product's. */
  sku: string
  /** Unit price as a decimal string, as added. On a plan: the price of one delivery. */
  price: string
  qty: number
  /** The variant the shopper chose (size, colour, position). Absent: the product has no choice to make. */
  variantId?: number
  /** The variant's title as it was when added ("M / Black"). `describeVariant` (src/storefront/variants.ts) reads it as "Size M · Black". */
  variantTitle?: string
  /** The shopper's vehicle when they added it: "2019 Ford F-150". */
  vehicle?: string
  /** The subscription plan the shopper chose. Absent: bought once. */
  plan?: LinePlan
}

/** The most of one line a cart holds. */
export const MAX_QTY = 99

/**
 * What tells two lines apart: `productId[/variantId][:planId]`. Two sizes of a
 * shirt are separate lines. So are the same product bought once and on a plan, or
 * on two plans: they cost differently and renew differently. A line without a
 * variant keeps the key it always had.
 */
export function lineKey(line: Pick<CartLine, 'productId' | 'variantId' | 'plan'>): string {
  const item = line.variantId === undefined ? String(line.productId) : `${line.productId}/${line.variantId}`
  return line.plan ? `${item}:${line.plan.id}` : item
}

/**
 * The cart after adding a line: more of the same line, or a new one at the end.
 * More of a line added for another vehicle no longer names one: no single vehicle
 * is true of every unit.
 */
export function addLine(lines: CartLine[], added: CartLine): CartLine[] {
  const key = lineKey(added)
  const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(added.qty)))
  if (!lines.some((l) => lineKey(l) === key)) return [...lines, { ...added, qty }]
  return lines.map((l) => {
    if (lineKey(l) !== key) return l
    const merged: CartLine = { ...l, qty: Math.min(MAX_QTY, l.qty + qty) }
    if (merged.vehicle !== added.vehicle) delete merged.vehicle
    return merged
  })
}

/**
 * The cart split into the lines the store still sells and those it doesn't (a
 * theme applied since replaced its products, say), so the shopper can be told
 * what was taken out.
 */
export function pruneLines(lines: CartLine[], sellableIds: Iterable<number>): { kept: CartLine[]; removed: CartLine[] } {
  const sellable = new Set(sellableIds)
  return {
    kept: lines.filter((l) => sellable.has(l.productId)),
    removed: lines.filter((l) => !sellable.has(l.productId)),
  }
}

/** The product a line was bought from: by its id, or by its SKU for a line saved before lines carried one. */
export function lineProduct<P extends { id: number; sku: string }>(products: readonly P[], line: { productId?: number; sku: string }): P | undefined {
  return line.productId === undefined ? products.find((p) => p.sku === line.sku) : products.find((p) => p.id === line.productId)
}
