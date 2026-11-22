import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import TicketOrdersPanel from './TicketOrdersPanel.vue'
import { surfaceFrame } from '@/stories/decorators'

const meta = {
  title: 'Product/Service/TicketOrdersPanel',
  component: TicketOrdersPanel,
  tags: ['autodocs'],
  decorators: [surfaceFrame({ width: 'var(--mp-layout-inboxRailPanelWidth)', height: '640px' })],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A ticket's **Customer orders** panel. It reads the seeded stores: the ticket's customer's orders
come from Commerce (\`ordersForCustomer(email)\`), and the ticket keeps which one it's about
(\`linkedOrderId\`).

- **List** — the linked order on top, then the customer's other orders (number · date · items ·
  total · status). Search matches order numbers, products and statuses.
- **Detail** (click a row) — status, payment and channel, line items with totals, shipping and
  tracking, recent activity. Pinned actions: **Insert in reply** (emits \`insert\` with a plain-text
  summary), **Link** to the ticket, and ⋯ Open in Commerce · Unlink · Refund… · Cancel order. An
  action that doesn't apply is disabled and says why ("Already shipped — refund it instead").

### A11y
- Rows are buttons; the detail heading takes focus on open and Back returns focus to the row.
- Cancel and refund go through \`MpConfirmDialog\` / \`MpDialog\`.
        `,
      },
    },
  },
  args: { ticketId: 1524, orderId: null },
} satisfies Meta<typeof TicketOrdersPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Default — ticket #1524 (Rajan Bhanot): three orders, #10000 linked. Click one to drill in. */
export const Default: Story = {
  render: (args) => ({
    components: { TicketOrdersPanel },
    setup: () => ({ args, orderId: ref<number | null>(args.orderId ?? null) }),
    template: `<TicketOrdersPanel :ticket-id="args.ticketId" v-model:order-id="orderId" />`,
  }),
}

/** Variants — an order open in detail: #10000, still processing, so it can be cancelled. */
export const Variants: Story = {
  render: () => ({
    components: { TicketOrdersPanel },
    setup: () => ({ orderId: ref<number | null>(1) }),
    template: `<TicketOrdersPanel :ticket-id="1524" v-model:order-id="orderId" />`,
  }),
}

/** No orders — ticket #1519's customer has never bought anything. */
export const NoOrders: Story = {
  render: () => ({
    components: { TicketOrdersPanel },
    setup: () => ({ orderId: ref<number | null>(null) }),
    template: `<TicketOrdersPanel :ticket-id="1519" v-model:order-id="orderId" />`,
  }),
}

/** States — a shipped order: Cancel is disabled with its reason, Refund is available. */
export const States: Story = {
  render: () => ({
    components: { TicketOrdersPanel },
    setup: () => ({ orderId: ref<number | null>(27) }),
    template: `<TicketOrdersPanel :ticket-id="1524" v-model:order-id="orderId" />`,
  }),
}
