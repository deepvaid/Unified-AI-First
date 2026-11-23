// The web stores made with Create sales channel and Store Builder switched on.
// They are kept in this browser, so a new tab (the storefront that "Show store"
// opens) has them too, and each can take a theme from the library. Pure: the
// storage is passed in, so `npm run test:storefront` runs this in Node.

import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { StorageLike } from './demoStorage.ts'
import { isDemoStoreId } from './demoStores/index.ts'

export const CREATED_STORES_KEY = 'mp.store-builder.created-stores.v1'
/**
 * Slots 2-9 belong to the demo stores (src/storefront/demoStores/: 2-4 today, the
 * rest kept for the ones added later); a created store takes the next free one from here.
 */
export const FIRST_CREATED_SLOT = 10
/** The id blocks run out past this (src/storefront/demoStores/install.ts). */
export const MAX_STORE_SLOT = 99

function isCreatedStore(value: unknown): value is SalesChannel {
  const channel = value as Partial<SalesChannel> | null
  const ref = channel?.webStore?.blueprint
  return !!channel && typeof channel.id === 'string' && typeof channel.accountId === 'string' && typeof channel.name === 'string'
    && channel.type === 'web_store' && !!ref && Number.isInteger(ref.slot) && ref.slot >= FIRST_CREATED_SLOT && ref.slot <= MAX_STORE_SLOT
    && (ref.original === null || isDemoStoreId(ref.original))
}

/**
 * A store deleted here. Its id and slot are never given to another store in this
 * browser: what other parts of the app keep by store id (Maropay sessions, orders)
 * would otherwise belong to the new one, and its ids would point at the new store's products.
 */
export interface RetiredStore {
  id: string
  slot: number
}

/** What the browser keeps: the stores made here, oldest first, and those deleted. */
export interface CreatedStoresRecord {
  stores: SalesChannel[]
  retired: RetiredStore[]
}

function isRetired(value: unknown): value is RetiredStore {
  const retired = value as Partial<RetiredStore> | null
  return !!retired && typeof retired.id === 'string' && Number.isInteger(retired.slot)
}

/** What this browser holds. A record this build cannot read is left out. */
export function readCreatedRecord(storage: StorageLike | undefined): CreatedStoresRecord {
  try {
    const parsed = JSON.parse(storage?.getItem(CREATED_STORES_KEY) ?? '{}') as Partial<CreatedStoresRecord> | null
    return {
      stores: Array.isArray(parsed?.stores) ? parsed.stores.filter(isCreatedStore) : [],
      retired: Array.isArray(parsed?.retired) ? parsed.retired.filter(isRetired) : [],
    }
  } catch {
    return { stores: [], retired: [] }
  }
}

/** The stores this browser made, oldest first. */
export function readCreatedStores(storage: StorageLike | undefined): SalesChannel[] {
  return readCreatedRecord(storage).stores
}

/** False when the browser refused it (storage full or blocked). Nothing to keep removes the key. */
export function writeCreatedStores(storage: StorageLike | undefined, record: CreatedStoresRecord): boolean {
  if (!storage) return false
  try {
    if (record.stores.length || record.retired.length) storage.setItem(CREATED_STORES_KEY, JSON.stringify(record))
    else storage.removeItem(CREATED_STORES_KEY)
    return true
  } catch {
    return false
  }
}

/** The slot for the next store made here: one past every slot in use or retired, from 10. Null when none is left. */
export function nextStoreSlot(channels: readonly Pick<SalesChannel, 'webStore'>[], retired: readonly RetiredStore[] = []): number | null {
  const used = [...channels.map((channel) => channel.webStore?.blueprint?.slot ?? 0), ...retired.map((store) => store.slot)]
  const next = Math.max(FIRST_CREATED_SLOT - 1, ...used) + 1
  return next <= MAX_STORE_SLOT ? next : null
}

/** Every key the browser holds for one store (its parts under `mp.demo-store.<id>.`), for deleting it. */
export function storeKeys(storage: Pick<Storage, 'key' | 'length'> | undefined, channelId: string): string[] {
  if (!storage) return []
  const prefix = `mp.demo-store.${channelId}.`
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(prefix)) keys.push(key)
  }
  return keys
}
