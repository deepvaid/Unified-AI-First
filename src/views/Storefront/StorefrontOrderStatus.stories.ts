import type { Decorator, Meta, StoryObj } from '@storybook/vue3'
import { computed, provide } from 'vue'
import { shopperOrderStatus } from '@/storefront/orderStatus'
import type { ShopperOrder } from '@/storefront/orderStatus'
import StorefrontOrderStatus from './StorefrontOrderStatus.vue'
import { STOREFRONT } from './storefrontContext'
import type { StorefrontContext } from './storefrontContext'
import { storefrontFrame } from './storefrontStoryFixtures'

/** The one thing the status reads from its store (StorefrontLayout provides it): which drawing the theme uses. */
const drawing = (sections: boolean): Decorator => () => ({
  setup() {
    provide(STOREFRONT, { sectionsDrawing: computed(() => sections) } as unknown as StorefrontContext)
  },
  template: '<story />',
})

// Orders as the admin holds them; the shopper sees the status shopperOrderStatus gives each.
const placed: ShopperOrder = { status: 'Processing', fulfillmentStatus: 'Not Ready', paymentStatus: 'Paid', trackingNumber: null, courier: null }
const ORDERS: Record<string, ShopperOrder> = {
  'Just paid': placed,
  'Paid by bank deposit, not arrived yet': { ...placed, paymentStatus: 'Pending', paymentProvider: 'bank_deposit' },
  'Card payment failed': { ...placed, paymentStatus: 'Failed' },
  'Marked fulfilled in the admin': { ...placed, fulfillmentStatus: 'Shipped', trackingNumber: '1ZNF20001', courier: 'UPS' },
  'Completed after shipping': { ...placed, status: 'Completed', fulfillmentStatus: 'Shipped', trackingNumber: '1ZNF20001', courier: 'UPS' },
  'Cancelled and refunded': { ...placed, status: 'Cancelled', fulfillmentStatus: 'Cancelled', paymentStatus: 'Refunded' },
  Refunded: { ...placed, status: 'Refunded', paymentStatus: 'Refunded' },
}

const meta = {
  title: 'Product/Storefront/StorefrontOrderStatus',
  component: StorefrontOrderStatus,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
An order's status as its shopper sees it, on the account page and the order's own page
(\`/account/orders/:number\`). The admin's order, fulfilment and payment statuses become one of
seven plain words (\`shopperOrderStatus\`, src/storefront/orderStatus.ts): Preparing, Awaiting
payment, Payment not received, Shipped, Delivered, Cancelled, Refunded.

### Behaviour
- Always an **icon and the word**, never the colour alone.
- On the sections drawing (Northfold) the status sits on the theme's quiet surface in its text
  colour, with the theme's divider and corners; only the icon takes the status's colour (each at
  least 5:1 on that surface).
- A classic theme (Vitaheal) keeps the tinted pill: each tone paints its own fill and text, so a
  dark theme cannot put dark text on it.

Out of system on purpose (P4-8): it is part of the store's own pages.
        `,
      },
    },
  },
  decorators: [drawing(true), storefrontFrame()],
  args: { status: shopperOrderStatus(placed) },
} satisfies Meta<typeof StorefrontOrderStatus>

export default meta
type Story = StoryObj<typeof meta>

/** A new order: paid, being packed. */
export const Default: Story = {}

/** Every status a shopper can see, beside the admin state that gives it. */
export const EveryStatus: Story = {
  render: () => ({
    components: { StorefrontOrderStatus },
    setup: () => ({ rows: Object.entries(ORDERS).map(([label, order]) => ({ label, status: shopperOrderStatus(order) })) }),
    template: `
      <dl style="display: grid; grid-template-columns: auto 1fr; gap: 12px 24px; align-items: center; margin: 0">
        <template v-for="row in rows" :key="row.label">
          <dt style="font-size: 14px">{{ row.label }}</dt>
          <dd style="margin: 0"><StorefrontOrderStatus :status="row.status" /></dd>
        </template>
      </dl>`,
  }),
}

/** The same statuses on a classic theme's drawing: tinted pills. */
export const ClassicTheme: Story = {
  ...EveryStatus,
  decorators: [drawing(false)],
}
