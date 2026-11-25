// The product template's purchase options block: which stores the builder offers
// it to, what a new one starts as, and how the storefront reads it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blocksFor, createBlock, createSection, getBlockDef, getSectionDef, purchaseOptionsOf, purchaseOptionsSettings } from '../../src/storefront/themeSections.ts'
import type { ThemeSection } from '../../src/storefront/themeSections.ts'
import { VITAHEAL_THEME_TEMPLATES } from '../../src/storefront/vitahealDemo.ts'

const kinds = (defs: { kind: string }[]) => defs.map((def) => def.kind)
const SELLS_PLANS = { parts: false, sizes: false, subscriptions: true }

/** A product template whose product detail holds the given blocks. */
function productTemplate(blocks: ThemeSection['blocks'], hidden = false): { templates: { product: ThemeSection[] } } {
  return { templates: { product: [{ ...createSection('product-detail'), blocks, hidden }] } }
}

test('the builder offers the block to a store with subscription plans, and to no other', () => {
  assert.deepEqual(kinds(blocksFor('product-detail', undefined)), ['collapsible-row'])
  assert.deepEqual(kinds(blocksFor('product-detail', undefined, SELLS_PLANS)), ['collapsible-row', 'purchase-options'])
  assert.deepEqual(kinds(blocksFor('product-detail', 'sections')), ['collapsible-row'])
  // The sections product page draws it in the buy box too.
  assert.deepEqual(kinds(blocksFor('product-detail', 'sections', SELLS_PLANS)), ['collapsible-row', 'purchase-options'])
  // It belongs to the product page: no other section is offered it.
  assert.equal(kinds(blocksFor('rich-text', undefined, SELLS_PLANS)).includes('purchase-options'), false)
})

test('a product page holds one purchase options block, with five settings', () => {
  const def = getBlockDef('purchase-options')!
  assert.equal(def.unique, true)
  assert.deepEqual(def.fields.map((f) => f.key), ['style', 'defaultSelection', 'policyText', 'termsLink', 'cardBadge'])
  assert.deepEqual(def.fields[0]!.options, ['Cards', 'Radio buttons', 'Dropdown'])
  assert.deepEqual(def.fields[1]!.options, ['One-time purchase', 'Subscription'])
})

test('a new block starts as cards, buying once first, with the usual promise and the badge on', () => {
  assert.deepEqual(purchaseOptionsSettings(productTemplate([createBlock('purchase-options')])), {
    style: 'Cards', subscriptionFirst: false, policyText: 'Pause or cancel any time.', termsLink: '', cardBadge: true,
  })
})

test('the storefront reads what the merchant set', () => {
  const block = createBlock('purchase-options', { style: 'Radio buttons', defaultSelection: 'Subscription', policyText: '  Skip a month whenever you like. ', termsLink: '/policies/subscription-terms', cardBadge: false })
  assert.deepEqual(purchaseOptionsSettings(productTemplate([block])), {
    style: 'Radio buttons', subscriptionFirst: true, policyText: 'Skip a month whenever you like.', termsLink: '/policies/subscription-terms', cardBadge: false,
  })
  assert.equal(purchaseOptionsSettings(productTemplate([createBlock('purchase-options', { style: 'Tiles' })]))!.style, 'Cards', 'a style it does not know reads as cards')
})

test('without the block a store shows its options as it always did', () => {
  assert.equal(purchaseOptionsSettings(undefined), null)
  assert.equal(purchaseOptionsSettings(productTemplate([])), null)
  assert.equal(purchaseOptionsSettings(productTemplate([createBlock('purchase-options')], true)), null, 'a hidden product detail')
})

test('a product page reads the block from the section it draws, hidden or not', () => {
  const block = createBlock('purchase-options', { style: 'Dropdown', policyText: 'Skip a month whenever you like.' })
  const section = { ...createSection('product-detail'), blocks: [createBlock('collapsible-row'), block], hidden: true }
  assert.deepEqual(purchaseOptionsOf(section), {
    style: 'Dropdown', subscriptionFirst: false, policyText: 'Skip a month whenever you like.', termsLink: '', cardBadge: true,
  })
  assert.equal(purchaseOptionsOf({ blocks: [createBlock('collapsible-row')] }), null)
  assert.equal(purchaseOptionsOf({}), null)
  assert.equal(purchaseOptionsOf(undefined), null)
  // The theme's reading is the first visible product detail's.
  assert.deepEqual(purchaseOptionsSettings(productTemplate([block])), purchaseOptionsOf({ blocks: [block] }))
})

test('the sections product page can open on the lowest-priced choice, with a quantity and a stock line, all off until set', () => {
  const fields = getSectionDef('product-detail')!.fields.filter((f) => ['preselectVariant', 'quantity', 'stockLine'].includes(f.key))
  assert.deepEqual(fields.map((f) => [f.key, f.label, f.type, f.drawing]), [
    ['preselectVariant', 'Open on the lowest-priced choice', 'toggle', 'sections'],
    ['quantity', 'Quantity selector', 'toggle', 'sections'],
    ['stockLine', 'Stock line', 'toggle', 'sections'],
  ])
  const settings = createSection('product-detail').settings
  for (const key of ['preselectVariant', 'quantity', 'stockLine']) assert.equal(settings[key], undefined, `${key} starts off`)
})

test('Vitaheal is seeded with the block: its fixed plans as cards, the promise, the terms and the badge', () => {
  assert.deepEqual(purchaseOptionsSettings({ templates: VITAHEAL_THEME_TEMPLATES }), {
    style: 'Cards', subscriptionFirst: false, policyText: 'Skip, pause or cancel anytime.', termsLink: '/policies/subscription-terms', cardBadge: true,
  })
})
