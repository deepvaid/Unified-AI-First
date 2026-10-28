import type { Meta, StoryObj } from '@storybook/vue3'
import PosBadge from './PosBadge.vue'
import { posStock } from './posArt'
import { grid } from '@/stories/storyTemplate'
import { posSurface } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosBadge',
  component: PosBadge,
  tags: ['autodocs'],
  decorators: [posSurface],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A read-only status mark: stock, a sale's outcome, a loyalty tier (\`PosTierChip\`). The words always say
the status; tone and icon only reinforce it. Each tone is a \`*Ink\` on its \`*Soft\` fill, contrast-checked
at 4.5:1 in \`tokens.json\`. Figma kit: **Status Pill**.

Stock badges come from \`posStock(qty)\`, so every surface words and colours a count the same way:
out → danger, under 8 → warn, otherwise success (\`posStock(qty, 'tile')\` stays silent when healthy).

### A11y
- **Provides:** text in a token pair of at least 4.5:1; decorative icons hidden from screen readers.
- **Consumer must:** not rely on the badge alone for something the cashier must act on — say it in the
  row, a notice or a sheet too.
        `,
      },
    },
  },
  args: { tone: 'success', size: 'sm' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'success', 'warn', 'danger', 'accent', 'ink'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  render: (args) => ({
    components: { PosBadge },
    setup: () => ({ args }),
    template: '<PosBadge v-bind="args">Completed</PosBadge>',
  }),
} satisfies Meta<typeof PosBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ PosBadge }, [
    { label: 'Neutral', args: { tone: 'neutral' }, slot: 'Voided' },
    { label: 'Success', args: { tone: 'success' }, slot: 'Completed' },
    { label: 'Warn', args: { tone: 'warn' }, slot: 'Partial refund' },
    { label: 'Danger', args: { tone: 'danger' }, slot: 'Refunded' },
    { label: 'Accent', args: { tone: 'accent' }, slot: 'On this sale' },
    { label: 'Ink', args: { tone: 'ink' }, slot: 'VIP' },
  ], { columns: 'repeat(auto-fit, minmax(140px, 1fr))' }),
}

export const Sizes: Story = {
  render: grid({ PosBadge }, [
    { label: 'sm · rows and chips', args: { tone: 'warn', icon: 'triangle-alert' }, slot: 'Low stock · 3' },
    { label: 'md · on tile artwork', args: { tone: 'warn', icon: 'triangle-alert', size: 'md' }, slot: 'Low · 3 left' },
  ], { columns: 'repeat(auto-fit, minmax(180px, 1fr))' }),
}

const stock = [12, 3, 0].map((qty) => ({ qty, s: posStock(qty)! }))

export const States: Story = {
  render: grid({ PosBadge }, stock.map(({ qty, s }) => ({
    label: `Stock · ${qty} on hand`,
    args: { tone: s.tone, icon: s.icon },
    slot: s.label,
  })), { columns: 'repeat(auto-fit, minmax(160px, 1fr))' }),
}
