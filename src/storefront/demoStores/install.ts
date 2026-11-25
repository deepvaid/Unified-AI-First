// Installing a blueprint into a store: the ids it gets, the data it is seeded
// with, and which blueprint a store runs now. Pure: the storage is passed in.
//
// Ids are unique by construction, one block per (store, blueprint):
//   home      a blueprint on its own channel: products slot*1000 + n
//             (Vitaheal 2001-2016), variants productId*100 + n, collections
//             slot*1000 + 900 + n. Vitaheal keeps the ids it was seeded with:
//             variants productId*10 + n, collections 22 + n (23-28).
//   installed anywhere else: base = storeSlot*10000 + blueprintSlot*1000, so
//             products base + n (>= INSTALL_ID_FLOOR; Vitaheal on store slot 4 is
//             42001...), variants productId*100 + n, collections base + 900 + n.
//             Store slots 10-99 add 1,000,000, above the merchant window.
//   merchant  products a merchant creates: MERCHANT_PRODUCT_ID_FLOOR and up
//             (nextMerchantProductId), so they never land in a store's block.
// An id kept by history (a subscription's productId 2001) then points at nothing
// after another theme is applied, never at another store's product.

import type { SalesChannel } from '../../stores/useSalesChannels.ts'
import { demoSlotFor } from '../demoStorage.ts'
import type { DemoSlot, StorageLike } from '../demoStorage.ts'
import { demoStoreFor, homeBlueprintOf, isDemoStoreId } from './index.ts'
import type { DemoStoreBlueprint, DemoStoreId, InstallContext, StoreHistory, StoreSnapshot } from './types.ts'

/** Every id of a blueprint installed outside its home channel is at least this. */
export const INSTALL_ID_FLOOR = 20_000
/** The first id of a product a merchant creates. */
export const MERCHANT_PRODUCT_ID_FLOOR = 100_001
/** Installs on store slots 10-99 sit above this, clear of the merchant window. */
const HIGH_SLOT_BASE = 1_000_000

/** The channel fields an install reads. */
export type InstallChannel = Pick<SalesChannel, 'id' | 'name' | 'webStore'>

function inRange(what: string, n: number, max: number): number {
  if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`${what} ${n} is outside 1-${max}`)
  return n
}

/** Where a blueprint's ids start in a store. */
function idBase(blueprint: DemoStoreBlueprint, storeSlot: number, home: boolean): number {
  if (home) return blueprint.slot * 1000
  inRange('Store slot', storeSlot, 99)
  if (storeSlot < 2) throw new Error('Store slots start at 2')
  const block = storeSlot * 10_000 + blueprint.slot * 1000
  return storeSlot < 10 ? block : HIGH_SLOT_BASE + block
}

/** What installing `blueprint` into `channel` needs to know. The channel must carry `webStore.blueprint`. */
export function contextFor(blueprint: DemoStoreBlueprint, channel: InstallChannel, today: string): InstallContext {
  const ref = channel.webStore?.blueprint
  if (!ref || !channel.webStore) throw new Error(`${channel.id} cannot take a theme: it has no webStore.blueprint`)
  const home = channel.id === blueprint.homeChannel.id
  const base = idBase(blueprint, ref.slot, home)
  const legacy = home ? blueprint.legacyHomeIds : undefined
  return {
    channelId: channel.id,
    channelName: channel.name,
    domain: channel.webStore.domain,
    today,
    home,
    prefix: home ? blueprint.id : `${channel.id}--${blueprint.id}`,
    ids: {
      product: (n) => base + inRange('Product', n, 899),
      variant: (productId, n) => (legacy ? productId * legacy.variantFactor + inRange('Variant', n, legacy.variantFactor - 1) : productId * 100 + inRange('Variant', n, 99)),
      collection: (n) => (legacy ? legacy.collectionBase + inRange('Collection', n, 99) : base + 900 + inRange('Collection', n, 99)),
    },
  }
}

/** The id for a product a merchant creates: past every merchant product so far, never in a store's block. */
export function nextMerchantProductId(existingIds: Iterable<number>): number {
  let last = MERCHANT_PRODUCT_ID_FLOOR - 1
  for (const id of existingIds) if (id > last && id < HIGH_SLOT_BASE) last = id
  return last + 1
}

const built = new Map<string, StoreSnapshot>()

/**
 * What `channel` is seeded with when it runs `blueprintId`, as of `today` ("YYYY-MM-DD").
 * Built once per store, blueprint and day; each call returns its own deep copy, so the
 * caller may put it straight into reactive state and edit it.
 */
export function snapshotFor(channel: InstallChannel, blueprintId: DemoStoreId, today: string): StoreSnapshot {
  const blueprint = demoStoreFor(blueprintId)
  const ctx = contextFor(blueprint, channel, today)
  const key = JSON.stringify([blueprint.id, blueprint.seedVersion, ctx.channelId, ctx.channelName, ctx.domain, channel.webStore!.blueprint!.slot, today])
  let snapshot = built.get(key)
  if (!snapshot) {
    snapshot = blueprint.build(ctx)
    built.set(key, snapshot)
  }
  return structuredClone(snapshot)
}

/**
 * What happened in a demo store before the demo (subscribers, earlier chats), on its
 * home channel only and whatever theme it runs now; undefined for any other store.
 */
export function historyFor(channelId: string, today: string): StoreHistory | undefined {
  const blueprint = homeBlueprintOf(channelId)
  if (!blueprint?.history) return undefined
  return structuredClone(blueprint.history(contextFor(blueprint, blueprint.homeChannel, today)))
}

// ── Which blueprint a store runs ─────────────────────────────────────────────
// Applying a theme writes the store's `installed` record first, then each store
// part clears its saved slot and reseeds from currentBlueprintId(). Restore
// clears the record first, then the same. Another tab that sees a slot cleared
// reseeds from currentBlueprintId() too, which reads storage when it runs, so the
// order the events arrive in does not matter.

/** Which theme a store was given, and when. */
export interface InstalledRecord {
  blueprintId: DemoStoreId
  /** The blueprint's seedVersion when it was applied. */
  seedVersion: number
  /** ISO date-time. */
  appliedAt: string
}

export const INSTALLED_SLOT_NAME = 'installed'
export const INSTALLED_SLOT_VERSION = 1

function isInstalledRecord(value: unknown): value is InstalledRecord {
  const record = value as Partial<InstalledRecord> | null
  return !!record && isDemoStoreId(record.blueprintId) && typeof record.seedVersion === 'number' && typeof record.appliedAt === 'string'
}

/** The store's `installed` slot: `<channelStoragePrefix(channelId)>installed.v1`. Its `key` is what other tabs' storage events carry. */
export function installedSlot(channelId: string, storage: StorageLike | undefined): DemoSlot<InstalledRecord> {
  return demoSlotFor(channelId, INSTALLED_SLOT_NAME, INSTALLED_SLOT_VERSION, storage, isInstalledRecord)
}

/** The theme applied to a store, or null when it runs what it started with (or the record names a store this build does not have). */
export function readInstalled(channelId: string, storage: StorageLike | undefined): InstalledRecord | null {
  return installedSlot(channelId, storage).load()
}

/** False when the browser refused to save it. */
export function writeInstalled(channelId: string, record: InstalledRecord, storage: StorageLike | undefined): boolean {
  return installedSlot(channelId, storage).save(record)
}

export function clearInstalled(channelId: string, storage: StorageLike | undefined): void {
  installedSlot(channelId, storage).clear()
}

/**
 * The blueprint a store runs now: the theme applied to it, else the one it started
 * from. Null for a store that started blank, or one that cannot take a theme.
 */
export function currentBlueprintId(channel: Pick<SalesChannel, 'id' | 'webStore'>, storage: StorageLike | undefined): DemoStoreId | null {
  const ref = channel.webStore?.blueprint
  if (!ref) return null
  return readInstalled(channel.id, storage)?.blueprintId ?? ref.original
}

/**
 * The store's saved data comes from an older seed of the blueprint it runs, so it
 * should be reseeded (a seed fix then reaches a browser that saved the old one).
 * A store without an `installed` record counts as seeded at version 1.
 */
export function isSeedStale(channel: Pick<SalesChannel, 'id' | 'webStore'>, storage: StorageLike | undefined): boolean {
  const id = currentBlueprintId(channel, storage)
  if (!id) return false
  return demoStoreFor(id).seedVersion > (readInstalled(channel.id, storage)?.seedVersion ?? 1)
}
