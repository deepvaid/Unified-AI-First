/**
 * Payout rules — the lines a payout breaks into, the list's tabs, and the CSV
 * export. Every line is a sum of balance movements, so the lines always add up
 * to the payout: nothing in a payout is unexplained.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { negate, sum, toDecimal } from './money.ts'
import type { Money } from './money.ts'
import { PAYOUT_STATUS_LABELS, localDateKey } from './model.ts'
import type { BalanceMovement, MovementKind, Payout, PayoutStatus } from './model.ts'

/** The derived next payout's id in routes and lists; it is never stored. */
export const UPCOMING_PAYOUT_ID = 'upcoming'

export interface PayoutLine {
  key: 'payments' | 'fees' | 'refunds' | 'refunds_returned' | 'disputes' | 'dispute_fees' | 'disputes_won'
  label: string
  amount: Money
  /** How many movements the line adds up; zero for derived lines (fees). */
  count: number
}

function linesOf(movements: BalanceMovement[], kind: MovementKind): BalanceMovement[] {
  return movements.filter((m) => m.kind === kind)
}

/**
 * Payments − fees − refunds − disputes (+ anything returned) = the payout.
 * Lines with nothing in them are left out.
 */
export function payoutLines(movements: BalanceMovement[], currency: string): PayoutLine[] {
  const total = (items: BalanceMovement[], pick: (m: BalanceMovement) => Money) => sum(items.map(pick), currency)
  const charges = linesOf(movements, 'charge')
  const refunds = linesOf(movements, 'refund')
  const returned = linesOf(movements, 'refund_reversal')
  const disputes = linesOf(movements, 'dispute')
  const won = linesOf(movements, 'dispute_reversal')
  const lines: PayoutLine[] = [
    { key: 'payments', label: 'Payments', amount: total(charges, (m) => m.gross), count: charges.length },
    { key: 'fees', label: 'Processing fees', amount: negate(total(charges, (m) => m.fee)), count: 0 },
    { key: 'refunds', label: 'Refunds', amount: total(refunds, (m) => m.net), count: refunds.length },
    { key: 'refunds_returned', label: 'Refunds returned', amount: total(returned, (m) => m.net), count: returned.length },
    { key: 'disputes', label: 'Disputes', amount: total(disputes, (m) => m.gross), count: disputes.length },
    { key: 'dispute_fees', label: 'Dispute fees', amount: negate(total(disputes, (m) => m.fee)), count: 0 },
    { key: 'disputes_won', label: 'Disputes won', amount: total(won, (m) => m.net), count: won.length },
  ]
  return lines.filter((line) => line.amount.amount !== 0)
}

// ── Tabs ──────────────────────────────────────────────────────────────────

export type PayoutTab = 'all' | 'upcoming' | PayoutStatus

export const PAYOUT_TABS: Array<{ key: PayoutTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_transit', label: PAYOUT_STATUS_LABELS.in_transit },
  { key: 'paid', label: PAYOUT_STATUS_LABELS.paid },
  { key: 'failed', label: PAYOUT_STATUS_LABELS.failed },
]

// ── CSV export ────────────────────────────────────────────────────────────

export const PAYOUT_CSV_HEADERS = ['Created', 'Payout', 'Status', 'Amount', 'Currency', 'Destination', 'Payments', 'Arrival', 'Retry of'] as const

export type PayoutCsvRow = Record<(typeof PAYOUT_CSV_HEADERS)[number], string>

/** "Arrival" is an estimate until the transfer is confirmed as sent — the file says which. */
export function payoutCsvRow(payout: Payout, payments: number): PayoutCsvRow {
  const arrival = payout.status === 'paid' && payout.paidAt
    ? `Sent ${localDateKey(Date.parse(payout.paidAt))}`
    : payout.status === 'in_transit' && payout.arrivalEstimate
      ? `Estimated ${localDateKey(Date.parse(payout.arrivalEstimate))}`
      : ''
  return {
    Created: localDateKey(Date.parse(payout.createdAt)),
    Payout: payout.id,
    Status: PAYOUT_STATUS_LABELS[payout.status],
    Amount: toDecimal(payout.amount),
    Currency: payout.amount.currency,
    Destination: `${payout.destination.bankName} •••• ${payout.destination.last4}`,
    Payments: String(payments),
    Arrival: arrival,
    'Retry of': payout.retryOf ?? '',
  }
}
