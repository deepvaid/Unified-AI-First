import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { money, sum, parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { Product } from './useCommerce'

// A shopper's cart on a storefront, one per store. It lives for the browser tab
// (sessionStorage), like a guest cart, and keeps each line's price as it was added.

export interface CartLine {
  productId: number
  name: string
  sku: string
  /** Unit price as a decimal string, as added. */
  price: string
  qty: number
}

const KEY = 'mp.storefront.cart.v1'
export const MAX_QTY = 99

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

  function add(channelId: string, product: Product, qty = 1): void {
    const lines = linesFor(channelId)
    const line = lines.find((l) => l.productId === product.id)
    if (line) line.qty = Math.min(MAX_QTY, line.qty + qty)
    else carts.value[channelId] = [...lines, { productId: product.id, name: product.name, sku: product.sku, price: product.price, qty: Math.min(MAX_QTY, qty) }]
  }

  function setQty(channelId: string, productId: number, qty: number): void {
    if (qty < 1) return remove(channelId, productId)
    const line = linesFor(channelId).find((l) => l.productId === productId)
    if (line) line.qty = Math.min(MAX_QTY, Math.floor(qty))
  }

  function remove(channelId: string, productId: number): void {
    carts.value[channelId] = linesFor(channelId).filter((l) => l.productId !== productId)
  }

  function clear(channelId: string): void {
    carts.value[channelId] = []
  }

  function count(channelId: string): number {
    return linesFor(channelId).reduce((n, l) => n + l.qty, 0)
  }

  function subtotal(channelId: string, currency: string): Money {
    return sum(linesFor(channelId).map((l) => lineTotal(l, currency)), currency)
  }

  return { carts, linesFor, add, setQty, remove, clear, count, subtotal }
})
