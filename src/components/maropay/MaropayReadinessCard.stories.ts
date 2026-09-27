import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayReadinessCard from './MaropayReadinessCard.vue'
import { grid } from '@/stories/storyTemplate'
import { closedState, storyReadiness, storyState, underReviewState } from './storyFixtures'

const meta = {
  title: 'Product/Maropay/MaropayReadinessCard',
  component: MaropayReadinessCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The Maropay overview's lead card: one instruction derived from the account state
(\`deriveOverviewInstruction\` in \`src/maropay/readiness.ts\`) above the state dimensions it came from —
setup, verification, payments, payouts and stores. The dimensions stay visible so *submitted*,
*verified*, *ready to activate* and *live* never collapse into a single "Connected" (plan §4).

**Use when:** the Maropay overview, and the Settings › Payment Account signpost.

**Don't use when:** you need a per-store checklist — that's the store's activation checklist.

### A11y
- **Provides:** the headline is a real \`h2\`/\`h3\` (\`headingLevel\`); every dimension is a \`dl\` pair with
  chip text, so colour never carries the state alone.
- **Consumer must:** pass a resolved \`actionTo\` route — the card never builds routes itself.
        `,
      },
    },
  },
  args: {
    ...storyReadiness(storyState('m10')),
    actionTo: '/accounts/2000290/maropay/transactions',
  },
} satisfies Meta<typeof MaropayReadinessCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Every headline the overview can show, in priority order. */
export const States: Story = {
  render: grid({ MaropayReadinessCard }, [
    { label: 'Closed', args: { ...storyReadiness(closedState()), actionTo: null } },
    { label: 'Setup in progress (M02)', args: storyReadiness(storyState('m02')) },
    { label: 'Provide information (M03)', args: storyReadiness(storyState('m03')) },
    { label: 'Under review', args: storyReadiness(underReviewState()) },
    { label: 'Declined (M04)', args: { ...storyReadiness(storyState('m04')), actionTo: null } },
    { label: 'Set up the store (M05)', args: storyReadiness(storyState('m05')) },
    { label: 'Ready to activate (M15)', args: storyReadiness(storyState('m15')) },
    { label: 'Payouts need attention (M09)', args: storyReadiness(storyState('m09')) },
    { label: 'Activate another store (M07)', args: storyReadiness(storyState('m07')) },
    { label: 'Information needed later (M16)', args: storyReadiness(storyState('m16')) },
    { label: 'Deadline passed (M17)', args: storyReadiness(storyState('m17')) },
    { label: 'Active (M10)', args: storyReadiness(storyState('m10')) },
  ], { columns: '1fr' }),
}
