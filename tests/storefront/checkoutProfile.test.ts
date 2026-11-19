import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkoutProfile } from '../../src/storefront/checkoutProfile.ts'
import { VITAHEAL_CHANNEL } from '../../src/storefront/vitahealDemo.ts'

test('a store without a currency of its own keeps the usual checkout', () => {
  const profile = checkoutProfile()
  assert.equal(profile.countries[0], 'United States')
  assert.equal(profile.regionLabel, 'State')
  assert.equal(profile.shopper.city, 'San Francisco')
  assert.equal(profile.keepsAddress, false)
  assert.deepEqual(checkoutProfile('USD'), profile)
})

test('a Swedish store delivers to Sweden first, then the Nordics, then the EU', () => {
  const profile = checkoutProfile('SEK')
  assert.deepEqual(profile.countries.slice(0, 5), ['Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland'])
  assert.ok(profile.countries.includes('Germany'))
  assert.ok(!profile.countries.includes('United States'))
  assert.equal(new Set(profile.countries).size, profile.countries.length)
  assert.deepEqual(checkoutProfile('sek'), profile)
})

test('its sample shopper lives in the store’s home country, at an address with no state', () => {
  const { shopper, countries, regionLabel, keepsAddress } = checkoutProfile('SEK')
  assert.equal(shopper.country, countries[0])
  assert.equal(shopper.region, '')
  assert.equal(regionLabel, null)
  assert.match(shopper.postcode, /^\d{3} \d{2}$/)
  assert.match(shopper.email, /@example\.com$/)
  assert.equal(keepsAddress, true)
})

test('the Vitaheal (demo) store gets the Swedish checkout', () => {
  assert.equal(checkoutProfile(VITAHEAL_CHANNEL.webStore?.currency).shopper.city, 'Stockholm')
  assert.equal(VITAHEAL_CHANNEL.webStore?.demo, true)
})
