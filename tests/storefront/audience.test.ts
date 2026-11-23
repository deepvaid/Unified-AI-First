// Who a piece of clothing is for, and what of a shared size chart applies to it
// (src/storefront/audience.ts): the product page's size guide and the chat
// assistant read the same rules, checked here on Northfold's own charts.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { audienceOf, chartForAudience, columnsForAudience, sharesAudience } from '../../src/storefront/audience.ts'

const home = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-20')
const outerwear = home.sizeCharts.find((c) => c.id === 'nf-chart-outerwear')!
const womensTops = home.sizeCharts.find((c) => c.id === 'nf-chart-womens-tops')!

test('a piece is for men or women by its collections, else by its subtitle', () => {
  assert.equal(audienceOf(['Men', 'Outerwear', 'New in']), 'him')
  assert.equal(audienceOf(['Women', 'Knitwear']), 'her')
  assert.equal(audienceOf(['Women', 'Men', 'New in']), null)
  assert.equal(audienceOf(['Sale'], "Men's boxy tee"), 'him')
  assert.equal(audienceOf(['Sale'], 'Women’s silk shirt'), 'her')
  assert.equal(audienceOf(['Brakes'], 'Ceramic pads'), null)
  for (const p of home.products) {
    const own = audienceOf(p.collections, p.detail!.subtitle)
    if (p.collections.includes('Men') !== p.collections.includes('Women')) assert.ok(own, `${p.name} is for someone`)
  }
  assert.equal(sharesAudience('him', 'him'), true)
  assert.equal(sharesAudience('him', null), true)
  assert.equal(sharesAudience(null, 'her'), true)
  assert.equal(sharesAudience('him', 'her'), false)
})

test('a shared chart shows a men’s piece the men’s columns, without the prefix', () => {
  assert.deepEqual(outerwear.columns, ['Women’s bust', 'Women’s sleeve', 'Men’s chest', 'Men’s sleeve'])
  assert.deepEqual(columnsForAudience(outerwear.columns, 'him'), [{ index: 2, label: 'Chest' }, { index: 3, label: 'Sleeve' }])
  assert.deepEqual(columnsForAudience(outerwear.columns, 'her'), [{ index: 0, label: 'Bust' }, { index: 1, label: 'Sleeve' }])
  const men = chartForAudience(outerwear, 'him')
  assert.deepEqual(men.columns, ['Chest', 'Sleeve'])
  assert.deepEqual(men.rows.find((r) => r.size === 'M'), { size: 'M', values: ['38-40', '34'] })
  // "How to measure" keeps the chest and the sleeve, not the bust.
  assert.deepEqual(men.howToMeasure.split('\n').map((line) => line.split(':')[0]), ['Chest', 'Sleeve'])
  const women = chartForAudience(outerwear, 'her')
  assert.deepEqual(women.columns, ['Bust', 'Sleeve'])
  assert.deepEqual(women.rows.find((r) => r.size === 'M'), { size: 'M', values: ['36-37', '31'] })
  assert.deepEqual(women.howToMeasure.split('\n').map((line) => line.split(':')[0]), ['Bust', 'Sleeve'])
  // The chart itself is left as it is.
  assert.equal(outerwear.columns.length, 4)
})

test('a piece for everyone, and a chart without gendered columns, are shown as written', () => {
  assert.equal(chartForAudience(outerwear, null), outerwear)
  assert.equal(chartForAudience(womensTops, 'her'), womensTops)
  assert.deepEqual(columnsForAudience(['US size', 'Bust'], 'him'), [{ index: 0, label: 'US size' }, { index: 1, label: 'Bust' }])
})
