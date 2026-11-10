import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SLA_MIN_MINUTES,
  fillTags,
  formatSla,
  fromMinutes,
  inboxReadiness,
  inboxReplyState,
  isDuplicateName,
  slaError,
  slugify,
  toMinutes,
  uniqueSlug,
  withoutEmail,
  type SupportEmail,
} from '../../src/service/model.ts'

const email = (id: string, status: SupportEmail['status'], isDefault = false, inboxId = 'support'): SupportEmail => ({
  id, inboxId, name: id, address: `${id}@example.com`, status, isDefault,
})

test('inbox ids are URL-safe and never collide', () => {
  assert.equal(slugify('Orders & Returns'), 'orders-returns')
  assert.equal(slugify('  Café  Support '), 'cafe-support')
  assert.equal(uniqueSlug('Orders', ['support']), 'orders')
  assert.equal(uniqueSlug('Orders', ['orders', 'orders-2']), 'orders-3')
  assert.equal(uniqueSlug('!!!', []), 'item', 'a name with no letters still gets an id')
})

test('duplicate names ignore case, padding and the item being edited', () => {
  const items = [{ id: 'a', name: 'Refund' }, { id: 'b', name: 'VIP' }]
  assert.equal(isDuplicateName(items, '  refund '), true)
  assert.equal(isDuplicateName(items, 'Refund', 'a'), false, 'renaming an item to itself is fine')
  assert.equal(isDuplicateName(items, ''), false, 'an empty name is a required-field error, not a duplicate')
})

test('SLA breach time has a 70-minute floor, and no SLA is allowed', () => {
  assert.equal(slaError(null), '')
  assert.equal(slaError(SLA_MIN_MINUTES), '')
  assert.match(slaError(SLA_MIN_MINUTES - 1), /at least 70 minutes/)
  assert.match(slaError(0), /Enter a breach time/)
  assert.match(slaError(Number.NaN), /Enter a breach time/)
})

test('SLA values round-trip through the friendliest unit', () => {
  assert.equal(toMinutes(4, 'hours'), 240)
  assert.equal(toMinutes(90, 'minutes'), 90)
  assert.deepEqual(fromMinutes(240), { value: 4, unit: 'hours' })
  assert.deepEqual(fromMinutes(90), { value: 90, unit: 'minutes' })
  assert.equal(formatSla(null), 'No SLA')
  assert.equal(formatSla(70), '1 h 10 min')
  assert.equal(formatSla(45), '45 min')
  assert.equal(formatSla(240), '4 h')
})

test('an inbox can only reply through a verified address', () => {
  assert.deepEqual(inboxReplyState([]), { canReply: false, verified: 0, pending: 0 })
  assert.deepEqual(inboxReplyState([email('a', 'Pending')]), { canReply: false, verified: 0, pending: 1 })
  assert.equal(inboxReplyState([email('a', 'Pending'), email('b', 'Verified')]).canReply, true)
  assert.equal(inboxReadiness([]), 'Needs setup')
  assert.equal(inboxReadiness([email('a', 'Pending')]), 'Pending')
  assert.equal(inboxReadiness([email('a', 'Verified')]), 'Live')
})

test('removing the default address promotes a verified one in the same inbox', () => {
  const emails = [
    email('a', 'Verified', true),
    email('b', 'Pending'),
    email('c', 'Verified'),
    email('x', 'Verified', true, 'orders'),
  ]
  const rest = withoutEmail(emails, 'a')
  assert.deepEqual(rest.map(e => e.id), ['b', 'c', 'x'])
  assert.equal(rest.find(e => e.id === 'c')?.isDefault, true, 'the verified address wins over the pending one')
  assert.equal(rest.find(e => e.id === 'x')?.isDefault, true, 'another inbox keeps its own default')
  assert.equal(emails[0]?.isDefault, true, 'the input is not mutated')
})

test('removing the only address leaves no default to promote', () => {
  assert.deepEqual(withoutEmail([email('a', 'Pending', true)], 'a'), [])
})

test('template tags fill known keys and leave typos visible', () => {
  const values = { CONTACT_FIRST_NAME: 'Sofia', TICKET_NUMBER: '#1512' }
  assert.equal(fillTags('Hi {{CONTACT_FIRST_NAME}}, re {{ TICKET_NUMBER }}', values), 'Hi Sofia, re #1512')
  assert.equal(fillTags('Hi {{CONTACT_FRIST_NAME}}', values), 'Hi {{CONTACT_FRIST_NAME}}')
})
