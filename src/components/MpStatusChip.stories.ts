import type { Meta, StoryObj } from '@storybook/vue3'
import MpStatusChip from './MpStatusChip.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Data Display/MpStatusChip',
  component: MpStatusChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`MpStatusChip\` displays the current state of an entity. It automatically applies appropriate Maropost semantic colors based on the text string matching known statuses in the business logic (lookup is case-insensitive).

**Use when:** rendering a workflow state in a table cell, card, or detail view — orders, fulfillments, payments, campaigns, contacts, tickets, coupons, priorities, connections.

**Don't use when:** tagging or categorizing (use \`v-chip\`), toggling a state (use \`MpStatusToggle\`), or identifying a data source (use \`MpSourceCloudChip\`).

### Usage
\`\`\`html
<template #item.status="{ item }">
  <MpStatusChip :status="item.status" type="order" />
</template>
<template #item.fulfillment="{ item }">
  <MpStatusChip :status="item.fulfillment" type="fulfillment" show-icon />
</template>
\`\`\`

### 🟢 Do's
- **Do** always provide the specific \`type\` (e.g., 'order', 'fulfillment', 'campaign'). This is crucial because a 'Pending' status might mean different things (and need different colors) across different domains.
- **Do** use \`size="small"\` when placing chips inside Data Tables to conserve vertical space.
- **Do** use the \`showIcon\` prop explicitly for Fulfillment statuses, where the visual icon adds critical scanning speed for warehouse teams.

### 🔴 Don'ts
- **Don't** manually override colors via CSS or props. The component is deliberately rigid to enforce platform-wide color consistency for specific status terms.
- **Don't** use this component for generic tags (like "VIP Customer" or "New"). Use standard \`v-chip\` for general tagging; \`MpStatusChip\` is strictly for workflow states.

### 💡 Best Practices
- **Fallback:** If a status string is passed that the component doesn't recognize for the given \`type\`, it falls back to the \`general\` map, then to a neutral gray layout.
- **Consistency:** If you are adding a new business status to the backend, ensure you also update the \`MpStatusChip\` logic maps to support it.

### A11y
- **Provides:** the status is always visible as text, so color is never the sole carrier of meaning; tonal variants use theme tokens for contrast; the optional icon inherits \`currentColor\` and is decorative (\`v-icon\` is \`aria-hidden\`).
- **Consumer must:** pass human-readable status strings (the chip renders \`status\` verbatim) and keep the chip non-interactive — wire row actions elsewhere.
- **Gaps:** none found at baseline; the chip renders as a static element with no focusable parts.
        `,
      },
    },
  },
  argTypes: {
    status: { control: 'text', description: 'Status text, rendered verbatim. Matched case-insensitively against the tone map for the given type.' },
    type: {
      control: 'select',
      options: ['order', 'fulfillment', 'payment', 'campaign', 'contact', 'ticket', 'coupon', 'priority', 'connection', 'general'],
      description: 'Business domain used to resolve the status → color mapping. Unknown statuses fall back to the general map, then neutral.',
    },
    size: { control: 'select', options: ['x-small', 'small', 'default'], description: 'Chip size. Use "small" inside data tables.' },
    variant: { control: 'select', options: ['flat', 'tonal', 'outlined'], description: 'Chip fill style. Tonal (default) is the platform standard.' },
    showIcon: { control: 'boolean', description: 'Prepend the mapped status icon (available for fulfillment, campaign, ticket, order, payment, priority, connection).' },
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

/** Pinned dark — tonal chips on L1 surfaces. */
export const DarkModeOrderStatuses: Story = {
  globals: darkModeGlobals,
  ...OrderStatuses,
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

/**
 * The complete status × type matrix — every status string the component maps for
 * every type, plus the neutral fallback for unknown statuses. This is the source
 * of truth for which strings resolve to which tone.
 */
export const FullMatrix: Story = {
  render: () => ({
    components: { MpStatusChip },
    setup() {
      // Mirrors the component's toneMap keys, title-cased for display
      // (the lookup is case-insensitive).
      const matrix: Record<string, string[]> = {
        order: ['Processing', 'Completed', 'Cancelled', 'Refunded', 'On Hold', 'Archived'],
        fulfillment: [
          'Unapproved', 'Not Ready', 'Ready For Fulfillment', 'Shipped', 'Return Requested',
          'Cancelled', 'Fulfilled', 'Unfulfilled', 'Partial', 'Awaiting Fulfillment',
          'Picking', 'Packed', 'Ready To Ship',
        ],
        payment: ['Paid', 'Refunded', 'Voided', 'Pending', 'Failed', 'Authorised', 'partially_refunded'],
        campaign: ['Sent', 'Scheduled', 'Draft', 'Sending', 'Active', 'Paused', 'Completed', 'Failed', 'Archived', 'Aborted'],
        contact: ['Active', 'Subscribed', 'Unsubscribed', 'Bounced', 'Pending', 'Confirmed', 'Suspended', 'Suppressed', 'Spam', 'Hard Bounce'],
        ticket: ['Open', 'In Progress', 'Awaiting Reply', 'Resolved', 'Closed', 'On Hold', 'Escalated', 'New'],
        coupon: ['Active', 'Expired', 'Scheduled', 'Used', 'Disabled'],
        priority: ['Critical', 'Urgent', 'High', 'Medium', 'Normal', 'Low'],
        connection: ['Connected', 'Disconnected', 'Needs Setup', 'Sync Issue', 'Auth Expired', 'Syncing', 'Error', 'Healthy'],
        general: [
          'Active', 'Inactive', 'Pending', 'Error', 'Published', 'Draft', 'Archived',
          'Enabled', 'Disabled', 'Failed', 'Running', 'Paused', 'Completed',
          'Connected', 'Disconnected', 'Needs Setup', 'Sync Issue', 'Auth Expired',
          'Healthy', 'Needs Attention', 'Incomplete', 'Open', 'Closed', 'Online', 'Offline', 'Syncing',
        ],
      }
      return { matrix }
    },
    template: `
      <div>
        <div v-for="(statuses, type) in matrix" :key="type" class="mb-4">
          <h4 class="text-subtitle-2 text-capitalize mb-2">{{ type }}</h4>
          <div class="d-flex flex-wrap gap-2 align-center">
            <MpStatusChip v-for="s in statuses" :key="s" :status="s" :type="type" />
          </div>
        </div>
        <h4 class="text-subtitle-2 mb-2">Unknown status → neutral fallback</h4>
        <div class="d-flex flex-wrap gap-2 align-center">
          <MpStatusChip status="Some Custom Status" type="order" />
        </div>
      </div>
    `,
  }),
  args: {} as any,
}

/** Size × variant matrix on a single status, for density decisions in tables vs detail views. */
export const SizesAndVariants: Story = {
  render: () => ({
    components: { MpStatusChip },
    setup() {
      const sizes = ['x-small', 'small', 'default']
      const variants = ['tonal', 'flat', 'outlined']
      return { sizes, variants }
    },
    template: `
      <div>
        <div v-for="variant in variants" :key="variant" class="mb-4">
          <h4 class="text-subtitle-2 text-capitalize mb-2">{{ variant }}</h4>
          <div class="d-flex flex-wrap gap-2 align-center">
            <MpStatusChip
              v-for="size in sizes"
              :key="size"
              status="Shipped"
              type="fulfillment"
              :size="size"
              :variant="variant"
              showIcon
            />
          </div>
        </div>
      </div>
    `,
  }),
  args: {} as any,
}
