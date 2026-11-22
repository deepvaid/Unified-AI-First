import type { Meta, StoryObj } from '@storybook/vue3'
import DvCatalogGateCard from './DvCatalogGateCard.vue'
import { grid } from '@/stories/storyTemplate'
import { constrain } from '@/stories/decorators'

const TRIAL_USED = { kind: 'trial', limit: 50, used: 50, expired: false } as const
const PACK_USED = { kind: 'pack', limit: 500, used: 500, expired: false } as const
const NONE = { kind: 'none', limit: 0, used: 0, expired: false } as const

const meta = {
  title: 'Product/Da Vinci/DvCatalogGateCard',
  component: DvCatalogGateCard,
  tags: ['autodocs'],
  decorators: [constrain('narrow')],
  args: {
    reason: 'trial_exhausted',
    wallet: TRIAL_USED,
  },
  argTypes: {
    reason: {
      control: 'select',
      options: ['trial_exhausted', 'no_credits', 'no_commerce', 'kill_switch', 'role'],
      description: 'PRD `gate_reason`. Each has its own copy and actions.',
    },
    wallet: { control: 'object', description: '`CatalogWallet` — decides trial-ended vs used-up copy, pack vs no pack, and the usage meter.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
Why Catalog Co-Pilot can't draft right now, and what to do about it. Composes the shared Da Vinci card
chrome (\`DvOnboardingCardShell\`) with an \`MpUsageMeter\` when there is an allowance to show. Emits
\`action\` with \`upgrade\` (Plans), \`buy-credits\` (Billing add-ons), \`talk-to-sales\` or \`add-manually\`;
the host owns navigation and the sales dialog.

## Rules
- A gate blocks generation only. Every variant says the manual product path still works.
- Copy is non-technical — the kill switch never mentions an incident, a flag or a model.
`,
      },
    },
  },
} satisfies Meta<typeof DvCatalogGateCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ DvCatalogGateCard }, [
    { label: 'Trial allowance used', args: { reason: 'trial_exhausted', wallet: TRIAL_USED } },
    { label: 'No Co-Pilot pack', args: { reason: 'no_credits', wallet: NONE } },
    { label: 'No Commerce Cloud', args: { reason: 'no_commerce', wallet: NONE } },
    { label: 'Kill switch', args: { reason: 'kill_switch', wallet: NONE } },
    { label: 'View-only role', args: { reason: 'role', wallet: NONE } },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}

export const States: Story = {
  render: grid({ DvCatalogGateCard }, [
    { label: 'Trial — all 5 actions used', args: { reason: 'trial_exhausted', wallet: TRIAL_USED } },
    { label: 'Trial — ended', args: { reason: 'trial_exhausted', wallet: { ...TRIAL_USED, expired: true } } },
    { label: 'Pack — used up', args: { reason: 'no_credits', wallet: PACK_USED } },
    { label: 'Pack — none', args: { reason: 'no_credits', wallet: NONE } },
  ], { columns: 'repeat(auto-fit, minmax(300px, 1fr))' }),
}
