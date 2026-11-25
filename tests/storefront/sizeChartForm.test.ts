// Editing a size chart in Products › Size charts (src/storefront/sizeChartForm.ts):
// what a cell may hold, the grid's edits, and what stops a chart being saved.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addMeasurement, addSize, canSave, cellKey, cellLabel, cleanSizeChart, convertRows, hasValuesToConvert, issueList,
  measurementError, missingSizes, moveItem, moveMeasurement, nextSizeName, normalizeMeasurement, removeItem,
  removeMeasurement, sizeChartIssues, sizeRange, sizesOf,
} from '../../src/storefront/sizeChartForm.ts'
import type { SizeChartDraft, SizeRow } from '../../src/storefront/sizeChartForm.ts'
import { demoStoreFor } from '../../src/storefront/demoStores/index.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'

const rows = (...list: [string, ...string[]][]): SizeRow[] => list.map(([size, ...values]) => ({ size, values }))

const draft = (changes: Partial<SizeChartDraft> = {}): SizeChartDraft => ({
  channelId: 'northfold-demo',
  name: 'Kids’ tops',
  unit: 'in',
  columns: ['Chest', 'Waist'],
  rows: rows(['S', '26-27', '22-23'], ['M', '28-29', '24-25']),
  fitNote: '',
  howToMeasure: '',
  ...changes,
})

test('a cell holds a number, a range (smaller number first) or a dash for none', () => {
  for (const ok of ['34', '13.5', '34-36', '32–33', '32 - 33', '30-30', '—', ' - ', '–']) assert.equal(measurementError(ok), '', ok)
  assert.equal(measurementError(''), 'Enter a measurement')
  assert.equal(measurementError('  '), 'Enter a measurement')
  for (const bad of ['34 in', 'abc', '34-', '-34', '34-36-38', '34,5']) assert.equal(measurementError(bad), 'Use a number or a range, like 34-36', bad)
  assert.equal(measurementError('36-34'), 'Put the smaller number first, like 34-36')
})

test('a range is saved as 34-36, whatever dash and spaces were typed', () => {
  assert.equal(normalizeMeasurement(' 32 – 33 '), '32-33')
  assert.equal(normalizeMeasurement('13.5'), '13.5')
  assert.equal(normalizeMeasurement('One size'), 'One size')
  assert.equal(normalizeMeasurement(' - '), '—', 'a dash for none is saved as —')
})

test('switching the unit converts every measurement and keeps the sizes', () => {
  const inches = rows(['M', '36-37', '30.5'], ['L', '38-40', '31'])
  const cm = convertRows(inches, 'in', 'cm')
  assert.deepEqual(cm, rows(['M', '91-94', '77'], ['L', '97-102', '79']))
  assert.deepEqual(convertRows(cm, 'cm', 'in'), inches, 'back to inches gives what was written')
  assert.equal(hasValuesToConvert(['Chest', 'Waist'], rows(['M', '', ''])), false)
  assert.equal(hasValuesToConvert(['Chest', 'Waist'], cm), true)
})

test('switching the unit leaves a column of sizes alone, and a chart of sizes only has nothing to convert', () => {
  // Aurora's Socks: shoe sizes, not lengths.
  const columns = ['Women’s shoe size', 'Men’s shoe size']
  const socks = rows(['S', '4-6.5', '—'], ['M', '7-9.5', '6-8.5'], ['L', '10-12', '9-12'])
  assert.deepEqual(convertRows(socks, 'in', 'cm', columns), socks)
  assert.equal(hasValuesToConvert(columns, socks), false)
  // A chart with a size column and a length converts the length only, a foot length to the half centimeter.
  const boots = rows(['8', '8', '10'], ['9', '9', '10.375'])
  assert.deepEqual(convertRows(boots, 'in', 'cm', ['US size', 'Foot length']), rows(['8', '8', '25.5'], ['9', '9', '26.5']))
  assert.equal(hasValuesToConvert(['US size', 'Foot length'], boots), true)
})

test('rows and columns move, go and come, and every row keeps one value per column', () => {
  const start = rows(['S', '1', '2'], ['M', '3', '4'], ['L', '5', '6'])
  assert.deepEqual(moveItem(start, 2, 0).map((r) => r.size), ['L', 'S', 'M'])
  assert.deepEqual(moveItem(start, 0, 5).map((r) => r.size), ['S', 'M', 'L'], 'out of range: unchanged')
  assert.deepEqual(removeItem(start, 1).map((r) => r.size), ['S', 'L'])

  const added = addSize(start, 2)
  assert.deepEqual(added.at(-1), { size: 'XL', values: ['', ''] })
  assert.equal(start.length, 3, 'the original rows are not changed')

  const wider = addMeasurement(['Chest', 'Waist'], start, 'Hip')
  assert.deepEqual(wider.columns, ['Chest', 'Waist', 'Hip'])
  assert.ok(wider.rows.every((row) => row.values.length === 3))

  const moved = moveMeasurement(['Chest', 'Waist'], start, 1, 0)
  assert.deepEqual(moved.columns, ['Waist', 'Chest'])
  assert.deepEqual(moved.rows[0], { size: 'S', values: ['2', '1'] })

  const narrower = removeMeasurement(['Chest', 'Waist'], start, 0)
  assert.deepEqual(narrower.columns, ['Waist'])
  assert.deepEqual(narrower.rows.map((row) => row.values), [['2'], ['4'], ['6']])
})

test('Add size suggests the next size in the run', () => {
  assert.equal(nextSizeName(rows(['XS'], ['S'])), 'M')
  assert.equal(nextSizeName(rows(['l'], ['xl'])), 'XXL')
  assert.equal(nextSizeName(rows(['XXL'])), '3XL')
  assert.equal(nextSizeName(rows(['28'], ['30'], ['32'])), '34')
  assert.equal(nextSizeName(rows(['6'])), '7')
  assert.equal(nextSizeName(rows(['4XL'])), '')
  assert.equal(nextSizeName(rows(['Petite'])), '')
  assert.equal(nextSizeName([]), '')
  assert.equal(nextSizeName(rows(['M'], ['L'], ['XL'], ['XXL'], ['XL'])), '', 'XXL is already there')
})

test('a chart reads as its first and last size', () => {
  assert.equal(sizeRange(rows(['XS'], ['S'], ['XL'])), 'XS–XL')
  assert.equal(sizeRange(rows(['M'])), 'M')
  assert.equal(sizeRange([]), '')
})

test('the sizes a product sells come from its Size option, and the chart says which it lacks', () => {
  const product = { detail: { options: [{ name: 'Color', values: ['Sand'] }, { name: ' size ', values: ['S', 'M', 'XXL'] }] } }
  assert.deepEqual(sizesOf(product), ['S', 'M', 'XXL'])
  assert.deepEqual(sizesOf({}), [])
  assert.deepEqual(missingSizes(rows(['s'], ['M'], ['L']), sizesOf(product)), ['XXL'])
})

test('a filled-in chart can be saved', () => {
  const issues = sizeChartIssues(draft(), [{ name: 'Women’s tops', channelId: 'northfold-demo' }])
  assert.equal(canSave(issues), true)
  assert.deepEqual(issueList(draft(), issues), [])
})

test('every Northfold chart, as seeded, can be saved as it is', () => {
  const northfold = snapshotFor(demoStoreFor('northfold').homeChannel, 'northfold', '2026-11-20')
  for (const chart of northfold.sizeCharts) {
    const { id, ...rest } = chart
    const others = northfold.sizeCharts.filter((c) => c.id !== id)
    assert.equal(canSave(sizeChartIssues(rest, others)), true, chart.name)
    assert.deepEqual(cleanSizeChart(rest), rest, `${chart.name} is saved unchanged`)
  }
})

test('every Aurora chart, as seeded, can be saved as it is, its dashes included', () => {
  const aurora = snapshotFor(demoStoreFor('aurora').homeChannel, 'aurora', '2026-11-20')
  assert.ok(aurora.sizeCharts.some((chart) => chart.rows.some((row) => row.values.includes('—'))), 'a chart marks a size a column does not have')
  for (const chart of aurora.sizeCharts) {
    const { id, ...rest } = chart
    const others = aurora.sizeCharts.filter((c) => c.id !== id)
    assert.equal(canSave(sizeChartIssues(rest, others)), true, chart.name)
    assert.deepEqual(cleanSizeChart(rest), rest, `${chart.name} is saved unchanged`)
  }
})

test('the name is needed, and no other chart in the store may have it', () => {
  assert.equal(sizeChartIssues(draft({ name: '  ' })).name, 'Enter a name')
  const others = [{ name: 'kids’ TOPS', channelId: 'northfold-demo' }]
  assert.equal(sizeChartIssues(draft(), others).name, 'Another chart in this store has this name')
  assert.equal(sizeChartIssues(draft({ channelId: 'vitaheal-demo' }), others).name, undefined, 'another store may use the name')
})

test('sizes and measurements are named, and named once', () => {
  const issues = sizeChartIssues(draft({
    columns: ['Chest', '', 'chest'],
    rows: rows(['S', '1', '2', '3'], ['', '1', '2', '3'], ['s', '1', '2', '3']),
  }))
  assert.deepEqual(issues.measurementNames, { 1: 'Name the measurement', 2: 'chest is already a column' })
  assert.deepEqual(issues.sizeNames, { 1: 'Enter a size', 2: 's is already a size' })
  assert.equal(canSave(issues), false)
})

test('a chart needs a size and a measurement', () => {
  const issues = sizeChartIssues(draft({ columns: [], rows: [] }))
  assert.equal(issues.sizes, 'Add at least one size')
  assert.equal(issues.measurements, 'Add at least one measurement')
  assert.equal(canSave(issues), false)
})

test('each cell that is not a number or a range is named in words', () => {
  const chart = draft({ rows: rows(['S', '26-27', ''], ['M', '29-28', '24-25'], ['', 'wide', '1']) })
  const issues = sizeChartIssues(chart)
  assert.deepEqual(issues.cells, {
    [cellKey(0, 1)]: 'Enter a measurement',
    [cellKey(1, 0)]: 'Put the smaller number first, like 34-36',
    [cellKey(2, 0)]: 'Use a number or a range, like 34-36',
  })
  assert.deepEqual(issueList(chart, issues).map((issue) => issue.text), [
    'Waist for size S: Enter a measurement',
    'Chest for size M: Put the smaller number first, like 34-36',
    'Size in row 3: Enter a size',
    'Chest in row 3: Use a number or a range, like 34-36',
  ])
  assert.deepEqual(issueList(chart, issues)[0]!.target, { kind: 'cell', row: 0, column: 1 })
  assert.equal(cellLabel('', 1, 'M', 0), 'Measurement 2 for size M')
})

test('what is saved is trimmed, with ranges written 34-36 and no blank lines', () => {
  const saved = cleanSizeChart(draft({
    name: '  Kids’ tops ',
    columns: [' Chest '],
    rows: rows([' S ', ' 26 – 27 ']),
    fitNote: ' Cut roomy. ',
    howToMeasure: '\nChest: around the fullest part.\n\n  Waist: at the natural waist. \n',
  }))
  assert.equal(saved.name, 'Kids’ tops')
  assert.deepEqual(saved.columns, ['Chest'])
  assert.deepEqual(saved.rows, rows(['S', '26-27']))
  assert.equal(saved.fitNote, 'Cut roomy.')
  assert.equal(saved.howToMeasure, 'Chest: around the fullest part.\nWaist: at the natural waist.')
})
