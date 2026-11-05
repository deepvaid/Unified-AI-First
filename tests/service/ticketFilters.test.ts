import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  inInbox,
  isBuiltInView,
  isOpen,
  matchesBuiltInView,
  matchesFilters,
  matchesSearch,
} from '../../src/service/ticketFilters.ts'
import type { Ticket, TicketFilters } from '../../src/stores/useTickets.ts'

const filters = (patch: Partial<TicketFilters> = {}): TicketFilters => ({
  status: [], priority: [], channel: [], type: [], group: [], agent: '', contact: '', tags: [],
  createdFrom: '', createdTo: '', readStatus: '', ...patch,
})

const ticket = (patch: Partial<Ticket> = {}): Ticket => ({
  id: 1, number: '#1', subject: 'Where is my refund?', customer: 'Sofia Thompson', customerEmail: 'sofia@email.com',
  customerPhone: '', status: 'Open', priority: 'Medium', channel: 'Email', type: 'Payment', assignee: 'Chris Parker',
  group: 'General', inboxId: 'orders', tags: ['Refund'], unread: true, folder: 'inbox',
  createdAt: '2026-08-31T07:02:00Z', updatedAt: '2026-08-31T07:02:00Z',
  thread: [{ id: 1, author: 'Sofia Thompson', role: 'customer', action: 'reported via Email', time: '2026-08-31T07:02:00Z', body: 'I returned my order ten days ago' }],
  activities: [], linkedOrderId: null, ...patch,
})

test('inbox scope: all, or one inbox', () => {
  assert.equal(inInbox(ticket(), 'all'), true)
  assert.equal(inInbox(ticket(), 'orders'), true)
  assert.equal(inInbox(ticket(), 'support'), false)
})

test('built-in views', () => {
  assert.equal(isBuiltInView('My Tickets'), true)
  assert.equal(isBuiltInView('VIP refunds'), false)
  assert.equal(matchesBuiltInView(ticket(), 'All Tickets', 'Deepak Vaidya'), true)
  assert.equal(matchesBuiltInView(ticket(), 'My Tickets', 'Chris Parker'), true)
  assert.equal(matchesBuiltInView(ticket(), 'My Tickets', 'Deepak Vaidya'), false)
  assert.equal(matchesBuiltInView(ticket({ priority: 'High' }), 'High Priority Tickets', 'x'), true)
})

test('filters combine, and status can be left to the tabs', () => {
  const t = ticket()
  assert.equal(matchesFilters(t, filters()), true)
  assert.equal(matchesFilters(t, filters({ tags: ['VIP', 'Refund'] })), true, 'any listed tag matches')
  assert.equal(matchesFilters(t, filters({ tags: ['VIP'] })), false)
  assert.equal(matchesFilters(t, filters({ priority: ['Medium'], type: ['Payment'] })), true)
  assert.equal(matchesFilters(t, filters({ status: ['Closed'] })), false)
  assert.equal(matchesFilters(t, filters({ status: ['Closed'] }), { status: false }), true)
  assert.equal(matchesFilters(t, filters({ readStatus: 'Read' })), false)
  assert.equal(matchesFilters(t, filters({ createdTo: '2026-08-31' })), true, 'the end date is inclusive')
  assert.equal(matchesFilters(t, filters({ createdFrom: '2026-09-01' })), false)
  assert.equal(matchesFilters(ticket({ channel: '' }), filters({ channel: ['Email'] })), false)
})

test('search covers number, subject, customer, email and message bodies', () => {
  const t = ticket()
  assert.equal(matchesSearch(t, ''), true)
  assert.equal(matchesSearch(t, '  REFUND '), true)
  assert.equal(matchesSearch(t, 'sofia@'), true)
  assert.equal(matchesSearch(t, 'ten days'), true)
  assert.equal(matchesSearch(t, 'exchange'), false)
})

test('open means anything not closed', () => {
  assert.equal(isOpen(ticket({ status: 'On Hold' })), true)
  assert.equal(isOpen(ticket({ status: 'Closed' })), false)
})
