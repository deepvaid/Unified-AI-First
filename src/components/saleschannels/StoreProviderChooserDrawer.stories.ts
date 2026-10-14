import type { Meta, StoryObj } from '@storybook/vue3'
import StoreProviderChooserDrawer from './StoreProviderChooserDrawer.vue'
import { storyState } from '@/components/maropay/storyFixtures'
import { storeProvidersFor } from '@/maropay/providers'

const ATLAS = 'retest-sales-notification'

const meta = {
  title: 'Product/Sales Channels/StoreProviderChooserDrawer',
  component: StoreProviderChooserDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
"Add a payment method": the real product's provider set as a select-then-commit \`MpOptionCard\` gallery in an
\`MpFormDrawer\` — the merchant's own providers (PayPal, Stripe, eWay, Afterpay, Zip) and the manual methods
(bank deposit, cheque, cash on delivery). Providers already on the store are left out. Choosing one emits its
kind; the page connects it and opens its own drawer.

**Use when:** the Add provider / Add manual method buttons on \`StorePayments\`.

### A11y
- **Provides:** the drawer's focus trap, keyboard-operable option cards with \`aria-pressed\`, Continue disabled
  until a choice is made.
        `,
      },
    },
  },
  args: { modelValue: true, setup: storeProvidersFor(storyState('m05'), ATLAS), group: 'providers' },
} satisfies Meta<typeof StoreProviderChooserDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** A Stripe merchant adding a second provider: Stripe and Bank deposit are already on the store. */
export const Default: Story = {}

export const ManualFirst: Story = {
  args: { group: 'manual' },
}
