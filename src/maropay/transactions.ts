/**
 * Transactions rules — which payments sit under which tab and what the CSV
 * export holds.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { toDecimal } from './money.ts'
import { PAYMENT_STATUS_LABELS, PROVIDER_LABELS, localDateKey } from './model.ts'
import type { Dispute, Payment, PaymentStatus } from './model.ts'
import { paymentBreakdown } from './readiness.ts'

// ── Tabs ──────────────────────────────────────────────────────────────────

export type TransactionTab = 'all' | 'succeeded' | 'pending' | 'refunded' | 'disputed' | 'failed'

/** Cancelled authorisations appear under All only: nothing was taken and nothing failed. */
export const TRANSACTION_TABS: Array<{ key: TransactionTab; label: string; statuses: PaymentStatus[] | null }> = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'succeeded', label: 'Succeeded', statuses: ['captured'] },
  { key: 'pending', label: 'Pending', statuses: ['processing', 'authorised'] },
  { key: 'refunded', label: 'Refunded', statuses: ['partially_refunded', 'refunded'] },
  { key: 'disputed', label: 'Disputed', statuses: ['disputed'] },
  { key: 'failed', label: 'Failed', statuses: ['failed'] },
]

export function inTab(payment: Payment, tab: TransactionTab): boolean {
  const statuses = TRANSACTION_TABS.find((t) => t.key === tab)?.statuses ?? null
  return statuses === null || statuses.includes(payment.status)
}

// ── CSV export ────────────────────────────────────────────────────────────

export const TRANSACTION_CSV_HEADERS = [
  'Date', 'Payment', 'Order', 'Store', 'Customer', 'Provider', 'Method', 'Currency', 'Amount', 'Refunded', 'Fee', 'Net', 'Status',
] as const

export type TransactionCsvRow = Record<(typeof TRANSACTION_CSV_HEADERS)[number], string>

/**
 * One export row. Fees and net are Maropay's to report: a payment an earlier
 * provider took leaves them blank rather than guessing.
 */
export function transactionCsvRow(payment: Payment, storeName: string, dispute: Dispute | null): TransactionCsvRow {
  const breakdown = paymentBreakdown(payment, dispute)
  const ours = payment.provider === 'maropay'
  return {
    Date: localDateKey(Date.parse(payment.createdAt)),
    Payment: payment.id,
    Order: payment.orderNumber ?? '',
    Store: storeName,
    Customer: payment.customer.name,
    Provider: PROVIDER_LABELS[payment.provider],
    Method: payment.methodLabel,
    Currency: payment.amount.currency,
    Amount: toDecimal(payment.amount),
    Refunded: toDecimal(breakdown.refunded),
    Fee: ours ? toDecimal(breakdown.fee) : '',
    Net: ours ? toDecimal(breakdown.net) : '',
    Status: PAYMENT_STATUS_LABELS[payment.status],
  }
}
