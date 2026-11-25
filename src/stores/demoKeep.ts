import { watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { demoSlotFor } from '@/storefront/demoStorage'
import type { DemoSlot } from '@/storefront/demoStorage'

// How a Pinia store keeps its part of a demo store in the browser.
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

/** One part of every demo store, each store in its own slot (see keepPerChannel). */
export interface ChannelKeeper {
  /**
   * Starts keeping the store's part: puts a saved value in place if there is one,
   * then saves real changes and follows other tabs. Seed the store's part first.
   * Calling it again for the same store does nothing.
   */
  attach(channelId: string): void
  /** After replacing the store's part yourself (a reseed), so the replacement is not saved straight back. */
  adopt(channelId: string): void
  /** Removes the store's saved value; attached or not. */
  clear(channelId: string): void
}

/**
 * keepInBrowser for a part that every demo store has, kept per store under
 * `<channelStoragePrefix(channelId)><name>.v<version>`, so Vitaheal's keys stay
 * `mp.vitaheal-demo.<name>.v<version>`.
 *
 * - `read(channelId)` returns that store's part; a real change to it is saved.
 * - `take(channelId, saved)` puts a value in place: a saved one, or `null` when
 *   another tab cleared it (a restore or an applied theme), so reseed the store
 *   from currentBlueprintId() (src/storefront/demoStores/install.ts).
 */
export function keepPerChannel<T>(
  name: string,
  version: number,
  isValid: (value: unknown) => value is T,
  part: { read(channelId: string): T; take(channelId: string, saved: T | null): void },
): ChannelKeeper {
  const kept = new Map<string, { adopt: () => void }>()
  const slotOf = (channelId: string): DemoSlot<T> => demoSlotFor(channelId, name, version, browserStorage(), isValid)

  return {
    attach(channelId) {
      if (kept.has(channelId)) return
      const slot = slotOf(channelId)
      const saved = slot.load()
      if (saved !== null) part.take(channelId, saved)
      kept.set(channelId, keepInBrowser(slot, () => part.read(channelId), (fromOtherTab) => part.take(channelId, fromOtherTab)))
    },
    adopt(channelId) {
      kept.get(channelId)?.adopt()
    },
    clear(channelId) {
      slotOf(channelId).clear()
    },
  }
}
