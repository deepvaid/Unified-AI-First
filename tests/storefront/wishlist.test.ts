// The shopper's wishlist on the sections drawing (src/storefront/wishlist.ts): what the
// browser keeps, how a heart toggles, which saved products a store still shows and
// counts, and what the hearts and the header say. Also the Boxed card style the
// wishlist page and Lumos's lists draw (src/storefront/listing.ts).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  WISHLIST_KEY, heartLabel, parseWishlists, savedCountText, serializeWishlists, shownIds, toggleAnnouncement, toggled,
  wishlistCount, wishlistLinkLabel, without,
} from '../../src/storefront/wishlist.ts'
import { DEFAULT_GRID, gridSettings } from '../../src/storefront/listing.ts'

test('the wishlist is kept under one key, a list of product ids per store', () => {
  assert.equal(WISHLIST_KEY, 'mp.storefront.wishlist.v1')
  const lists = { 'lumos-demo': [5001, 5019], 'store-12': [120001] }
  assert.deepEqual(parseWishlists(serializeWishlists(lists)), lists)
  // A store with nothing saved is not written down.
  assert.equal(serializeWishlists({ 'lumos-demo': [], 'store-12': [7] }), '{"store-12":[7]}')
})

test('what the browser keeps reads back safely: anything malformed is nothing saved', () => {
  for (const raw of [null, undefined, '', 'not json', '[]', '42', '"text"', 'null']) assert.deepEqual(parseWishlists(raw), {}, String(raw))
  // Ids only, each once, in the order first saved; a store whose list is not a list is left out.
  assert.deepEqual(
    parseWishlists(JSON.stringify({ 'lumos-demo': [5003, 'x', 5003, -1, 2.5, 0, 5001], broken: 'nope', empty: [] })),
    { 'lumos-demo': [5003, 5001] },
  )
})

test('a heart saves a product last, and takes it off when it was saved', () => {
  assert.deepEqual(toggled([], 5001), [5001])
  assert.deepEqual(toggled([5001], 5003), [5001, 5003])
  assert.deepEqual(toggled([5001, 5003], 5001), [5003])
  assert.deepEqual(without([5001, 5003], 5003), [5001])
  assert.deepEqual(without([5001], 5099), [5001])
})

test('a store shows and counts only the saved products it still sells, newest first', () => {
  const saved = [5001, 5014, 4021, 5007]
  const sold = [5001, 5002, 5007, 5014]
  assert.deepEqual(shownIds(saved, sold), [5007, 5014, 5001])
  // 4021 was saved while another theme ran: kept, but neither shown nor counted.
  assert.equal(wishlistCount(saved, sold), 3)
  assert.equal(wishlistCount(saved, new Set<number>()), 0)
  assert.deepEqual(shownIds([], sold), [])
})

test('a heart keeps one name and says its state with aria-pressed; pressing it is said politely', () => {
  assert.equal(heartLabel('Arlo 3-Seat Sofa'), 'Save Arlo 3-Seat Sofa to your wishlist')
  assert.equal(toggleAnnouncement('Arlo 3-Seat Sofa', true), 'Saved to your wishlist · Arlo 3-Seat Sofa')
  assert.equal(toggleAnnouncement('Arlo 3-Seat Sofa', false), 'Removed from your wishlist · Arlo 3-Seat Sofa')
})

test('the header heart and the wishlist page say how many are saved', () => {
  assert.equal(wishlistLinkLabel(0), 'Wishlist')
  assert.equal(wishlistLinkLabel(1), 'Wishlist, 1 item')
  assert.equal(wishlistLinkLabel(3), 'Wishlist, 3 items')
  assert.equal(savedCountText(1), '1 item saved')
  assert.equal(savedCountText(4), '4 items saved')
})

test('the collection template asks for Boxed cards, the Figma product card; other values keep Editorial', () => {
  assert.equal(gridSettings([{ kind: 'collection-grid', settings: { cardStyle: 'Boxed', columns: 3 } }]).cardStyle, 'Boxed')
  assert.equal(gridSettings([{ kind: 'collection-grid', settings: { cardStyle: 'Dense' } }]).cardStyle, 'Dense')
  assert.equal(gridSettings([{ kind: 'collection-grid', settings: { cardStyle: 'boxed' } }]).cardStyle, 'Editorial')
  assert.equal(DEFAULT_GRID.cardStyle, 'Editorial')
})
