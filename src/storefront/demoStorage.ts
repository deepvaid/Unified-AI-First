// What a sales person changes in a demo store is kept in this browser, so it
// survives a reload and reaches the storefront tab that "View store" opens.
// Pure: the storage is passed in, so `npm run test:storefront` runs this in Node.

/** The Vitaheal (demo) store's keys start with this, as they always have. */
export const DEMO_STORAGE_PREFIX = 'mp.vitaheal-demo.'

/**
 * Where one store's keys start. Vitaheal keeps its own prefix, so what a browser
 * saved before stays readable. Every other store's sit under `mp.demo-store.`: a
 * store made through Create sales channel takes its id from its name, and a bare
 * `mp.<id>.` could land on an app key such as `mp.maropay.`.
 */
export function channelStoragePrefix(channelId: string): string {
  return channelId === 'vitaheal-demo' ? DEMO_STORAGE_PREFIX : `mp.demo-store.${channelId}.`
}

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
  return slotAt(`${DEMO_STORAGE_PREFIX}${name}.v${version}`, storage, isValid)
}

/** One saved value of one store: `<channelStoragePrefix(channelId)><name>.v<version>`. */
export function demoSlotFor<T>(
  channelId: string,
  name: string,
  version: number,
  storage: StorageLike | undefined,
  isValid: (value: unknown) => value is T,
): DemoSlot<T> {
  return slotAt(`${channelStoragePrefix(channelId)}${name}.v${version}`, storage, isValid)
}

function slotAt<T>(key: string, storage: StorageLike | undefined, isValid: (value: unknown) => value is T): DemoSlot<T> {
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
