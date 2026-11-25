// The launch checklist's hand-marked steps as the app keeps them: saved under the
// store's own key, read back after a reload, and forgotten when the store is
// restored or deleted. The rules themselves are in storeLaunch.test.ts.
// The stores import each other with '@/', so the resolve hook is registered first.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { setMaxListeners } from 'node:events'

register('../support/appImports.mjs', import.meta.url)

const memory = new Map<string, string>()
const window = new EventTarget()
setMaxListeners(0, window)
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)) },
    removeItem: (key: string) => { memory.delete(key) },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
    clear: () => memory.clear(),
  },
  window,
})

const { createPinia, setActivePinia } = await import('pinia')
const { useDemoStores } = await import('@/stores/useDemoStores')
const { useStoreLaunchStore } = await import('@/stores/useStoreLaunch')

const ACCOUNT = '2000290'
const KEY = 'mp.demo-store.test-garage.launch.v1'

/** The app starting in the browser as it is now (nothing is cleared between starts). */
function startApp() {
  setActivePinia(createPinia())
  return { demoStores: useDemoStores(), launch: useStoreLaunchStore() }
}

test('a step marked done is kept under the store’s own key and read back after a reload', () => {
  memory.clear()
  const first = startApp()
  const store = first.demoStores.create(ACCOUNT, { name: 'Test Garage', type: 'web_store', storeBuilderEnabled: true, merchandiseConnected: false, theme: 'daybloom' })
  assert.equal(store.id, 'test-garage')
  first.launch.load(store.id)
  assert.deepEqual(first.launch.confirmed(store.id), [])
  assert.equal(memory.has(KEY), false, 'nothing is kept until a step is marked')

  assert.equal(first.launch.confirm(store.id, 'shipping'), true)
  assert.equal(first.launch.confirm(store.id, 'shipping'), true, 'marking it again changes nothing')
  assert.equal(first.launch.confirm(store.id, 'taxes'), true)
  assert.deepEqual(first.launch.confirmed(store.id), ['shipping', 'taxes'])
  assert.equal(memory.get(KEY), '["shipping","taxes"]')
  // A step the store reads by itself is never marked by hand.
  assert.equal(first.launch.confirm(store.id, 'payments'), false)
  assert.deepEqual(first.launch.confirmed(store.id), ['shipping', 'taxes'])

  const second = startApp()
  assert.deepEqual(second.launch.confirmed(store.id), [], 'nothing is read until the store’s page opens')
  second.launch.load(store.id)
  assert.deepEqual(second.launch.confirmed(store.id), ['shipping', 'taxes'])
})

test('restoring the store, or deleting it, forgets what was marked', () => {
  const app = startApp()
  app.launch.load('test-garage')
  assert.deepEqual(app.launch.confirmed('test-garage'), ['shipping', 'taxes'])

  assert.equal(app.demoStores.restore('test-garage'), true)
  assert.deepEqual(app.launch.confirmed('test-garage'), [])
  assert.equal(memory.has(KEY), false)

  app.launch.confirm('test-garage', 'branding')
  assert.equal(memory.get(KEY), '["branding"]')
  assert.equal(app.demoStores.remove('test-garage'), true)
  assert.deepEqual(app.launch.confirmed('test-garage'), [])
  assert.equal(memory.has(KEY), false)
})

test('a list this build cannot read is ignored', () => {
  memory.set(KEY, JSON.stringify({ version: 1, value: ['payments'] }))
  const app = startApp()
  app.launch.load('test-garage')
  assert.deepEqual(app.launch.confirmed('test-garage'), [])
})
