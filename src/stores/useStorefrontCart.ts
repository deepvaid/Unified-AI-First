import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { money, sum, parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { MAX_QTY, addLine, lineKey, pruneLines } from '@/storefront/cart'
import type { CartLine } from '@/storefront/cart'
import type { LinePlan } from '@/subscriptions/plans'
import type { Product, ProductVariant } from './useCommerce'

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

/** What the shopper chose beside the product: a plan (and its price per delivery), a variant, their vehicle. */
export interface CartChoice {
  plan?: LinePlan
  /** The unit price to charge: on a plan, one delivery. Absent: the variant's price, else the product's. */
  price?: string
  variant?: Pick<ProductVariant, 'id' | 'title' | 'sku' | 'price'>
  /** "2019 Ford F-150". */
  vehicle?: string
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

  /**
   * Adds a product, bought once at its own price, or on a plan at the plan's price
   * per delivery. A chosen variant gives the line its id, title, SKU and price; it
   * is only kept where the product has options, so a product without a choice
   * stays one line however it was added.
   */
  function add(channelId: string, product: Product, qty = 1, choice?: CartChoice): void {
    // Shopping again: the note about the emptied cart has done its job.
    dismissNotice(channelId)
    const variant = product.detail?.options.length ? choice?.variant : undefined
    carts.value[channelId] = addLine(linesFor(channelId), {
      productId: product.id,
      name: product.name,
      sku: variant?.sku || product.sku,
      price: choice?.price ?? variant?.price ?? product.price,
      qty,
      ...(variant ? { variantId: variant.id, variantTitle: variant.title } : {}),
      ...(choice?.vehicle ? { vehicle: choice.vehicle } : {}),
      ...(choice?.plan ? { plan: choice.plan } : {}),
    })
  }

  /** Takes out the lines whose product the store no longer sells, and returns them so the shopper can be told. */
  function prune(channelId: string, sellableIds: Iterable<number>): CartLine[] {
    const { kept, removed } = pruneLines(linesFor(channelId), sellableIds)
    if (removed.length) carts.value[channelId] = kept
    return removed
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

  // ── The store changed under the shopper ──────────────────────────
  // Applying a theme or restoring the store (here or in the admin's tab) replaces
  // every product, so the cart is emptied. What was in it is remembered for this
  // page view, so the storefront can say why the cart is empty.
  const changedNotices = ref<Record<string, string[]>>({})

  /** Empties the cart because the store's products were replaced; a cart that held something is remembered (noticeFor). */
  function storeChanged(channelId: string): void {
    const names = [...new Set(linesFor(channelId).map((line) => line.name))]
    if (names.length) changedNotices.value[channelId] = names
    clear(channelId)
  }

  /** The names of the products a store change took out of the cart, or null when it took nothing. */
  function noticeFor(channelId: string): string[] | null {
    return changedNotices.value[channelId] ?? null
  }

  function dismissNotice(channelId: string): void {
    delete changedNotices.value[channelId]
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

  return { carts, linesFor, add, setQty, remove, prune, clear, storeChanged, noticeFor, dismissNotice, count, subtotal, codeFor, setCode }
})
