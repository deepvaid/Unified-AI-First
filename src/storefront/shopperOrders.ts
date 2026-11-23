// What a shopper sees of the things they bought: how a cart, checkout or order line
// reads ("Size M · Sand") and which photo it shows (the colour they chose), and the
// orders their account lists (theirs, on this store, newest first) with what each
// one cost. Pure rules: no Vue, no Pinia, no `@/` imports, so
// `npm run test:storefront` runs them in Node.

import { add, money, parseDecimal, subtract, sum } from '../maropay/money.ts'
import type { Money } from '../maropay/money.ts'
import { describeVariant, optionKey, optionKind, optionValuesOf } from './variants.ts'
import type { SellableVariant, VariantOption } from './variants.ts'

// ── Lines ────────────────────────────────────────────────────────────

/** The fields these rules read from a product. A commerce `Product` satisfies it. */
export interface LineProduct {
  id: number
  sku: string
  imageUrls?: string[]
  detail?: {
    options: VariantOption[]
    variantsList: Pick<SellableVariant, 'id' | 'title' | 'optionValues'>[]
    /** Photos per value of the Color option, the colour's own photo first. */
    imagesByColor?: Record<string, string[]>
  }
}

/** What a cart, checkout or order line says about what was bought. */
export interface BoughtLine {
  productId?: number
  sku: string
  variantId?: number
  /** The variant's title as it was when bought ("Sand / M"). */
  variantTitle?: string
}

type LineVariant = Pick<SellableVariant, 'title' | 'optionValues'>

/**
 * The variant a line was bought in: the product's variant with that id, or, once
 * the product no longer has it, the title the line kept. Undefined for a line
 * without a choice (a product without options).
 */
export function lineVariant(product: LineProduct | undefined, line: BoughtLine): LineVariant | undefined {
  const kept = line.variantTitle ? { title: line.variantTitle } : undefined
  if (line.variantId === undefined) return kept
  return product?.detail?.variantsList.find((v) => v.id === line.variantId) ?? kept
}

/**
 * How the line's choice reads under its name: "Size M · Sand", "Front". Empty for
 * a line without one. A line whose product is gone reads its kept title, "Sand · M".
 */
export function lineVariantText(product: LineProduct | undefined, line: BoughtLine): string {
  const variant = lineVariant(product, line)
  if (!variant) return ''
  const options = product?.detail?.options ?? []
  if (options.length) return describeVariant(variant, options)
  return variant.title.split(' / ').map((part) => part.trim()).filter(Boolean).join(' · ')
}

/** The colour the line was bought in, for a product with a Color option. */
export function lineColor(product: LineProduct | undefined, line: BoughtLine): string | undefined {
  const variant = lineVariant(product, line)
  const options = product?.detail?.options ?? []
  const index = options.findIndex((option) => optionKind(option) === 'color')
  if (!variant || index < 0) return undefined
  return optionValuesOf(variant, options)[index] || undefined
}

/**
 * The line's photo: the chosen colour's own photo when the product has one,
 * otherwise the product's first. Undefined for a product without photos.
 */
export function lineImage(product: LineProduct | undefined, line: BoughtLine): string | undefined {
  const color = lineColor(product, line)
  const own = color === undefined ? undefined : product?.detail?.imagesByColor?.[color]?.[0]
  return own ?? product?.imageUrls?.[0]
}

/**
 * The product page's query that opens it on the line's choice (`?color=sand&size=m`,
 * as `initialSelection` reads it). Empty for a line without one.
 */
export function lineProductQuery(product: LineProduct | undefined, line: BoughtLine): Record<string, string> {
  const variant = lineVariant(product, line)
  const options = product?.detail?.options ?? []
  if (!variant || !options.length) return {}
  const values = optionValuesOf(variant, options)
  const query: Record<string, string> = {}
  options.forEach((option, i) => {
    if (values[i]) query[optionKey(option.name)] = optionKey(values[i]!)
  })
  return query
}

/** A storefront path with a query, as a link takes it: "/products/linen-overshirt-3015?color=sand&size=m". */
export function withQuery(path: string, query: Record<string, string>): string {
  const params = new URLSearchParams(query).toString()
  return params ? `${path}?${params}` : path
}

// ── Orders ───────────────────────────────────────────────────────────

/** The fields these rules read from an order. A commerce `Order` satisfies it. */
export interface ShopperOrderRecord {
  id: number
  /** "#41001". */
  orderNumber: string
  /** The store it was placed on. */
  channelId: string | null
  customer: { email: string }
  /** YYYY-MM-DD. */
  date: string
  /** What was charged, net of any discount, shipping included. */
  total: string
  shipping: string
  currency: string
  lineItems: { price: string; qty: number; coupon: string | null; discountPct: number }[]
}

/** An order's number as its page's URL writes it: "#41001" → "41001". */
export function orderParam(orderNumber: string): string {
  return orderNumber.trim().replace(/^#/, '')
}

/** The shopper's orders on this store, newest first. None without a shopper. */
export function ordersOfShopper<O extends ShopperOrderRecord>(orders: readonly O[], channelId: string, email: string | null | undefined): O[] {
  const key = email?.trim().toLowerCase()
  if (!key) return []
  return orders
    .filter((o) => o.channelId === channelId && o.customer.email.trim().toLowerCase() === key)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}

/**
 * The order an order page names (`param` as `orderParam` writes it), when it is the
 * shopper's own and was placed on this store. Undefined otherwise: the page says it
 * can't find it rather than show someone else's order.
 */
export function orderOfShopper<O extends ShopperOrderRecord>(orders: readonly O[], channelId: string, email: string | null | undefined, param: string): O | undefined {
  const wanted = orderParam(param)
  if (!wanted) return undefined
  return ordersOfShopper(orders, channelId, email).find((o) => orderParam(o.orderNumber) === wanted)
}

/** What an order cost, as its page sums it up. */
export interface OrderSums {
  /** The lines at their own prices. */
  items: Money
  /** What a discount code took off, or null. */
  discount: { code: string; pct: number; amount: Money } | null
  shipping: Money
  total: Money
  /** Units bought. */
  count: number
}

/**
 * The order's sums. Lines keep their own prices and the total is what was charged,
 * so what the code took off is the difference, to the cent the shopper paid.
 */
export function orderSums(order: ShopperOrderRecord): OrderSums {
  const currency = order.currency
  const amount = (value: string): Money => parseDecimal(value, currency) ?? money(0, currency)
  const items = sum(order.lineItems.map((li) => money(amount(li.price).amount * li.qty, currency)), currency)
  const shipping = amount(order.shipping)
  const total = amount(order.total)
  const off = subtract(add(items, shipping), total)
  const coded = order.lineItems.find((li) => li.coupon && li.discountPct)
  return {
    items,
    discount: coded && off.amount > 0 ? { code: coded.coupon!, pct: coded.discountPct, amount: off } : null,
    shipping,
    total,
    count: order.lineItems.reduce((n, li) => n + li.qty, 0),
  }
}

/**
 * The day an order was placed, the way the store writes dates: "Nov 20, 2026", or
 * "20 Nov 2026" for a store that writes amounts its own way ("585,90 kr").
 */
export function placedOn(date: string, dayFirst = false): string {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString(dayFirst ? 'en-GB' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}
