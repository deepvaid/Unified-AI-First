import type { Meta, StoryObj } from '@storybook/vue3'
import MaropaySupportAlert from './MaropaySupportAlert.vue'

const meta = {
  title: 'Product/Maropay/MaropaySupportAlert',
  component: MaropaySupportAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Maropost support is the first contact for Maropay. Instead of a separate support-case view, detail
pages carry this alert with the references an agent needs — account, store, payment, payout or
dispute — plus "Copy references" and "Contact support". The prototype never sends anything; the
contact action says so. Composes \`MpAlert\`.
        `,
      },
    },
  },
  args: {
    references: [
      { label: 'Maropost account', value: '2000290' },
      { label: 'Maropay account', value: 'acct_mp2000290' },
      { label: 'Payment', value: 'pay_910000' },
    ],
  },
} satisfies Meta<typeof MaropaySupportAlert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const DecisionReview: Story = {
  args: {
    title: 'Ask for this decision to be reviewed',
    message: 'Maropost support can ask our payments partner to look at the decision again. Approval isn’t guaranteed.',
  },
}
