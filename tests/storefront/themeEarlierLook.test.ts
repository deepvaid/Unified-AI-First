// A browser that kept a demo store's theme from before the library changed its look
// (Vitaheal 1.0, the classic drawing, before 2.0 on sections) runs that look, while the
// library names the new version. useStoreThemes().earlierLookOf finds it, so the Themes
// page and the Store data card can say so beside Restore original store, without writing
// to the browser on load.
//
// Since Vitaheal's seed version 2 (eight more products, 2026-11-25), a browser that saved
// Vitaheal before (seed 1: no seed recorded) is seeded again on its first start, its theme
// included, so it runs 2.0 and says nothing of an earlier look. Since seed 3 (US dollars) the
// same goes for a browser at seed 2. The Vitaheal tests below therefore start from a browser
// that has recorded seed 3; the seed-1 case has its own test.
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
const { useStoreThemesStore } = await import('@/stores/useStoreThemes')
const { useDemoStores } = await import('@/stores/useDemoStores')
const { DEMO_STORES } = await import('@/storefront/demoStores')
const { earlierLookMessage } = await import('@/storefront/demoStores/summary')
const { VITAHEAL_BLUEPRINT } = await import('@/storefront/demoStores/vitaheal')
const { contextFor } = await import('@/storefront/demoStores/install')

const VH = 'vitaheal-demo'
const VH_THEMES = 'mp.vitaheal-demo.themes.v1'
/** Lets the stores' watchers save to the browser. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
const browser = () => Object.fromEntries(memory)
/** The key the first start since Vitaheal's seed 2 writes: the seed version the store holds (useDemoStores reseedStale). */
const VH_SEED = 'mp.vitaheal-demo.installed.v1'
/** `saved` as a browser that has recorded seed 3 holds it, so Vitaheal is not seeded again on load. */
const atSeed3 = (saved: Record<string, string>) => ({ ...saved, [VH_SEED]: JSON.stringify({ blueprintId: 'vitaheal', seedVersion: 3, appliedAt: '2026-11-25T09:00:00.000Z' }) })

/** The app starting in a browser that holds `saved`. */
function startApp(saved: Record<string, string> = {}) {
  memory.clear()
  for (const [key, value] of Object.entries(saved)) memory.set(key, value)
  setActivePinia(createPinia())
  return { channels: useSalesChannelsStore(), themes: useStoreThemesStore(), demoStores: useDemoStores() }
}
/** The app started, as it is before anyone can edit anything: the stores seeded, and a stale seed seeded again. */
async function startedApp(saved: Record<string, string> = {}) {
  const app = startApp(saved)
  await settle()
  return app
}
type App = ReturnType<typeof startApp>

/** Edits the store's published theme, as a rep rehearsing would, so this browser keeps the store's themes. */
async function editTheme(app: App, channelId: string) {
  const theme = app.themes.themeForChannel(channelId)!
  app.themes.updateStyles(theme.id, { brandColor: '#123456' })
  app.themes.publishTheme(theme.id)
  await settle()
}

/** The browser's kept themes for a store, with `themeId` drawn as an earlier version drew it. */
function asEarlierLook(saved: string, themeId: string, drawing: 'sections' | undefined): string {
  const kept = JSON.parse(saved) as { themes: { id: string; styles: { drawing?: string } }[]; published: { id: string; styles: { drawing?: string } }[] }
  for (const theme of [...kept.themes, ...kept.published]) {
    if (theme.id !== themeId) continue
    if (drawing) theme.styles.drawing = drawing
    else delete theme.styles.drawing
  }
  return JSON.stringify(kept)
}

/** A browser holding Vitaheal's theme as it was edited before 2.0: the classic drawing. */
async function olderVitahealBrowser(): Promise<Record<string, string>> {
  const app = await startedApp()
  await editTheme(app, VH)
  return { [VH_THEMES]: asEarlierLook(memory.get(VH_THEMES)!, 'theme-vitaheal', undefined) }
}

test('in a fresh browser no store runs an earlier look, and asking writes nothing', async () => {
  const app = await startedApp()
  // Loading wrote only the seed version Vitaheal holds.
  const loaded = browser()
  assert.deepEqual(Object.keys(loaded), [VH_SEED])
  for (const blueprint of DEMO_STORES) assert.equal(app.themes.earlierLookOf(blueprint.homeChannel.id), null, blueprint.id)
  // Stores that cannot take a theme, and one that does not exist.
  for (const id of ['neelam-store', 'retest-sales-notification', 'beta-sales-channel', 'no-such-store']) assert.equal(app.themes.earlierLookOf(id), null, id)
  assert.deepEqual(browser(), loaded)
})

test('a browser holding an edited Vitaheal theme from before 2.0 runs it, and the store says so; nothing is written on load', async () => {
  const saved = atSeed3(await olderVitahealBrowser())
  const app = startApp(saved)
  await settle()
  const current = app.themes.themeForChannel(VH)!
  assert.equal(current.id, 'theme-vitaheal')
  assert.equal(current.styles.drawing, undefined, 'the storefront draws the kept, earlier look')
  const look = app.themes.earlierLookOf(VH)
  assert.deepEqual(look, { name: 'Vitaheal', version: '2.0', applied: false })
  assert.equal(earlierLookMessage(look!), 'This store runs an earlier Vitaheal look that was edited in this browser. Restore original store to get Vitaheal 2.0.')
  // The other stores are not touched by it.
  for (const blueprint of DEMO_STORES.filter((b) => b.id !== 'vitaheal')) assert.equal(app.themes.earlierLookOf(blueprint.homeChannel.id), null, blueprint.id)
  assert.deepEqual(browser(), saved, 'a browser at seed 3 is not seeded again: loading leaves the browser as it was')
})

test('since seed 2, a browser that kept an edited Vitaheal theme from before 2.0 at seed 1 is seeded again: it runs 2.0 and says nothing of an earlier look', async () => {
  const saved = await olderVitahealBrowser()
  assert.deepEqual(Object.keys(saved), [VH_THEMES], 'no seed recorded: seed 1')
  const app = await startedApp(saved)
  assert.equal(app.themes.themeForChannel(VH)?.styles.drawing, 'sections')
  assert.equal(app.themes.themeForChannel(VH)?.styles.brandColor, VITAHEAL_BLUEPRINT.build(contextFor(VITAHEAL_BLUEPRINT, VITAHEAL_BLUEPRINT.homeChannel, '2026-11-25')).theme.styles.brandColor, 'the edit went with the reseed')
  assert.equal(app.themes.earlierLookOf(VH), null)
  // The theme's slot is cleared, and the store records the seed it holds now.
  assert.deepEqual(Object.keys(browser()), [VH_SEED])
  assert.equal(JSON.parse(browser()[VH_SEED]!).seedVersion, 3)
})

test('Restore original store brings Vitaheal 2.0 back, and the store no longer says it runs an earlier look', async () => {
  const app = startApp(atSeed3(await olderVitahealBrowser()))
  await settle()
  assert.ok(app.themes.earlierLookOf(VH))
  assert.equal(app.demoStores.restore(VH), true)
  await settle()
  assert.equal(app.themes.themeForChannel(VH)?.styles.drawing, 'sections')
  assert.equal(app.themes.earlierLookOf(VH), null)
  assert.equal(memory.has(VH_THEMES), false)
})

test('an edited theme on the look the library has now is not an earlier look, in any demo store', async () => {
  for (const blueprint of DEMO_STORES) {
    const id = blueprint.homeChannel.id
    const first = await startedApp()
    await editTheme(first, id)
    const saved = browser()
    assert.ok(Object.keys(saved).some((key) => key.endsWith(`${id}.themes.v1`)), `${id} keeps its themes`)
    const app = startApp(saved)
    await settle()
    assert.equal(app.themes.themeForChannel(id)?.styles.brandColor, '#123456', `${id} runs the edit`)
    assert.equal(app.themes.earlierLookOf(id), null, id)
  }
})

test('any demo store: its kept theme drawn as an earlier version drew it is an earlier look', async () => {
  const first = await startedApp()
  await editTheme(first, 'northfold-demo')
  const key = 'mp.demo-store.northfold-demo.themes.v1'
  const saved = atSeed3({ [key]: asEarlierLook(memory.get(key)!, 'theme-northfold', undefined) })
  const app = startApp(saved)
  await settle()
  assert.deepEqual(app.themes.earlierLookOf('northfold-demo'), { name: 'Northfold', version: '1.0', applied: false })
  assert.equal(app.themes.earlierLookOf(VH), null)
  assert.deepEqual(browser(), saved)
})

test('only the published theme counts: an earlier look kept as a draft beside a published copy is not what the store runs', async () => {
  const first = await startedApp()
  await editTheme(first, VH)
  const copy = first.themes.duplicateTheme('theme-vitaheal')!
  first.themes.publishTheme(copy.id)
  await settle()
  const app = startApp(atSeed3({ [VH_THEMES]: asEarlierLook(memory.get(VH_THEMES)!, 'theme-vitaheal', undefined) }))
  await settle()
  assert.equal(app.themes.getTheme('theme-vitaheal')?.status, 'Draft')
  assert.equal(app.themes.earlierLookOf(VH), null)
})

test('an applied theme kept from an earlier look: a restore goes back to the store’s own theme, so the store is told to apply it again', async () => {
  const first = startApp()
  assert.equal(first.demoStores.apply(VH, 'northfold'), true)
  await settle()
  await editTheme(first, VH)
  const applied = first.themes.themeForChannel(VH)!
  assert.equal(applied.styles.drawing, 'sections')
  const saved = { ...browser(), [VH_THEMES]: asEarlierLook(memory.get(VH_THEMES)!, applied.id, undefined) }
  const app = startApp(saved)
  await settle()
  const look = app.themes.earlierLookOf(VH)
  assert.deepEqual(look, { name: 'Northfold', version: '1.0', applied: true })
  assert.equal(earlierLookMessage(look!), 'This store runs an earlier Northfold look that was edited in this browser. To get Northfold 1.0, restore the original store, then apply Northfold again.')
  assert.deepEqual(browser(), saved)
})
