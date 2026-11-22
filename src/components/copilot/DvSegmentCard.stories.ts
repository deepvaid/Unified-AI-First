import type { Meta, StoryObj } from '@storybook/vue3'
import DvSegmentCard from './DvSegmentCard.vue'
import { useContactsStore } from '@/stores/useContacts'
import { constrain, measure } from '@/stories/decorators'
import { grid } from '@/stories/storyTemplate'

const VIP = {
  name: 'VIP Customers',
  rules: ['Lifetime spend > $500', 'Ordered in the last 90 days', 'Email engagement: high'],
  estimatedSize: 3120,
}

const INACTIVE = {
  name: 'Inactive subscribers — 6+ months',
  rules: [
    'Last purchase: more than 180 days ago',
    'No email opens: last 90 days',
    'Subscription status: active (not unsubscribed)',
  ],
  estimatedSize: 2341,
}

const meta = {
  title: 'Product/Da Vinci/DvSegmentCard',
  component: DvSegmentCard,
  tags: ['autodocs'],
  args: VIP,
  argTypes: {
    name: { control: 'text', description: 'Name of the audience segment.' },
    rules: { control: 'object', description: 'Plain-language rules that define the segment, one per row.' },
    estimatedSize: { control: 'number', description: 'Contacts that match right now.' },
    savedSegmentId: { control: 'number', description: 'The segment this card was saved as. Lives on the chat message, so a remount can\'t save twice; the card offers Save again if that segment is deleted.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
A segment Da Vinci proposes: name, size, and the rules behind it. **Save Segment** really adds the
segment to the account (dynamic, refreshing daily) — the host shows the toast — and never adds a
second copy of a name the account already has. Once saved the button reads **Saved** and the card
offers **Open segments**.

## Do's
- Write rules in plain language, most important first
- Always show the estimated size

## Don'ts
- Don't offer a preview for a segment that isn't saved — there is nothing to open yet
`,
      },
    },
  },
  decorators: [constrain('drawer')],
  render: (args) => ({
    components: { DvSegmentCard },
    setup: () => ({ args }),
    template: '<DvSegmentCard v-bind="args" />',
  }),
} satisfies Meta<typeof DvSegmentCard>

export default meta
type Story = StoryObj<typeof meta>

/** A proposed segment, not yet saved. */
export const Default: Story = {}

/** The two shapes the copilot proposes: a short rule list and a longer one. */
export const Variants: Story = {
  decorators: [constrain('dialog')],
  render: grid({ DvSegmentCard }, [
    { label: 'Three rules', args: VIP },
    { label: 'Longer names wrap', args: INACTIVE },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}

/** There is no size prop: the card fills its host — the 480px drawer body, or a narrow panel. */
export const Sizes: Story = {
  decorators: [constrain('dialog')],
  render: (args) => ({
    components: { DvSegmentCard },
    setup: () => ({ args, narrow: measure.narrow, drawer: measure.drawer }),
    template: `
      <div style="display: flex; gap: var(--mp-space-24); align-items: flex-start; flex-wrap: wrap;">
        <div :style="{ width: narrow }"><DvSegmentCard v-bind="args" /></div>
        <div :style="{ width: drawer }"><DvSegmentCard v-bind="args" /></div>
      </div>
    `,
  }),
}

/** Resting, and saved — "Saved" needs a segment that really exists in the account. */
export const States: Story = {
  decorators: [constrain('dialog')],
  render: (args) => ({
    components: { DvSegmentCard },
    setup() {
      const contacts = useContactsStore()
      const saved = contacts.segments[0]
      return { args, savedSegmentId: saved?.id }
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--mp-space-24);">
        <div><div class="text-caption text-medium-emphasis mb-2">Resting</div><DvSegmentCard v-bind="args" /></div>
        <div><div class="text-caption text-medium-emphasis mb-2">Saved</div><DvSegmentCard v-bind="args" :saved-segment-id="savedSegmentId" /></div>
      </div>
    `,
  }),
}
