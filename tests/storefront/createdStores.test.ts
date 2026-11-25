// The stores made with Create sales channel, as this browser keeps them
// (src/storefront/createdStores.ts): read back only when they still fit, a slot
// each, and every key of one store found for deleting it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CREATED_STORES_KEY, FIRST_CREATED_SLOT, MAX_STORE_SLOT, nextStoreSlot, readCreatedRecord, readCreatedStores, storeKeys, writeCreatedStores,
} from '../../src/storefront/createdStores.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'
import { DEMO_STORES } from '../../src/storefront/demoStores/index.ts'
import type { DemoStoreId } from '../../src/storefront/demoStores/index.ts'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size },
  }
}

function made(id: string, slot: number, original: DemoStoreId | null = null): SalesChannel {
  return {
    id, accountId: '2000290', name: id, type: 'web_store', provider: 'maropost_store_builder', status: 'needs_setup', health: 'incomplete',
    connectedClouds: ['commerce', 'store_builder'], createdAt: '2026-11-24T10:00:00.000Z', updatedAt: '2026-11-24T10:00:00.000Z', lastActivityAt: '2026-11-24T10:00:00.000Z',
    webStore: { domain: `${id}.maropost.store`, storeBuilderEnabled: true, published: false, merchandiseConnected: false, demo: true, blueprint: { original, slot } },
  }
}

test('created stores round-trip under one key; an empty list removes it', () => {
  const storage = memoryStorage()
  assert.deepEqual(readCreatedStores(storage), [])
  const stores = [made('test-garage', 10, 'torqline'), made('blank-shop', 11)]
  assert.equal(writeCreatedStores(storage, { stores, retired: [{ id: 'old-shop', slot: 12 }] }), true)
  assert.deepEqual(readCreatedStores(storage), stores)
  assert.deepEqual(readCreatedRecord(storage).retired, [{ id: 'old-shop', slot: 12 }])
  assert.equal(writeCreatedStores(storage, { stores: [], retired: [] }), true)
  assert.equal(storage.data.has(CREATED_STORES_KEY), false)
  assert.equal(writeCreatedStores(undefined, { stores, retired: [] }), false)
})

test('a record this build cannot use is left out, and junk reads as none', () => {
  const storage = memoryStorage()
  const good = made('ok', 10, 'northfold')
  const unknownTheme = { ...made('old', 11), webStore: { ...made('old', 11).webStore!, blueprint: { original: 'garden', slot: 11 } } }
  const demoSlot = made('clash', 5, 'vitaheal')
  const offline = { ...made('pos', 12), type: 'offline_store' }
  storage.setItem(CREATED_STORES_KEY, JSON.stringify({ stores: [good, unknownTheme, demoSlot, offline, null, 'x'], retired: [{ id: 'gone', slot: 13 }, { id: 3 }] }))
  assert.deepEqual(readCreatedStores(storage), [good])
  assert.deepEqual(readCreatedRecord(storage).retired, [{ id: 'gone', slot: 13 }])
  storage.setItem(CREATED_STORES_KEY, '{not json')
  assert.deepEqual(readCreatedStores(storage), [])
})

test('the next slot is past every one in use, from 10 to 99: 2-9 stay free for demo stores', () => {
  const homes = DEMO_STORES.map((blueprint) => blueprint.homeChannel)
  assert.equal(nextStoreSlot(homes), FIRST_CREATED_SLOT)
  assert.equal(FIRST_CREATED_SLOT, 10)
  assert.equal(nextStoreSlot([...homes, made('a', 10), made('b', 14)]), 15)
  // A deleted store's slot is never taken again.
  assert.equal(nextStoreSlot([...homes, made('a', 10)], [{ id: 'b', slot: 14 }]), 15)
  assert.equal(nextStoreSlot([made('last', MAX_STORE_SLOT)]), null)
})

test('a store\'s keys are its own: a store whose id starts the same keeps its keys', () => {
  const storage = memoryStorage()
  for (const key of ['mp.demo-store.garage.products.v1', 'mp.demo-store.garage.themes.v1', 'mp.demo-store.garage-2.products.v1', 'mp.vitaheal-demo.products.v1', CREATED_STORES_KEY]) storage.setItem(key, '[]')
  assert.deepEqual(storeKeys(storage, 'garage'), ['mp.demo-store.garage.products.v1', 'mp.demo-store.garage.themes.v1'])
  assert.deepEqual(storeKeys(undefined, 'garage'), [])
})
