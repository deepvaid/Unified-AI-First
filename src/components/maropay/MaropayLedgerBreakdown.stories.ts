import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayLedgerBreakdown from './MaropayLedgerBreakdown.vue'
import { stack } from '@/stories/storyTemplate'
import { money } from '@/maropay/money'

const usd = (amount: number) => money(amount, 'USD')

const meta = {
  title: 'Product/Maropay/MaropayLedgerBreakdown',
  component: MaropayLedgerBreakdown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Where the money went, line by line: signed amounts that add up to the total underneath. A payment
shows gross minus fees, refunds and disputes; a payout uses the same shape for the payments, fees
and refunds inside it. A line can link to the records behind it (\`to\`), and the caption says what
the figures leave out.

**Use when:** explaining how an amount was reached.

**Don't use when:** you only need one figure — use \`MaropayMoney\`.

### A11y
- **Provides:** a \`dl\` of label/amount pairs; signs are real characters ("−$4.04"), so screen readers
  hear the direction of each line.
        `,
      },
    },
  },
  args: {
    title: 'Money',
    lines: [
      { label: 'Amount captured', amount: usd(12900) },
      { label: 'Processing fee', amount: usd(-404) },
      { label: 'Refunded', amount: usd(-2500) },
    ],
    total: { label: 'Net to you', amount: usd(9996) },
    caption: '$104.00 left to refund. Processing fees aren’t returned on refunds.',
  },
} satisfies Meta<typeof MaropayLedgerBreakdown>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: stack({ MaropayLedgerBreakdown }, [
    { label: 'Partially refunded payment', args: {} },
    {
      label: 'Lost dispute',
      args: {
        lines: [
          { label: 'Amount captured', amount: usd(8900) },
          { label: 'Processing fee', amount: usd(-288) },
          { label: 'Lost to dispute', amount: usd(-8900) },
          { label: 'Dispute fee', amount: usd(-1500) },
        ],
        total: { label: 'Net to you', amount: usd(-1788) },
        caption: undefined,
      },
    },
    {
      label: 'Payout, with linked lines',
      args: {
        title: 'Payout breakdown',
        lines: [
          { label: 'Payments', amount: usd(41220), hint: '4 payments', to: '/accounts/2000290/maropay/transactions' },
          { label: 'Fees', amount: usd(-1316) },
          { label: 'Refunds', amount: usd(-2500), hint: '1 refund' },
        ],
        total: { label: 'Paid out', amount: usd(37404) },
        caption: undefined,
      },
    },
  ]),
}
