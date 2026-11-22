import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  INK_DARK, INK_LIGHT, MIN_TEXT_CONTRAST, brandInk, contrastRatio, isValidHex, onBrand, relativeLuminance,
} from '../../src/utils/brandContrast.ts'

// The builder's swatch palette.
const SWATCHES = ['#1F2933', '#2563EB', '#6D28D9', '#7CB9D6', '#7BC67B', '#E9C74A', '#DD7A3B', '#C0559A']

test('hex validation accepts #rgb and #rrggbb only', () => {
  assert.ok(isValidHex('#fff'))
  assert.ok(isValidHex('#2563EB'))
  assert.ok(isValidHex(' #2563eb '))
  assert.ok(!isValidHex('2563EB'))
  assert.ok(!isValidHex('#2563E'))
  assert.ok(!isValidHex('blue'))
})

test('luminance and contrast match the WCAG anchors', () => {
  assert.equal(relativeLuminance('#000000'), 0)
  assert.equal(relativeLuminance('#ffffff'), 1)
  assert.equal(relativeLuminance('#fff'), 1, 'short form expands')
  assert.equal(contrastRatio('#000000', '#ffffff'), 21)
  assert.equal(contrastRatio('#ffffff', '#000000'), 21, 'order does not matter')
  assert.equal(relativeLuminance('nope'), null)
  assert.equal(contrastRatio('#fff', 'nope'), null)
})

test('ink on the brand fill is dark on light colours and white on dark ones', () => {
  assert.equal(onBrand('#E9C74A'), INK_DARK, 'yellow')
  assert.equal(onBrand('#7CB9D6'), INK_DARK, 'sky blue')
  assert.equal(onBrand('#ffffff'), INK_DARK)
  assert.equal(onBrand('#2563EB'), INK_LIGHT, 'brand blue')
  assert.equal(onBrand('#1F2933'), INK_LIGHT, 'near-black')
  assert.equal(onBrand('#000000'), INK_LIGHT)
  assert.equal(onBrand('not-a-colour'), INK_LIGHT, 'invalid input falls back to white')
})

test('every swatch gets readable ink on its own fill', () => {
  for (const swatch of SWATCHES) {
    const ratio = contrastRatio(swatch, onBrand(swatch))!
    assert.ok(ratio >= MIN_TEXT_CONTRAST, `${swatch} → ${ratio.toFixed(2)}:1`)
  }
})

test('a brand that already reads on white is left exactly as picked', () => {
  assert.equal(brandInk('#2563EB'), '#2563eb')
  assert.equal(brandInk('#1F2933'), '#1f2933')
})

test('a light brand is darkened on white until it reaches 4.5:1', () => {
  for (const swatch of ['#E9C74A', '#7CB9D6', '#7BC67B', '#DD7A3B']) {
    const ink = brandInk(swatch)
    assert.notEqual(ink.toLowerCase(), swatch.toLowerCase(), `${swatch} should change`)
    assert.ok(contrastRatio(ink, '#ffffff')! >= MIN_TEXT_CONTRAST, `${swatch} → ${ink}`)
    assert.ok(relativeLuminance(ink)! < relativeLuminance(swatch)!, 'moves darker, not lighter')
  }
})

test('on a dark surface a dark brand is lightened instead', () => {
  const surface = '#17191c'
  const ink = brandInk('#1F2933', surface)
  assert.ok(contrastRatio(ink, surface)! >= MIN_TEXT_CONTRAST)
  assert.ok(relativeLuminance(ink)! > relativeLuminance('#1F2933')!)
  assert.equal(brandInk('#E9C74A', surface), '#e9c74a', 'yellow already reads on dark')
})

test('white and black still resolve to something readable', () => {
  assert.ok(contrastRatio(brandInk('#ffffff'), '#ffffff')! >= MIN_TEXT_CONTRAST)
  assert.ok(contrastRatio(brandInk('#000000', '#000000'), '#000000')! >= MIN_TEXT_CONTRAST)
})

test('invalid input is returned unchanged rather than guessed at', () => {
  assert.equal(brandInk('#12'), '#12')
  assert.equal(brandInk('#2563EB', 'nope'), '#2563EB')
})
