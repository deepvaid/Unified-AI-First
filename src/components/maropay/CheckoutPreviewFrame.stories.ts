import type { Meta, StoryObj } from '@storybook/vue3'
import CheckoutPreviewFrame from './CheckoutPreviewFrame.vue'
import { grid, stack } from '@/stories/storyTemplate'
import { money } from '@/maropay/money'

const methods = [
  { id: 'card', label: 'Cards', category: 'cards' as const },
  { id: 'apple_pay', label: 'Apple Pay', category: 'wallets' as const },
  { id: 'google_pay', label: 'Google Pay', category: 'wallets' as const },
  { id: 'afterpay_clearpay', label: 'Afterpay', category: 'bnpl' as const },
]

const meta = {
  title: 'Product/Maropay/CheckoutPreviewFrame',
  component: CheckoutPreviewFrame,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The store's checkout as a shopper sees it, drawn inside the admin for Maropay's checkout preview.
It is a **merchant-chrome simulation**, so it keeps a storefront look of its own — built on tokens and
re-skinned only through its \`--cp-*\` custom properties, never \`:deep\`. It presents and emits; the
page runs the checkout and feeds back the \`stage\`: checkout, declined, the bank's 3-D Secure check,
a buy-now-pay-later redirect, processing (delayed methods) and the confirmation.

Only the store's ready methods are passed in, so a method still awaiting approval simply isn't there.
Methods a run can't use stay visible but can't be picked.

**Use when:** Maropay → Checkout preview.

**Don't use when:** you need a real storefront render — that's \`StorefrontPreview\`.

### A11y
- **Provides:** a labelled radio group for methods, a live region announcing each stage, and a
  labelled verification-code input on the bank check.
        `,
      },
    },
  },
  args: {
    storeName: 'Atlas Outfitters',
    domain: 'atlas-outfitters.uat.maropost.store',
    product: { name: 'Patagonia Better Sweater Fleece Vest', price: money(18400, 'USD') },
    customer: { name: 'Harper Clark', email: 'harper.clark@email.com' },
    methods,
    usable: ['card', 'apple_pay', 'google_pay'],
    method: 'card',
    stage: 'checkout',
    orderNumber: '#20001',
  },
} satisfies Meta<typeof CheckoutPreviewFrame>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Desktop and the phone width most shoppers use. */
export const Sizes: Story = {
  render: grid({ CheckoutPreviewFrame }, [
    { label: 'Desktop', args: { device: 'desktop' } },
    { label: 'Mobile', args: { device: 'mobile' } },
  ], { columns: '1fr' }),
}

export const States: Story = {
  render: stack({ CheckoutPreviewFrame }, [
    { label: 'Declined', args: { stage: 'declined', declineMessage: 'The card was declined. The shopper can try another card.' } },
    { label: 'Bank asks to confirm (3-D Secure)', args: { stage: 'authenticate' } },
    { label: 'Pay on another page', args: { stage: 'redirect', method: 'afterpay_clearpay', usable: ['afterpay_clearpay'] } },
    { label: 'Delayed confirmation', args: { stage: 'processing' } },
    { label: 'Confirmed', args: { stage: 'complete' } },
    { label: 'Processing (Pay pressed)', args: { busy: true } },
  ]),
}
