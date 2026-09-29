import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HISTORY_LIMITS,
  buildRecord,
  fitToBudget,
  groupConversations,
  parseHistory,
  subtitleFor,
  titleFrom,
  upsert,
  type HistoryConversation,
} from '../../src/davinci/history.ts'
import type { ChatMessage } from '../../src/stores/useCopilot.ts'

const NOW = new Date(2026, 8, 29, 15, 0, 0).getTime() // 29 Sep 2026, local
const HOUR = 3_600_000
const DAY = 24 * HOUR

const user = (id: string, text: string): ChatMessage => ({ id, role: 'user', text })
const bot = (id: string, text: string, componentData?: ChatMessage['componentData']): ChatMessage => ({ id, role: 'assistant', text, componentData })

const draftSet = (added: Array<{ widgetId: string } | null> = []): NonNullable<ChatMessage['componentData']>[number] => ({
  type: 'widgetDraftSet',
  props: {
    drafts: [{ type: 'kpi', title: 'Orders', dataSource: 'commerce', metricId: 'commerce_orders', dashboardId: 'd1' }],
    rationale: 'why',
    conversationId: 'c1',
    added: added.map((entry) => (entry ? { title: 'Orders', dashboardName: 'Overview', widgetId: entry.widgetId, dashboardId: 'd1', accountId: 'a1' } : null)),
  } as never,
})

const record = (over: Partial<HistoryConversation> & { id: string }): HistoryConversation => ({
  title: 'Show revenue',
  icon: 'sparkles',
  createdAt: NOW - HOUR,
  updatedAt: NOW - HOUR,
  draftedCount: 0,
  addedCount: 0,
  questions: 1,
  messages: [user('u1', 'Show revenue')],
  ...over,
})

test('nothing is recorded until the merchant has said something', () => {
  assert.equal(buildRecord('c1', [], undefined, NOW), null)
  assert.equal(buildRecord('c1', [bot('a1', 'Hi, I am Da Vinci')], undefined, NOW), null)
})

test('a conversation that never drafted a widget is still recorded, titled by its first question', () => {
  const built = buildRecord('c1', [user('u1', "How's revenue this week?"), bot('a1', 'Revenue is up 8%.')], undefined, NOW)
  assert.ok(built)
  assert.equal(built.id, 'c1')
  assert.equal(built.title, "How's revenue this week?")
  assert.equal(built.icon, 'shopping-cart')
  assert.equal(built.draftedCount, 0)
  assert.equal(subtitleFor(built), '1 question')
})

test('titles are one short line', () => {
  assert.equal(titleFrom([user('u1', 'Show   me\n revenue')]), 'Show me revenue')
  const long = titleFrom([user('u1', 'x'.repeat(200))])
  assert.equal(long.length, 60)
  assert.ok(long.endsWith('…'))
})

test('drafted and added widgets are counted from the transcript', () => {
  const thread = [user('u1', 'Show orders'), bot('a1', 'Drafted', [draftSet([null])]), user('u2', 'Add it'), bot('a2', 'Added', [draftSet([{ widgetId: 'w1' }])])]
  const built = buildRecord('c1', thread, undefined, NOW)!
  assert.equal(built.draftedCount, 2)
  assert.equal(built.addedCount, 1)
  assert.equal(subtitleFor(built), '1 widget added')
  assert.equal(subtitleFor({ ...built, addedCount: 0 }), '2 widgets drafted')
})

test('a saved chat chart counts as an added widget', () => {
  const chart = { type: 'chart', props: { labels: [], series: [], savedTo: { widgetId: 'w1' } } }
  const thread = [user('u1', 'Revenue'), bot('a1', 'Here', [{ type: 'intentCards', props: { cards: [chart] } } as never])]
  assert.equal(buildRecord('c1', thread, undefined, NOW)!.addedCount, 1)
})

test('only the newest 40 messages are kept, and the title survives the cut', () => {
  const thread: ChatMessage[] = []
  for (let i = 0; i < 30; i += 1) thread.push(user(`u${i}`, i === 0 ? 'The very first question' : `q${i}`), bot(`a${i}`, `answer ${i}`))
  const built = buildRecord('c1', thread, undefined, NOW)!
  assert.equal(built.messages.length, HISTORY_LIMITS.messages)
  assert.equal(built.messages.at(-1)?.text, 'answer 29')
  assert.equal(built.title, 'The very first question')
  // Continuing a restored (capped) conversation keeps the title it was recorded with.
  const continued = buildRecord('c1', [...built.messages, user('u30', 'one more')], built, NOW + 1)!
  assert.equal(continued.title, 'The very first question')
})

test('counts never go backwards when a capped transcript is continued', () => {
  const first = buildRecord('c1', [user('u1', 'Orders'), bot('a1', 'Drafted', [draftSet([{ widgetId: 'w1' }])])], undefined, NOW)!
  const continued = buildRecord('c1', [user('u9', 'Anything else?'), bot('a9', 'No.')], first, NOW + 1)!
  assert.equal(continued.draftedCount, 1)
  assert.equal(continued.addedCount, 1)
  assert.equal(continued.questions, 1)
})

test('guided-flow cards are not kept: their buttons would act on a session that has moved on', () => {
  const setup = { type: 'setupOnboarding', props: { kind: 'goal', title: 'Pick a goal', step: 1, totalSteps: 3 } }
  const thread = [user('u1', 'Help me set up'), bot('a1', 'Pick a goal', [setup as never]), bot('a2', 'Two more', [draftSet(), setup as never])]
  const built = buildRecord('c1', thread, undefined, NOW)!
  assert.equal(built.messages[1]?.componentData, undefined)
  assert.equal(built.messages[1]?.text, 'Pick a goal')
  assert.deepEqual(built.messages[2]?.componentData?.map((component) => component.type), ['widgetDraftSet'])
})

test('a record is a snapshot: later changes to the live thread do not leak into it', () => {
  const live = [user('u1', 'Orders'), bot('a1', 'Drafted', [draftSet([null])])]
  const first = buildRecord('c1', live, undefined, NOW)!
  ;(live[1]!.componentData![0]!.props as { added: unknown[] }).added = [{ widgetId: 'w1' }]
  assert.equal((first.messages[1]!.componentData![0]!.props as { added: unknown[] }).added[0], null)
  // …and the change is noticed the next time it is built.
  const second = buildRecord('c1', live, first, NOW + 5)!
  assert.notEqual(second, first)
  assert.equal(second.updatedAt, NOW + 5)
  assert.equal(second.createdAt, NOW)
})

test('an unchanged transcript comes back untouched — opening a conversation does not reorder it', () => {
  const thread = [user('u1', 'Orders'), bot('a1', 'Here you go')]
  const first = buildRecord('c1', thread, undefined, NOW)!
  assert.equal(buildRecord('c1', thread, first, NOW + DAY), first)
})

test('the list is newest activity first and holds at most 30 conversations', () => {
  let list: HistoryConversation[] = []
  for (let i = 0; i < 35; i += 1) list = upsert(list, record({ id: `c${i}`, updatedAt: NOW - (35 - i) * HOUR }))
  assert.equal(list.length, HISTORY_LIMITS.conversations)
  assert.equal(list[0]?.id, 'c34')
  assert.ok(!list.some((conversation) => conversation.id === 'c0'))
  // Updating an existing conversation moves it to the top and never duplicates it.
  list = upsert(list, record({ id: 'c10', updatedAt: NOW }))
  assert.equal(list[0]?.id, 'c10')
  assert.equal(list.filter((conversation) => conversation.id === 'c10').length, 1)
})

test('over budget, the oldest conversations go first and the live one goes last', () => {
  const big = (id: string, at: number) => record({ id, updatedAt: at, messages: [user('u1', 'x'.repeat(3000))] })
  const list = [big('live', NOW - 3 * DAY), big('b', NOW - 4 * DAY), big('c', NOW - 5 * DAY)].sort((a, b) => b.updatedAt - a.updatedAt)
  const fitted = fitToBudget(list, 7000, 'live')
  assert.deepEqual(fitted.map((conversation) => conversation.id), ['live', 'b'])
  assert.deepEqual(fitToBudget(list, 4000, 'live').map((conversation) => conversation.id), ['live'])
})

test('a live conversation too big on its own is trimmed from the front, then dropped if it still cannot fit', () => {
  const messages = Array.from({ length: 10 }, (_, i) => user(`u${i}`, `${i}`.repeat(2000)))
  const alone = record({ id: 'live', messages })
  const trimmed = fitToBudget([alone], 9000, 'live')
  assert.equal(trimmed.length, 1)
  assert.ok(trimmed[0]!.messages.length < 10)
  assert.equal(trimmed[0]!.messages.at(-1)?.id, 'u9')
  assert.deepEqual(fitToBudget([alone], 100, 'live'), [])
})

test('a stored list is trusted only where it is well-formed', () => {
  assert.deepEqual(parseHistory(null), [])
  assert.deepEqual(parseHistory('not json'), [])
  assert.deepEqual(parseHistory('{"a":1}'), [])
  const good = record({ id: 'good', updatedAt: NOW })
  const older = record({ id: 'older', updatedAt: NOW - DAY })
  const raw = JSON.stringify([
    older,
    { id: 'no-messages', title: 'x', createdAt: 1, updatedAt: 1 },
    { ...good, messages: [{ id: 'm', role: 'system', text: 'x' }] },
    { ...good, messages: [{ id: 'm', role: 'user', text: 'x', componentData: [{ type: 'mystery', props: {} }] }] },
    null,
    good,
  ])
  assert.deepEqual(parseHistory(raw).map((conversation) => conversation.id), ['good', 'older'])
})

test('an old row missing its counters still loads', () => {
  const { icon: _icon, draftedCount: _d, addedCount: _a, questions: _q, ...bare } = record({ id: 'c1' })
  const [loaded] = parseHistory(JSON.stringify([bare]))
  assert.equal(loaded?.icon, 'sparkles')
  assert.equal(loaded?.questions, 0)
})

test('rows group by the local day of their last activity', () => {
  const list = [
    record({ id: 'today', updatedAt: NOW - HOUR }),
    record({ id: 'yesterday', updatedAt: new Date(2026, 8, 28, 9, 0).getTime() }),
    record({ id: 'week', updatedAt: new Date(2026, 8, 24, 9, 0).getTime() }),
    record({ id: 'older', updatedAt: new Date(2026, 8, 1, 9, 0).getTime() }),
  ]
  const groups = groupConversations(list, new Date(NOW))
  assert.deepEqual(groups.today.map((c) => c.id), ['today'])
  assert.deepEqual(groups.yesterday.map((c) => c.id), ['yesterday'])
  assert.deepEqual(groups.lastWeek.map((c) => c.id), ['week'])
  assert.deepEqual(groups.older.map((c) => c.id), ['older'])
})
