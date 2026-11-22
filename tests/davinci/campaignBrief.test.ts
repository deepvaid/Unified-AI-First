import { test } from 'node:test'
import assert from 'node:assert/strict'
import { campaignCopy, objectiveKey, readCampaignRequest } from '../../src/davinci/campaignBrief.ts'

test('a request that names its occasion and goal is not asked for them again', () => {
  const table: Array<[string, string | null, string | null]> = [
    ['Draft a Black Friday email campaign for my VIP customers', 'Black Friday', 'promotion'],
    ['Run a summer sale campaign', 'Summer Sale', 'promotion'],
    ['Send a Cyber Monday offer to all subscribers', 'Cyber Monday', 'promotion'],
    ['Create a campaign with 20% off for loyal customers', null, 'promotion'],
    ['Launch a campaign announcing our new collection', null, 'announcement'],
    ['Send a holiday newsletter', 'Holiday', 'newsletter'],
    ['Run a win-back campaign for lapsed buyers', null, 'reconnect'],
    ['Create a Christmas campaign', 'Christmas', null],
    ['Run a campaign', null, null],
    ['Run a campaign to VIP customers', null, null],
  ]
  for (const [text, topic, objective] of table) {
    assert.deepEqual(readCampaignRequest(text), { topic, objective }, text)
  }
})

test('the draft is named for the occasion, not as a first campaign', () => {
  assert.deepEqual(campaignCopy('promotion', 'Black Friday', false), {
    name: 'Black Friday — Special offer',
    subject: 'Black Friday: an offer picked for you',
    preheader: 'Our Black Friday offer is live — see what’s inside.',
  })
  assert.equal(campaignCopy('newsletter', 'Holiday', false).name, 'Holiday — Newsletter')
  assert.equal(campaignCopy('generic', 'Christmas', false).name, 'Christmas campaign')
  // No occasion: an established account gets a plain name…
  assert.equal(campaignCopy('promotion', null, false).name, 'Special offer')
  assert.equal(campaignCopy('generic', null, false).name, 'New campaign')
  // …and only an account that has never sent one is told it is its first.
  assert.equal(campaignCopy('promotion', null, true).name, 'First campaign — Special offer')
  assert.equal(campaignCopy('generic', null, true).subject, 'Your first campaign')
  // An occasion still leads for a first campaign.
  assert.equal(campaignCopy('promotion', 'Black Friday', true).name, 'Black Friday — Special offer')
})

test('wizard answers map to a goal', () => {
  assert.equal(objectiveKey('Promote an offer'), 'promotion')
  assert.equal(objectiveKey('Announce something'), 'announcement')
  assert.equal(objectiveKey('Reconnect with customers'), 'reconnect')
  assert.equal(objectiveKey('Share a newsletter'), 'newsletter')
  assert.equal(objectiveKey(''), 'generic')
})
