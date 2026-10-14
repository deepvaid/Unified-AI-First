import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayMethodMark from './MaropayMethodMark.vue'
import MpListRow from '@/components/MpListRow.vue'
import { grid } from '@/stories/storyTemplate'
import { METHOD_MARK_IDS } from '@/maropay/methodMarks'

const meta = {
  title: 'Product/Maropay/MaropayMethodMark',
  component: MaropayMethodMark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A payment method's brand tile — the brand's colour with a glyph or initials standing in for its
artwork, which the prototype doesn't carry. One mark per method wherever methods are listed:
rates, a store's methods, transactions, the order page and the shopper checkout.
Colours are the \`color.methodMark.<id>\` tokens (each tile names its own foreground, checked by
\`npm run contrast:check\`); geometry is \`component.methodMark.*\`. Map a method id to its mark with
\`markFor(methodId, label?)\` from \`@/maropay/methodMarks\` — a card payment's label names its brand.

**Use when:** a payment method is named in a list, table cell or checkout option.

**Don't use when:** you need a status — that's \`MpStatusChip type="method"\`.

### A11y
- **Provides:** \`role="img"\` named after the brand.
- **Consumer must:** pass \`decorative\` when the method's name is written beside the mark, so it
  isn't read twice.
        `,
      },
    },
  },
  args: { mark: 'visa', size: 'md' },
} satisfies Meta<typeof MaropayMethodMark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ MaropayMethodMark }, METHOD_MARK_IDS.map((mark) => ({ label: mark, args: { mark } })), { columns: 'repeat(auto-fill, minmax(120px, 1fr))' }),
}

export const Sizes: Story = {
  render: grid({ MaropayMethodMark }, (['sm', 'md', 'lg'] as const).flatMap((size) =>
    (['visa', 'applePay', 'maropay'] as const).map((mark) => ({ label: `${size} · ${mark}`, args: { mark, size } }))),
  { columns: 'repeat(3, minmax(0, 1fr))' }),
}

export const States: Story = {
  render: () => ({
    components: { MaropayMethodMark, MpListRow },
    template: `
      <div style="display: grid; gap: var(--mp-space-24); max-width: 480px;">
        <div>
          <p class="mp-meta-label mb-2">Labelled (role="img")</p>
          <MaropayMethodMark mark="paypal" />
        </div>
        <div>
          <p class="mp-meta-label mb-2">Leading a list row — decorative, the name is beside it</p>
          <MpListRow variant="divided" title="Klarna" subtitle="5.99% + 30¢">
            <template #lead><MaropayMethodMark mark="klarna" decorative /></template>
          </MpListRow>
          <MpListRow variant="divided" title="Apple Pay" subtitle="2.9% + 30¢">
            <template #lead><MaropayMethodMark mark="applePay" decorative /></template>
          </MpListRow>
        </div>
        <div>
          <p class="mp-meta-label mb-2">In a table cell (sm)</p>
          <span class="d-inline-flex align-center ga-2 text-body-2"><MaropayMethodMark mark="visa" size="sm" decorative /> •••• 4242</span>
        </div>
      </div>
    `,
  }),
}
