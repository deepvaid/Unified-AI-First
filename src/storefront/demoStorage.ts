// What a sales person changes in the Vitaheal (demo) store is kept in this browser,
// so it survives a reload and reaches the storefront tab that "View store" opens.
// Pure: the storage is passed in, so `npm run test:storefront` runs this in Node.

/** Every key this module writes starts with this, so a restore can be sure it found them all. */
export const DEMO_STORAGE_PREFIX = 'mp.vitaheal-demo.'

/** The part of `Storage` a slot uses. `localStorage` satisfies it. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface DemoSlot<T> {
  /** The full storage key, for matching `storage` events from other tabs. */
  key: string
  /** The saved value, or `null` when there is none or it is not what `isValid` expects. */
  load(): T | null
  /** False when the browser refused (storage full or blocked): the caller tells the user. */
  save(value: T): boolean
  clear(): void
}

/**
 * One saved value. The version is part of the key, so data saved by an older
 * shape is never read by a newer one: the store starts from its seed again.
 */
export function demoSlot<T>(
  name: string,
  version: number,
  storage: StorageLike | undefined,
  isValid: (value: unknown) => value is T,
): DemoSlot<T> {
  const key = `${DEMO_STORAGE_PREFIX}${name}.v${version}`
  return {
    key,
    load() {
      try {
        const raw = storage?.getItem(key)
        if (raw == null) return null
        const value: unknown = JSON.parse(raw)
        return isValid(value) ? value : null
      } catch {
        return null
      }
    },
    save(value) {
      if (!storage) return false
      try {
        storage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
    clear() {
      try {
        storage?.removeItem(key)
      } catch {
        // Storage blocked: there was nothing saved to remove.
      }
    },
  }
}
