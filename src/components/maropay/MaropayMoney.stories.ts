import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayMoney from './MaropayMoney.vue'
import { grid } from '@/stories/storyTemplate'
import { money } from '@/maropay/money'

const meta = {
  title: 'Product/Maropay/MaropayMoney',
  component: MaropayMoney,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Renders a Maropay \`Money\` value — integer minor units plus a currency — as \`.mp-money\` markup. The
sign sits before the symbol (\`−$12.50\`, never \`$-12.50\`), and zero-decimal currencies like JPY have
no cents. Amounts are never converted or added across currencies.

### A11y
- **Provides:** one text run, so screen readers hear the full amount including "minus".
        `,
      },
    },
  },
  args: { amount: money(118_000, 'USD') },
} satisfies Meta<typeof MaropayMoney>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ MaropayMoney }, [
    { label: 'default', args: { amount: money(118_000, 'USD') } },
    { label: 'prominent', args: { amount: money(118_000, 'USD'), emphasis: 'prominent' } },
    { label: 'signed (ledger line)', args: { amount: money(2_500, 'USD'), signed: true } },
  ]),
}

export const States: Story = {
  render: grid({ MaropayMoney }, [
    { label: 'negative balance', args: { amount: money(-71_500, 'USD'), emphasis: 'prominent' } },
    { label: 'zero', args: { amount: money(0, 'USD') } },
    { label: 'JPY — no cents', args: { amount: money(12_900, 'JPY') } },
    { label: 'EUR', args: { amount: money(4_999, 'EUR') } },
  ]),
}
