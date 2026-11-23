/**
 * The assistant on a store's own pages: what it understands and what it answers.
 *
 * Scripted rules, not a language model: it recognises a question by its wording
 * and answers from the store's real orders, subscriptions, products and pages,
 * which the chat widget hands in as plain data. Nothing leaves the browser, and
 * the same question always gets the same answer. When it does not understand, it
 * says what it can help with instead of guessing.
 *
 * What it knows about the kind of store (the needs it suggests products for, the
 * questions it answers with care) is the store's assistant profile
 * (assistantProfiles.ts); the rest is the same for every store. A clothing store's
 * profile adds size and fit, fabric and care (clothingAnswers.ts).
 *
 * Pure, with relative `.ts` imports only, so `npm run test:chatbot` runs a whole
 * conversation in Node. The builder's preview keeps its own stand-in
 * (previewResponder.ts), which this reuses for knowledge-base answers.
 */

import type { AssistantProfileId, SizeChart } from '../storefront/demoStores/types.ts'
import { dayLabel } from '../subscriptions/contracts.ts'
import type { ContractStatus } from '../subscriptions/contracts.ts'
import { assistantProfile } from './assistantProfiles.ts'
import type { AssistantNeed, AssistantProfile } from './assistantProfiles.ts'
import {
  CARE, FABRIC, HEIGHT_WEIGHT, SIZE, audienceAsked, careAnswer, fabricAnswer, fibreAvoidance, forAudience,
  measurementsIn, pieceForMeasurements, priceLimit, sizeAnswer, sizesIn, subjectOf, withoutNames,
} from './clothingAnswers.ts'
import type { ClothingTurn } from './clothingAnswers.ts'
import { bestEntry, hits, keywords } from './previewResponder.ts'
import type { PreviewEntry } from './previewResponder.ts'

export interface AssistantProduct {
  id: number
  name: string
  subtitle: string
  description: string
  collections: string[]
  /** Its page on the store: "/products/linen-overshirt-3015". */
  url?: string
  /** What it costs in the store's currency, as a number (98 for "$98.00"): a shopper may say "under $100". */
  price?: number
  /** Clothing: how it fits ("Regular fit, true to size. Model is 5'9" and wears S."). */
  fitNote?: string
  /** Clothing: what it is made of ("100% extra-fine merino wool"). */
  material?: string
  /** Clothing: how to wash it. */
  care?: string
  /** Clothing: the size chart its size guide shows (`SizeChart.id`). */
  sizeChartId?: string
}

/** The fields the assistant reads from one of the store's products. A commerce `Product` satisfies it. */
export interface StoreProductFields {
  id: number
  name: string
  price: string
  collections: string[]
  detail?: { subtitle?: string; description?: string; fitNote?: string; material?: string; care?: string; sizeChartId?: string }
}

/** A store product as the assistant reads it; `url` is its page ("/products/linen-overshirt-3015"). */
export function assistantProduct(product: StoreProductFields, url?: string): AssistantProduct {
  const price = Number.parseFloat(product.price)
  const detail = product.detail
  return {
    id: product.id,
    name: product.name,
    subtitle: detail?.subtitle ?? '',
    description: detail?.description ?? '',
    collections: product.collections,
    ...(url ? { url } : {}),
    ...(Number.isFinite(price) ? { price } : {}),
    ...(detail?.fitNote ? { fitNote: detail.fitNote } : {}),
    ...(detail?.material ? { material: detail.material } : {}),
    ...(detail?.care ? { care: detail.care } : {}),
    ...(detail?.sizeChartId ? { sizeChartId: detail.sizeChartId } : {}),
  }
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
  /** What kind of store it is (`ChatbotConfig.assistantProfile`). Unset: wellness. */
  profile?: AssistantProfileId
  /** The store's size charts (Products › Size charts), for a clothing store's size answers. */
  sizeCharts?: SizeChart[]
  /** The product whose page the shopper is on, so "Which size should I get?" needs no name. */
  currentProductId?: number
  /** How the store writes a day ("Nov 18, 2026"). Unset: "18 Nov 2026". */
  formatDay?: (date: string) => string
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
  /** Clothing: the piece the last answer was about, so a follow-up ("between M and L") needs no name. */
  productId?: number
}

export const NEW_CONVERSATION: AssistantState = { pending: null, email: null }

export type AssistantReply =
  /** `topic` names the chat in the admin's Conversations when the answer has no card to say it. */
  | { kind: 'text'; text: string; link?: { label: string; href: string }; topic?: string }
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
/** Clothing: a question about returning or changing a piece is the store's pages' to answer, even when it says "size". */
const EXCHANGE = /\b(exchange\w*|swap\w*|send (it |them )?back|return\w*|refund\w*)\b/
/** Clothing: the words of a question only about subscriptions, on a store that sells none. */
const PLAN_WORDS = /\b(subscri\w*|renew\w*|skip\w*|paus\w*|resum\w*|plans?)\b/
/** Clothing: asking what is reduced, not for a code. */
const SALE_ITEMS = /\b(on sale|sale (items?|styles?)|what('s| is) (on )?sale|reduced|markdowns?|clearance)\b/

/**
 * The products that fit a need, best first: at most three, and only those close
 * to the best match. The need is matched against each product's own name,
 * subtitle, description and collections, so a product the merchant adds can be
 * suggested too.
 */
export function productsFor(message: string, products: AssistantProduct[], profile?: AssistantProfileId): { label: string | null; productIds: number[] } {
  const text = message.toLowerCase()
  const needs = assistantProfile(profile).needs.filter((need) => need.says.test(text))
  const tokens = needs.length ? needs.flatMap((need) => need.means) : keywords(message)
  if (!tokens.length) return { label: null, productIds: [] }
  return {
    label: needs.length ? needs.map((need) => need.label).join(' and ') : null,
    productIds: rankProducts(tokens, products),
  }
}

/** The products that mention the words, best first: at most three, and only those close to the best. */
function rankProducts(tokens: string[], products: AssistantProduct[]): number[] {
  const scored = products
    .map((product, index) => ({
      id: product.id,
      index,
      score: hits(tokens, product.name) * 3 + hits(tokens, product.subtitle) * 3 + hits(tokens, product.collections.join(' ')) * 2 + hits(tokens, product.description),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
  const best = scored[0]?.score ?? 0
  return scored.filter((p) => p.score * 2 >= best).slice(0, 3).map((p) => p.id)
}

// ── Answers ──────────────────────────────────────────────────────────────────

function orderNumberIn(message: string): string | null {
  const match = ORDER_NUMBER.exec(message)
  const digits = match?.[1] ?? match?.[2] ?? match?.[3]
  return digits ? `#${digits}` : null
}

function orderLine(order: AssistantOrder, day: (date: string) => string): string {
  const items = order.items.map((item) => (item.qty > 1 ? `${item.qty} × ${item.name}` : item.name)).join(', ')
  const placed = `Order ${order.number}, placed ${day(order.date)}: ${items}, ${order.total}.`
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
  return [{ kind: 'order', text: `${orderLine(order, ctx.formatDay ?? dayLabel)}${more}`, order }]
}

const SUBSCRIPTION_ORDER: Record<ContractStatus, number> = { 'Payment failed': 0, Active: 1, Paused: 2, Cancelled: 3 }

function answerSubscription(question: string, email: string, ctx: AssistantContext): AssistantReply[] {
  const mine = ctx.subscriptions
    .filter((s) => s.email.toLowerCase() === email)
    .sort((a, b) => SUBSCRIPTION_ORDER[a.status] - SUBSCRIPTION_ORDER[b.status])
  const first = mine[0]
  if (!first) {
    const none = assistantProfile(ctx.profile).noSubscription
    return [{ kind: 'text', text: `I can’t find a subscription for ${email}. ${none.text}`, link: none.link }]
  }
  const text = question.toLowerCase()
  const day = ctx.formatDay ?? dayLabel
  let lead: string
  if (first.status === 'Payment failed') lead = `We couldn’t take the last payment for your ${first.product} subscription, so its delivery is on hold. You can pay again on your account page.`
  else if (first.status === 'Paused') lead = `Your ${first.product} subscription is paused. Nothing is charged or sent until you resume it on your account page.`
  else if (first.status === 'Cancelled') lead = `Your ${first.product} subscription is cancelled, so nothing more is charged.`
  else if (/\bskip\w*/.test(text)) lead = `Your next ${first.product} delivery is on ${day(first.nextChargeOn!)}. You can skip it right here.`
  else if (/\b(paus\w*|cancel\w*|change|stop)\b/.test(text)) lead = `Your next ${first.product} delivery is on ${day(first.nextChargeOn!)}. You can pause, change plan or cancel on your account page.`
  else lead = `Your next ${first.product} delivery is on ${day(first.nextChargeOn!)}, ${first.price} with your ${first.plan}.`
  const more = mine.length > 1 ? ` You have ${mine.length} subscriptions; here they all are.` : ''
  return [{ kind: 'subscriptions', text: `${lead}${more}`, subscriptions: mine }]
}

function answerKnown(question: string, email: string, ctx: AssistantContext): AssistantReply[] {
  return SUBSCRIPTION.test(question.toLowerCase()) && !orderNumberIn(question) && !sellsNoPlans(ctx) ? answerSubscription(question, email, ctx) : answerOrder(question, email, ctx)
}

/** A store whose profile sells no subscriptions, and that lists none: "next delivery" means an order. */
function sellsNoPlans(ctx: AssistantContext): boolean {
  return assistantProfile(ctx.profile).subscriptions === false && !ctx.subscriptions.length
}

// ── Clothing ─────────────────────────────────────────────────────────────────

/** "A coat or jacket for cold days for him under $250. Here’s what I’d pick:" */
function suggestionText(profile: AssistantProfile, needs: AssistantNeed[], count: number, audience: string | null, price: string | null): string {
  const pieces = needs.filter((need) => need.kind === 'piece').map((need) => need.label)
  const occasions = needs.filter((need) => need.kind !== 'piece').map((need) => need.label)
  let head = pieces.length ? pieces.join(' or ') : occasions.length ? 'something' : ''
  if (occasions.length) head += ` for ${occasions.join(' and ')}`
  if (audience) head += ` for ${audience}`
  if (price) head += ` ${price}`
  head = head.trim()
  const lead = count === 1 ? profile.suggestionLead.one : profile.suggestionLead.many
  return head ? `${head[0]!.toUpperCase()}${head.slice(1)}. ${lead}` : lead
}

/**
 * Pieces for what the shopper describes, for whom and under what price: the
 * needs it names, else the words it uses; with only a price or an audience, the
 * store's own order. When the price leaves nothing, the closest pieces above it.
 */
function clothingSuggestion(message: string, ctx: AssistantContext, profile: AssistantProfile): AssistantReply | null {
  const text = message.toLowerCase()
  const clothing = profile.clothing!
  const audience = audienceAsked(text)
  const price = priceLimit(message)
  const needs = profile.needs.filter((need) => need.says.test(text))
  const people = forAudience(ctx.products, audience, clothing)
  const affordable = price ? people.filter((p) => p.price === undefined || p.price <= price.max) : people
  if (needs.length) {
    const means = needs.flatMap((need) => need.means)
    const ids = rankProducts(means, affordable)
    if (ids.length) return { kind: 'products', text: suggestionText(profile, needs, ids.length, audience, price?.phrase ?? null), productIds: ids }
    const closest = price ? rankProducts(means, people) : []
    return closest.length ? { kind: 'products', text: `Nothing ${price!.phrase} fits that. These come closest:`, productIds: closest } : null
  }
  // No need named: the words it uses, else the store's own order (for a price or an audience alone).
  const words = keywords(price ? text.replace(price.phrase, ' ') : message).filter((t) => !/^\d/.test(t))
  const ranked = words.length ? rankProducts(words, affordable) : []
  const ids = ranked.length ? ranked : (price || audience) ? affordable.slice(0, 3).map((p) => p.id) : []
  if (ids.length) return { kind: 'products', text: suggestionText(profile, needs, ids.length, audience, price?.phrase ?? null), productIds: ids }
  if (!price || !people.length) return null
  const cheapest = [...people].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)).slice(0, 3).map((p) => p.id)
  return { kind: 'products', text: `Nothing ${price.phrase} right now. These come closest:`, productIds: cheapest }
}

/**
 * A fibre to avoid ("I’m allergic to wool"): whether the piece in question has
 * it, the pieces made without it, and where every fabric is listed. Never advice.
 */
function fibreAnswer(message: string, ctx: AssistantContext, state: AssistantState, profile: AssistantProfile): ClothingTurn | null {
  const clothing = profile.clothing!
  const text = message.toLowerCase()
  const avoid = fibreAvoidance(message, ctx, clothing)
  if (!avoid) return null
  // "I have a wool allergy, is this ok?": the fibre is not a piece's name, so the piece is the page's.
  const { product } = subjectOf(text.replace(new RegExp(avoid.fibre.says.source, 'g'), ' '), ctx, state.productId)
  const replies: AssistantReply[] = []
  if (product?.material) {
    replies.push({ kind: 'text', topic: 'Fabric and care', text: `${product.name}: ${product.material.replace(/\.?$/, '.')} ${avoid.contains(product) ? `It has ${avoid.fibre.name} in it.` : `There’s no ${avoid.fibre.name} in it.`}` })
  }
  const pool = forAudience(avoid.without, audienceAsked(text), clothing).filter((p) => p.id !== product?.id)
  const pieces = profile.needs.filter((need) => need.says.test(text) && need.kind === 'piece')
  const ids = ctx.shoppingEnabled ? rankProducts(pieces.length ? pieces.flatMap((need) => need.means) : avoid.fibre.instead, pool) : []
  if (ids.length) replies.push({ kind: 'products', text: `These are made without any ${avoid.fibre.name}:`, productIds: ids })
  replies.push({ kind: 'text', topic: 'Fabric and care', text: clothing.fabricNote, link: clothing.fabricPage })
  return { replies, ...(product ? { productId: product.id } : {}) }
}

/** A clothing store's answers on care, fabric, and size and fit, about the piece in question. */
function clothingAnswer(message: string, ctx: AssistantContext, state: AssistantState, profile: AssistantProfile): ClothingTurn | null {
  const clothing = profile.clothing!
  const text = message.toLowerCase()
  const { product, named } = subjectOf(message, ctx, state.productId)
  // The question without the pieces' own names: "the organic cotton tee" is not a question about fabric.
  const asked = withoutNames(text, named)
  if (CARE.test(asked)) {
    const care = careAnswer(message, ctx, clothing, product, named)
    if (care) return care
  }
  if (FABRIC.test(asked)) {
    const fabric = fabricAnswer(clothing, product, named)
    if (fabric) return fabric
  }
  if (SIZE.test(text) || HEIGHT_WEIGHT.test(text) || sizesIn(message).length || measurementsIn(message).length) {
    return sizeAnswer(message, ctx, clothing, pieceForMeasurements(message, ctx, clothing, product), named)
  }
  return null
}

// ── The conversation ─────────────────────────────────────────────────────────

/** What the assistant says to a message, and where the conversation stands after it. */
export function assistantReply(message: string, ctx: AssistantContext, state: AssistantState = NEW_CONVERSATION): AssistantTurn {
  const text = message.trim().toLowerCase()
  const profile = assistantProfile(ctx.profile)
  // Whoever is signed in on the store now wins over an email confirmed earlier in the chat:
  // the shopper may have checked out as someone else since.
  const known = ctx.email?.toLowerCase() ?? state.email
  const turn = (replies: AssistantReply[], next: Partial<AssistantState> = {}, extra: Partial<AssistantTurn> = {}): AssistantTurn =>
    ({ replies, state: { pending: null, email: state.email, ...next }, offerPrompts: false, ...extra })
  const clothing = profile.clothing
  /** A clothing answer remembers its piece for the next message. */
  const worn = (answer: ClothingTurn): AssistantTurn => turn(answer.replies, answer.productId ? { productId: answer.productId } : {})

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

  // ── A fibre to avoid (a clothing store): what everything is made of, never advice ──
  // A skin or health condition named alongside the fibre gets the caution below instead.
  if (clothing && !profile.caution.says.test(text.replace(/\ballerg\w*/g, ' '))) {
    const avoid = fibreAnswer(message, ctx, state, profile)
    if (avoid) return worn(avoid)
  }

  // ── Health questions get a careful answer, never a product ─────────
  if (profile.caution.says.test(text)) return turn([{ kind: 'text', text: profile.caution.text, ...(profile.caution.link ? { link: profile.caution.link } : {}) }])

  // ── A store that sells no subscriptions says so, and "next delivery" is an order ──
  const noPlans = sellsNoPlans(ctx)
  const planWords = noPlans && SUBSCRIPTION.test(text) && !orderNumberIn(message)
  if (planWords && PLAN_WORDS.test(text)) return turn([{ kind: 'text', text: profile.noSubscription.text, link: profile.noSubscription.link }])

  // ── Orders and subscriptions need to know who is asking ────────────
  const general = GENERAL.test(text) && !/\b(my|next)\b/.test(text)
  const aboutSubscription = !general && !noPlans && SUBSCRIPTION.test(text) && !orderNumberIn(message)
  const aboutOrder = !general && !aboutSubscription && (ORDER.test(text) || !!orderNumberIn(message) || planWords)
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
  // A clothing store's return question that says "sale" ("Can I return a sale item?") is the pages' to answer.
  if (PROMOTION.test(text) && !(clothing && (POLICY.test(text) || EXCHANGE.test(text)))) {
    const offer: AssistantReply = {
      kind: 'text',
      text: ctx.promotion ? `Yes. ${ctx.promotion}. Type the code in your cart or at checkout.` : profile.noPromotion.text,
      link: ctx.promotion ? { label: 'Go to your cart', href: '/cart-page' } : profile.noPromotion.link,
    }
    // "What's on sale?" in a clothing store: the reduced pieces, and the code when one runs.
    const reduced = clothing && SALE_ITEMS.test(text) && ctx.shoppingEnabled
      ? ctx.products.filter((p) => p.collections.some((c) => /^sale$/i.test(c))).slice(0, 3).map((p) => p.id)
      : []
    if (reduced.length) {
      const sale: AssistantReply = { kind: 'products', text: reduced.length === 1 ? 'This is on sale now:' : 'These are on sale now:', productIds: reduced }
      return turn(ctx.promotion ? [sale, { ...offer, text: `There’s also a code running. ${ctx.promotion}. Type it in your cart or at checkout.` }] : [sale])
    }
    return turn([offer])
  }

  if (HUMAN.test(text)) {
    return turn([{ kind: 'text', text: 'Of course. Our team answers within one working day. Write to us and say what you need.', link: CONTACT }])
  }

  // ── Size and fit, fabric and care (a clothing store) ───────────────
  // A question about returning or changing a piece is the store's pages' to answer.
  if (clothing && !POLICY.test(text) && !EXCHANGE.test(text)) {
    const answer = clothingAnswer(message, ctx, state, profile)
    if (answer) return worn(answer)
  }

  // ── A need, or a request for a suggestion ──────────────────────────
  const wantsProduct = !POLICY.test(text) && (profile.needs.some((need) => need.says.test(text)) || SHOPPING.test(text)
    || (!!clothing && (!!priceLimit(message) || !!audienceAsked(text))))
  if (wantsProduct && ctx.shoppingEnabled && clothing) {
    const suggestion = clothingSuggestion(message, ctx, profile)
    return turn([suggestion ?? { kind: 'text', text: profile.askNeed }])
  }
  if (wantsProduct && ctx.shoppingEnabled) {
    const match = productsFor(message, ctx.products, profile.id)
    if (match.productIds.length) {
      return turn([{
        kind: 'products',
        text: match.label
          ? `For ${match.label}, ${match.productIds.length === 1 ? profile.suggestionLead.one : profile.suggestionLead.many}:`
          : 'These look like the closest match:',
        productIds: match.productIds,
      }])
    }
    return turn([{ kind: 'text', text: profile.askNeed }])
  }

  if (text.split(/\s+/).length <= 4) {
    if (GREETING.test(text)) return turn([{ kind: 'text', text: `Hi! ${profile.help}` }], {}, { offerPrompts: true })
    if (THANKS.test(text)) return turn([{ kind: 'text', text: 'You’re welcome. Is there anything else I can help with?' }])
  }

  // ── The store's own pages ──────────────────────────────────────────
  const entry = bestEntry(message, ctx.entries)
  if (entry) {
    const url = (entry as PreviewEntry & { url?: string }).url
    return turn([{ kind: 'answer', text: entry.text, source: entry.source, ...(url ? { link: { label: `Read: ${entry.title}`, href: url } } : {}) }])
  }

  if (THANKS.test(text)) return turn([{ kind: 'text', text: 'You’re welcome. Is there anything else I can help with?' }])
  return turn([{ kind: 'text', text: `I’m not sure about that one. ${profile.help}` }], {}, { offerPrompts: true })
}
