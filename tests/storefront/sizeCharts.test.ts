import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chartFor, chartInUnit, convertMeasurement, hasMeasurements } from '../../src/storefront/sizeCharts.ts'
import type { SizeChart } from '../../src/storefront/sizeCharts.ts'

const tops: SizeChart = {
  id: 'northfold-chart-tops',
  channelId: 'northfold-demo',
  name: 'Tops',
  unit: 'in',
  columns: ['Chest', 'Waist', 'Length'],
  rows: [
    { size: 'S', values: ['34-36', '28-30', '27'] },
    { size: 'M', values: ['38-40', '32-34', '28'] },
    { size: 'L', values: ['42-44', '36-38', '29.5'] },
  ],
  fitNote: 'Relaxed fit. Between sizes, take the smaller one.',
  howToMeasure: 'Measure around the fullest part of your chest, under your arms.',
}
const bottoms: SizeChart = { ...tops, id: 'northfold-chart-bottoms', name: 'Bottoms', unit: 'cm', columns: ['Waist', 'Hip'], rows: [{ size: '30', values: ['76', '96–100'] }] }

test('a product shows the chart it links, and only that one', () => {
  assert.equal(chartFor({ detail: { sizeChartId: 'northfold-chart-bottoms' } }, [tops, bottoms]), bottoms)
  assert.equal(chartFor({ detail: { sizeChartId: 'gone' } }, [tops, bottoms]), undefined)
  assert.equal(chartFor({ detail: {} }, [tops, bottoms]), undefined)
  assert.equal(chartFor({}, [tops]), undefined)
})

test('inches become whole centimetres, and centimetres the nearest half inch', () => {
  assert.equal(convertMeasurement('34-36', 'in', 'cm'), '86-91')
  assert.equal(convertMeasurement('29.5', 'in', 'cm'), '75')
  assert.equal(convertMeasurement('86-91', 'cm', 'in'), '34-36')
  assert.equal(convertMeasurement('76', 'cm', 'in'), '30')
  assert.equal(convertMeasurement('85', 'cm', 'in'), '33.5')
})

test('a range keeps its dash, and words are left alone', () => {
  assert.equal(convertMeasurement('96–100', 'cm', 'in'), '38–39.5')
  assert.equal(convertMeasurement('One size', 'cm', 'in'), 'One size')
  assert.equal(convertMeasurement('—', 'in', 'cm'), '—')
  assert.equal(convertMeasurement('34-36', 'in', 'in'), '34-36')
})

test('a chart in the other unit converts its measurements and keeps sizes, columns and notes', () => {
  const inCm = chartInUnit(tops, 'cm')
  assert.equal(inCm.unit, 'cm')
  assert.deepEqual(inCm.rows.map((r) => r.size), ['S', 'M', 'L'])
  assert.deepEqual(inCm.rows[0]!.values, ['86-91', '71-76', '69'])
  assert.deepEqual(inCm.columns, tops.columns)
  assert.equal(inCm.fitNote, tops.fitNote)
  // Waist sizes are names, not measurements: "30" stays "30".
  assert.equal(chartInUnit(bottoms, 'in').rows[0]!.size, '30')
})

test('a chart already in the unit is returned as it is, and converting never changes the chart given', () => {
  assert.equal(chartInUnit(tops, 'in'), tops)
  const before = JSON.stringify(tops)
  chartInUnit(tops, 'cm')
  assert.equal(JSON.stringify(tops), before)
})

test('a size column (a shoe size) is never converted; a chart of sizes only has nothing to switch', () => {
  const socks = { id: 'socks', channelId: 'x', name: 'Socks', unit: 'in' as const, columns: ["Women's shoe size", "Men's shoe size"], rows: [{ size: 'S', values: ['4-6.5', '—'] }], fitNote: '', howToMeasure: '' }
  assert.deepEqual(chartInUnit(socks, 'cm').rows[0]!.values, ['4-6.5', '—'])
  assert.equal(convertMeasurement('7-9.5', 'in', 'cm', 'Women’s shoe size'), '7-9.5')
  assert.equal(hasMeasurements(socks), false)
  const boots = { ...socks, name: 'Boots', columns: ['US size', "Women's foot length"], rows: [{ size: '8', values: ['8', '10'] }] }
  assert.equal(hasMeasurements(boots), true)
  assert.deepEqual(chartInUnit(boots, 'cm').rows[0]!.values, ['8', '25.5'])
})

test('a foot length keeps its centimetres to the half; other lengths convert as before', () => {
  // Aurora's boots, written to the eighth of an inch: half a shoe size is about 0.4 cm.
  const boots: SizeChart = {
    ...tops,
    id: 'boots',
    name: 'Boots',
    columns: ['Women’s foot length', 'Men’s foot length'],
    rows: [['6', '9.25', '—'], ['7', '9.5', '—'], ['8', '9.875', '10'], ['9', '10.25', '10.375'], ['10', '10.5', '10.75'], ['11', '—', '11.125'], ['12', '—', '11.5']]
      .map(([size, ...values]) => ({ size: size!, values })),
  }
  const cm = chartInUnit(boots, 'cm').rows.map((row) => row.values)
  assert.deepEqual(cm.map((v) => v[0]), ['23.5', '24', '25', '26', '26.5', '—', '—'], 'women’s 6–10')
  assert.deepEqual(cm.map((v) => v[1]), ['—', '—', '25.5', '26.5', '27.5', '28.5', '29'], 'men’s 8–12')
  assert.equal(convertMeasurement('10.75', 'in', 'cm', 'Foot length'), '27.5')
  assert.equal(convertMeasurement('9-10', 'in', 'cm', 'feet'), '23-25.5')
  // A body measurement stays whole: Northfold's 13.5-14 in neck is 34-36 cm, as before.
  assert.equal(convertMeasurement('13.5-14', 'in', 'cm', 'Neck'), '34-36')
  assert.equal(convertMeasurement('30.5', 'in', 'cm', 'Sleeve'), '77')
  // Centimetres to inches is to the half inch, whatever the column.
  assert.equal(convertMeasurement('26.5', 'cm', 'in', 'Foot length'), '10.5')
})
