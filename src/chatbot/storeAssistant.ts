/**
 * The assistant on a store's own pages: what it understands and what it answers.
 *
 * Scripted rules, not a language model: it recognises a question by its wording
 * and answers from the store's real orders, subscriptions, products and pages,
 * which the chat widget hands in as plain data. Nothing leaves the browser, and
 * the same question always gets the same answer. When it does not understand, it
 * says what it can help with instead of guessing.
 *
 * Pure, with relative `.ts` imports only, so `npm run test:chatbot` runs a whole
 * conversation in Node. The builder's preview keeps its own stand-in
 * (previewResponder.ts), which this reuses for knowledge-base answers.
 */

import { dayLabel } from '../subscriptions/contracts.ts'
import type { ContractStatus } from '../subscriptions/contracts.ts'
import { bestEntry, hits, keywords } from './previewResponder.ts'
import type { PreviewEntry } from './previewResponder.ts'

export interface AssistantProduct {
  id: number
  name: string
  subtitle: string
  description: string
  collections: string[]
}

export interface AssistantOrder {
  id: number
  /** "#20007" */
  number: string
  email: string
  /** "YYYY-MM-DD" */
  date: string
  status: string
  fulfillment: string
  tracking: string | null
  items: Array<{ name: string; qty: number }>
  /** As the store writes it: "585,90 kr". */
  total: string
}

export interface AssistantSubscription {
  id: string
  number: string
  email: string
  product: string
  plan: string
  status: ContractStatus
  nextChargeOn: string | null
  /** Per delivery, as the store writes it. */
  price: string
  /** The next delivery can be skipped from the chat. */
  canSkip: boolean
}

export interface AssistantContext {
  /** The shopper already signed in on the store, if any. */
  email: string | null
  orders: AssistantOrder[]
  subscriptions: AssistantSubscription[]
  products: AssistantProduct[]
  /** The chatbot's knowledge base: enabled, active sources only. An entry may name the page it came from. */
  entries: Array<PreviewEntry & { url?: string }>
  shoppingEnabled: boolean
  trackingEnabled: boolean
  /** A store shown to prospects says so where the mocked code is asked for. */
  demo: boolean
  /** The message of the store's running campaign ("15% off with code WINTER15"), or empty when none runs. */
  promotion?: string
}

/** A question waiting for the shopper to say who they are. */
export interface AssistantPending {
  step: 'email' | 'code'
  /** The question to answer once they have. */
  question: string
  email?: string
  /** An order number with its email is enough; anything else needs the code too. */
  needsCode: boolean
}

export interface AssistantState {
  pending: AssistantPending | null
  /** Who the shopper confirmed they are, in this chat. */
  email: string | null
}

export const NEW_CONVERSATION: AssistantState = { pending: null, email: null }

export type AssistantReply =
  | { kind: 'text'; text: string; link?: { label: string; href: string } }
  | { kind: 'order'; text: string; order: AssistantOrder }
  | { kind: 'subscriptions'; text: string; subscriptions: AssistantSubscription[] }
  | { kind: 'products'; text: string; productIds: number[] }
  | { kind: 'answer'; text: string; source: string; link?: { label: string; href: string } }

export interface AssistantTurn {
  replies: AssistantReply[]
  state: AssistantState
  /** Set on the turn the shopper confirmed their email: the store signs them in. */
  signedIn?: string
  /** Offer the quick prompts again: the assistant did not have a specific answer. */
  offerPrompts: boolean
}

const CONTACT = { label: 'Contact us', href: '/page/contact' }
const ACCOUNT = { label: 'Manage subscription', href: '/account' }

// ── What a message is about ──────────────────────────────────────────────────

const MEDICAL = /\b(pregnan\w*|breast\s?feed\w*|nursing|medication|medicines?|prescription|antidepress\w*|blood pressure|diabet\w*|disease|illness|diagnos\w*|allerg\w*|side effects?|doctor|cure|treat(s|ment)?|my (child|kid|baby|son|daughter)|under 18)\b/
const SUBSCRIPTION = /\b(subscription|subscrib\w*|next (delivery|charge|order|shipment|box)|renew\w*|skip\w*|paus\w*|resum\w*|my plan|change (my )?plan)\b/
const ORDER = /\b(orders?|track\w*|parcel|package|shipment|shipped|dispatch\w*|delivery status|where('s| is) my|has it (shipped|arrived))\b/
const ORDER_NUMBER = /#\s?(\d{4,6})\b|\b(?:order|number)\s*(?:no\.?|number)?\s*#?\s?(\d{4,6})\b|^\s*(\d{5,6})\s*$/
const EMAIL = /[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}/i
const HUMAN = /\b(human|agent|real person|someone|speak to|talk to|call (me|you)|support team|customer service)\b/
const GREETING = /^\s*(hi|hello|hey|hej|good (morning|afternoon|evening))\b/
const THANKS = /\b(thanks|thank you|thx|tack|cheers|great,? thanks)\b/
/** A question about how subscriptions work in general, not about the shopper's own: the store's pages answer it. */
const GENERAL = /\b(how (do|does)|what (is|are)|do you (offer|have)|can i (subscribe|cancel|pause|skip)|is there)\b/
/** Words of a question about how the store works: its pages answer it, even when it names a need or a product. */
const POLICY = /\b(guarantee\w*|refund\w*|returns?|return (it|policy)|shipping|ship to|deliver(y|ies) (time|cost)|policy|vat|payment methods?)\b/
const PROMOTION = /\b(discounts?|coupons?|promo(tion)?s?|vouchers?|on sale|sales?|deals?|(special|any|current) offers?)\b/
const SHOPPING = /\b(recommend\w*|suggest\w*|which (product|one)|what (should|can|do) i (take|buy|use|try)|looking for|help me (choose|pick|find)|what do you (sell|have)|best (product|supplement))\b/

/**
 * Everyday words for a wellness need, and the words products use for it. The
 * need is then matched against each product's own name, subtitle, description
 * and collections, so a product the merchant adds can be suggested too.
 */
const NEEDS: Array<{ label: string; says: RegExp; means: string[] }> = [
  { label: 'better sleep', says: /\b(sleep\w*|insomnia|awake|restless|bedtime|wind(ing)? down|at night)\b/, means: ['sleep', 'bed', 'evening'] },
  { label: 'feeling calmer', says: /\b(stress\w*|anxious|anxiety|calm\w*|relax\w*|overwhelmed)\b/, means: ['calm', 'winding'] },
  { label: 'focus', says: /\b(focus\w*|concentrat\w*|brain fog|study\w*|sharp\w*|alert\w*|productiv\w*|distract\w*)\b/, means: ['focus'] },
  { label: 'steady energy', says: /\b(tired\w*|fatigue\w*|exhausted|energy|sluggish|afternoon dip|worn out)\b/, means: ['energy'] },
  { label: 'hydration and training', says: /\b(hydrat\w*|dehydrat\w*|thirst\w*|cramps?|sweat\w*|electrolytes?|run(ning|ner)?|workouts?|train\w*|gym|sports?|exercis\w*|cycling|marathon)\b/, means: ['hydrat', 'train', 'sport'] },
  { label: 'skin, hair and joints', says: /\b(skin|hair|nails?|joints?|knees?|collagen|glow\w*|wrinkles?)\b/, means: ['skin', 'hair', 'joint', 'collagen'] },
  { label: 'healthy ageing', says: /\b(age(ing)?|aging|longevity|getting older|cellular|nad)\b/, means: ['longevity', 'cellular', 'ageing'] },
  { label: 'easier breathing', says: /\b(snor\w*|breath\w*|blocked nose|stuffy|congest\w*|nasal|nose)\b/, means: ['breath', 'nose'] },
  { label: 'women’s daily balance', says: /\b(wom[ae]n\w*|cycle|period|hormon\w*|menopause|pms)\b/, means: ['women', 'month'] },
]

/** The products that fit a need, best first: at most three, and only those close to the best match. */
export function productsFor(message: string, products: AssistantProduct[]): { label: string | null; productIds: number[] } {
  const text = message.toLowerCase()
  const needs = NEEDS.filter((need) => need.says.test(text))
  const tokens = needs.length ? needs.flatMap((need) => need.means) : keywords(message)
  if (!tokens.length) return { label: null, productIds: [] }
  const scored = products
    .map((product, index) => ({
      id: product.id,
      index,
      score: hits(tokens, product.name) * 3 + hits(tokens, product.subtitle) * 3 + hits(tokens, product.collections.join(' ')) * 2 + hits(tokens, product.description),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
  const best = scored[0]?.score ?? 0
  return {
    label: needs.length ? needs.map((need) => need.label).join(' and ') : null,
    productIds: scored.filter((p) => p.score * 2 >= best).slice(0, 3).map((p) => p.id),
  }
}

// ── Answers ──────────────────────────────────────────────────────────────────

function orderNumberIn(message: string): string | null {
  const match = ORDER_NUMBER.exec(message)
  const digits = match?.[1] ?? match?.[2] ?? match?.[3]
  return digits ? `#${digits}` : null
}

function orderLine(order: AssistantOrder): string {
  const items = order.items.map((item) => (item.qty > 1 ? `${item.qty} × ${item.name}` : item.name)).join(', ')
  const placed = `Order ${order.number}, placed ${dayLabel(order.date)}: ${items}, ${order.total}.`
  if (/cancel/i.test(order.status)) return `${placed} It was cancelled, so nothing will be sent.`
  if (/refund/i.test(order.status)) return `${placed} It has been refunded.`
  if (/shipped/i.test(order.fulfillment)) return `${placed} It has shipped${order.tracking ? `, tracking number ${order.tracking}` : ''}.`
  return `${placed} We are packing it and it has not shipped yet. You will get an email as soon as it leaves us.`
}

function answerOrder(question: string, email: string, ctx: AssistantContext): AssistantReply[] {
  const number = orderNumberIn(question)
  const mine = ctx.orders
    .filter((order) => order.email.toLowerCase() === email)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  const order = number ? mine.find((o) => o.number === number) : mine[0]
  if (!order) {
    return [{
      kind: 'text',
      text: number
        ? `I can’t find order ${number} for ${email}. Check the number in your confirmation email, or write to us and we will look into it.`
        : `I can’t find an order for ${email}. If you used another email, tell me that one, or write to us and we will look into it.`,
      link: CONTACT,
    }]
  }
  const more = !number && mine.length > 1 ? ` You have ${mine.length} orders with us; this is the latest.` : ''
  return [{ kind: 'order', text: `${orderLine(order)}${more}`, order }]
}

const SUBSCRIPTION_ORDER: Record<ContractStatus, number> = { 'Payment failed': 0, Active: 1, Paused: 2, Cancelled: 3 }

function answerSubscription(question: string, email: string, ctx: AssistantContext): AssistantReply[] {
  const mine = ctx.subscriptions
    .filter((s) => s.email.toLowerCase() === email)
    .sort((a, b) => SUBSCRIPTION_ORDER[a.status] - SUBSCRIPTION_ORDER[b.status])
  const first = mine[0]
  if (!first) {
    return [{ kind: 'text', text: `I can’t find a subscription for ${email}. You can start one from any product in our Subscription collection.`, link: { label: 'See subscriptions', href: '/collections/subscription' } }]
  }
  const text = question.toLowerCase()
  let lead: string
  if (first.status === 'Payment failed') lead = `We couldn’t take the last payment for your ${first.product} subscription, so its delivery is on hold. You can pay again on your account page.`
  else if (first.status === 'Paused') lead = `Your ${first.product} subscription is paused. Nothing is charged or sent until you resume it on your account page.`
  else if (first.status === 'Cancelled') lead = `Your ${first.product} subscription is cancelled, so nothing more is charged.`
  else if (/\bskip\w*/.test(text)) lead = `Your next ${first.product} delivery is on ${dayLabel(first.nextChargeOn!)}. You can skip it right here.`
  else if (/\b(paus\w*|cancel\w*|change|stop)\b/.test(text)) lead = `Your next ${first.product} delivery is on ${dayLabel(first.nextChargeOn!)}. You can pause, change plan or cancel on your account page.`
  else lead = `Your next ${first.product} delivery is on ${dayLabel(first.nextChargeOn!)}, ${first.price} with your ${first.plan}.`
  const more = mine.length > 1 ? ` You have ${mine.length} subscriptions; here they all are.` : ''
  return [{ kind: 'subscriptions', text: `${lead}${more}`, subscriptions: mine }]
}

function answerKnown(question: string, email: string, ctx: AssistantContext): AssistantReply[] {
  return SUBSCRIPTION.test(question.toLowerCase()) && !orderNumberIn(question) ? answerSubscription(question, email, ctx) : answerOrder(question, email, ctx)
}

const HELP = 'I can look up your order, tell you when your next subscription delivery is, suggest a product for sleep, focus, hydration, skin or healthy ageing, and answer questions about delivery and returns.'

// ── The conversation ─────────────────────────────────────────────────────────

/** What the assistant says to a message, and where the conversation stands after it. */
export function assistantReply(message: string, ctx: AssistantContext, state: AssistantState = NEW_CONVERSATION): AssistantTurn {
  const text = message.trim().toLowerCase()
  // Whoever is signed in on the store now wins over an email confirmed earlier in the chat:
  // the shopper may have checked out as someone else since.
  const known = ctx.email?.toLowerCase() ?? state.email
  const turn = (replies: AssistantReply[], next: Partial<AssistantState> = {}, extra: Partial<AssistantTurn> = {}): AssistantTurn =>
    ({ replies, state: { pending: null, email: state.email, ...next }, offerPrompts: false, ...extra })

  // ── A question is waiting for an email or a code ───────────────────
  const pending = state.pending
  if (pending?.step === 'email' && message.includes('@')) {
    const email = EMAIL.exec(message)?.[0].toLowerCase()
    if (!email) return turn([{ kind: 'text', text: 'That doesn’t look like an email address. It should read like name@example.com.' }], { pending })
    if (!pending.needsCode) return turn(answerKnown(pending.question, email, ctx))
    return turn([{
      kind: 'text',
      text: `Thanks. I sent a 6-digit code to ${email}. Type it here so I know it’s you.${ctx.demo ? ' This is a demo store, so any 6 digits work.' : ''}`,
    }], { pending: { ...pending, step: 'code', email } })
  }
  if (pending?.step === 'code' && pending.email && /\d/.test(message)) {
    if (!/^\D*\d{6}\D*$/.test(message)) return turn([{ kind: 'text', text: 'The code has 6 digits. Please type it again.' }], { pending })
    return turn(answerKnown(pending.question, pending.email, ctx), { email: pending.email }, { signedIn: pending.email })
  }
  // Anything else while a question waits is a new question: the old one is dropped.

  // ── Health questions get a careful answer, never a product ─────────
  if (MEDICAL.test(text)) {
    return turn([{
      kind: 'text',
      text: 'I can’t give medical advice. If you are pregnant, breastfeeding, taking medication, managing a condition or asking for a child, please check with your doctor or pharmacist before starting a supplement. I can tell you what each product contains and what it is made for.',
    }])
  }

  // ── Orders and subscriptions need to know who is asking ────────────
  const general = GENERAL.test(text) && !/\b(my|next)\b/.test(text)
  const aboutSubscription = !general && SUBSCRIPTION.test(text) && !orderNumberIn(message)
  const aboutOrder = !general && !aboutSubscription && (ORDER.test(text) || !!orderNumberIn(message))
  if (aboutSubscription || aboutOrder) {
    if (!ctx.trackingEnabled) {
      return turn([{ kind: 'text', text: 'I can’t look up orders or subscriptions in this chat. Write to us and the team will check it for you.', link: aboutSubscription ? ACCOUNT : CONTACT }])
    }
    // An order number with its email is enough; a typed email saves a step.
    const typed = EMAIL.exec(message)?.[0].toLowerCase()
    const number = orderNumberIn(message)
    if (aboutOrder && number && typed) return turn(answerOrder(message, typed, ctx))
    if (known) return turn(answerKnown(message, known, ctx))
    return turn([{
      kind: 'text',
      text: aboutOrder && number
        ? `I can look up order ${number}. Which email did you order with?`
        : `I can check that. Which email did you ${aboutSubscription ? 'subscribe' : 'order'} with?`,
    }], { pending: { step: 'email', question: message, needsCode: !(aboutOrder && number) } })
  }

  // ── Is there an offer on? The store's running campaign answers ─────
  if (PROMOTION.test(text)) {
    return turn([{
      kind: 'text',
      text: ctx.promotion
        ? `Yes. ${ctx.promotion}. Type the code in your cart or at checkout.`
        : 'There is no discount code running right now. A subscription saves 20% to 30% on every delivery, all year.',
      link: ctx.promotion ? { label: 'Go to your cart', href: '/cart-page' } : { label: 'See subscriptions', href: '/collections/subscription' },
    }])
  }

  if (HUMAN.test(text)) {
    return turn([{ kind: 'text', text: 'Of course. Our team answers within one working day. Write to us and say what you need.', link: CONTACT }])
  }

  // ── A wellness need, or a request for a suggestion ─────────────────
  const wantsProduct = !POLICY.test(text) && (NEEDS.some((need) => need.says.test(text)) || SHOPPING.test(text))
  if (wantsProduct && ctx.shoppingEnabled) {
    const match = productsFor(message, ctx.products)
    if (match.productIds.length) {
      return turn([{
        kind: 'products',
        text: match.label
          ? `For ${match.label}, ${match.productIds.length === 1 ? 'this is the one we make for it' : 'these are the ones we make for it'}:`
          : 'These look like the closest match:',
        productIds: match.productIds,
      }])
    }
    return turn([{ kind: 'text', text: 'Tell me what you would like help with, for example better sleep, focus, hydration, skin or healthy ageing, and I will suggest a product.' }])
  }

  if (text.split(/\s+/).length <= 4) {
    if (GREETING.test(text)) return turn([{ kind: 'text', text: `Hi! ${HELP}` }], {}, { offerPrompts: true })
    if (THANKS.test(text)) return turn([{ kind: 'text', text: 'You’re welcome. Is there anything else I can help with?' }])
  }

  // ── The store's own pages ──────────────────────────────────────────
  const entry = bestEntry(message, ctx.entries)
  if (entry) {
    const url = (entry as PreviewEntry & { url?: string }).url
    return turn([{ kind: 'answer', text: entry.text, source: entry.source, ...(url ? { link: { label: `Read: ${entry.title}`, href: url } } : {}) }])
  }

  if (THANKS.test(text)) return turn([{ kind: 'text', text: 'You’re welcome. Is there anything else I can help with?' }])
  return turn([{ kind: 'text', text: `I’m not sure about that one. ${HELP}` }], {}, { offerPrompts: true })
}
