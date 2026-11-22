// West-of-UTC is where `new Date('YYYY-MM-DD')` puts an order on the previous day.
process.env.TZ = 'America/Los_Angeles'

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localDateKey, parseLocalDateKey } from '../../src/utils/localDate.ts'
import { escapeHtml } from '../../src/utils/escapeHtml.ts'

test('a date-only key is local midnight of that day, not the previous evening', () => {
  assert.equal(new Date('2026-09-29').getDate(), 28, 'the bug: date-only strings parse as UTC')
  const parsed = parseLocalDateKey('2026-09-29')
  assert.equal(parsed.getDate(), 29)
  assert.equal(parsed.getHours(), 0)
})

test('full timestamps pass through untouched; empty input is an invalid date', () => {
  assert.equal(parseLocalDateKey('2026-08-31T08:25:00Z').getTime(), new Date('2026-08-31T08:25:00Z').getTime())
  assert.ok(Number.isNaN(parseLocalDateKey('').getTime()))
  assert.ok(Number.isNaN(parseLocalDateKey(undefined).getTime()))
})

test('keys round-trip, including across the DST changes', () => {
  for (const key of ['2026-01-01', '2026-03-08', '2026-03-09', '2026-11-01', '2026-11-02', '2026-12-31']) {
    assert.equal(localDateKey(parseLocalDateKey(key)), key)
  }
})

test('escapeHtml neutralises markup that chart tooltips build from user-authored names', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;')
  assert.equal(escapeHtml(`Bob's "Q3" & co`), 'Bob&#39;s &quot;Q3&quot; &amp; co')
  assert.equal(escapeHtml(undefined), '')
  assert.equal(escapeHtml(42), '42')
})
