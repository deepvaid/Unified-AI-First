import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geminiHistory, makeId, type HistoryMessage } from '../../src/davinci/conversation.ts'

const msg = (id: string, role: 'user' | 'assistant', text: string): HistoryMessage => ({ id, role, text })

test('history leaves out only the turn being answered', () => {
  const thread = [msg('u1', 'user', 'Show revenue'), msg('a1', 'assistant', 'Revenue is up'), msg('u2', 'user', 'And orders?')]
  assert.deepEqual(geminiHistory(thread, 'u2'), [
    { role: 'user', text: 'Show revenue' },
    { role: 'assistant', text: 'Revenue is up' },
  ])
})

test('a queued follow-up keeps the previous answer and never sends its own question twice', () => {
  // u2 was queued behind u1's reply: the transcript reads u1, u2, a1 — the current turn is NOT last.
  const thread = [msg('u1', 'user', 'Show revenue'), msg('u2', 'user', 'And orders?'), msg('a1', 'assistant', 'Revenue is up')]
  const history = geminiHistory(thread, 'u2')
  assert.deepEqual(history.map((turn) => turn.text), ['Show revenue', 'Revenue is up'])
})

test('a pause notice stays in the history', () => {
  const thread = [msg('u1', 'user', 'How do I pick a segment?'), msg('a0', 'assistant', 'Campaign setup is paused'), msg('u2', 'user', 'Ok')]
  assert.equal(geminiHistory(thread, 'u1').length, 2)
})

test('empty messages are dropped and the window is the most recent turns', () => {
  const many = Array.from({ length: 10 }, (_, i) => msg(`m${i}`, i % 2 ? 'assistant' : 'user', `turn ${i}`))
  const history = geminiHistory([...many, msg('blank', 'assistant', '  ')], null, 4)
  assert.deepEqual(history.map((turn) => turn.text), ['turn 6', 'turn 7', 'turn 8', 'turn 9'])
})

test('ids are unique even when created in the same millisecond', () => {
  const ids = new Set(Array.from({ length: 200 }, () => makeId('a')))
  assert.equal(ids.size, 200)
})
