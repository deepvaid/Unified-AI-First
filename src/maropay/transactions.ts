/**
 * Transactions rules — which payments sit under which tab, what the CSV
 * export holds, and which payment method each checkout-preview flow runs on.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { toDecimal } from './money.ts'
import { PAYMENT_STATUS_LABELS, PROVIDER_LABELS, localDateKey } from './model.ts'
import type { Dispute, Payment, PaymentMethodCatalogEntry, PaymentStatus, ShopperFlow } from './model.ts'
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

// ── Checkout preview flows ────────────────────────────────────────────────

export interface CheckoutFlow {
  flow: ShopperFlow
  label: string
  description: string
  icon: string
}

export const CHECKOUT_FLOWS: CheckoutFlow[] = [
  { flow: 'success', label: 'Successful payment', description: 'The shopper pays by card or wallet and it goes straight through.', icon: 'circle-check' },
  { flow: 'auth_required', label: 'Bank asks to confirm', description: '3-D Secure: the shopper confirms the payment with their bank.', icon: 'shield-check' },
  { flow: 'declined', label: 'Card declined', description: 'The shopper’s bank says no, so nothing is taken.', icon: 'circle-x' },
  { flow: 'redirect', label: 'Pay on another page', description: 'Buy now, pay later: the shopper approves on the provider’s page.', icon: 'external-link' },
  { flow: 'delayed', label: 'Delayed confirmation', description: 'Bank debit: the bank confirms a few days later.', icon: 'hourglass' },
]

/** Methods a flow can run on. Cards authenticate and decline; wallets only succeed. */
export function methodsForFlow(flow: ShopperFlow, methods: PaymentMethodCatalogEntry[]): PaymentMethodCatalogEntry[] {
  switch (flow) {
    case 'success':
      return methods.filter((m) => m.category === 'cards' || m.category === 'wallets')
    case 'auth_required':
    case 'declined':
      return methods.filter((m) => m.category === 'cards')
    case 'redirect':
      return methods.filter((m) => m.category === 'bnpl')
    case 'delayed':
      return methods.filter((m) => m.delayed)
  }
}

/** Why a flow can't run on this store's checkout, or null when it can. */
export function flowUnavailableReason(flow: ShopperFlow, methods: PaymentMethodCatalogEntry[]): string | null {
  if (methodsForFlow(flow, methods).length) return null
  switch (flow) {
    case 'success':
      return 'Turn on cards or a wallet.'
    case 'auth_required':
    case 'declined':
      return 'Turn on cards.'
    case 'redirect':
      return 'Turn on Afterpay, Affirm or Klarna.'
    case 'delayed':
      return 'Turn on ACH Direct Debit.'
  }
}
