import { test } from 'node:test'
import assert from 'node:assert/strict'
import { displayName, matchProductName } from '../../src/davinci/productMatch.ts'

const CATALOGUE = [
  'Nike Air Max 270 - Black/White',
  'Sony WH-1000XM5 Headphones',
  'Sony Alpha a7 IV Camera',
  'Hydro Flask 32oz Wide Mouth',
  'Kindle Paperwhite 16GB',
  'YETI Rambler 20oz Tumbler',
  'Dyson V15 Detect Vacuum',
]

test('a request names a catalogue product by its spoken name, not its variant suffix', () => {
  const table: Array<[string, string | null]> = [
    ['Write a product description for the Nike Air Max 270', 'Nike Air Max 270 - Black/White'],
    ['Draft a description for my Hydro Flask', 'Hydro Flask 32oz Wide Mouth'],
    ['draft a product description for the kindle paperwhite', 'Kindle Paperwhite 16GB'],
    ['Write a description for the Sony WH-1000XM5 headphones', 'Sony WH-1000XM5 Headphones'],
    ['Describe the Dyson V15', 'Dyson V15 Detect Vacuum'],
    // A brand alone names no product — two Sony products share it.
    ['Write a description for my Sony product', null],
    // Nothing from the catalogue.
    ['Draft a product description', null],
    ['Write a description for a ceramic mug called Morning Ritual', null],
  ]
  for (const [text, expected] of table) assert.equal(matchProductName(text, CATALOGUE), expected, text)
})

test('the display name drops the variant suffix', () => {
  assert.equal(displayName('Nike Air Max 270 - Black/White'), 'Nike Air Max 270')
  assert.equal(displayName('Kindle Paperwhite 16GB'), 'Kindle Paperwhite 16GB')
})
