import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayActivateDialog from './MaropayActivateDialog.vue'

function consequences(takeCards: boolean): string[] {
  return [
    'Shoppers can pay with Cards, Apple Pay and Google Pay through Maropay.',
    takeCards
      ? 'New checkouts on Atlas Outfitters go through Maropay instead of Stripe for cards. Earlier payments, refunds and payouts stay with Stripe.'
      : 'Stripe keeps taking cards on Atlas Outfitters. Maropay adds PayPal beside it.',
    'Bank deposit stays as it is.',
    takeCards ? 'No more Maropost platform fee on PayPal (illustrative 1% today). Other providers keep theirs while they stay connected.' : 'The illustrative Maropost platform fees on Stripe stay as they are.',
    'Money is paid out to Mercury Bank •••• 4417 — daily, 2 business days after a payment.',
  ]
}

const meta = {
  title: 'Product/Maropay/MaropayActivateDialog',
  component: MaropayActivateDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The Activate dialog for a store: one choice when the store already has a gateway taking cards —
Maropay takes them (the default), or the gateway keeps them and Maropay adds only what it lacks — and a
consequences list that restates whichever the owner picked (\`consequences(takeCards)\`). Composes \`MpDialog\`
at \`size="sm"\`; \`MpConfirmDialog\` has no room for a control.

**Use when:** activating Maropay on a store, from the store's Payments page or Maropay's page for the store.

**Don't use when:** stopping Maropay — that stays an \`MpConfirmDialog danger\`.

### A11y
- **Provides:** the dialog shell's focus handling, a labelled checkbox with a persistent hint, the list
  as the dialog's description.
- **Consumer must:** act on \`confirm(takeCards)\`.
        `,
      },
    },
  },
  args: { modelValue: true, storeName: 'Atlas Outfitters', gateway: 'Stripe', consequences },
} satisfies Meta<typeof MaropayActivateDialog>

export default meta
type Story = StoryObj<typeof meta>

/** A store on Stripe: the choice is offered, Maropay takes cards by default. */
export const Default: Story = {}

/** A store with no gateway: no choice, Maropay simply takes new checkouts. */
export const NoGateway: Story = {
  args: { gateway: null, consequences: () => ['Shoppers can pay with Cards, Apple Pay and Google Pay through Maropay.', 'Maropay takes new checkouts on Atlas Outfitters.', 'Bank deposit stays as it is.'] },
}
