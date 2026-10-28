import type { Meta, StoryObj } from '@storybook/vue3'
import PosCartLine from './PosCartLine.vue'
import { stack } from '@/stories/storyTemplate'
import { posSurface, constrain } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Components/PosCartLine',
  component: PosCartLine,
  tags: ['autodocs'],
  decorators: [posSurface, constrain('drawer')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
One line of the sale. The whole row opens the line's actions (price, note, discount, remove) — it emits
\`open\` on tap, Enter or Space. Each reason the line costs less, or needs a look, gets its own note with an
icon and words, never colour alone. Figma kit: **Cart Line**.

| Note | Icon | Ink |
|---|---|---|
| \`promo\` — an automatic promotion | tag | success |
| \`discount\` — a cashier's line discount, with its reason | badge-percent | success |
| \`stock\` — sold beyond what's on hand | triangle-alert | warn |
| \`note\` — gift wrap, alterations | sticky-note | muted |

Prices arrive formatted; \`wasLabel\` (struck through) shows whenever the customer pays less than catalogue.

### A11y
- **Provides:** \`role="button"\` with \`tabindex="0"\`, Enter/Space, the quantity badge hidden (the
  consumer's label says it).
- **Consumer must:** write the row's \`aria-label\` from the sale — name, variant, quantity, total, each
  note — ending with the action ("Edit line").
        `,
      },
    },
  },
  args: {
    name: 'Classic crew tee',
    meta: 'Black · TEE-001-BLK-M',
    qty: 2,
    unitLabel: '2 × $39.00',
    wasLabel: '$78.00',
    totalLabel: '$54.60',
    seed: 'TEE-001-BLK-M',
    notes: [{ kind: 'promo', label: 'Spring sale 30%', amount: '−$23.40' }],
    'aria-label': 'Classic crew tee, Black, quantity 2, $54.60, Spring sale 30%, minus $23.40. Edit line',
  },
} satisfies Meta<typeof PosCartLine>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: stack({ PosCartLine }, [
    { label: 'One unit, full price', args: { name: 'Cap', meta: 'Navy · CAP-001-NVY', qty: 1, unitLabel: undefined, wasLabel: undefined, totalLabel: '$35.00', seed: 'CAP-001-NVY', notes: [] } },
    { label: 'Promotion', args: {} },
    {
      label: 'Promotion + line discount + note',
      args: {
        name: 'Pullover hoodie', meta: 'Grey, L · HOOD-101-GRY-L', qty: 1, unitLabel: undefined, wasLabel: '$89.00', totalLabel: '$57.30', seed: 'HOOD-101-GRY-L',
        notes: [
          { kind: 'promo', label: 'Spring sale 30%', amount: '−$26.70' },
          { kind: 'discount', label: 'Damaged', amount: '−$5.00' },
          { kind: 'note', label: 'Gift wrap' },
        ],
      },
    },
    {
      label: 'Price changed',
      args: { name: 'Slim denim', meta: 'Dark, 32 · JEAN-512-DRK-32', qty: 1, unitLabel: '1 × $99.00 · price changed from $129.00', wasLabel: '$129.00', totalLabel: '$99.00', seed: 'JEAN-512-DRK-32', notes: [] },
    },
  ]),
}

export const Sizes: Story = {
  parameters: { docs: { description: { story: 'One size: the cart pane sets the width. Names and meta truncate; notes wrap so a long reason is never cut.' } } },
  render: stack({ PosCartLine }, [
    {
      label: 'Long name and note',
      args: {
        name: 'Merino wool quarter-zip pullover with thumb loops', meta: 'Charcoal, M · KNIT-221-CHR-M', qty: 1, unitLabel: undefined, wasLabel: undefined, totalLabel: '$189.00', seed: 'KNIT-221',
        notes: [{ kind: 'note', label: 'Hold for alterations — customer collects Saturday after 10am' }],
      },
    },
  ]),
}

export const States: Story = {
  render: stack({ PosCartLine }, [
    { label: 'Just added (fresh)', args: { name: 'Cap', meta: 'Navy · CAP-001-NVY', qty: 1, unitLabel: undefined, wasLabel: undefined, totalLabel: '$35.00', seed: 'CAP-001-NVY', notes: [], fresh: true } },
    {
      label: 'Sold beyond stock',
      args: {
        name: 'Court sneaker', meta: 'White, 10 · SNEAK-A1-WHT-10', qty: 1, unitLabel: undefined, wasLabel: undefined, totalLabel: '$159.00', seed: 'SNEAK-A1-WHT-10',
        notes: [{ kind: 'stock', label: '1 more than in stock' }],
      },
    },
  ]),
}
