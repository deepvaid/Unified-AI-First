/**
 * The setup status page's timeline — where the business is on the way from
 * "application submitted" to "every store on Maropay", read from the account,
 * its tasks and its stores. One derivation, so the headline, the five steps and
 * the store rows can never disagree with each other or with the overview.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import type { MaropayAccountState, StoreActivationState } from './model.ts'
import { cardGateway, providerLabel, storeProvidersFor } from './providers.ts'
import {
  activationChecklist, checklistProgress, deriveCapabilities, formatDay, joinList, payoutScheduleLabel, storeActivationState,
} from './readiness.ts'
import type { FactsFor } from './readiness.ts'

export type TimelineStepState = 'done' | 'current' | 'waiting' | 'blocked'

export interface TimelineStep {
  key: 'submitted' | 'verified' | 'payments' | 'payouts' | 'stores'
  title: string
  caption: string
  state: TimelineStepState
  /** When it happened, for done steps. */
  at: string | null
  /** A trailing figure instead of a time ("1 of 2"). */
  meta: string | null
}

export interface TimelineStore {
  channelId: string
  name: string
  state: StoreActivationState
  since: string | null
  /** Maropay payments this calendar month. */
  paymentsThisMonth: number
  done: number
  total: number
  /** The gateway still taking its cards, when there is one. */
  gateway: string | null
}

export interface SetupTimeline {
  headline: string
  detail: string
  steps: TimelineStep[]
  stores: TimelineStore[]
  live: number
  linked: number
}

function sameMonth(iso: string, now: number): boolean {
  const a = new Date(iso)
  const b = new Date(now)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function setupTimeline(state: MaropayAccountState, now: number, factsFor?: FactsFor): SetupTimeline | null {
  const account = state.account
  if (!account) return null
  const capabilities = deriveCapabilities(state, now)
  const nameOf = (channelId: string) => factsFor?.(channelId)?.name ?? 'this store'
  const openTask = state.tasks.find((t) => t.status !== 'resolved' && t.kind === 'verification') ?? null

  const stores: TimelineStore[] = state.bindings.map((binding) => {
    const checklist = activationChecklist(state, binding, factsFor?.(binding.channelId) ?? null, now)
    const { done, total } = checklistProgress(checklist)
    const gateway = cardGateway(storeProvidersFor(state, binding.channelId))
    return {
      channelId: binding.channelId,
      name: nameOf(binding.channelId),
      state: storeActivationState(binding, capabilities, checklist),
      since: binding.activation === 'live' ? binding.activatedAt : null,
      paymentsThisMonth: state.payments.filter((p) => p.channelId === binding.channelId && p.provider === 'maropay' && sameMonth(p.createdAt, now)).length,
      done, total,
      gateway: gateway ? providerLabel(gateway.kind) : null,
    }
  })
  const live = stores.filter((s) => s.state === 'live').length
  const linked = stores.length
  const liveNames = stores.filter((s) => s.state === 'live').map((s) => s.name)
  const next = stores.find((s) => s.state !== 'live') ?? null
  const verification = account.verification

  // ── The five steps ──────────────────────────────────────────────────────
  const submitted: TimelineStep = {
    key: 'submitted', title: 'Application submitted', caption: 'Business details, owners and rates',
    state: account.setup === 'submitted' ? 'done' : 'current', at: account.submittedAt, meta: null,
  }
  const verified: TimelineStep = (() => {
    switch (verification) {
      case 'verified': return { key: 'verified', title: 'Business verified', caption: 'Approved by our payments partner', state: 'done', at: account.verifiedAt, meta: null }
      case 'action_required': return { key: 'verified', title: 'Business verification', caption: openTask ? `Waiting on you: ${openTask.title}` : 'Waiting on information from you', state: 'blocked', at: null, meta: null }
      case 'rejected': return { key: 'verified', title: 'Business verification', caption: 'Not approved — Maropost support can ask for the decision to be reviewed', state: 'blocked', at: account.declinedAt, meta: null }
      default: return { key: 'verified', title: 'Business verification', caption: 'Our payments partner is reviewing — usually minutes, sometimes up to 2 business days', state: account.setup === 'submitted' ? 'current' : 'waiting', at: null, meta: null }
    }
  })()
  const payments: TimelineStep = (() => {
    switch (capabilities.payments) {
      case 'enabled': return { key: 'payments', title: 'Payments switched on', caption: 'Cards, wallets and buy now, pay later', state: 'done', at: account.verifiedAt, meta: null }
      case 'restricted': return { key: 'payments', title: 'Payments paused', caption: 'New Maropay payments wait until the information due is provided', state: 'blocked', at: null, meta: null }
      case 'disabled': return { key: 'payments', title: 'Payments switched off', caption: 'Your stores keep their current payment setup', state: 'blocked', at: null, meta: null }
      default: return { key: 'payments', title: 'Payments switched on', caption: 'Switched on the moment you’re verified', state: 'waiting', at: null, meta: null }
    }
  })()
  const destination = account.payoutDestination
  const schedule = payoutScheduleLabel(account.payoutSchedule).split(',')[0]
  const payouts: TimelineStep = (() => {
    switch (capabilities.payouts) {
      case 'ready': return {
        key: 'payouts', title: 'Payouts ready',
        caption: destination ? `${schedule} to ${destination.bankName} •••• ${destination.last4}, ${account.payoutSchedule.delayDays} business days after each payment` : `${schedule}, ${account.payoutSchedule.delayDays} business days after each payment`,
        state: 'done', at: destination?.addedAt ?? account.verifiedAt, meta: null,
      }
      case 'action_required': return { key: 'payouts', title: 'Payouts need attention', caption: destination ? 'Confirm the bank account to resume payouts' : 'Add a bank account to receive payouts', state: 'blocked', at: null, meta: null }
      case 'paused': return { key: 'payouts', title: 'Payouts paused', caption: 'Held until the information due is provided', state: 'blocked', at: null, meta: null }
      default: return { key: 'payouts', title: 'Payouts ready', caption: destination ? `${schedule} to ${destination.bankName} •••• ${destination.last4}, once you’re verified` : 'Set up once you’re verified', state: 'waiting', at: null, meta: null }
    }
  })()
  const storesStep: TimelineStep = {
    key: 'stores', title: 'Stores moved to Maropay',
    caption: linked ? 'Switch each store when you’re ready. Shoppers won’t notice a thing until you do.' : 'Link a store once you’re verified; nothing changes at checkout until you activate it.',
    state: !linked ? 'waiting' : live === linked ? 'done' : capabilities.payments === 'enabled' ? 'current' : 'waiting',
    at: null, meta: linked ? `${live} of ${linked}` : null,
  }

  // ── The headline ────────────────────────────────────────────────────────
  let headline: string
  let detail: string
  const nextKeeps = next ? `${next.name} keeps using ${next.gateway ?? 'its current setup'} until you finish its checklist.` : ''
  if (account.closedAt) {
    headline = 'This Maropay account is closed.'
    detail = `Payments and payouts stopped on ${formatDay(account.closedAt)}. Your stores keep their current payment setup.`
  } else if (verification === 'rejected') {
    headline = 'This business wasn’t approved.'
    detail = 'Nothing changed at checkout — your stores keep their current payment setup. Maropost support can ask our payments partner to look again.'
  } else if (verification === 'action_required') {
    headline = 'One thing to fix before review continues.'
    detail = openTask ? `Our payments partner asked for: ${openTask.title.toLowerCase()}. Payments start once it’s in and approved.` : 'Our payments partner needs more information before it can approve the business.'
  } else if (verification !== 'verified') {
    headline = 'Submitted — now under review.'
    detail = 'Our payments partner is checking your details. Nothing is needed from you; we’ll let you know when there’s a decision.'
  } else if (capabilities.payments !== 'enabled') {
    headline = 'Verified, but payments are paused.'
    detail = openTask ? `Provide ${openTask.title.toLowerCase()} and payments resume on approval.` : 'See your tasks for what to provide.'
  } else if (!linked) {
    headline = 'You’re verified. Link your first store.'
    detail = 'Linking changes nothing at checkout. You’ll choose methods and run a test before anything switches.'
  } else if (live === linked) {
    headline = linked === 1 ? 'All set — your store is on Maropay.' : 'All set — every store is on Maropay.'
    detail = `Maropay is taking payments on ${joinList(liveNames)}.`
  } else if (!live) {
    headline = 'You’re verified. Activate your first store.'
    detail = nextKeeps
  } else {
    const remaining = linked - live
    headline = `You’re verified. ${remaining === 1 ? 'One store' : `${remaining} stores`} to go.`
    detail = `Maropay is taking payments on ${joinList(liveNames)}. ${nextKeeps}`
  }

  return { headline, detail, steps: [submitted, verified, payments, payouts, storesStep], stores, live, linked }
}
