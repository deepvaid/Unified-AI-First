import type { Meta, StoryObj } from '@storybook/vue3'
import MpStatusChip from './MpStatusChip.vue'

const meta = {
  title: 'Data Display/MpStatusChip',
  component: MpStatusChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpStatusChip\` displays the current state of an entity. It automatically applies appropriate Maropost semantic colors based on the text string matching known statuses in the business logic.

### 🟢 Do's
- **Do** always provide the specific \`type\` (e.g., 'order', 'fulfillment', 'campaign'). This is crucial because a 'Pending' status might mean different things (and need different colors) across different domains.
- **Do** use \`size="small"\` when placing chips inside Data Tables to conserve vertical space.
- **Do** use the \`showIcon\` prop explicitly for Fulfillment statuses, where the visual icon adds critical scanning speed for warehouse teams.

### 🔴 Don'ts
- **Don't** manually override colors via CSS or props. The component is deliberately rigid to enforce platform-wide color consistency for specific status terms.
- **Don't** use this component for generic tags (like "VIP Customer" or "New"). Use standard \`v-chip\` for general tagging; \`MpStatusChip\` is strictly for workflow states.

### 💡 Best Practices
- **Fallback:** If a status string is passed that the component doesn't recognize for the given \`type\`, it safely defaults to a neutral gray layout. 
- **Consistency:** If you are adding a new business status to the backend, ensure you also update the \`MpStatusChip\` logic maps to support it.
        `,
      },
    },
  },
  argTypes: {
    status: { control: 'text' },
    type: {
      control: 'select',
      options: ['order', 'fulfillment', 'payment', 'campaign', 'contact', 'ticket', 'coupon', 'priority', 'connection', 'general'],
    },
    size: { control: 'select', options: ['x-small', 'small', 'default'] },
    variant: { control: 'select', options: ['flat', 'tonal', 'outlined'] },
    showIcon: { control: 'boolean' },
  },
} satisfies Meta<typeof MpStatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { status: 'Processing', type: 'order' },
}

export const WithIcon: Story = {
  args: { status: 'Shipped', type: 'fulfillment', showIcon: true },
}

export const OrderStatuses: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div class="d-flex flex-wrap gap-2 align-center">
        <MpStatusChip status="Pending" type="order" />
        <MpStatusChip status="Processing" type="order" />
        <MpStatusChip status="Completed" type="order" />
        <MpStatusChip status="Cancelled" type="order" />
        <MpStatusChip status="Refunded" type="order" />
        <MpStatusChip status="On Hold" type="order" />
      </div>
    `,
  }),
  args: {} as any,
}

export const PriorityLevels: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div class="d-flex flex-wrap gap-2 align-center">
        <MpStatusChip status="Critical" type="priority" showIcon />
        <MpStatusChip status="High" type="priority" showIcon />
        <MpStatusChip status="Medium" type="priority" showIcon />
        <MpStatusChip status="Low" type="priority" showIcon />
      </div>
    `,
  }),
  args: {} as any,
}

export const ConnectionStatuses: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div class="d-flex flex-wrap gap-2 align-center">
        <MpStatusChip status="Connected" type="connection" showIcon />
        <MpStatusChip status="Disconnected" type="connection" showIcon />
        <MpStatusChip status="Needs Setup" type="connection" showIcon />
        <MpStatusChip status="Sync Issue" type="connection" showIcon />
        <MpStatusChip status="Auth Expired" type="connection" showIcon />
      </div>
    `,
  }),
  args: {} as any,
}

export const FulfillmentStatuses: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div class="d-flex flex-wrap gap-2 align-center">
        <MpStatusChip status="Unapproved" type="fulfillment" showIcon />
        <MpStatusChip status="Not Ready" type="fulfillment" showIcon />
        <MpStatusChip status="Ready For Fulfillment" type="fulfillment" showIcon />
        <MpStatusChip status="Shipped" type="fulfillment" showIcon />
        <MpStatusChip status="Return Requested" type="fulfillment" showIcon />
        <MpStatusChip status="Cancelled" type="fulfillment" showIcon />
      </div>
    `,
  }),
  args: {} as any,
}

export const PaymentStatuses: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div class="d-flex flex-wrap gap-2 align-center">
        <MpStatusChip status="Not Paid" type="payment" />
        <MpStatusChip status="Paid" type="payment" />
        <MpStatusChip status="Requires Action" type="payment" />
      </div>
    `,
  }),
  args: {} as any,
}

export const CampaignStatuses: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div class="d-flex flex-wrap gap-2 align-center">
        <MpStatusChip status="Draft" type="campaign" />
        <MpStatusChip status="Scheduled" type="campaign" />
        <MpStatusChip status="Sending" type="campaign" />
        <MpStatusChip status="Sent" type="campaign" />
        <MpStatusChip status="Stopped" type="campaign" />
      </div>
    `,
  }),
  args: {} as any,
}

export const AllTypes: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div>
        <h4 class="text-subtitle-2 mb-2">Order</h4>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <MpStatusChip status="Processing" type="order" />
          <MpStatusChip status="Completed" type="order" />
          <MpStatusChip status="Cancelled" type="order" />
        </div>
        <h4 class="text-subtitle-2 mb-2">Fulfillment</h4>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <MpStatusChip status="Shipped" type="fulfillment" showIcon />
          <MpStatusChip status="Ready For Fulfillment" type="fulfillment" showIcon />
          <MpStatusChip status="Unapproved" type="fulfillment" showIcon />
        </div>
        <h4 class="text-subtitle-2 mb-2">Payment</h4>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <MpStatusChip status="Paid" type="payment" />
          <MpStatusChip status="Not Paid" type="payment" />
          <MpStatusChip status="Requires Action" type="payment" />
        </div>
        <h4 class="text-subtitle-2 mb-2">Campaign</h4>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <MpStatusChip status="Draft" type="campaign" />
          <MpStatusChip status="Sent" type="campaign" />
          <MpStatusChip status="Stopped" type="campaign" />
        </div>
        <h4 class="text-subtitle-2 mb-2">Ticket</h4>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <MpStatusChip status="Open" type="ticket" />
          <MpStatusChip status="In Progress" type="ticket" />
          <MpStatusChip status="Resolved" type="ticket" />
          <MpStatusChip status="Closed" type="ticket" />
        </div>
      </div>
    `,
  }),
  args: {} as any,
}
