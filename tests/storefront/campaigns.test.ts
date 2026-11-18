import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toDecimal } from '../../src/maropay/money.ts'
import { activeCampaign, campaignStatus, codeProblem, discountFor, findByCode, offerErrors, takesCodes } from '../../src/storefront/campaigns.ts'
import type { StoreCampaign } from '../../src/storefront/campaigns.ts'
import { VITAHEAL_CHANNEL_ID, VITAHEAL_COLLECTION_NAMES, vitahealCampaigns } from '../../src/storefront/vitahealDemo.ts'

const TODAY = '2026-11-18'
const NOW = new Date(`${TODAY}T12:00`)
const seeded = vitahealCampaigns(TODAY)
const [winter, sleep, blackWeek] = seeded as [StoreCampaign, StoreCampaign, StoreCampaign]

test('a campaign is scheduled before its window, active inside it and ended after', () => {
  const window = { startDate: '2026-11-18', startTime: '09:00', endDate: '2026-11-20', endTime: '18:00' }
  assert.equal(campaignStatus(window, new Date('2026-11-18T08:59')), 'Scheduled')
  assert.equal(campaignStatus(window, new Date('2026-11-18T09:00')), 'Active')
  assert.equal(campaignStatus(window, new Date('2026-11-20T18:00')), 'Active')
  assert.equal(campaignStatus(window, new Date('2026-11-20T18:01')), 'Ended')
  // Without times the window is whole days.
  assert.equal(campaignStatus({ ...window, startTime: '', endTime: '' }, new Date('2026-11-20T23:30')), 'Active')
})

test('the demo store has one campaign running, one to come and one over, whatever the day', () => {
  for (const today of [TODAY, '2027-06-30', '2028-02-29']) {
    const now = new Date(`${today}T12:00`)
    assert.deepEqual(vitahealCampaigns(today).map((c) => campaignStatus(c, now)), ['Active', 'Scheduled', 'Ended'], today)
  }
  for (const c of seeded) {
    assert.equal(c.channelId, VITAHEAL_CHANNEL_ID)
    assert.deepEqual(offerErrors(c.offer!, seeded.filter((other) => other.id !== c.id)), {}, `${c.name} has a usable offer`)
    for (const target of c.targets) assert.ok((VITAHEAL_COLLECTION_NAMES as readonly string[]).includes(target), `${target} is one of the store's collections`)
  }
})

test('the store shows the running campaign’s message, and only then asks for a code', () => {
  assert.equal(activeCampaign(seeded, VITAHEAL_CHANNEL_ID, NOW)?.name, 'Winter wellness week')
  assert.equal(takesCodes(seeded, VITAHEAL_CHANNEL_ID, NOW), true)
  assert.equal(activeCampaign(seeded, 'neelam-store', NOW), undefined)
  assert.equal(takesCodes(seeded, 'neelam-store', NOW), false)
  // After it ends there is nothing to show and nothing to type.
  const later = new Date('2026-12-15T12:00')
  assert.equal(activeCampaign(seeded, VITAHEAL_CHANNEL_ID, later), undefined)
  assert.equal(takesCodes(seeded, VITAHEAL_CHANNEL_ID, later), false)
  // A running campaign without a message shows nothing.
  assert.equal(activeCampaign([{ ...winter, offer: { ...winter.offer!, message: ' ' } }], VITAHEAL_CHANNEL_ID, NOW), undefined)
})

test('of two running campaigns, the one that started last has the bar', () => {
  const earlier: StoreCampaign = { ...winter, id: 'a', name: 'Earlier', startDate: '2026-11-01' }
  assert.equal(activeCampaign([earlier, winter], VITAHEAL_CHANNEL_ID, NOW)?.name, 'Winter wellness week')
})

test('a code is found whatever its case, and each reason it can’t be used is said plainly', () => {
  assert.equal(findByCode(seeded, VITAHEAL_CHANNEL_ID, ' winter15 ')?.id, winter.id)
  assert.equal(findByCode(seeded, 'neelam-store', 'WINTER15'), undefined)
  const problem = (code: string) => codeProblem(seeded, VITAHEAL_CHANNEL_ID, code, NOW)
  assert.equal(problem('winter15'), null)
  assert.equal(problem(''), 'Enter a discount code.')
  assert.equal(problem('NOPE'), 'That code is not valid for this store.')
  assert.equal(problem('SLEEP20'), 'That code is not active yet.')
  assert.equal(problem('BLACK25'), 'That code has ended.')
})

test('a code with no targets takes its percentage off every line', () => {
  const lines = [
    { price: '399.00', qty: 2, collections: ['Sleep'] },
    { price: '199.00', qty: 1, collections: ['Sport'] },
  ]
  const discount = discountFor(lines, winter, 'SEK')!
  assert.equal(discount.code, 'WINTER15')
  assert.deepEqual(discount.covers, [true, true])
  // 15% of 798,00 + 15% of 199,00 = 119,70 + 29,85
  assert.equal(toDecimal(discount.amount), '149.55')
})

test('a code with targets only covers products in those collections', () => {
  const lines = [
    { price: '399.00', qty: 1, collections: ['Sleep', 'Subscription'] },
    { price: '279.00', qty: 1, collections: ['Hydrate', 'Sport'] },
  ]
  const discount = discountFor(lines, sleep, 'SEK')!
  assert.deepEqual(discount.covers, [true, false])
  assert.equal(toDecimal(discount.amount), '79.80')
  assert.equal(discountFor([lines[1]!], sleep, 'SEK'), null)
})

test('each line’s discount is rounded on its own, so the lines add up to the total', () => {
  const lines = [{ price: '585.90', qty: 1, collections: [] }, { price: '223.20', qty: 3, collections: [] }]
  // 15% of 585,90 = 87,885 → 87,89; 15% of 669,60 = 100,44
  assert.equal(toDecimal(discountFor(lines, winter, 'SEK')!.amount), '188.33')
})

test('no campaign, no code or nothing covered means no discount', () => {
  const lines = [{ price: '399.00', qty: 1, collections: ['Sleep'] }]
  assert.equal(discountFor(lines, undefined, 'SEK'), null)
  assert.equal(discountFor(lines, { ...winter, offer: { message: 'Hello', code: '', discountPct: 15 } }, 'SEK'), null)
  assert.equal(discountFor(lines, { ...winter, offer: undefined }, 'SEK'), null)
  assert.equal(discountFor([], winter, 'SEK'), null)
})

test('an offer’s code and percentage are checked before it is saved', () => {
  const others = [blackWeek]
  assert.deepEqual(offerErrors({ message: '', code: '', discountPct: 0 }, others), {})
  assert.deepEqual(offerErrors({ message: 'A message alone is fine', code: '', discountPct: 0 }, others), {})
  assert.match(offerErrors({ message: '', code: 'two words', discountPct: 10 }, others).code!, /letters and numbers/)
  assert.match(offerErrors({ message: '', code: 'black25', discountPct: 10 }, others).code!, /already uses that code/)
  assert.match(offerErrors({ message: '', code: 'SPRING10', discountPct: 0 }, others).discountPct!, /1 to 90/)
  assert.match(offerErrors({ message: '', code: 'SPRING10', discountPct: 12.5 }, others).discountPct!, /whole number/)
})
