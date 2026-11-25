// A new store's setup steps and its launch checklist (src/storefront/storeLaunch.ts).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MANUAL_LAUNCH_STEPS, SETUP_STEP_MS, isConfirmedList, launchChecklist, launchSummary, setupDuration, setupProgress, setupSteps,
} from '../../src/storefront/storeLaunch.ts'
import type { LaunchFacts } from '../../src/storefront/storeLaunch.ts'

const MADE = '2026-11-24T10:00:00.000Z'
const at = (ms: number) => Date.parse(MADE) + ms
const FROM_THEME = { merchandise: true, theme: 'Daybloom', domain: 'my-shop.maropost.store' }

// ── Setup ────────────────────────────────────────────────────────────────────

test('a store made from a theme and connected to Merchandise Cloud is set up in five steps', () => {
  assert.deepEqual(setupSteps(FROM_THEME).map((s) => [s.id, s.title, s.doneTitle]), [
    ['account', 'Connecting your Commerce Cloud account', 'Commerce Cloud account connected'],
    ['merchandise', 'Setting up search and recommendations', 'Search and recommendations set up'],
    ['storefront', 'Building your storefront from the Daybloom theme', 'Storefront built from the Daybloom theme'],
    ['checkout', 'Setting up checkout', 'Checkout set up'],
    ['address', 'Putting your store online at my-shop.maropost.store', 'Online at my-shop.maropost.store'],
  ])
})

test('a blank store without Merchandise Cloud has no search to set up and no theme to name', () => {
  const steps = setupSteps({ merchandise: false, theme: null, domain: 'blank.maropost.store' })
  assert.deepEqual(steps.map((s) => s.id), ['account', 'storefront', 'checkout', 'address'])
  assert.equal(steps[1]!.title, 'Building your storefront')
})

test('setup moves one step at a time from the moment the store was made', () => {
  const steps = setupSteps(FROM_THEME)
  const statuses = (ms: number) => setupProgress(steps, MADE, at(ms)).steps.map((s) => s.status)
  assert.deepEqual(statuses(0), ['running', 'waiting', 'waiting', 'waiting', 'waiting'])
  assert.deepEqual(statuses(SETUP_STEP_MS - 1), ['running', 'waiting', 'waiting', 'waiting', 'waiting'])
  assert.deepEqual(statuses(SETUP_STEP_MS), ['done', 'running', 'waiting', 'waiting', 'waiting'])
  assert.deepEqual(statuses(SETUP_STEP_MS * 4.5), ['done', 'done', 'done', 'done', 'running'])

  const half = setupProgress(steps, MADE, at(SETUP_STEP_MS * 2.5))
  assert.equal(half.doneCount, 2)
  assert.equal(half.percent, 50)
  assert.equal(half.ready, false)
  assert.equal(half.current?.id, 'storefront')
})

test('once every step has had its time the store is ready, and stays ready', () => {
  const steps = setupSteps(FROM_THEME)
  assert.equal(setupDuration(steps), SETUP_STEP_MS * 5)
  // Never 100% while a step still runs.
  const last = setupProgress(steps, MADE, at(setupDuration(steps) - 1))
  assert.equal(last.ready, false)
  assert.equal(last.percent, 99)
  for (const ms of [setupDuration(steps), setupDuration(steps) + 1, 86_400_000 * 30]) {
    const done = setupProgress(steps, MADE, at(ms))
    assert.equal(done.ready, true, String(ms))
    assert.equal(done.percent, 100)
    assert.equal(done.current, null)
    assert.ok(done.steps.every((s) => s.status === 'done'))
  }
})

test('a clock that is behind, or a date that cannot be read, shows the store as just made', () => {
  const steps = setupSteps(FROM_THEME)
  for (const progress of [setupProgress(steps, MADE, at(-5000)), setupProgress(steps, 'not a date', at(0))]) {
    assert.equal(progress.doneCount, 0)
    assert.equal(progress.percent, 0)
    assert.equal(progress.current?.id, 'account')
  }
})

// ── Launch ───────────────────────────────────────────────────────────────────

const facts = (over: Partial<LaunchFacts> = {}): LaunchFacts => ({
  name: 'My Shop', brand: 'Daybloom', locations: ['Oxford Warehouse'], products: 10, theme: 'Daybloom 1.0', countries: 5,
  paymentMethods: [], domain: 'my-shop.maropost.store', confirmed: [], ...over,
})
const row = (steps: ReturnType<typeof launchChecklist>, id: string) => steps.find((s) => s.id === id)!

test('the checklist is the eight steps to launch, in the order a merchant does them', () => {
  assert.deepEqual(launchChecklist(facts()).map((s) => [s.id, s.title]), [
    ['location', 'Add a location'],
    ['product', 'Add your first product'],
    ['branding', 'Check your store name and logo'],
    ['theme', 'Choose a theme'],
    ['shipping', 'Check your shipping'],
    ['taxes', 'Check your taxes'],
    ['payments', 'Set up payments'],
    ['domain', 'Check your store’s address'],
  ])
})

test('a store made from a theme starts with its location, products, theme and address done', () => {
  const steps = launchChecklist(facts())
  assert.deepEqual(steps.filter((s) => s.done).map((s) => s.id), ['location', 'product', 'theme', 'domain'])
  assert.equal(row(steps, 'location').description, 'Orders ship from Oxford Warehouse.')
  assert.equal(row(steps, 'product').description, '10 products in this store.')
  assert.equal(row(steps, 'theme').description, 'Daybloom 1.0 is published.')
  assert.equal(row(steps, 'domain').description, 'Your store is at my-shop.maropost.store.')
  assert.equal(row(steps, 'shipping').description, 'Shoppers get free home delivery in 3 to 5 business days, to 5 countries.')
  assert.deepEqual(launchSummary(steps), { done: 4, total: 8, percent: 50, next: row(steps, 'branding'), ready: false })
})

test('a blank store has its first product and its theme still to do, each with a way to do it', () => {
  const steps = launchChecklist(facts({ products: 0, theme: null, locations: [] }))
  assert.deepEqual(steps.filter((s) => s.done).map((s) => s.id), ['domain'])
  assert.deepEqual(row(steps, 'location').action, { label: 'Add location', target: 'inventory' })
  assert.deepEqual(row(steps, 'product').action, { label: 'Add product', target: 'add_product' })
  assert.deepEqual(row(steps, 'theme').action, { label: 'Choose theme', target: 'themes' })
  // Nothing to look at yet: no "View store" before a theme is published.
  assert.equal(row(steps, 'branding').link, null)
  assert.equal(row(steps, 'domain').action, null)
  assert.equal(launchSummary(steps).next?.id, 'location')
})

test('the three steps with nothing to read are marked done by the merchant', () => {
  assert.deepEqual([...MANUAL_LAUNCH_STEPS], ['branding', 'shipping', 'taxes'])
  const before = launchChecklist(facts())
  for (const id of MANUAL_LAUNCH_STEPS) {
    assert.equal(row(before, id).manual, true)
    assert.equal(row(before, id).done, false)
    assert.deepEqual(row(before, id).action, { label: 'Mark as done', target: 'confirm' })
  }
  assert.deepEqual(row(before, 'taxes').link, { label: 'Open tax categories', target: 'taxes' })
  const after = launchChecklist(facts({ confirmed: ['shipping', 'taxes'] }))
  assert.equal(row(after, 'shipping').done, true)
  assert.equal(row(after, 'shipping').action, null, 'a step marked done has no button left')
  assert.deepEqual(row(after, 'taxes').link, { label: 'Open tax categories', target: 'taxes' }, 'its page is still one press away')
  assert.equal(row(after, 'branding').done, false)
  // No step the store can read is ever marked by hand.
  assert.ok(before.filter((s) => !s.manual).every((s) => s.action?.target !== 'confirm'))
})

test('payments are done once the store accepts a way to pay, and the step names them', () => {
  const none = row(launchChecklist(facts()), 'payments')
  assert.equal(none.done, false)
  assert.deepEqual(none.action, { label: 'Set up payments', target: 'payments' })
  assert.match(none.description, /no one can check out/)
  const paid = row(launchChecklist(facts({ paymentMethods: ['Maropay', 'Stripe'] })), 'payments')
  assert.equal(paid.done, true)
  assert.equal(paid.description, 'Shoppers can pay with Maropay, Stripe.')
  assert.deepEqual(paid.action, { label: 'Manage', target: 'payments' })
})

test('with every step done the store is ready to launch', () => {
  const steps = launchChecklist(facts({ paymentMethods: ['Maropay'], confirmed: ['branding', 'shipping', 'taxes'] }))
  assert.deepEqual(launchSummary(steps), { done: 8, total: 8, percent: 100, next: null, ready: true })
})

test('the name step says what shoppers really read at the top of the store', () => {
  // A store made from a theme shows the theme's brand, whatever the store is called in the admin.
  assert.equal(row(launchChecklist(facts()), 'branding').description, 'Shoppers see “Daybloom” at the top of every page: the name your theme came with.')
  assert.equal(row(launchChecklist(facts({ brand: 'My Shop' })), 'branding').description, 'Shoppers see “My Shop” at the top of every page.')
})

test('counts read as a person says them', () => {
  assert.equal(row(launchChecklist(facts({ products: 1 })), 'product').description, '1 product in this store.')
  assert.equal(row(launchChecklist(facts({ countries: 1 })), 'shipping').description, 'Shoppers get free home delivery in 3 to 5 business days, to 1 country.')
  assert.equal(row(launchChecklist(facts({ locations: ['Oxford Warehouse', 'Leeds'] })), 'location').description, 'Orders ship from Oxford Warehouse and 1 other location.')
  assert.equal(row(launchChecklist(facts({ locations: ['A', 'B', 'C'] })), 'location').description, 'Orders ship from A and 2 other locations.')
})

test('what the browser kept is read back only when it names manual steps', () => {
  assert.equal(isConfirmedList(['shipping', 'taxes']), true)
  assert.equal(isConfirmedList([]), true)
  assert.equal(isConfirmedList(['payments']), false, 'a step the store reads is never kept as confirmed')
  assert.equal(isConfirmedList(['shipping', 7]), false)
  assert.equal(isConfirmedList({ shipping: true }), false)
  assert.equal(isConfirmedList(null), false)
})
