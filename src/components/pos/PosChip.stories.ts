import type { Meta, StoryObj } from '@storybook/vue3'
import PosChip from './PosChip.vue'
import { grid } from '@/stories/storyTemplate'
import { posSurface } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosChip',
  component: PosChip,
  tags: ['autodocs'],
  decorators: [posSurface],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A pill the cashier taps — a filter (collections, history), a preset (10%, $50, a discount reason) or a
quick action ("Custom item"). Never shorter than the 44px target; \`lg\` (48) is for money presets.
Figma kit: **Filter Chip**.

Pass \`active\` (true **or** false) for a toggle — it renders \`aria-pressed\`. Leave it unset for a
one-shot action: an action chip reads in ink, an off toggle recedes to muted until chosen.

### 🔴 Don'ts
- **Don't** use chips for the sale's next step — that is a \`PosButton\`.
- **Don't** leave a group of toggles unnamed: wrap them in \`role="group"\` with an \`aria-label\` or
  \`aria-labelledby\`.

### A11y
- **Provides:** a real button, \`aria-pressed\` on toggles, 44/48px targets, label in words.
- **Consumer must:** name the group; keep labels short enough not to wrap.
        `,
      },
    },
  },
  render: (args) => ({
    components: { PosChip },
    setup: () => ({ args }),
    template: '<PosChip v-bind="args">Apparel</PosChip>',
  }),
  args: { active: false, size: 'md' },
  argTypes: {
    active: { control: 'select', options: [undefined, true, false] },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
} satisfies Meta<typeof PosChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ PosChip }, [
    { label: 'Filter · off', args: { active: false }, slot: 'Footwear' },
    { label: 'Filter · on', args: { active: true }, slot: 'All items' },
    { label: 'Action with icon', args: { active: undefined, icon: 'plus' }, slot: 'Custom item' },
    { label: 'Preset', args: { active: false }, slot: '15%' },
  ], { columns: 'repeat(auto-fit, minmax(160px, 1fr))' }),
}

export const Sizes: Story = {
  render: grid({ PosChip }, [
    { label: 'md · 44', args: { active: false }, slot: 'Damaged' },
    { label: 'lg · 48 (cash)', args: { active: false, size: 'lg' }, slot: '$120.00' },
  ], { columns: 'repeat(auto-fit, minmax(160px, 1fr))' }),
}

export const States: Story = {
  render: grid({ PosChip }, [
    { label: 'Pressed', args: { active: true, size: 'lg' }, slot: '$115.00' },
    { label: 'Not pressed', args: { active: false, size: 'lg' }, slot: 'Exact $111.90' },
    { label: 'Action (no pressed state)', args: { active: undefined, icon: 'user-plus' }, slot: 'Add customer' },
  ], { columns: 'repeat(auto-fit, minmax(180px, 1fr))' }),
}
