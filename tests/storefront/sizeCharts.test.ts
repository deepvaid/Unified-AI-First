import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chartFor, chartInUnit, convertMeasurement } from '../../src/storefront/sizeCharts.ts'
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
