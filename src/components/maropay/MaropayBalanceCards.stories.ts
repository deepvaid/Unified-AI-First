import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayBalanceCards from './MaropayBalanceCards.vue'
import { grid } from '@/stories/storyTemplate'
import { storyBalance, storyState } from './storyFixtures'

const meta = {
  title: 'Product/Maropay/MaropayBalanceCards',
  component: MaropayBalanceCards,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Available, pending, in-transit and next-payout figures for **one** currency — a multi-currency
business renders one row per currency, never a converted total. The next payout is an *estimate*
from what has settled; it says so, and says "Paused" when payouts are held. Composes \`MpKpiCard\`
with \`MaropayMoney\` in its value slot.
        `,
      },
    },
  },
  args: storyBalance(storyState('m10')),
} satisfies Meta<typeof MaropayBalanceCards>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: grid({ MaropayBalanceCards }, [
    { label: 'Dispute debited — negative available (M11)', args: storyBalance(storyState('m11')) },
    { label: 'Payouts paused (M08)', args: storyBalance(storyState('m08')) },
    { label: 'Failed payout returned to available (M09)', args: storyBalance(storyState('m09')) },
  ], { columns: '1fr' }),
}
