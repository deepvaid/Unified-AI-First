// The questions the Vitaheal assistant is checked on, in every kind of context:
// signed in or not, with a campaign running or not, with shopping or order
// tracking turned off. wellnessUnchanged.test.ts runs it and compares every turn
// with fixtures/wellness-replies.json, the answers the assistant gave before the
// apparel profile existed, so the wellness store cannot change by accident.
// Not a test file itself: the glob runs `*.test.ts` only.

import { createHash } from 'node:crypto'
import type { AssistantContext, AssistantOrder, AssistantState, AssistantSubscription, AssistantTurn } from '../../src/chatbot/storeAssistant.ts'
import { VITAHEAL_CHATBOT, vitahealProducts } from '../../src/storefront/vitahealDemo.ts'

type Reply = (message: string, ctx: AssistantContext, state?: AssistantState) => AssistantTurn

const LINNEA = 'linnea.berg@example.com'

const order = (over: Partial<AssistantOrder> = {}): AssistantOrder => ({
  id: 900007, number: '#20007', email: LINNEA, date: '2026-11-18', status: 'Processing', fulfillment: 'Not Ready',
  tracking: null, items: [{ name: 'Vitaheal Electrolytes', qty: 1 }], total: '585,90 kr', ...over,
})
const subscription = (over: Partial<AssistantSubscription> = {}): AssistantSubscription => ({
  id: 'sub-1009', number: 'S-1009', email: LINNEA, product: 'Vitaheal Electrolytes', plan: '3-month supply',
  status: 'Active', nextChargeOn: '2027-02-18', price: '585,90 kr', canSkip: true, ...over,
})

const base: AssistantContext = {
  email: null,
  orders: [order(), order({ id: 900001, number: '#20001', date: '2026-11-17', fulfillment: 'Shipped', tracking: '1Z999', items: [{ name: 'Unwind', qty: 2 }] })],
  subscriptions: [subscription(), subscription({ id: 'sub-2', number: 'S-2', status: 'Paused', product: 'Unwind' })],
  products: vitahealProducts().map((p) => ({ id: p.id, name: p.name, subtitle: p.detail!.subtitle, description: p.detail!.description, collections: p.collections })),
  entries: VITAHEAL_CHATBOT.knowledgeSources!.flatMap((s) => (s.entries ?? []).map((e) => ({ ...e, source: s.name }))),
  shoppingEnabled: true,
  trackingEnabled: true,
  demo: true,
}

const CONTEXTS: Record<string, AssistantContext> = {
  guest: base,
  signedIn: { ...base, email: LINNEA },
  promotion: { ...base, email: LINNEA, promotion: 'Winter wellness week: 15% off everything with code WINTER15' },
  nothingYet: { ...base, email: LINNEA, orders: [], subscriptions: [] },
  shoppingOff: { ...base, shoppingEnabled: false },
  trackingOff: { ...base, email: LINNEA, trackingEnabled: false },
  notDemo: { ...base, demo: false },
  wellnessNamed: { ...base, profile: 'wellness' },
}

/** Every message, alone. Includes the clothing store's questions, which a wellness store must answer as it always did. */
const MESSAGES = [
  'Hi', 'Hello there', 'hej', 'Good morning', 'Thanks!', 'thank you so much', 'asdf qwerty', '',
  'Where is my order?', 'Track order 20007', 'order #20001', '#99999', '20007', `Where is order #20007? My email is ${LINNEA}`,
  'When is my next delivery?', 'I want to skip my next delivery', 'How do I cancel my subscription?', 'pause my subscription please',
  'when does my subscription renew?', 'my subscription', 'How do subscriptions work?', 'Can I cancel anytime?', 'Do you offer a subscription?',
  'I can’t sleep', 'Help me sleep better', 'I feel stressed in the evenings', 'I need more focus at work', 'I get cramps when I train',
  'something for my skin', 'I want to age well', 'my partner says I snore', 'something for women', 'What do you recommend?',
  'what should I buy?', 'Which one is best for running?', 'Can I take this while pregnant?', 'Is Clear Focus safe with my blood pressure medication?',
  'Will Unwind cure my insomnia?', 'Can my child take it?', 'I am allergic to nuts', 'Do you have a discount code?', 'any offers right now?',
  'is anything on sale?', 'What is your return policy?', 'Can I return something from the sale?', 'Do you ship to Norway?', 'Is shipping free?',
  'How long does delivery take?', 'Is Unwind covered by a guarantee?', 'Can I talk to a human?', 'speak to someone please',
  // A clothing store's questions, asked of the wellness store.
  'What size should I get in the merino sweater?', 'does the car coat run large', 'I’m 5’6 and 140 lb', 'between M and L', 'Which size should I get?',
  'can I wash the merino', 'is the linen see-through', 'How do I wash merino?', 'I’m allergic to wool', 'a warm coat under $250', 'gift for him',
  'What’s on sale?', 'How do returns work?', 'bust 36 waist 30', 'I’m usually a medium. Will it fit?', 'anything under 300 kr?',
]

/** Whole conversations: each message is answered with the state the last one left. */
const CHATS: Array<[string, string[]]> = [
  ['guest', ['Where is my order?', `it is ${LINNEA}`, '1234', '482913', 'when is my next delivery?']],
  ['guest', ['Where is my order?', 'nobody@example.com', '111111']],
  ['guest', ['Track order 20007', LINNEA]],
  ['guest', ['order #99999', LINNEA]],
  ['guest', ['When is my next delivery?', LINNEA, '123456', 'skip it']],
  ['guest', ['Where is my order?', 'Help me sleep better']],
  ['guest', ['Where is my order?', 'not an email @']],
  ['notDemo', ['Where is my order?', LINNEA]],
  ['signedIn', ['What size should I get in the merino sweater?', 'between M and L']],
]

/** Every turn of the corpus, keyed by context and message (or chat). */
export function runCorpus(reply: Reply): Record<string, AssistantTurn> {
  const out: Record<string, AssistantTurn> = {}
  for (const [name, ctx] of Object.entries(CONTEXTS)) {
    for (const message of MESSAGES) out[`${name} · ${message}`] = reply(message, ctx)
  }
  CHATS.forEach(([name, messages], i) => {
    let turn = reply(messages[0]!, CONTEXTS[name]!)
    out[`chat ${i} · ${messages[0]}`] = turn
    messages.slice(1).forEach((message, j) => {
      turn = reply(message, CONTEXTS[name]!, turn.state)
      out[`chat ${i}.${j + 1} · ${message}`] = turn
    })
  })
  return out
}

/** A turn as the fixture keeps it: what it said, readable, and a fingerprint of everything else. */
export function fingerprint(turn: AssistantTurn): { says: string[]; sha: string } {
  return { says: turn.replies.map((r) => r.text), sha: createHash('sha256').update(JSON.stringify(turn)).digest('hex').slice(0, 16) }
}
