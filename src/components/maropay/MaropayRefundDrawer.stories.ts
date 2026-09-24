import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayRefundDrawer from './MaropayRefundDrawer.vue'
import { money } from '@/maropay/money'
import { fail, ok } from '@/maropay/model'
import type { Money } from '@/maropay/money'
import type { Payment } from '@/maropay/model'
import { storyPayment } from './storyFixtures'

const ours = storyPayment('m10', (p) => p.status === 'captured' && p.provider === 'maropay')
const paypal = storyPayment('m06', (p) => p.status === 'captured' && p.provider === 'paypal')

/** A stand-in for the store action: refunds succeed in the story without touching real state. */
function fakeRefund(payment: Payment) {
  return (amount: Money, reason: string, key: string) => ok({
    payment,
    refund: { id: 're_story', amount, reason, status: 'succeeded' as const, at: new Date().toISOString(), idempotencyKey: key, provider: payment.provider, failureReason: null },
  })
}

const meta = {
  title: 'Product/Maropay/MaropayRefundDrawer',
  component: MaropayRefundDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      story: { inline: false, height: '640px' },
      description: {
        component: `
### Overview
Refund a payment from its Maropay page or from the order. Composes \`MpFormDrawer\` at \`sm\`. The
amount defaults to what's left to refund and can't exceed it; the note says where the money comes
from (the Maropay balance, fees not returned) — or, for a payment an **earlier provider** took,
that the refund goes back through that provider and never touches the Maropay balance.

The page passes the store action as \`refund\`. The drawer keeps one idempotency key per attempt:
pressing Refund twice, or retrying after a timeout, can't refund twice. A refund the shopper's bank
rejects keeps the drawer open with the reason.

**Use when:** refunding a Maropay-tracked payment.

**Don't use when:** the order has no tracked payment — the order page keeps its own drawer.

### A11y
- **Provides:** a labelled amount field whose error says the limit; outcomes are \`MpAlert\`s with
  live regions.
        `,
      },
    },
  },
  args: {
    modelValue: true,
    payment: ours,
    remaining: ours.amount,
    storeName: 'Atlas Outfitters',
    refund: fakeRefund(ours),
  },
} satisfies Meta<typeof MaropayRefundDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** A payment PayPal took before the store switched: the refund goes back through PayPal. */
export const OriginalProvider: Story = {
  args: { payment: paypal, remaining: paypal.amount, refund: fakeRefund(paypal) },
}

/** The store can't cover the refund right now (the reviewer's "Balance too low" switch). */
export const Refused: Story = {
  args: {
    remaining: money(ours.amount.amount - 2500, 'USD'),
    refund: () => fail('insufficient_balance', 'Your Maropay balance can’t cover this refund right now. It can be issued once new payments settle.'),
  },
}
