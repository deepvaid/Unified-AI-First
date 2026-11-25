import type { RouterScrollBehavior } from 'vue-router'

type Place = { left: number; top: number }

/**
 * Where each history entry was when the shopper left it with Back or Forward, by an id this file
 * stamps on the entry. vue-router keeps its own copy by history position and path, and never clears
 * it when a later click lands on the same position and path (open a product, Back, open it again), so
 * its saved position can be the first visit's. A click writes the right place on the entry itself
 * (`history.state.scroll`), so only Back and Forward need this.
 */
const placeOf = new Map<string, Place>()
let current: string | undefined
let leftAt: Place | undefined
let made = 0
let listening = false

/** Notes the entry a navigation landed on, and whether the shopper came back to it rather than making it. */
function land(): { entry: string; returned: boolean } | undefined {
  if (typeof window === 'undefined' || !window.history.state) return undefined
  if (!listening) {
    listening = true
    // Runs before vue-router navigates, while the page being left is still on screen.
    window.addEventListener('popstate', () => { leftAt = { left: window.scrollX, top: window.scrollY } })
  }
  const state = window.history.state as { entry?: string }
  const returned = !!state.entry && state.entry !== current
  if (current && state.entry !== current) {
    // Left with Back or Forward: keep its place. Left with a click: the entry holds it, and any kept place is stale.
    if (returned && leftAt) placeOf.set(current, leftAt)
    else placeOf.delete(current)
  }
  leftAt = undefined
  if (!state.entry) window.history.replaceState({ ...state, entry: `${Date.now().toString(36)}-${++made}` }, '')
  current = (window.history.state as { entry: string }).entry
  return { entry: current, returned }
}

/**
 * Where the window scrolls after a navigation. Back and forward return to where the page was.
 * On a store's storefront a new page opens at its top, as on any web shop, and so does a new search;
 * a new filter, sort or variant on the same page keeps the shopper's place. Admin pages keep their
 * place, as before.
 */
export const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  const landed = land()
  if (landed?.returned) {
    const place = placeOf.get(landed.entry) ?? (window.history.state.scroll as Place | null | undefined) ?? savedPosition
    placeOf.delete(landed.entry)
    if (place) return place
  } else if (savedPosition) return savedPosition
  if (!String(to.name ?? '').startsWith('Storefront')) return false
  // The sticky header can search again from far down the last results: new results start at the top.
  const newSearch = to.name === 'StorefrontSearch' && String(to.query.q ?? '') !== String(from.query.q ?? '')
  return to.path !== from.path || newSearch ? { top: 0 } : false
}
