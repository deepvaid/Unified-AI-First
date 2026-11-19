import { watch } from 'vue'
import { useToast } from '@/composables/useToast'
import type { DemoSlot } from '@/storefront/demoStorage'

// How a Pinia store keeps its part of the Vitaheal (demo) store in the browser.
// The storage rules themselves are pure, in src/storefront/demoStorage.ts.

/** localStorage, or nothing where the browser blocks it. */
export function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** One warning for the whole app, however many saves fail after it. */
let warnedStorageFull = false

/**
 * Keeps one part of the demo store in a slot.
 *
 * - `read` returns that part; a real change to it is saved. Taking it from
 *   storage or from the seed is not a change, so a store nobody has touched
 *   keeps following the seed.
 * - `take` puts a value from another tab in place (`null`: that tab restored
 *   the store, so go back to the seed).
 *
 * Call `adopt()` after replacing the part yourself (a restore), so the
 * replacement is not saved straight back.
 */
export function keepInBrowser<T>(slot: DemoSlot<T>, read: () => T, take: (saved: T | null) => void): { adopt: () => void } {
  let known = JSON.stringify(read())
  const adopt = (): void => {
    known = JSON.stringify(read())
  }

  watch(read, (value) => {
    const current = JSON.stringify(value)
    if (current === known) return
    known = current
    if (slot.save(value) || warnedStorageFull) return
    warnedStorageFull = true
    useToast().warning('This browser has no room left, so changes to the demo store will be gone after a reload. Remove a few product pictures, or restore the store.', { title: 'Changes not kept' })
  }, { deep: true })

  // Another tab changed the demo store (the admin, beside an open storefront): follow it.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== slot.key) return
      take(slot.load())
      adopt()
    })
  }

  return { adopt }
}
