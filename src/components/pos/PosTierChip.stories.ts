import type { Meta, StoryObj } from '@storybook/vue3'
import PosTierChip from './PosTierChip.vue'
import { grid } from '@/stories/storyTemplate'
import { posSurface } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosTierChip',
  component: PosTierChip,
  tags: ['autodocs'],
  decorators: [posSurface],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A customer's loyalty tier, named — a thin \`PosBadge\` wrapper so the tier looks the same in the cart's
customer chip, the customer picker and the Customers view. Gold and VIP stand out; Member and Silver stay
quiet. Labels come from \`LOYALTY_TIER_LABELS\` in the contacts store. Figma kit: **Tier Chip**.

One size (\`sm\`) and no interactive states: it is a label, not a control.
        `,
      },
    },
  },
  args: { tier: 'gold' },
  argTypes: { tier: { control: 'inline-radio', options: ['member', 'silver', 'gold', 'vip'] } },
} satisfies Meta<typeof PosTierChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ PosTierChip }, [
    { label: 'Member', args: { tier: 'member' } },
    { label: 'Silver', args: { tier: 'silver' } },
    { label: 'Gold', args: { tier: 'gold' } },
    { label: 'VIP', args: { tier: 'vip' } },
  ], { columns: 'repeat(auto-fit, minmax(120px, 1fr))' }),
}
