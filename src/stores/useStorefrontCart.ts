import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { money, sum, parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { MAX_QTY, addLine, lineKey } from '@/storefront/cart'
import type { CartLine } from '@/storefront/cart'
import type { LinePlan } from '@/subscriptions/plans'
import type { Product } from './useCommerce'

// A shopper's cart on a storefront, one per store. It lives for the browser tab
// (sessionStorage), like a guest cart, and keeps each line's price as it was added.
// The line rules are in src/storefront/cart.ts.

export { MAX_QTY, lineKey }
export type { CartLine }

const KEY = 'mp.storefront.cart.v1'
/** The discount code the shopper applied, per store. Beside the cart, and emptied with it. */
const CODE_KEY = 'mp.storefront.code.v1'

function readCodes(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(CODE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function read(): Record<string, CartLine[]> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, CartLine[]>) : {}
  } catch {
    return {}
  }
}

export function lineTotal(line: Pick<CartLine, 'price' | 'qty'>, currency: string): Money {
  const unit = parseDecimal(line.price, currency) ?? money(0, currency)
  return money(unit.amount * line.qty, currency)
}

export const useStorefrontCartStore = defineStore('storefrontCart', () => {
  const carts = ref<Record<string, CartLine[]>>(read())

  watch(carts, (value) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // Storage blocked: the cart still works for this page view.
    }
  }, { deep: true })

  function linesFor(channelId: string): CartLine[] {
    return carts.value[channelId] ?? []
  }

  /** Adds a product, bought once at its own price, or on a plan at the plan's price per delivery. */
  function add(channelId: string, product: Product, qty = 1, subscription?: { plan: LinePlan; price: string }): void {
    carts.value[channelId] = addLine(linesFor(channelId), {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: subscription?.price ?? product.price,
      qty,
      ...(subscription ? { plan: subscription.plan } : {}),
    })
  }

  /** `key` is the line's `lineKey`. */
  function setQty(channelId: string, key: string, qty: number): void {
    if (qty < 1) return remove(channelId, key)
    const line = linesFor(channelId).find((l) => lineKey(l) === key)
    if (line) line.qty = Math.min(MAX_QTY, Math.floor(qty))
  }

  function remove(channelId: string, key: string): void {
    carts.value[channelId] = linesFor(channelId).filter((l) => lineKey(l) !== key)
  }

  function clear(channelId: string): void {
    carts.value[channelId] = []
    delete codes.value[channelId]
  }

  // ── Discount code ────────────────────────────────────────────────
  // Only the code is kept. Whether it still counts, and what it takes off, is
  // worked out fresh from the store's campaigns (src/storefront/campaigns.ts).
  const codes = ref<Record<string, string>>(readCodes())
  watch(codes, (value) => {
    try {
      sessionStorage.setItem(CODE_KEY, JSON.stringify(value))
    } catch {
      // Storage blocked: the code still applies for this page view.
    }
  }, { deep: true })

  function codeFor(channelId: string): string {
    return codes.value[channelId] ?? ''
  }

  function setCode(channelId: string, code: string): void {
    if (code.trim()) codes.value[channelId] = code.trim().toUpperCase()
    else delete codes.value[channelId]
  }

  function count(channelId: string): number {
    return linesFor(channelId).reduce((n, l) => n + l.qty, 0)
  }

  function subtotal(channelId: string, currency: string): Money {
    return sum(linesFor(channelId).map((l) => lineTotal(l, currency)), currency)
  }

  return { carts, linesFor, add, setQty, remove, clear, count, subtotal, codeFor, setCode }
})
