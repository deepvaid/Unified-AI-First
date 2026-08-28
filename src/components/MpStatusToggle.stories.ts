import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpStatusToggle from './MpStatusToggle.vue'

const meta = {
  title: 'Atoms/MpStatusToggle',
  component: MpStatusToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpStatusToggle\` is the status cell used in journey/data-journey tables: an inline switch plus a
colored status label. The switch is on for **Active**, off for **Paused**, and disabled for **Draft**
(drafts are activated from the builder, not the list). The component is stateless — it renders
\`status\` and emits \`toggle\`; the owning view flips the row's status.

**Use when:** a table row's status can be flipped between Active and Paused in place (journeys,
data journeys, automations).

**Don't use when:** the status is read-only (use \`MpStatusChip\`), has more than the three
Active/Paused/Draft states, or the flip needs confirmation first (open \`MpConfirmDialog\`
from the \`@toggle\` handler instead of toggling directly).

### Usage
\`\`\`html
<template #item.status="{ item }">
  <MpStatusToggle
    :status="item.status"
    @toggle="item.status = item.status === 'Active' ? 'Paused' : 'Active'"
  />
</template>
\`\`\`

### 🟢 Do's
- **Do** handle \`@toggle\` in the view and flip the row's status between Active and Paused.
- **Do** use it inside a \`v-data-table\` status column for consistency with Journeys/Data Journeys.
- **Do** keep Draft rows disabled — activation belongs to the builder's publish flow.

### 🔴 Don'ts
- **Don't** use it for statuses outside Active/Paused/Draft — use \`MpStatusChip\` for read-only badges.
- **Don't** mutate status inside the component's parent template without persisting — the switch
  reflects \`status\` on the next render, so a dropped update makes the switch snap back.

### A11y
- **Provides:** the switch carries a dynamic \`aria-label\` ("Pause" when Active, "Activate" when
  Paused) naming the action it performs, and the visible status word is associated with the switch
  input via \`aria-describedby\`, so screen readers hear the current state after the action name
  *(fixed in the Phase 4 a11y pass)*; the Draft state renders the switch \`disabled\`; the status
  word is always visible as text, so color is not the only carrier.
- **Consumer must:** re-render with the new \`status\` promptly after \`@toggle\`, and keep row
  identity clear elsewhere in the row (the aria-label does not say which journey it controls).
- **Gaps:** the disabled Draft switch is skipped by keyboard focus, leaving no focusable element
  that conveys why it cannot be toggled (backlog — would need aria-disabled instead of disabled).
        `,
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['Active', 'Paused', 'Draft'],
      description: 'Current status. Active = switch on, Paused = switch off, Draft = switch disabled.',
    },
    toggle: {
      control: false,
      description: 'Event — emitted when the switch is flipped. The view owns the state change.',
      table: { category: 'events' },
    },
  },
} satisfies Meta<typeof MpStatusToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: { status: 'Active' },
}

export const Paused: Story = {
  args: { status: 'Paused' },
}

/** Draft renders the switch disabled — drafts are activated from the builder, not the list. */
export const Draft: Story = {
  args: { status: 'Draft' },
}

/** The full state matrix side by side. */
export const AllStates: Story = {
  render: () => ({
    components: { MpStatusToggle },
    template: `
      <div class="d-flex flex-column ga-3">
        <MpStatusToggle status="Active" />
        <MpStatusToggle status="Paused" />
        <MpStatusToggle status="Draft" />
      </div>
    `,
  }),
  args: {} as any,
}

/**
 * Draft's disabled mechanism, made explicit: the switch is rendered `disabled` (per the
 * component's `:disabled="status === 'Draft'"` binding), so clicking it fires no \`toggle\`
 * event at all. This play function clicks the switch input and the counter below stays at 0.
 */
export const DisabledInteraction: Story = {
  render: () => ({
    components: { MpStatusToggle },
    setup() {
      const toggleCount = ref(0)
      function onToggle() {
        toggleCount.value++
      }
      return { toggleCount, onToggle }
    },
    template: `
      <div>
        <MpStatusToggle status="Draft" @toggle="onToggle" />
        <div class="text-caption text-medium-emphasis mt-3">Toggle events fired: {{ toggleCount }} (switch is disabled on Draft, so this stays 0)</div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]')
    input?.click()
  },
  args: {} as any,
}

/**
 * Live wiring of the \`toggle\` event: the story owns the status and flips it between
 * Active and Paused, exactly like a journeys list view does. The last event is logged below.
 */
export const ToggleEvent: Story = {
  render: () => ({
    components: { MpStatusToggle },
    setup() {
      const status = ref<'Active' | 'Paused'>('Active')
      const lastEvent = ref('—')
      function onToggle() {
        status.value = status.value === 'Active' ? 'Paused' : 'Active'
        lastEvent.value = `toggle → ${status.value}`
      }
      return { status, lastEvent, onToggle }
    },
    template: `
      <div>
        <MpStatusToggle :status="status" @toggle="onToggle" />
        <div class="text-caption text-medium-emphasis mt-3">Last event: {{ lastEvent }}</div>
      </div>
    `,
  }),
  args: {} as any,
}
