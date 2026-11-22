import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PLG_CURRENCIES, convert, formatMoney, resolveCurrency } from '../../src/plg/currency.ts'

test('USD amounts pass through unchanged', () => {
  assert.equal(convert(299, 'USD'), 299)
  assert.equal(formatMoney(299, 'USD'), '$299.00')
})

test('another currency converts and carries its own symbol', () => {
  const aud = resolveCurrency('AUD')
  assert.equal(convert(100, 'AUD'), 100 * aud.rate)
  assert.equal(formatMoney(100, 'AUD'), `A$${(100 * aud.rate).toFixed(2)}`)
  assert.match(formatMoney(100, 'GBP'), /^£/)
  assert.match(formatMoney(100, 'EUR'), /^€/)
})

test('conversion rounds to the cent', () => {
  assert.equal(convert(209.3, 'CAD'), Math.round(209.3 * resolveCurrency('CAD').rate * 100) / 100)
})

test('an unknown or missing code falls back to USD', () => {
  assert.equal(resolveCurrency('XYZ').code, 'USD')
  assert.equal(resolveCurrency(undefined).code, 'USD')
  assert.equal(resolveCurrency('aud').code, 'AUD')
  assert.equal(formatMoney(50, null), '$50.00')
})

test('the five offered currencies are distinct', () => {
  assert.deepEqual(PLG_CURRENCIES.map(c => c.code), ['USD', 'AUD', 'CAD', 'GBP', 'EUR'])
})
