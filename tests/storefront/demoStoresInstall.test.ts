import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  INSTALL_ID_FLOOR, MERCHANT_PRODUCT_ID_FLOOR, clearInstalled, contextFor, currentBlueprintId, installedSlot, isSeedStale,
  nextMerchantProductId, readInstalled, snapshotFor, writeInstalled,
} from '../../src/storefront/demoStores/install.ts'
import { DEMO_STORES, canApplyTheme, demoStoreFor, homeBlueprintOf, isDemoChannelId, isDemoStoreId } from '../../src/storefront/demoStores/index.ts'
import type { StorageLike } from '../../src/storefront/demoStorage.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'
import type { DemoStoreBlueprint, DemoStoreId } from '../../src/storefront/demoStores/types.ts'

const TODAY = '2026-11-18'

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) }, removeItem: (key) => { data.delete(key) } }
}

/** A web store; `slot` null for one that cannot take a theme. */
function store(id: string, slot: number | null, original: DemoStoreId | null = null): SalesChannel {
  return {
    id, accountId: '2000290', name: id, type: 'web_store', provider: 'maropost_store_builder', status: 'connected', health: 'healthy',
    connectedClouds: ['commerce', 'store_builder'], createdAt: '', updatedAt: '', lastActivityAt: '',
    webStore: { domain: `${id}.example`, storeBuilderEnabled: true, published: true, merchandiseConnected: false, ...(slot === null ? {} : { blueprint: { original, slot } }) },
  }
}

const vitaheal = demoStoreFor('vitaheal')

// ── Registry ─────────────────────────────────────────────────────────────────

test('the registry knows its stores by id and by home channel', () => {
  assert.equal(isDemoStoreId('vitaheal'), true)
  assert.equal(isDemoStoreId('northwind'), false)
  assert.equal(homeBlueprintOf('vitaheal-demo'), vitaheal)
  assert.equal(homeBlueprintOf('neelam-store'), undefined)
  assert.equal(isDemoChannelId('vitaheal-demo'), true)
  assert.equal(isDemoChannelId('retest-sales-notification'), false)
  assert.throws(() => demoStoreFor('northwind' as never))
})

test('every blueprint has its own slot, a home channel that names it, and a seed version', () => {
  const slots = DEMO_STORES.map((b) => b.slot)
  assert.equal(new Set(slots).size, slots.length)
  for (const b of DEMO_STORES) {
    assert.ok(b.slot >= 2 && b.slot <= 9, `${b.id} slot ${b.slot}`)
    assert.deepEqual(b.homeChannel.webStore?.blueprint, { original: b.id, slot: b.slot })
    assert.ok(Number.isInteger(b.seedVersion) && b.seedVersion >= 1)
  }
})

test('only a store with webStore.blueprint can take a theme', () => {
  assert.equal(canApplyTheme(vitaheal.homeChannel), true)
  assert.equal(canApplyTheme(store('test-garage', 5)), true)
  for (const id of ['neelam-store', 'retest-sales-notification', 'shopify-fashion', 'beta-sales-channel']) assert.equal(canApplyTheme(store(id, null)), false)
  assert.equal(canApplyTheme(undefined), false)
  assert.equal(canApplyTheme({ webStore: undefined }), false)
})

// ── Ids ──────────────────────────────────────────────────────────────────────

/** Every product, variant and collection id a blueprint gets on a store. */
function idsOf(blueprint: DemoStoreBlueprint, channel: SalesChannel) {
  const snapshot = snapshotFor(channel, blueprint.id, TODAY)
  return {
    products: snapshot.products.map((p) => p.id),
    variants: snapshot.products.flatMap((p) => p.detail?.variantsList.map((v) => v.id) ?? []),
    collections: snapshot.collections.map((c) => c.id),
  }
}

test('Vitaheal keeps its seeded ids on its home channel', () => {
  const ids = idsOf(vitaheal, vitaheal.homeChannel)
  assert.deepEqual(ids.products, [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008])
  assert.deepEqual(ids.variants.slice(0, 3), [20011, 20012, 20021])
  assert.deepEqual(ids.collections, [23, 24, 25, 26, 27])
})

test('ids never repeat across every store and blueprint, and each install stays in its block', () => {
  const stores = [...DEMO_STORES.map((b) => b.homeChannel), ...[5, 6, 7, 8, 9, 10, 11, 42, 99].map((slot) => store(`store-${slot}`, slot))]
  const seen = { products: new Set<number>(), variants: new Set<number>(), collections: new Set<number>() }
  for (const channel of stores) {
    for (const blueprint of DEMO_STORES) {
      const home = channel.id === blueprint.homeChannel.id
      const ids = idsOf(blueprint, channel)
      for (const kind of ['products', 'variants', 'collections'] as const) {
        for (const id of ids[kind]) {
          assert.ok(!seen[kind].has(id), `${kind} id ${id} (${blueprint.id} on ${channel.id}) is used once`)
          seen[kind].add(id)
        }
      }
      const slot = channel.webStore!.blueprint!.slot
      for (const id of ids.products) {
        if (home) assert.ok(id > blueprint.slot * 1000 && id < blueprint.slot * 1000 + 900, `${id} in ${blueprint.id}'s home block`)
        else {
          assert.ok(id >= INSTALL_ID_FLOOR, `${id} is at least the install floor`)
          assert.equal(Math.floor((id % 1_000_000) / 1000), slot * 10 + blueprint.slot, `${id} is in store ${slot}'s block for ${blueprint.id}`)
          assert.ok(id < MERCHANT_PRODUCT_ID_FLOOR || id > 1_000_000, `${id} stays out of the merchant window`)
        }
      }
    }
  }
})

test('a store slot outside 2-99 or a product past 899 is refused, not given a clashing id', () => {
  assert.throws(() => contextFor(vitaheal, store('store-1', 1), TODAY))
  assert.throws(() => contextFor(vitaheal, store('store-100', 100), TODAY))
  assert.throws(() => contextFor(vitaheal, store('plain', null), TODAY))
  const ctx = contextFor(vitaheal, store('store-5', 5), TODAY)
  assert.equal(ctx.ids.product(899), 52899)
  assert.throws(() => ctx.ids.product(900))
  assert.throws(() => ctx.ids.product(0))
  assert.throws(() => ctx.ids.variant(52001, 100))
})

test('a merchant\'s new product is numbered past every merchant product, never inside a store\'s block', () => {
  assert.equal(nextMerchantProductId([]), MERCHANT_PRODUCT_ID_FLOOR)
  assert.equal(nextMerchantProductId([1000, 1040, 2008, 42008, 99999]), MERCHANT_PRODUCT_ID_FLOOR)
  assert.equal(nextMerchantProductId([2001, 100001, 100004]), 100005)
  assert.equal(nextMerchantProductId([100001, 1_102_001]), 100002, 'an install on a high store slot is not a merchant product')
})

// ── Snapshots ────────────────────────────────────────────────────────────────

test('each snapshot is the caller\'s own copy', () => {
  const a = snapshotFor(vitaheal.homeChannel, 'vitaheal', TODAY)
  a.products[0]!.name = 'Changed'
  a.theme.templates.home[0]!.settings.text = 'Changed'
  a.chrome.nav.pop()
  const b = snapshotFor(vitaheal.homeChannel, 'vitaheal', TODAY)
  assert.equal(b.products[0]!.name, 'Unwind')
  assert.notEqual(b.theme.templates.home[0]!.settings.text, 'Changed')
  assert.equal(b.chrome.nav.length, a.chrome.nav.length + 1)
})

test('the snapshot follows the day it is built for', () => {
  const campaigns = snapshotFor(vitaheal.homeChannel, 'vitaheal', '2026-12-01').campaigns
  assert.equal(campaigns[0]!.startDate, '2026-11-28')
})

// ── What a store runs ────────────────────────────────────────────────────────

test('the installed record round-trips under the store\'s own key, and junk reads as nothing', () => {
  const storage = memoryStorage()
  assert.equal(readInstalled('vitaheal-demo', storage), null)
  const record = { blueprintId: 'vitaheal' as const, seedVersion: 1, appliedAt: '2026-11-19T10:00:00Z' }
  assert.equal(writeInstalled('test-garage', record, storage), true)
  assert.deepEqual(readInstalled('test-garage', storage), record)
  assert.deepEqual([...storage.data.keys()], ['mp.demo-store.test-garage.installed.v1'])
  assert.equal(installedSlot('vitaheal-demo', storage).key, 'mp.vitaheal-demo.installed.v1')
  clearInstalled('test-garage', storage)
  assert.equal(storage.data.size, 0)
  storage.setItem('mp.demo-store.test-garage.installed.v1', JSON.stringify({ blueprintId: 'northwind', seedVersion: 1, appliedAt: '' }))
  assert.equal(readInstalled('test-garage', storage), null, 'a store this build does not know reads as nothing applied')
})

test('a store runs the theme applied to it, else the one it started from', () => {
  const storage = memoryStorage()
  assert.equal(currentBlueprintId(vitaheal.homeChannel, storage), 'vitaheal')
  assert.equal(currentBlueprintId(store('blank', 5), storage), null, 'a blank store runs nothing until a theme is applied')
  writeInstalled('blank', { blueprintId: 'vitaheal', seedVersion: 1, appliedAt: '2026-11-19T10:00:00Z' }, storage)
  assert.equal(currentBlueprintId(store('blank', 5), storage), 'vitaheal')
  clearInstalled('blank', storage)
  assert.equal(currentBlueprintId(store('blank', 5), storage), null)
  writeInstalled('neelam-store', { blueprintId: 'vitaheal', seedVersion: 1, appliedAt: '' }, storage)
  assert.equal(currentBlueprintId(store('neelam-store', null), storage), null, 'a store that cannot take a theme runs none')
  assert.equal(currentBlueprintId(vitaheal.homeChannel, undefined), 'vitaheal', 'without browser storage, the original')
})

test('saved data is stale once the blueprint\'s seed version passes the one it was applied at', () => {
  const storage = memoryStorage()
  assert.equal(isSeedStale(vitaheal.homeChannel, storage), vitaheal.seedVersion > 1)
  writeInstalled('vitaheal-demo', { blueprintId: 'vitaheal', seedVersion: vitaheal.seedVersion, appliedAt: '' }, storage)
  assert.equal(isSeedStale(vitaheal.homeChannel, storage), false)
  writeInstalled('vitaheal-demo', { blueprintId: 'vitaheal', seedVersion: vitaheal.seedVersion - 1, appliedAt: '' }, storage)
  assert.equal(isSeedStale(vitaheal.homeChannel, storage), true)
  assert.equal(isSeedStale(store('blank', 5), memoryStorage()), false)
})
