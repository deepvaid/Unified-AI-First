// The price on a chat card (StorefrontChat.vue) is the store's card price for that
// product, looked up by its id in previewProducts: a women's and a men's piece may
// share a style, and the men's Trailhead Hiking Pants cost more than the women's.
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
const { useSalesChannelsStore } = await import('@/stores/useSalesChannels')
const { useCommerceStore } = await import('@/stores/useCommerce')
const { previewProducts } = await import('@/views/Storefront/storefrontCatalog')

test('a chat card is priced by its product’s id: the men’s Trailhead Hiking Pants are $85.00, the women’s $79.00', () => {
  setActivePinia(createPinia())
  const channel = useSalesChannelsStore().channels.find((c) => c.id === 'aurora-demo')
  assert.ok(channel, 'the Aurora (demo) store is seeded')
  const products = useCommerceStore().products
  const list = previewProducts(products, channel)
  assert.ok(list?.length)
  const pants = (wearer: string) => products.find((p) => p.channelIds?.includes('aurora-demo') && p.collections.includes(wearer) && p.collections.includes('Pants'))
  const [women, men] = [pants('Women'), pants('Men')]
  assert.ok(women && men && women.id !== men.id)
  // What the chat does: the card for that id.
  const price = (id: number) => list!.find((p) => p.id === id)?.price
  assert.equal(price(men.id), '$85.00')
  assert.equal(price(women.id), '$79.00')
  // Every card a store's drawing lists has its own id.
  assert.equal(new Set(list!.map((p) => p.id)).size, list!.length)
})
