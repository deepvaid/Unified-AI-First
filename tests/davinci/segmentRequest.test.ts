import { test } from 'node:test'
import assert from 'node:assert/strict'
import { answerSegmentRequest, segmentSpecFor, windowDays, type ExistingSegment, type SegmentKind } from '../../src/davinci/segmentRequest.ts'

// The demo account's segments (src/stores/useContacts.ts) — the counts Da Vinci must agree with.
const SEGMENTS: ExistingSegment[] = [
  { id: 1, name: 'High Value Customers', description: 'Contacts with LTV > $500', count: 1842 },
  { id: 2, name: 'Lapsed 90 Days', description: 'No activity in 90+ days', count: 4201 },
  { id: 3, name: 'Newsletter Subscribers', description: 'Opted in to weekly newsletter', count: 18432 },
  { id: 4, name: 'Abandoned Cart - 7 Days', description: 'Cart abandoned in last 7 days', count: 892 },
  { id: 5, name: 'VIP Members', description: 'Tagged as VIP or Loyalty tier', count: 312 },
  { id: 6, name: 'New Signups - 30 Days', description: 'Joined in the last 30 days', count: 2341 },
  { id: 7, name: 'Repeat Buyers', description: '2+ orders in any period', count: 5621 },
  { id: 10, name: 'Re-Engagement Targets', description: '120+ days inactive, still subscribed', count: 3102 },
]

test('windowDays reads the window a request names', () => {
  const table: Array<[string, number | null]> = [
    ["customers who haven't purchased in 90 days", 90],
    ['no order in the last 3 months', 90],
    ['signed up in the past six weeks', 42],
    ['bought nothing this quarter', 90],
    ['inactive for a year', 365],
    ['120+ days inactive', 120],
    ['Build a VIP customer segment', null],
  ]
  for (const [text, days] of table) assert.equal(windowDays(text), days, text)
})

test('a request maps to the segment it describes — never a canned one', () => {
  const table: Array<[string, SegmentKind, string]> = [
    ["Create a segment of customers who haven't purchased in 90 days", 'lapsed', 'Lapsed buyers · 90 days'],
    ["Build a segment of people who haven't ordered in 60 days", 'lapsed', 'Lapsed buyers · 60 days'],
    ['Build a segment of lapsed customers', 'lapsed', 'Lapsed buyers · 90 days'],
    ['Make an audience of at-risk customers', 'lapsed', 'Lapsed buyers · 90 days'],
    ["Create a segment of subscribers who haven't opened an email in 45 days", 'unengaged', 'Inactive subscribers · 45 days'],
    ['Build a segment of inactive subscribers', 'unengaged', 'Inactive subscribers · 120 days'],
    ['Create a segment of customers who abandoned their cart', 'cart', 'Cart abandoners · 7 days'],
    ['Make a segment of new customers from the last 30 days', 'new', 'New customers · 30 days'],
    ['Create a segment of people who signed up in the last 2 weeks', 'new', 'New signups · 14 days'],
    ['Build an audience of repeat buyers', 'repeat', 'Repeat buyers'],
    ['Build a VIP customer segment', 'vip', 'VIP customers'],
    ['Create a segment of my loyal customers', 'vip', 'VIP customers'],
    ['Create a segment of people who spent over $500', 'high-value', 'High-value customers'],
    ['Build a segment of my best customers', 'high-value', 'High-value customers'],
    ['Create a segment of engaged subscribers', 'engaged', 'Engaged subscribers · 30 days'],
    ['Create a segment', 'high-intent', 'High-intent shoppers'],
  ]
  for (const [text, kind, name] of table) {
    const spec = segmentSpecFor(text)
    assert.equal(spec.kind, kind, text)
    assert.equal(spec.name, name, text)
  }
})

test('the rules say what was asked for', () => {
  assert.deepEqual(segmentSpecFor("customers who haven't purchased in 90 days").rules, [
    'Has placed at least 1 order',
    'No order in the last 90 days',
    'Subscribed to email',
  ])
  assert.equal(segmentSpecFor('people who spent more than $1,200').rules[0], 'Lifetime spend over $1,200')
  assert.equal(segmentSpecFor('new subscribers this month').rules[0], 'Joined in the last 30 days')
  // The spoken name leaves the window out — "Lapsed buyers", not "Lapsed buyers dot 90 days".
  assert.equal(segmentSpecFor('lapsed customers').spokenName, 'Lapsed buyers')
})

test('a segment the account already has is shown with its real count, not drafted again', () => {
  const table: Array<[string, string, number]> = [
    ["Create a segment of customers who haven't purchased in 90 days", 'Lapsed 90 Days', 4201],
    ['Build a VIP customer segment', 'VIP Members', 312],
    ['Create a segment of people who spent over $500', 'High Value Customers', 1842],
    ['Build an audience of repeat buyers', 'Repeat Buyers', 5621],
    ['Create a segment of customers who abandoned their cart', 'Abandoned Cart - 7 Days', 892],
    ['Make a segment of new signups from the last 30 days', 'New Signups - 30 Days', 2341],
    ['Build a segment of inactive subscribers', 'Re-Engagement Targets', 3102],
  ]
  for (const [text, name, count] of table) {
    const answer = answerSegmentRequest(text, SEGMENTS)
    assert.equal(answer.existing?.name, name, text)
    assert.equal(answer.size, count, text)
  }
})

test('a new window is estimated from its nearest relative, in the right direction', () => {
  const lapsed60 = answerSegmentRequest("customers who haven't purchased in 60 days", SEGMENTS)
  assert.equal(lapsed60.existing, null)
  assert.ok(lapsed60.size > 4201, 'more contacts have gone 60 days without an order than 90')

  const lapsed180 = answerSegmentRequest("customers who haven't purchased in 180 days", SEGMENTS)
  assert.ok(lapsed180.size < 4201, 'fewer have gone 180 days')

  const cart14 = answerSegmentRequest('customers who abandoned their cart in the last 14 days', SEGMENTS)
  assert.equal(cart14.existing, null)
  assert.ok(cart14.size > 892, 'two weeks of abandoned carts is more than one')

  // A different spend threshold is a different segment.
  assert.equal(answerSegmentRequest('people who spent over $2,000', SEGMENTS).existing, null)
})

test('an account with no segments still gets a size, and estimates are round numbers', () => {
  const empty = answerSegmentRequest('Build a VIP customer segment', [])
  assert.equal(empty.existing, null)
  assert.ok(empty.size > 0)
  assert.equal(answerSegmentRequest("customers who haven't purchased in 60 days", SEGMENTS).size % 10, 0)
})
