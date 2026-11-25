// Size charts as the app keeps them (src/stores/useSizeCharts.ts): seeded from the
// theme each store runs, edited in Products › Size charts, kept in the browser per
// store under `size-charts.v1`, and put back by Restore original store.
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
const { useSalesChannelsStore, SEEDED_DEMO_CHANNELS } = await import('@/stores/useSalesChannels')
const { useCommerceStore } = await import('@/stores/useCommerce')
const { useSizeChartsStore, emptySizeChart } = await import('@/stores/useSizeCharts')
const { useDemoStores } = await import('@/stores/useDemoStores')
const { homeBlueprintOf, isDemoStoreId } = await import('@/storefront/demoStores')
const { currentBlueprintId, snapshotFor } = await import('@/storefront/demoStores/install')
const { localDateKey } = await import('@/maropay/model')

const VH = 'vitaheal-demo'
const NF = 'northfold-demo'
/** Northfold joins the registry in Part 2; the tests that need its charts wait for it. */
const northfold = homeBlueprintOf(NF)
const needsNorthfold = northfold ? false : 'Northfold is not in the demo store registry yet'

const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value))
/** Lets the stores' watchers save to the browser. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
const chartKeys = () => [...memory.keys()].filter((key) => key.includes('.size-charts.')).sort()
const today = () => localDateKey(Date.now())

/** The app starting in a browser that holds `saved`. */
function startApp(saved: Record<string, string> = {}) {
  memory.clear()
  for (const [key, value] of Object.entries(saved)) memory.set(key, value)
  setActivePinia(createPinia())
  return { channels: useSalesChannelsStore(), commerce: useCommerceStore(), charts: useSizeChartsStore(), demoStores: useDemoStores() }
}
type App = ReturnType<typeof startApp>
const savedNow = () => Object.fromEntries([...memory.entries()])

/** What the theme a store runs now seeds it with. */
function seededFor(app: App, channelId: string) {
  const channel = app.channels.channels.find((c) => c.id === channelId)!
  const id = currentBlueprintId(channel, localStorage)
  return id ? snapshotFor(channel, id, today()).sizeCharts : []
}

// A store made from a theme (Part 4): the app brings it in with useDemoStores().attach.
const CREATED = 'test-boutique'
function addCreatedStore(app: App, original: 'vitaheal' | 'northfold' = 'vitaheal') {
  const vitaheal = plain(app.channels.channels.find((channel) => channel.id === VH)!)
  app.channels.channels.push({
    ...vitaheal, id: CREATED, name: 'Test Boutique',
    webStore: { ...vitaheal.webStore!, domain: 'test-boutique.uat.maropost.store', blueprint: { original, slot: 11 } },
  })
  assert.equal(app.demoStores.attach(CREATED), true)
}

test('every demo store starts with the charts of the theme it runs, Vitaheal with none, and nothing is written', async () => {
  const app = startApp()
  await settle()
  assert.ok(SEEDED_DEMO_CHANNELS.some((channel) => channel.id === VH))
  for (const channel of SEEDED_DEMO_CHANNELS) assert.deepEqual(plain(app.charts.chartsForChannel(channel.id)), seededFor(app, channel.id), channel.id)
  assert.deepEqual(app.charts.chartsForChannel(VH), [])
  // Only demo stores have charts.
  assert.ok(app.charts.charts.every((chart) => SEEDED_DEMO_CHANNELS.some((channel) => channel.id === chart.channelId)))
  assert.deepEqual(chartKeys(), [])
})

test('Northfold\'s sized products each show a chart of their own store', { skip: needsNorthfold }, async () => {
  const app = startApp()
  const charts = app.charts.chartsForChannel(NF)
  assert.equal(charts.length, 5)
  const sized = app.commerce.products.filter((product) => product.channelIds?.includes(NF) && product.detail?.options.some((option) => /size/i.test(option.name)))
  assert.ok(sized.length > 0)
  for (const product of sized) assert.equal(app.charts.chartForProduct(product)?.channelId, NF, product.name)
  assert.ok(app.charts.productsUsing(charts[0]!.id).length > 0)
})

test('the stores that cannot take a theme get no charts, and a reseed of them does nothing', async () => {
  const app = startApp()
  for (const id of ['neelam-store', 'retest-sales-notification', 'shopify-fashion', 'beta-sales-channel', 'max-test-store', 'pos-store']) {
    app.charts.reseedDemo(id)
    app.charts.attachDemo(id)
    assert.deepEqual(app.charts.chartsForChannel(id), [], id)
  }
  await settle()
  assert.deepEqual(chartKeys(), [])
})

test('create, edit, duplicate and delete: a chart in use is not deleted until the merchant confirms, and then its products let it go', async () => {
  const app = startApp()
  addCreatedStore(app)
  const chart = app.charts.createChart({ ...emptySizeChart(CREATED), name: '  Tops  ', rows: [{ size: 'S', values: ['34-36', '28-30'] }, { size: 'M', values: ['37-39', '31-33'] }] })
  assert.equal(chart.name, 'Tops')
  assert.equal(chart.channelId, CREATED)
  assert.deepEqual(app.charts.chartsForChannel(CREATED).map((c) => c.id), [chart.id])

  const edited = app.charts.updateChart(chart.id, { name: 'Tops and tees', unit: 'cm', fitNote: 'Body measurements.' })!
  assert.equal(edited.name, 'Tops and tees')
  assert.equal(app.charts.getChart(chart.id)?.unit, 'cm')
  assert.equal(app.charts.updateChart('no-such-chart', { name: 'x' }), undefined)

  const copy = app.charts.duplicateChart(chart.id)!
  assert.equal(copy.name, 'Tops and tees (copy)')
  assert.notEqual(copy.id, chart.id)
  assert.deepEqual(copy.rows, edited.rows)
  assert.notEqual(copy.rows, app.charts.getChart(chart.id)!.rows, 'the copy has rows of its own')
  assert.deepEqual(app.charts.chartsForChannel(CREATED).map((c) => c.id), [chart.id, copy.id])

  // Link a product of that store to the chart.
  const product = app.commerce.products.find((p) => p.channelIds?.includes(CREATED))!
  product.detail!.sizeChartId = chart.id
  assert.equal(app.charts.chartForProduct(product)?.id, chart.id)
  const refused = app.charts.deleteChart(chart.id)
  assert.deepEqual(refused, { deleted: false, usedBy: [{ id: product.id, name: product.name }] })
  assert.ok(app.charts.getChart(chart.id))
  const done = app.charts.deleteChart(chart.id, { force: true })
  assert.deepEqual(done, { deleted: true, usedBy: [{ id: product.id, name: product.name }] })
  assert.equal(app.charts.getChart(chart.id), undefined)
  assert.equal(product.detail!.sizeChartId, undefined)
  assert.equal(app.charts.chartForProduct(product), undefined)
  // A chart nobody uses goes at once.
  assert.deepEqual(app.charts.deleteChart(copy.id), { deleted: true, usedBy: [] })
  assert.deepEqual(app.charts.deleteChart(copy.id), { deleted: false, usedBy: [] })
})

test('a store\'s charts are kept in the browser per store, read back after a reload, and forgotten by a restore', async () => {
  const first = startApp()
  addCreatedStore(first)
  await settle()
  assert.deepEqual(chartKeys(), [], 'bringing a store in writes nothing')
  const chart = first.charts.createChart({ ...emptySizeChart(CREATED), name: 'Knitwear' })
  await settle()
  assert.deepEqual(chartKeys(), [`mp.demo-store.${CREATED}.size-charts.v1`])
  const saved = savedNow()

  // The next start brings the store in again and reads its chart back, writing nothing.
  const second = startApp(saved)
  addCreatedStore(second)
  await settle()
  assert.deepEqual(plain(second.charts.chartsForChannel(CREATED)), plain([chart]))
  assert.deepEqual(savedNow(), saved)
  assert.deepEqual(second.charts.chartsForChannel(VH), [])

  // A restore puts the store back as its theme seeds it and forgets what was kept.
  assert.equal(second.demoStores.restore(CREATED), true)
  await settle()
  assert.deepEqual(plain(second.charts.chartsForChannel(CREATED)), seededFor(second, CREATED))
  assert.deepEqual(chartKeys(), [])
})

test('Northfold: an edited chart survives a reload, and Restore original store puts the seed back; Vitaheal is untouched', { skip: needsNorthfold }, async () => {
  const first = startApp()
  const seed = plain(first.charts.chartsForChannel(NF))
  const [chart] = seed
  first.charts.updateChart(chart!.id, { rows: chart!.rows.map((row, i) => (i === 0 ? { ...row, values: row.values.map(() => '1-2') } : row)) })
  await settle()
  assert.deepEqual(chartKeys(), [`mp.demo-store.${NF}.size-charts.v1`])

  const second = startApp(savedNow())
  await settle()
  assert.deepEqual(second.charts.getChart(chart!.id)!.rows[0]!.values.every((value) => value === '1-2'), true)
  assert.equal(second.demoStores.restore(NF), true)
  await settle()
  assert.deepEqual(plain(second.charts.chartsForChannel(NF)), seed)
  assert.deepEqual(chartKeys(), [])
  assert.deepEqual(second.charts.chartsForChannel(VH), [])
})

test('applying Northfold to Vitaheal brings its charts, and a restore takes them away again', { skip: needsNorthfold }, async () => {
  const app = startApp()
  assert.ok(isDemoStoreId('northfold'))
  assert.equal(app.demoStores.apply(VH, 'northfold'), true)
  await settle()
  const applied = app.charts.chartsForChannel(VH)
  assert.equal(applied.length, 5)
  assert.ok(applied.every((chart) => chart.channelId === VH))
  // Northfold's own charts stay its own: no id is shared.
  const own = new Set(app.charts.chartsForChannel(NF).map((chart) => chart.id))
  assert.ok(applied.every((chart) => !own.has(chart.id)))
  // Each sized product of the applied theme finds its chart in the store.
  for (const product of app.commerce.products.filter((p) => p.channelIds?.includes(VH) && p.detail?.sizeChartId)) {
    assert.equal(app.charts.chartForProduct(product)?.channelId, VH, product.name)
  }
  assert.equal(app.demoStores.restore(VH), true)
  await settle()
  assert.deepEqual(app.charts.chartsForChannel(VH), [])
  assert.deepEqual(chartKeys(), [])
})
