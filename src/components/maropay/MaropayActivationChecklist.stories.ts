import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayActivationChecklist from './MaropayActivationChecklist.vue'
import { stack } from '@/stories/storyTemplate'
import { storyChecklist, storyState, underReviewState } from './storyFixtures'

const meta = {
  title: 'Product/Maropay/MaropayActivationChecklist',
  component: MaropayActivationChecklist,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The seven things that must be true before a store switches to Maropay (plan §3D), from
\`activationChecklist\` in \`src/maropay/readiness.ts\`. Every item says whose move it is — **done**,
**waiting** on our payments partner, or **to do** — so waiting is never mistaken for action required.
The page supplies each item's fix through the \`#action\` slot (a button, a link or a scroll to the
section that fixes it); the checklist never builds routes itself.

**Use when:** a store's Payments page, before the store is live.

**Don't use when:** you need account-level tasks — that's \`MaropayTaskList\`.

### A11y
- **Provides:** a list of rows; each state is spoken before its label ("Waiting on our payments
  partner: Payments are enabled on your account"), so the icon never carries the state alone.
- **Consumer must:** give every \`#action\` control a label that names the fix.
        `,
      },
    },
  },
  args: { checklist: storyChecklist(storyState('m06')) },
} satisfies Meta<typeof MaropayActivationChecklist>

export default meta
type Story = StoryObj<typeof meta>

/** Switching from PayPal: the account is verified, the store's own checks are still to do. */
export const Default: Story = {
  render: (args) => ({
    components: { MaropayActivationChecklist },
    setup: () => ({ args }),
    template: `
      <MaropayActivationChecklist v-bind="args">
        <template #action="{ item }">
          <v-btn size="small" variant="outlined" class="text-none">
            {{ item.key === 'checkout_validated' ? 'Run test checkout' : 'Fix' }}
          </v-btn>
        </template>
      </MaropayActivationChecklist>
    `,
  }),
}

export const States: Story = {
  render: stack({ MaropayActivationChecklist }, [
    { label: 'Ready to activate (M15)', args: { checklist: storyChecklist(storyState('m15')) } },
    { label: 'Waiting on review', args: { checklist: storyChecklist(underReviewState()) } },
    { label: 'Information needed (M03)', args: { checklist: storyChecklist(storyState('m03')) } },
    { label: 'Store checks to do (M06)', args: { checklist: storyChecklist(storyState('m06')) } },
  ]),
}
