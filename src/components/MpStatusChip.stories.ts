import type { Meta, StoryObj } from '@storybook/vue3'
import MpStatusChip from './MpStatusChip.vue'
import { grid, liquidskyDocs } from '@/stories/storyTemplate'

const meta = {
  title: 'Atoms/MpStatusChip',
  component: MpStatusChip,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('atoms-mpstatuschip') + `
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
- **Do** use \`size="sm"\` when placing chips inside Data Tables to conserve vertical space.
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
      options: ['order', 'fulfillment', 'payment', 'payout', 'dispute', 'method', 'readiness', 'campaign', 'contact', 'ticket', 'coupon', 'subscription', 'priority', 'connection', 'stock', 'report', 'general'],
      description: 'Business domain used to resolve the status → color mapping. Unknown statuses fall back to the general map, then neutral.',
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Chip size on the shared sm|md|lg ramp (P2-1). Heights come from component.chip.height.* — 20 / 24 / 32. Use "sm" inside data tables.' },
    variant: { control: 'select', options: ['flat', 'tonal', 'outlined'], description: 'Chip fill style. Tonal (default) is the platform standard.' },
    showIcon: { control: 'boolean', description: 'Prepend the mapped status icon (available for fulfillment, campaign, ticket, order, payment, payout, dispute, method, readiness, priority, connection, stock).' },
  },
} satisfies Meta<typeof MpStatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { status: 'Processing', type: 'order' },
}

/** The three fill treatments. `tonal` is the default — a whisper of colour, not a block of it. */
export const Variants: Story = {
  render: () => ({
    components: { MpStatusChip },
    setup: () => ({ variants: ['tonal', 'flat', 'outlined'] }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div v-for="v in variants" :key="v">
          <div class="text-caption text-medium-emphasis mb-2">{{ v }}</div>
          <div class="d-flex flex-wrap ga-2 align-center">
            <MpStatusChip status="Completed" type="order" :variant="v" />
            <MpStatusChip status="On hold" type="order" :variant="v" />
            <MpStatusChip status="Cancelled" type="order" :variant="v" />
            <MpStatusChip status="Archived" type="order" :variant="v" />
          </div>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** All three sizes on the shared sm|md|lg ramp. */
export const Sizes: Story = {
  render: grid(
    { MpStatusChip },
    (['sm', 'md', 'lg'] as const).map((size) => ({
      label: size,
      args: { status: 'Shipped', type: 'fulfillment', size, showIcon: true },
    })),
  ),
  args: {} as never,
}

/** Every tone the chip maps to, plus the icon on/off state and an unmapped status falling back to neutral. */
export const States: Story = {
  render: () => ({
    components: { MpStatusChip },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">all five tones</div>
          <div class="d-flex flex-wrap ga-2 align-center">
            <MpStatusChip status="Processing" type="order" />
            <MpStatusChip status="Completed" type="order" />
            <MpStatusChip status="On hold" type="order" />
            <MpStatusChip status="Cancelled" type="order" />
            <MpStatusChip status="Archived" type="order" />
          </div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">show-icon</div>
          <div class="d-flex flex-wrap ga-2 align-center">
            <MpStatusChip status="Shipped" type="fulfillment" show-icon />
            <MpStatusChip status="Cancelled" type="fulfillment" show-icon />
          </div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">unmapped status — falls back to the neutral tone rather than throwing</div>
          <MpStatusChip status="Something we've never seen" type="order" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** A sample of the most-used types. `FullMatrix` lists every type and every status. */
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
          <MpStatusChip status="Pending" type="payment" />
          <MpStatusChip status="Failed" type="payment" />
        </div>
        <h4 class="text-subtitle-2 mb-2">Campaign</h4>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <MpStatusChip status="Draft" type="campaign" />
          <MpStatusChip status="Sent" type="campaign" />
          <MpStatusChip status="Scheduled" type="campaign" />
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
 * The complete status × type matrix: every status string the component maps, for all sixteen
 * types, with the mapped icon where a type has one, plus the neutral fallback for an unknown
 * status. This is the source of truth for which strings resolve to which tone.
 *
 * `readiness` is Maropay's one map for every account and store state dimension, so
 * Submitted → Verified → Ready to activate → Live read as distinct steps instead of a single
 * "Connected". Payouts say "Sent to bank" (the confirmed event), never "Received".
 */
export const FullMatrix: Story = {
  render: () => ({
    components: { MpStatusChip },
    setup() {
      // Mirrors the keys of `toneMap` in MpStatusChip.vue (the lookup is case-insensitive).
      const matrix: Record<string, string[]> = {
        order: ['Processing', 'Completed', 'Cancelled', 'Refunded', 'On hold', 'Archived'],
        fulfillment: [
          'Unapproved', 'Not ready', 'Ready for fulfillment', 'Shipped', 'Return requested',
          'Cancelled', 'Fulfilled', 'Unfulfilled', 'Partial', 'Awaiting fulfillment',
          'Picking', 'Packed', 'Ready to ship',
        ],
        payment: [
          'Paid', 'Refunded', 'Voided', 'Pending', 'Failed', 'Authorised', 'Partially refunded',
          'Disputed', 'Succeeded', 'Processing', 'Cancelled',
        ],
        payout: ['Upcoming', 'In transit', 'Sent to bank', 'Failed'],
        dispute: ['Needs response', 'Under review', 'Won', 'Lost', 'Accepted'],
        method: ['Available', 'Setup required', 'Pending approval', 'Enabled', 'Unavailable'],
        readiness: [
          'Not started', 'In progress', 'Submitted', 'Not submitted', 'Under review', 'Action required',
          'Verified', 'Rejected', 'Declined', 'Not enabled', 'Enabled', 'Restricted', 'Disabled',
          'Ready', 'Paused', 'Inactive', 'Needs setup', 'Ready to activate', 'Live', 'Pending',
        ],
        campaign: ['Sent', 'Scheduled', 'Draft', 'Sending', 'Active', 'Paused', 'Completed', 'Failed', 'Archived', 'Aborted', 'Recurring'],
        contact: ['Active', 'Subscribed', 'Unsubscribed', 'Bounced', 'Pending', 'Confirmed', 'Suspended', 'Suppressed', 'Spam', 'Hard bounce'],
        ticket: ['Open', 'In progress', 'Awaiting reply', 'Resolved', 'Closed', 'On hold', 'Escalated', 'New', 'Pending'],
        coupon: ['Active', 'Expired', 'Scheduled', 'Used', 'Disabled'],
        subscription: ['Active', 'Paused', 'Cancelled', 'Payment failed'],
        priority: ['Critical', 'Urgent', 'High', 'Medium', 'Normal', 'Low'],
        connection: [
          'Connected', 'Disconnected', 'Needs setup', 'Sync issue', 'Auth expired', 'Syncing',
          'Error', 'Healthy', 'Active', 'Setup incomplete', 'Inactive',
        ],
        stock: ['In stock', 'Low stock', 'Out of stock', 'Backordered', 'Discontinued'],
        report: ['Scheduled', 'Recurring'],
        general: [
          'Active', 'Inactive', 'Pending', 'Error', 'Published', 'Draft', 'Archived',
          'Enabled', 'Disabled', 'Failed', 'Success', 'Required', 'Optional',
          'Running', 'Paused', 'Completed', 'Indexing', 'Available', 'Unconfigured',
          'Info', 'Warning', 'Connected', 'Disconnected', 'Needs setup', 'Sync issue', 'Auth expired',
          'Healthy', 'Needs attention', 'Incomplete', 'Open', 'Closed', 'Online', 'Offline',
          'Syncing', 'Invited', 'Deactivated', 'Verified', 'Unverified', 'Finished',
        ],
      }
      return { matrix }
    },
    template: `
      <div>
        <div v-for="(statuses, type) in matrix" :key="type" class="mb-4">
          <h4 class="text-subtitle-2 text-capitalize mb-2">{{ type }}</h4>
          <div class="d-flex flex-wrap ga-2 align-center">
            <MpStatusChip v-for="s in statuses" :key="s" :status="s" :type="type" show-icon />
          </div>
        </div>
        <h4 class="text-subtitle-2 mb-2">Unknown status → neutral fallback</h4>
        <div class="d-flex flex-wrap ga-2 align-center">
          <MpStatusChip status="Some custom status" type="order" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}
