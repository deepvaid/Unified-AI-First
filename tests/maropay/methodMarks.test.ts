import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { METHOD_CATALOG } from '../../src/maropay/model.ts'
import { CARD_BRAND_MARKS, METHOD_MARK_IDS, METHOD_MARKS, markFor, methodCaption } from '../../src/maropay/methodMarks.ts'

test('every catalogue method has a mark, and cards resolve their brand from the label', () => {
  for (const method of METHOD_CATALOG) assert.ok(METHOD_MARKS[markFor(method.id)], method.id)
  assert.equal(markFor('card'), 'card')
  assert.equal(markFor('card', 'Visa •••• 4242'), 'visa')
  assert.equal(markFor('card', 'Mastercard •••• 8888'), 'mastercard')
  assert.equal(markFor('card', 'Amex •••• 1234'), 'amex')
  assert.equal(markFor('card', 'Shop Pay'), 'card', 'a brand Maropay does not know is a generic card')
  assert.equal(markFor('paypal_wallet', 'PayPal'), 'paypal', 'previous-provider PayPal')
  assert.equal(markFor('us_bank_account'), 'ach')
  assert.equal(markFor('something_new'), 'card')
})

test('every mark has a glyph or initials, and the caption drops what the mark already says', () => {
  for (const id of METHOD_MARK_IDS) assert.ok(METHOD_MARKS[id].glyph || METHOD_MARKS[id].initials, id)
  assert.deepEqual([...CARD_BRAND_MARKS], ['visa', 'mastercard', 'amex'])
  assert.equal(methodCaption('card', 'Visa •••• 4242'), '•••• 4242')
  assert.equal(methodCaption('card', 'Cards'), 'Cards')
  assert.equal(methodCaption('google_pay', 'Google Pay'), 'Google Pay')
})

test('every mark has a token pair and a contrast check', () => {
  const tokens = JSON.parse(readFileSync(new URL('../../src/design-tokens/tokens.json', import.meta.url), 'utf8'))
  const pairs = tokens.$contrastPairs as Array<{ surface: string; foreground: string }>
  for (const id of METHOD_MARK_IDS) {
    assert.ok(tokens.color.methodMark[id]?.tile && tokens.color.methodMark[id]?.onTile, `${id} tokens`)
    assert.ok(pairs.some((p) => p.surface === `color.methodMark.${id}.tile` && p.foreground === `color.methodMark.${id}.onTile`), `${id} contrast pair`)
  }
})

test('a previous provider’s wallet named only by its label still gets its brand', () => {
  assert.equal(markFor('', 'PayPal Checkout'), 'paypal')
  assert.equal(markFor('card', 'PayPal Checkout'), 'card', 'a card is never read as a wallet')
  assert.equal(markFor('', 'Store credit'), 'card')
})
