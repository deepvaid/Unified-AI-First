import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  add, applyRate, compare, formatMoney, fromDecimal, money, moneyParts, parseDecimal, subtract, sum, toDecimal,
} from '../../src/maropay/money.ts'

test('decimal strings become integer minor units without float drift', () => {
  assert.deepEqual(fromDecimal('129.00', 'USD'), { amount: 12900, currency: 'USD' })
  assert.equal(fromDecimal('0.1', 'USD').amount + fromDecimal('0.2', 'USD').amount, 30)
  assert.equal(fromDecimal('1,290.5', 'USD').amount, 129050)
  assert.equal(fromDecimal('-12.5', 'USD').amount, -1250)
})

test('currency exponents are respected — JPY has none, KWD has three', () => {
  assert.equal(fromDecimal('1290', 'JPY').amount, 1290)
  assert.equal(toDecimal(money(1290, 'JPY')), '1290')
  assert.equal(fromDecimal('1.234', 'KWD').amount, 1234)
  assert.equal(toDecimal(money(1234, 'KWD')), '1.234')
  assert.equal(toDecimal(money(-1250, 'USD')), '-12.50')
  assert.equal(toDecimal(money(5, 'USD')), '0.05')
})

test('extra fraction digits round half away from zero; garbage is rejected', () => {
  assert.equal(fromDecimal('10.005', 'USD').amount, 1001)
  assert.equal(fromDecimal('10.004', 'USD').amount, 1000)
  assert.equal(parseDecimal('12.3.4', 'USD'), null)
  assert.equal(parseDecimal('abc', 'USD'), null)
  assert.equal(parseDecimal('', 'USD'), null)
  assert.throws(() => money(1.5, 'USD'))
})

test('arithmetic refuses to mix currencies', () => {
  assert.equal(add(money(100, 'USD'), money(50, 'USD')).amount, 150)
  assert.equal(subtract(money(100, 'USD'), money(150, 'USD')).amount, -50)
  assert.throws(() => add(money(100, 'USD'), money(100, 'EUR')), /currency mismatch/)
  assert.deepEqual(sum([], 'USD'), { amount: 0, currency: 'USD' })
  assert.equal(compare(money(1, 'USD'), money(2, 'USD')), -1)
})

test('rates: percentage rounds, fixed part is added, caps apply', () => {
  const card = { percentBps: 290, fixedMinor: 30, label: '2.9% + 30¢' }
  assert.equal(applyRate(money(12900, 'USD'), card).amount, 374 + 30)
  const ach = { percentBps: 80, fixedMinor: 0, label: '0.8%, max $5', capMinor: 500 }
  assert.equal(applyRate(money(10_000, 'USD'), ach).amount, 80)
  assert.equal(applyRate(money(1_000_000, 'USD'), ach).amount, 500)
})

test('formatting puts the sign before the symbol and omits fractions for JPY', () => {
  assert.equal(formatMoney(money(-1250, 'USD')), '-$12.50')
  assert.equal(formatMoney(money(1290, 'JPY')), '¥1,290')
  const parts = moneyParts(money(-123456, 'USD'))
  assert.deepEqual({ negative: parts.negative, symbol: parts.symbol, integer: parts.integer, fraction: parts.fraction }, { negative: true, symbol: '$', integer: '1,234', fraction: '56' })
  assert.equal(moneyParts(money(1290, 'JPY')).fraction, '')
})
