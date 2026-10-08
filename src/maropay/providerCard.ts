/**
 * The Maropay card at the top of a store's Payments page — the one place Maropay
 * is sold, the way Shopify sells Shopify Payments above a merchant's other
 * providers. One pure derivation turns the account's and the store's state into
 * what the card says and offers, so the card never grows a second state machine:
 * account-level states read the overview's own instruction, store-level states
 * read the binding and its checklist.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { CARD_BENEFITS } from './benefits.ts'
import type { MaropayBenefit } from './benefits.ts'
import { CARD_BRAND_MARKS, markFor } from './methodMarks.ts'
import type { MethodMarkId } from './methodMarks.ts'
import { SETUP_LABELS, STORE_ACTIVATION_LABELS, VERIFICATION_LABELS } from './model.ts'
import type { MaropayAccountState, MaropayAction, PaymentMethodCatalogEntry } from './model.ts'
import { activeConnections, cardGateway, connectionOfferedMethods, providerLabel, storeProvidersFor } from './providers.ts'
import {
  activationChecklist, checklistProgress, checkoutMethods, deriveCapabilities, deriveOverviewInstruction, formatDay, joinList,
  payoutScheduleLabel, storeActivationState, storeCheckoutNote, storePaymentsTarget,
} from './readiness.ts'
import type { ChannelFacts, FactsFor, MaropayTarget } from './readiness.ts'

export type MaropayCardState =
  | 'not_set_up' | 'setup_in_progress' | 'under_review' | 'action_required'
  | 'unlinked' | 'needs_setup' | 'ready_to_activate' | 'live' | 'stopped'
  | 'unavailable' | 'declined' | 'closed'

export interface MaropayCardAction {
  label: string
  /** `route` opens the target; `href` opens a page outside the app; the rest are the card's own emits. */
  kind: 'route' | 'href' | 'activate' | 'link' | 'see_providers'
  target?: MaropayTarget
  href?: string
  /** Why the actor can't do this (their role, an unfinished checklist). The button stays visible, disabled, with this as its tooltip. */
  disabledReason: string | null
}

export interface MaropayCardModel {
  state: MaropayCardState
  /** The quiet "Recommended" eyebrow — only while Maropay is still being sold. */
  recommended: boolean
  /** An MpStatusChip `readiness` label, when the state has one. */
  chip: string | null
  headline: string
  detail: string | null
  /** One line of hard facts under the headline ("No Maropost platform fee · Cards and wallets from 2.9% + 30¢"). */
  facts: string | null
  benefits: readonly MaropayBenefit[]
  marks: MethodMarkId[]
  moreCount: number
  progress: { done: number; total: number } | null
  nag: { tone: 'info' | 'warning'; title: string; body: string; action: { label: string; target: MaropayTarget } | null } | null
  primary: MaropayCardAction | null
  secondary: MaropayCardAction | null
  quiet: MaropayCardAction | null
  menu: Array<'open_in_maropay' | 'stop'>
  openInMaropay: MaropayTarget | null
  /** The live state's label/value list. */
  live: { takes: string; rates: string; payouts: string } | null
  footnote: string | null
}

export interface MaropayCardInput {
  state: MaropayAccountState
  channelId: string
  channel: ChannelFacts | null
  now: number
  /** Already narrowed to this store (the caller's `can(action, channelId)`). */
  can: (action: MaropayAction) => boolean
  factsFor?: FactsFor
}

/** The marketing page, outside the app. */
export const MAROPAY_LEARN_MORE_HREF = '/main-landing/maropay/'

const RATES_FOOTNOTE = 'Illustrative rates. The rates that apply to your business are shown before you accept the terms.'
const MAX_MARKS = 6

/** Marks for a set of methods — cards expand to the brand marks, under the Maropay tile. */
function marksFor(methods: PaymentMethodCatalogEntry[]): MethodMarkId[] {
  const ids: MethodMarkId[] = []
  for (const m of methods) {
    for (const mark of m.id === 'card' ? ['maropay' as const, ...CARD_BRAND_MARKS] : [markFor(m.id)]) if (!ids.includes(mark)) ids.push(mark)
  }
  return ids
}

export function deriveMaropayCard(input: MaropayCardInput): MaropayCardModel {
  const { state, channelId, channel, now, can } = input
  const storeName = channel?.name ?? 'this store'
  const overview = deriveOverviewInstruction(state, now, input.factsFor)
  const binding = state.bindings.find((b) => b.channelId === channelId) ?? null
  const setup = storeProvidersFor(state, channelId)
  const gateway = cardGateway(setup)
  const gatewayName = gateway ? providerLabel(gateway.kind) : null
  const checklist = binding ? activationChecklist(state, binding, channel, now) : null
  const activation = binding && checklist ? storeActivationState(binding, deriveCapabilities(state, now), checklist) : null
  const live = binding?.activation === 'live'
  const managePage = storePaymentsTarget(channelId, 'store')
  const overviewTarget: MaropayTarget = { name: 'MaropayOverview' }

  const card = state.methods.find((m) => m.id === 'card')
  const paypal = state.methods.find((m) => m.id === 'paypal')
  const sellFacts = card ? `No Maropost platform fee · Cards and wallets from ${card.rate.label}${paypal ? ` · PayPal ${paypal.rate.label}` : ''}` : 'No Maropost platform fee'
  const available = state.methods.filter((m) => m.availability !== 'unavailable')
  const route = (label: string, target: MaropayTarget, disabledReason: string | null = null): MaropayCardAction => ({ label, kind: 'route', target, disabledReason })
  const setupGate = can('edit_onboarding') ? null : 'Only owners and finance users can set up Maropay'
  const ownerGate = (what: string) => (can('activate_store') ? null : `Only the business owner can ${what}.`)
  const seeProviders: MaropayCardAction = { label: 'See all other providers', kind: 'see_providers', disabledReason: null }

  const base: Omit<MaropayCardModel, 'state' | 'headline'> = {
    recommended: true,
    chip: null,
    detail: null,
    facts: null,
    benefits: [],
    marks: [],
    moreCount: 0,
    progress: null,
    nag: null,
    primary: null,
    secondary: null,
    quiet: null,
    menu: [],
    openInMaropay: null,
    live: null,
    footnote: null,
  }
  const withMarks = (methods: PaymentMethodCatalogEntry[]) => {
    const marks = marksFor(methods)
    return { marks: marks.slice(0, MAX_MARKS), moreCount: Math.max(0, marks.length - MAX_MARKS) }
  }

  // ── Account-level states: the overview already knows what to say ─────────
  if (overview.key === 'closed') {
    return { ...base, state: 'closed', recommended: false, headline: overview.headline, detail: overview.detail, secondary: route('Open Maropay overview', overviewTarget) }
  }
  if (overview.key === 'declined') {
    return {
      ...base, state: 'declined', recommended: false, chip: VERIFICATION_LABELS.rejected,
      headline: overview.headline, detail: overview.detail,
      secondary: route('Ask Maropost support to review the decision', overviewTarget),
    }
  }
  if (overview.key === 'unavailable') {
    return {
      ...base, state: 'unavailable', recommended: false, chip: 'Not enabled',
      headline: overview.headline, detail: `${overview.detail.replace('Your current payment provider keeps working.', '').trim()} ${storeName} keeps its current payment setup.`.trim(),
      secondary: route('Open Maropay overview', overviewTarget),
    }
  }
  if (overview.key === 'not_started') {
    return {
      ...base, state: 'not_set_up',
      headline: 'Let shoppers pay their way with Maropay',
      detail: `Cards, wallets and buy now, pay later on ${storeName}, with every payment, payout and dispute next to its order.`,
      facts: sellFacts,
      benefits: CARD_BENEFITS,
      ...withMarks(available),
      primary: route('Set up Maropay', { name: 'MaropaySetup' }, setupGate),
      secondary: { label: 'Learn more', kind: 'href', href: MAROPAY_LEARN_MORE_HREF, disabledReason: null },
      quiet: seeProviders,
      footnote: RATES_FOOTNOTE,
    }
  }
  if (overview.key === 'finish_setup') {
    return {
      ...base, state: 'setup_in_progress', chip: SETUP_LABELS.in_progress,
      headline: overview.headline, detail: overview.detail, facts: sellFacts,
      ...withMarks(available),
      primary: route('Continue setup', { name: 'MaropaySetup' }, setupGate),
      quiet: seeProviders,
      footnote: RATES_FOOTNOTE,
    }
  }
  if (!live && overview.key === 'provide_info') {
    return {
      ...base, state: 'action_required', chip: VERIFICATION_LABELS.action_required,
      headline: overview.headline, detail: overview.detail,
      primary: overview.action ? route(overview.action.label, overview.action.target) : null,
      secondary: route('Open Maropay', overviewTarget),
      quiet: seeProviders,
    }
  }
  if (!live && overview.key === 'under_review') {
    return {
      ...base, state: 'under_review', chip: VERIFICATION_LABELS.under_review,
      headline: 'Your details are under review',
      detail: `Our payments partner is checking your details. Nothing is needed from you — we’ll tell you when ${storeName} can switch.`,
      ...withMarks(available),
      secondary: route('Open Maropay', overviewTarget),
      quiet: seeProviders,
    }
  }

  // ── Store-level states: the business is verified ─────────────────────────
  if (!binding) {
    return {
      ...base, state: 'unlinked', chip: STORE_ACTIVATION_LABELS.inactive,
      headline: `Your business is verified — link ${storeName} to Maropay`,
      detail: 'Linking changes nothing at checkout. You’ll choose methods and run a test before anything switches.',
      ...withMarks(available),
      primary: { label: 'Link store', kind: 'link', disabledReason: can('link_store') ? null : 'Only the business owner can link stores.' },
      quiet: seeProviders,
    }
  }
  if (live) {
    const ready = checkoutMethods(state, binding)
    const rates = [...new Set(ready.map((m) => m.rate.label))]
    const account = state.account
    const nagKey = overview.key === 'payouts_attention' || overview.key === 'provide_info' || overview.key === 'under_review'
    return {
      ...base, state: 'live', recommended: false, chip: STORE_ACTIVATION_LABELS.live,
      headline: `Maropay is live on ${storeName}`,
      detail: `${binding.activatedAt ? `Live since ${formatDay(binding.activatedAt)} · ` : ''}${storeCheckoutNote('live', setup)}`,
      ...withMarks(ready),
      nag: nagKey
        ? { tone: overview.key === 'under_review' ? 'info' : 'warning', title: overview.headline, body: overview.detail, action: overview.action }
        : null,
      secondary: route('Manage', managePage),
      menu: ['open_in_maropay', ...(can('deactivate_store') ? ['stop' as const] : [])],
      openInMaropay: storePaymentsTarget(channelId),
      live: {
        takes: ready.length ? joinList(ready.map((m) => m.label)) : 'Nothing yet — turn on a method',
        rates: rates.length ? `${rates.join(' / ')} · No Maropost platform fee` : 'No Maropost platform fee',
        payouts: account?.payoutDestination
          ? `${payoutScheduleLabel(account.payoutSchedule).split(',')[0]} to ${account.payoutDestination.bankName} •••• ${account.payoutDestination.last4}`
          : 'No payout account yet',
      },
    }
  }
  if (binding.deactivatedAt) {
    const others = activeConnections(setup).filter((c) => connectionOfferedMethods(c, setup).length > 0).map((c) => providerLabel(c.kind))
    return {
      ...base, state: 'stopped', chip: STORE_ACTIVATION_LABELS[activation ?? 'inactive'],
      headline: `Maropay was stopped on ${storeName} on ${formatDay(binding.deactivatedAt)}`,
      detail: `New checkouts use ${others.length ? joinList(others) : 'no online provider'}. Payments taken while it was live — with their refunds, disputes and payouts — are still in Maropay.`,
      primary: route('Review and activate again', managePage, ownerGate('activate Maropay')),
      quiet: seeProviders,
    }
  }
  if (activation === 'ready_to_activate') {
    const ready = checkoutMethods(state, binding)
    return {
      ...base, state: 'ready_to_activate', chip: STORE_ACTIVATION_LABELS.ready_to_activate,
      headline: `Ready to activate on ${storeName}`,
      detail: 'Every step is done. New checkouts switch to Maropay the moment you activate.',
      facts: ready.length ? `${joinList(ready.map((m) => m.label))} · ${[...new Set(ready.map((m) => m.rate.label))].join(' / ')} · No Maropost platform fee` : null,
      ...withMarks(ready),
      primary: { label: 'Activate Maropay', kind: 'activate', disabledReason: ownerGate('activate Maropay') },
      secondary: route('Review setup', managePage),
      quiet: seeProviders,
    }
  }
  const progress = checklist ? checklistProgress(checklist) : null
  return {
    ...base, state: 'needs_setup', chip: STORE_ACTIVATION_LABELS[activation ?? 'needs_setup'],
    headline: `Finish setting up Maropay on ${storeName}`,
    detail: gatewayName ? `Checkout uses ${gatewayName} until you activate Maropay.` : 'Checkout keeps its current setup until you activate Maropay.',
    ...withMarks(available),
    progress,
    primary: route('Finish setup for this store', managePage),
    quiet: seeProviders,
  }
}
