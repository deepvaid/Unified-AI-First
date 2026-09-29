import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slotVerdict, type PendingSlot } from '../../src/davinci/pendingSlot.ts'
import { isAffirmation, isDecline, isFlowExit } from '../../src/davinci/phrases.ts'

const engine: PendingSlot = { intent: 'engine', slot: 'type', context: { page: 'Home' } }
const journeyGoal: PendingSlot = { intent: 'journey', slot: 'goal', context: {} }
const journeyOpen: PendingSlot = { intent: 'journey', slot: 'open', context: { goal: 'lapsed-buyer' } }

const table: Array<[PendingSlot, string, 'answer' | 'decline' | 'unrelated']> = [
  [journeyOpen, 'Open the journey wizard', 'answer'],
  [journeyOpen, 'yes please', 'answer'],
  [journeyOpen, 'yes, open it', 'answer'],
  [journeyOpen, "No, don't open it", 'decline'],
  [journeyOpen, 'nope', 'decline'],
  [journeyOpen, 'Please show revenue', 'unrelated'],
  [journeyOpen, 'sure, but show revenue first', 'unrelated'],
  [journeyOpen, 'Draft a different journey', 'unrelated'],
  [journeyGoal, 'Win back lapsed buyers', 'answer'],
  [journeyGoal, 'Recover abandoned carts', 'answer'],
  [journeyGoal, "How's revenue this week?", 'unrelated'],
  [journeyGoal, 'not now', 'decline'],
  [engine, 'What about Newest Products?', 'answer'],
  [engine, 'Trending Products', 'answer'],
  [engine, 'And for the cart page?', 'answer'],
  [engine, 'Show open rate trend for last 30 days', 'unrelated'],
  [engine, 'Add a line chart of orders', 'unrelated'],
  [engine, "How's revenue this week?", 'unrelated'],
  [engine, 'No thanks', 'decline'],
]
for (const [slot, text, expected] of table) {
  test(`${slot.intent}/${slot.slot}: "${text}" → ${expected}`, () => {
    assert.equal(slotVerdict(slot, text), expected)
  })
}

test('isFlowExit only fires when the whole message is an exit', () => {
  for (const yes of ['never mind', 'Never mind.', 'No thanks, cancel it', 'no', 'Cancel.', 'forget it', 'not now']) {
    assert.equal(isFlowExit(yes), true, yes)
  }
  for (const no of ['No, I want to promote a sale', 'Stop the campaign from sending', 'Promote an offer', 'Cancel the order for VIP customers']) {
    assert.equal(isFlowExit(no), false, no)
  }
})

test('isDecline / isAffirmation edge cases', () => {
  assert.equal(isDecline('No, show me revenue instead'), false)
  assert.equal(isDecline('thanks'), true)
  assert.equal(isAffirmation('thanks'), false)
  assert.equal(isAffirmation('please'), true)
  assert.equal(isAffirmation('Go ahead'), true)
})
