import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayBalanceSummary from './MaropayBalanceSummary.vue'
import { grid } from '@/stories/storyTemplate'
import { storyBalance, storyState } from './storyFixtures'

const meta = {
  title: 'Product/Maropay/MaropayBalanceSummary',
  component: MaropayBalanceSummary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
One currency's balance, led by the **next payout** (Stripe Balances): the amount on its way next,
when and to which bank, then Available, Pending and In transit as two-line rows. A multi-currency
business renders one per currency, never a converted total. The next payout is an *estimate* from
what has settled — it says "≈" (read as "About") and "Paused" when payouts are held. The body is a
container query: side by side when the card is wide, stacked when narrow.

**Use when:** Maropay Overview and Payouts.

### A11y
- **Provides:** the "≈" is announced as "About"; the rows are \`MpListRow\`.
        `,
      },
    },
  },
  args: { ...storyBalance(storyState('m10')), destination: 'Mercury Bank •••• 4417', description: 'USD · daily payouts' },
} satisfies Meta<typeof MaropayBalanceSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** No variant prop — the layout follows the card's width. */
export const Variants: Story = {
  render: grid({ MaropayBalanceSummary }, [
    { label: 'Wide — side by side', args: {} },
  ], { columns: '1fr' }),
}

export const Sizes: Story = {
  render: grid({ MaropayBalanceSummary }, [
    { label: 'Narrow — stacked', args: {} },
    { label: 'Narrow — stacked', args: { destination: null } },
  ], { columns: 'repeat(2, minmax(0, 380px))' }),
}

export const States: Story = {
  render: grid({ MaropayBalanceSummary }, [
    { label: 'Dispute debited — negative available (M11)', args: storyBalance(storyState('m11')) },
    { label: 'Payouts paused (M08)', args: storyBalance(storyState('m08')) },
    { label: 'Failed payout returned to available (M09)', args: storyBalance(storyState('m09')) },
  ], { columns: '1fr' }),
}
