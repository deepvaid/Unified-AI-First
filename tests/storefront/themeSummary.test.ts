// What the Apply and Restore dialogs and Create sales channel say: one source, so
// every screen words it the same (src/storefront/demoStores/summary.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applySummary, countWord, currencyName, restoreMessage, restoreParts, restoreSummary, startSummary, themeFacts } from '../../src/storefront/demoStores/summary.ts'
import type { StoreFacts, ThemeFacts } from '../../src/storefront/demoStores/summary.ts'
import { DEMO_STORES, demoStoreFor } from '../../src/storefront/demoStores/index.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'

const TODAY = '2026-11-24'
const vitaheal: StoreFacts = { name: 'Vitaheal (demo)', blank: false, products: 8, currency: 'SEK', activePlans: 3, runs: null, broughtPlans: 0, subscribers: 8, sizeCharts: 0 }
const factsOf = (id: 'vitaheal' | 'northfold' | 'torqline'): ThemeFacts => {
  const blueprint = demoStoreFor(id)
  return themeFacts(blueprint.card.name, snapshotFor(blueprint.homeChannel, id, TODAY))
}

test('applying a theme without size charts to a store with them says they go', () => {
  const northfold: StoreFacts = { name: 'Northfold (demo)', blank: false, products: 20, currency: 'USD', activePlans: 0, runs: null, broughtPlans: 0, subscribers: 0, sizeCharts: 5 }
  assert.ok(applySummary(northfold, factsOf('torqline')).includes('This store’s size charts are removed.'))
  assert.ok(!applySummary(northfold, factsOf('northfold')).includes('This store’s size charts are removed.'))
})

test('a store without Merchandise Cloud is told search waits for it; part numbers on a parts theme', () => {
  const offline: StoreFacts = { ...vitaheal, searchConnected: false }
  assert.ok(applySummary(offline, factsOf('northfold')).includes('Search works once this store connects to Merchandise Cloud.'))
  assert.ok(applySummary(offline, factsOf('torqline')).includes('Search, part numbers included, works once this store connects to Merchandise Cloud.'))
  assert.ok(!applySummary(vitaheal, factsOf('torqline')).some((line) => line.startsWith('Search')))
  const facts = { original: 'Vitaheal', applied: null, plans: 0, subscribers: 0, campaigns: 0, sizeCharts: 0, announcesByEmail: false }
  assert.ok(restoreSummary({ ...facts, connectionBack: 'disconnected' }).includes('Merchandise Cloud is disconnected again, as it was when the store started.'))
})

test('the theme facts count what each theme brings', () => {
  const northfold = factsOf('northfold')
  assert.equal(northfold.name, 'Northfold')
  assert.equal(northfold.products, 20)
  assert.equal(northfold.currency, 'USD')
  assert.equal(northfold.assistant, 'apparel')
  assert.equal(northfold.plans, 0)
  assert.equal(factsOf('torqline').assistant, 'auto-parts')
  assert.ok(factsOf('vitaheal').plans > 0)
  for (const blueprint of DEMO_STORES) assert.ok(factsOf(blueprint.id).collections > 0, blueprint.id)
})

test('applying Northfold to Vitaheal says what is replaced, what changes, what stays and how to undo it', () => {
  const lines = applySummary(vitaheal, factsOf('northfold'))
  assert.equal(lines[0], '20 products replace the 8 in this store.')
  assert.match(lines[1]!, /^Northfold’s look, \d+ collections, \d+ pages and menus replace this store’s\.$/)
  assert.ok(lines.includes('The chatbot answers as a clothing store.'))
  assert.ok(lines.includes('Prices change to US dollars.'))
  assert.ok(lines.includes('This store’s three subscription plans are paused, so no one new can subscribe; its eight subscribers keep their subscriptions.'))
  assert.ok(lines.includes('Changes you made to this store’s products and campaigns are not kept: a restore brings back the original store, not your changes.'))
  assert.ok(!lines.some((line) => line.includes('are added.')), 'Northfold brings no plans')
  assert.deepEqual(lines.slice(-2), ['Orders already placed stay. The cart is emptied.', 'Restore original store puts this store back as it started.'])
})

test('applying Vitaheal to a blank USD store adds its products and plans, in Swedish kronor', () => {
  const blank: StoreFacts = { name: 'Test Garage', blank: true, products: 0, currency: 'USD', activePlans: 0, runs: null, broughtPlans: 0, subscribers: 0, sizeCharts: 0 }
  const theme = factsOf('vitaheal')
  const lines = applySummary(blank, theme)
  assert.equal(lines[0], `${theme.products} products are added to this store.`)
  assert.match(lines[1]!, /^Vitaheal’s look, .* are added\.$/)
  assert.match(lines[2]!, /campaigns? and \d+ search rules? are added\.$/)
  assert.ok(!lines.some((line) => line.includes('replace') || line.includes('not kept')), lines.join('\n'))
  assert.equal(lines.at(-1), 'Restore original store makes this store blank again.')
  assert.ok(lines.includes('Prices change to Swedish kronor.'))
  assert.ok(lines.includes(`Vitaheal’s ${countWord(theme.plans)} subscription plans are added.`))
  assert.ok(!lines.some((line) => line.includes('switch off')))
})

test('a theme in the store\'s own currency says nothing about prices; one plan and one product read in the singular', () => {
  const store: StoreFacts = { name: 'S', blank: false, products: 1, currency: 'USD', activePlans: 1, runs: null, broughtPlans: 0, subscribers: 0, sizeCharts: 0 }
  const lines = applySummary(store, { ...factsOf('torqline'), products: 1, plans: 1 })
  assert.equal(lines[0], '1 product replaces the 1 in this store.')
  assert.ok(!lines.some((line) => line.startsWith('Prices change')))
  assert.ok(lines.includes('This store’s subscription plan is paused, so no one new can subscribe.'))
  assert.ok(lines.includes('Torqline’s subscription plan is added.'))
})

test('a restore names the theme it goes back to, and what it removes', () => {
  const facts = { original: 'Vitaheal', applied: null, plans: 3, subscribers: 8, campaigns: 2, sizeCharts: 0, announcesByEmail: true }
  const lines = restoreSummary(facts)
  assert.equal(lines[0], 'The theme goes back to Vitaheal as it was published, with its collections, pages and menus.')
  assert.ok(lines.includes('Duplicated and draft themes are removed.'))
  assert.equal(restoreMessage('Vitaheal (demo)', facts), 'Vitaheal (demo) goes back to how it started: the Vitaheal theme, its products, plans and campaigns.')
  assert.ok(lines.includes('Subscription plans go back to the original three, and subscribers to the original eight.'))
  assert.ok(lines.includes('Campaigns go back to the original two, and their announcement emails are removed.'))
  assert.equal(lines.at(-1), 'Orders already placed stay.')
  assert.equal(restoreSummary({ ...facts, applied: 'Torqline' })[0], 'The theme goes back to Vitaheal, with its collections, pages and menus.')
  assert.deepEqual(restoreSummary({ ...facts, applied: 'Torqline', pricesBackTo: 'SEK' }).slice(0, 2), ['The theme goes back to Vitaheal, with its collections, pages and menus.', 'Prices go back to Swedish kronor.'])
  assert.deepEqual(restoreParts(facts), { card: 'Products, subscription plans and subscribers' })
  assert.deepEqual(restoreParts({ plans: 0, sizeCharts: 5 }), { card: 'Products, size charts and campaigns' })
  assert.deepEqual(restoreParts({ plans: 0, sizeCharts: 0 }), { card: 'Products and campaigns' })
})

test('a store that started blank goes back to blank', () => {
  const lines = restoreSummary({ original: null, applied: 'Northfold', plans: 0, subscribers: 0, campaigns: 0, sizeCharts: 0, announcesByEmail: false })
  assert.equal(lines[0], 'Northfold’s look, products, collections, pages and menus are removed, so the store is blank again.')
  assert.ok(lines.includes('Its subscription plans, size charts, campaigns, search rules and chatbot are removed.'))
  assert.equal(restoreMessage('Test Garage', { original: null, applied: 'Northfold', plans: 0, subscribers: 0, campaigns: 0, sizeCharts: 0, announcesByEmail: false }), 'Test Garage goes back to how it was made: a blank store.')
  assert.equal(restoreSummary({ original: null, applied: null, plans: 0, subscribers: 0, campaigns: 0, sizeCharts: 0, announcesByEmail: false })[0], 'The store stays blank.')
})

test('Create sales channel says what a new store starts with', () => {
  assert.equal(startSummary(null), 'A blank store: no products, pages or campaigns yet')
  const northfold = factsOf('northfold')
  assert.equal(startSummary(northfold), `A copy of Northfold: 20 products, ${northfold.collections} collections, ${northfold.pages} pages and ${northfold.campaigns} campaign${northfold.campaigns === 1 ? '' : 's'}, priced in US dollars`)
  assert.match(startSummary(factsOf('vitaheal')), /subscription plans, priced in Swedish kronor$/)
})

test('counts and currencies read as words', () => {
  assert.equal(countWord(0), 'no')
  assert.equal(countWord(8), 'eight')
  assert.equal(countWord(21), '21')
  assert.equal(currencyName('USD'), 'US dollars')
  assert.equal(currencyName('SEK'), 'Swedish kronor')
  assert.equal(currencyName('XYZ'), 'XYZ')
})
