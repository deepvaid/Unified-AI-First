import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canManageNote, pinnedNotes } from '../../src/service/notes.ts'
import type { TicketMessage } from '../../src/stores/useTickets.ts'

const message = (patch: Partial<TicketMessage> = {}): TicketMessage => ({
  id: 1, author: 'Deepak Vaidya', role: 'note', action: 'left an internal note',
  time: '2026-08-31T09:00:00Z', body: 'Refund approved by finance.', ...patch,
})

test('only its author manages a note, and only notes are managed', () => {
  assert.equal(canManageNote(message(), 'Deepak Vaidya'), true)
  assert.equal(canManageNote(message(), 'Chris Parker'), false, 'another agent can read and pin, not edit')
  assert.equal(canManageNote(message({ role: 'agent' }), 'Deepak Vaidya'), false, 'a sent reply is not a note')
})

test('pinned notes come out oldest first, and only notes count', () => {
  const thread = [
    message({ id: 3, pinned: true, time: '2026-09-02T09:00:00Z' }),
    message({ id: 1, pinned: false }),
    message({ id: 2, pinned: true, time: '2026-09-01T09:00:00Z' }),
    message({ id: 4, role: 'agent', pinned: true }),
  ]
  assert.deepEqual(pinnedNotes(thread).map(m => m.id), [2, 3])
  assert.deepEqual(pinnedNotes([message()]), [])
})
