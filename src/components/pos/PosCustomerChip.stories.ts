import type { Meta, StoryObj } from '@storybook/vue3'
import PosCustomerChip from './PosCustomerChip.vue'
import { stack } from '@/stories/storyTemplate'
import { posSurface, constrain } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosCustomerChip',
  component: PosCustomerChip,
  tags: ['autodocs'],
  decorators: [posSurface, constrain('narrow')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The customer on this sale, at the top of the cart. Tap opens their details (\`open\`); remove sits on its
own 44px target (\`remove\`) so it is never hit by accident. The name has its own line, so it never loses
room to the tier and points. Figma kit: **Customer Chip**.

### A11y
- **Provides:** two buttons — "Customer {name}, {tier}, {points} points. Open customer details" and
  "Remove customer from sale".
- **Consumer must:** offer Undo after \`remove\` (the register uses its undo toast).
        `,
      },
    },
  },
  args: { name: 'Hannah Cole', tier: 'gold', points: 2840 },
  argTypes: { tier: { control: 'inline-radio', options: ['member', 'silver', 'gold', 'vip'] } },
} satisfies Meta<typeof PosCustomerChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: stack({ PosCustomerChip }, [
    { label: 'Member', args: { name: 'Olivia Tremblay', tier: 'member', points: 120 } },
    { label: 'Gold', args: {} },
    { label: 'VIP', args: { name: 'Henry Adler', tier: 'vip', points: 18450 } },
  ]),
}

export const Sizes: Story = {
  parameters: { docs: { description: { story: 'One size; a long name truncates while tier and points keep their line.' } } },
  render: stack({ PosCustomerChip }, [
    { label: 'Long name', args: { name: 'Alexandra Montgomery-Fitzwilliam', tier: 'silver', points: 960 } },
  ]),
}
