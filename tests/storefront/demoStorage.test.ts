import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_STORAGE_PREFIX, channelStoragePrefix, demoSlot, demoSlotFor } from '../../src/storefront/demoStorage.ts'
import type { StorageLike } from '../../src/storefront/demoStorage.ts'

/** An in-memory stand-in for localStorage, with an optional size limit like a real browser's. */
function memoryStorage(limit = Infinity): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (value.length > limit) throw new Error('QuotaExceededError')
      data.set(key, value)
    },
    removeItem: (key) => { data.delete(key) },
  }
}

const isNames = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === 'string')

test('what is saved comes back, under a key that names the demo store and the version', () => {
  const storage = memoryStorage()
  const slot = demoSlot('products', 1, storage, isNames)
  assert.equal(slot.key, `${DEMO_STORAGE_PREFIX}products.v1`)
  assert.equal(slot.load(), null)
  assert.equal(slot.save(['Unwind', 'Collagen+']), true)
  assert.deepEqual(slot.load(), ['Unwind', 'Collagen+'])
  assert.deepEqual([...storage.data.keys()], ['mp.vitaheal-demo.products.v1'])
})

test('data saved by an older version is not read by a newer one', () => {
  const storage = memoryStorage()
  demoSlot('products', 1, storage, isNames).save(['Unwind'])
  assert.equal(demoSlot('products', 2, storage, isNames).load(), null)
})

test('broken or unexpected data reads as nothing saved, so the store starts from its seed', () => {
  const storage = memoryStorage()
  const slot = demoSlot('products', 1, storage, isNames)
  storage.setItem(slot.key, '{not json')
  assert.equal(slot.load(), null)
  storage.setItem(slot.key, JSON.stringify([{ id: 1 }]))
  assert.equal(slot.load(), null)
})

test('a full browser store reports the failure and keeps what was saved before', () => {
  const storage = memoryStorage(20)
  const slot = demoSlot('products', 1, storage, isNames)
  assert.equal(slot.save(['Unwind']), true)
  assert.equal(slot.save(['A name far too long for this small store']), false)
  assert.deepEqual(slot.load(), ['Unwind'])
})

test('clearing removes the saved value', () => {
  const storage = memoryStorage()
  const slot = demoSlot('products', 1, storage, isNames)
  slot.save(['Unwind'])
  slot.clear()
  assert.equal(slot.load(), null)
  assert.equal(storage.data.size, 0)
})

test('without browser storage nothing is saved and nothing throws', () => {
  const slot = demoSlot('products', 1, undefined, isNames)
  assert.equal(slot.save(['Unwind']), false)
  assert.equal(slot.load(), null)
  slot.clear()
})

test('each store keeps its own keys: Vitaheal\'s are the ones it always had', () => {
  assert.equal(channelStoragePrefix('vitaheal-demo'), 'mp.vitaheal-demo.')
  assert.equal(channelStoragePrefix('vitaheal-demo'), DEMO_STORAGE_PREFIX)
  assert.equal(demoSlotFor('vitaheal-demo', 'products', 1, undefined, isNames).key, 'mp.vitaheal-demo.products.v1')
  assert.equal(demoSlotFor('vitaheal-demo', 'products', 1, undefined, isNames).key, demoSlot('products', 1, undefined, isNames).key)
  assert.equal(demoSlotFor('northfold-demo', 'products', 1, undefined, isNames).key, 'mp.demo-store.northfold-demo.products.v1')
})

test('a store named like an app key cannot reach that key', () => {
  // Create sales channel makes the id from the name, so a store can be called "Maropay".
  for (const id of ['maropay', 'store-builder', 'onboarding']) {
    assert.ok(channelStoragePrefix(id).startsWith('mp.demo-store.'), id)
    assert.ok(!demoSlotFor(id, 'v1', 1, undefined, isNames).key.startsWith(`mp.${id}.`), id)
  }
})

test('one store\'s saved value is not another\'s, and clearing one leaves the other', () => {
  const storage = memoryStorage()
  demoSlotFor('vitaheal-demo', 'products', 1, storage, isNames).save(['Unwind'])
  const other = demoSlotFor('test-garage', 'products', 1, storage, isNames)
  assert.equal(other.load(), null)
  other.save(['Brake pads'])
  other.clear()
  assert.deepEqual(demoSlot('products', 1, storage, isNames).load(), ['Unwind'])
  assert.deepEqual([...storage.data.keys()], ['mp.vitaheal-demo.products.v1'])
})
