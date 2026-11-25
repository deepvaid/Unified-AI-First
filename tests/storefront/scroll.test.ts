import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { RouteLocationNormalized, RouterScrollBehavior } from 'vue-router'
import { scrollBehavior } from '../../src/router/scroll.ts'

const STORE = '/accounts/2000290/sales_channels/vitaheal-demo/storefront'
type Place = { left: number; top: number }
const at = (name: string, path: string, query: Record<string, string> = {}): RouteLocationNormalized =>
  ({ name, path, query, fullPath: path } as unknown as RouteLocationNormalized)
const scrollFor = (to: RouteLocationNormalized, from: RouteLocationNormalized, saved: Place | null = null) =>
  scrollBehavior(to, from, saved)

test('a product or collection opened from the storefront starts at the top of its page', () => {
  const home = at('StorefrontHome', STORE)
  assert.deepEqual(scrollFor(at('StorefrontProduct', `${STORE}/products/unwind-2001`), home), { top: 0 })
  assert.deepEqual(scrollFor(at('StorefrontCollection', `${STORE}/collections/sleep`), home), { top: 0 })
  assert.deepEqual(scrollFor(at('StorefrontProduct', `${STORE}/products/balance-2008`), at('StorefrontProduct', `${STORE}/products/unwind-2001`)), { top: 0 })
})

test('a filter, sort or variant on the same storefront page keeps the place', () => {
  const sleep = at('StorefrontCollection', `${STORE}/collections/sleep`)
  assert.equal(scrollFor(at('StorefrontCollection', `${STORE}/collections/sleep`, { sort: 'price-asc' }), sleep), false)
  const results = at('StorefrontSearch', `${STORE}/search`, { q: 'sleep' })
  assert.equal(scrollFor(at('StorefrontSearch', `${STORE}/search`, { q: 'sleep', sort: 'price-asc' }), results), false)
})

test('a new search from the search page starts at the top of the new results', () => {
  const results = at('StorefrontSearch', `${STORE}/search`, { q: 'sleep' })
  assert.deepEqual(scrollFor(at('StorefrontSearch', `${STORE}/search`, { q: 'protein' }), results), { top: 0 })
})

test('back and forward return to where the page was', () => {
  const saved = { left: 0, top: 1840 }
  assert.deepEqual(scrollFor(at('StorefrontHome', STORE), at('StorefrontProduct', `${STORE}/products/unwind-2001`), saved), saved)
  assert.deepEqual(scrollFor(at('SalesOrders', '/accounts/2000290/commerce/sales-orders'), at('OrderDetail', '/accounts/2000290/commerce/sales-orders/1'), saved), saved)
})

test('admin pages keep their place, as before', () => {
  assert.equal(scrollFor(at('OrderDetail', '/accounts/2000290/commerce/sales-orders/1'), at('SalesOrders', '/accounts/2000290/commerce/sales-orders')), false)
})

/**
 * A browser tab as vue-router drives it: a click leaves an entry with its place written on it
 * (`state.scroll`) and makes a new one; Back fires popstate while the old page is still on screen.
 * vue-router's own saved position, by history position and path, is passed in as it would be,
 * including the stale one it keeps when the same page is opened twice at the same position.
 */
async function tab() {
  const { scrollBehavior: behave } = await import(`../../src/router/scroll.ts?tab=${Math.random()}`) as { scrollBehavior: RouterScrollBehavior }
  const entries: { path: string; state: Record<string, unknown> }[] = [{ path: STORE, state: { position: 0 } }]
  let index = 0
  let popstate: (() => void) | undefined
  const routerSaved = new Map<string, Place>()
  const win = {
    scrollX: 0,
    scrollY: 0,
    history: {
      get state() { return entries[index]!.state },
      replaceState(state: Record<string, unknown>) { entries[index]!.state = state },
    },
    addEventListener(type: string, listener: () => void) { if (type === 'popstate') popstate = listener },
  }
  ;(globalThis as { window?: unknown }).window = win
  const page = (path: string) => at(path.includes('/products/') ? 'StorefrontProduct' : 'StorefrontHome', path)
  const land = (to: string, from: string, saved: Place | null) => {
    const place = behave(page(to), page(from), saved) as Place | { top: number } | false
    if (place) win.scrollY = place.top
    return place
  }
  const go = (delta: number) => {
    const from = entries[index]!
    index += delta
    popstate?.()
    routerSaved.set(`${index - delta}${from.path}`, { left: 0, top: win.scrollY })
    const to = entries[index]!
    const key = `${index}${to.path}`
    const saved = routerSaved.get(key) ?? (to.state.scroll as Place | undefined) ?? null
    routerSaved.delete(key)
    return land(to.path, from.path, saved)
  }
  return {
    scrollTo(top: number) { win.scrollY = top },
    click(path: string) {
      const from = entries[index]!
      from.state = { ...from.state, scroll: { left: 0, top: win.scrollY } }
      entries.splice(index + 1)
      entries.push({ path, state: { position: index + 1 } })
      index++
      return land(path, from.path, null)
    },
    back() { return go(-1) },
    forward() { return go(1) },
    done() { delete (globalThis as { window?: unknown }).window },
  }
}

test('back returns to a product opened a second time, not to where its first visit was left', async () => {
  const t = await tab()
  t.click(`${STORE}/products/unwind-2001`)
  t.back()
  t.click(`${STORE}/products/unwind-2001`)
  t.scrollTo(1200)
  t.click(`${STORE}/products/nasal-strips-2005`)
  assert.deepEqual(t.back(), { left: 0, top: 1200 })
  t.done()
})

test('back to a page left at its top comes back at its top, even if an earlier visit read it to the bottom', async () => {
  const t = await tab()
  t.click(`${STORE}/products/unwind-2001`)
  t.scrollTo(2900)
  t.back()
  t.click(`${STORE}/products/unwind-2001`)
  t.click(`${STORE}/collections/sleep`)
  assert.deepEqual(t.back(), { left: 0, top: 0 })
  t.done()
})

test('forward returns to where back left the page', async () => {
  const t = await tab()
  t.scrollTo(900)
  t.click(`${STORE}/products/unwind-2001`)
  t.scrollTo(640)
  assert.deepEqual(t.back(), { left: 0, top: 900 })
  t.scrollTo(300)
  assert.deepEqual(t.forward(), { left: 0, top: 640 })
  assert.deepEqual(t.back(), { left: 0, top: 300 })
  t.done()
})
