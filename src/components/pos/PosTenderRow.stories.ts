import type { Meta, StoryObj } from '@storybook/vue3'
import PosTenderRow from './PosTenderRow.vue'
import { stack } from '@/stories/storyTemplate'
import { posSurface, constrain } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosTenderRow',
  component: PosTenderRow,
  tags: ['autodocs'],
  decorators: [posSurface, constrain('drawer')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
One way to pay — card, Tap to Pay, cash, gift card, split. A full-width row, one tap to choose; the chosen
row takes the retail accent and a check. Figma kit: **Tender Row**.

### A11y
- **Provides:** a button with \`aria-pressed\`; the check is decorative (the pressed state says it).
- **Consumer must:** list only the tenders this register accepts, and keep exactly one pressed.
        `,
      },
    },
  },
  args: { label: 'Card', icon: 'credit-card', selected: false },
} satisfies Meta<typeof PosTenderRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: stack({ PosTenderRow }, [
    { label: 'Card', args: {} },
    { label: 'Tap to Pay', args: { label: 'Tap to Pay', icon: 'smartphone' } },
    { label: 'Cash', args: { label: 'Cash', icon: 'banknote' } },
    { label: 'Gift card', args: { label: 'Gift card', icon: 'gift' } },
  ]),
}

export const States: Story = {
  render: stack({ PosTenderRow }, [
    { label: 'Selected', args: { label: 'Cash', icon: 'banknote', selected: true } },
    { label: 'Not selected', args: {} },
  ]),
}
