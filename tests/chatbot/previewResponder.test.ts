import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bestEntry, respond, type PreviewContext, type PreviewEntry } from '../../src/chatbot/previewResponder.ts'

const entries: PreviewEntry[] = [
  { title: 'Shipping and delivery', text: 'Standard delivery takes 3–5 business days and is free on orders over $75.', source: 'FAQ' },
  { title: 'Returns and refunds', text: 'You can return unworn items within 30 days for a full refund.', source: 'FAQ' },
  { title: 'Sizing guide', text: 'Our sizes run true to size. Each product page has a size chart.', source: 'Help Articles' },
]
const ctx: PreviewContext = { shoppingEnabled: true, trackingEnabled: true, entries }

test('a knowledge-base question is answered from the matching entry, with its source', () => {
  const reply = respond('What is your return policy?', ctx)
  assert.equal(reply.kind, 'answer')
  assert.ok(reply.kind === 'answer' && reply.source === 'FAQ' && reply.text.includes('30 days'))
})

test('word forms still match: "ship" finds Shipping, "refunded" finds Returns and refunds', () => {
  assert.equal(bestEntry('Do you ship overseas?', entries)?.title, 'Shipping and delivery')
  assert.equal(bestEntry('When will I be refunded?', entries)?.title, 'Returns and refunds')
  assert.equal(bestEntry('do your shoes run small, what size?', entries)?.title, 'Sizing guide')
})

test('order and invoice questions never get an invented result', () => {
  for (const q of ['Where is my order?', 'Track my order', 'Email invoice']) {
    const reply = respond(q, ctx)
    assert.equal(reply.kind, 'live', q)
    assert.match(reply.text, /live store/)
  }
})

test('an order question says so when order tracking is off', () => {
  const reply = respond('Track my order', { ...ctx, trackingEnabled: false })
  assert.equal(reply.kind, 'live')
  assert.match(reply.text, /turned off/)
})

test('shopping questions show products only while the shopping assistant is on', () => {
  assert.equal(respond('Shop for items', ctx).kind, 'products')
  assert.equal(respond('looking for red boots size 11', ctx).kind, 'products')
  assert.notEqual(respond('Shop for items', { ...ctx, shoppingEnabled: false }).kind, 'products')
})

test('an unmatched question admits it and names what it can answer', () => {
  const reply = respond('Do you have a loyalty programme?', ctx)
  assert.equal(reply.kind, 'unknown')
  assert.match(reply.text, /Shipping and delivery/)
})

test('with no knowledge base it says there is nothing to answer from', () => {
  const reply = respond('What is your return policy?', { ...ctx, entries: [] })
  assert.equal(reply.kind, 'unknown')
  assert.match(reply.text, /knowledge base/)
})

test('stop-word-only messages do not match anything', () => {
  assert.equal(bestEntry('what are you', entries), null)
})
