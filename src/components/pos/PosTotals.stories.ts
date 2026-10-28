import type { Meta, StoryObj } from '@storybook/vue3'
import PosTotals from './PosTotals.vue'
import { stack } from '@/stories/storyTemplate'
import { posSurface, constrain } from '@/stories/decorators'

const AU = {
  subtotal: '$167.00',
  discounts: [
    { key: 'promo', label: 'Spring sale 30%', amount: '−$50.10' },
    { key: 'items', label: 'Item discounts', amount: '−$5.00' },
  ],
  discountTotal: '−$55.10',
  taxNote: 'Includes GST $10.17',
  total: '$111.90',
}

const CA = {
  subtotal: '$167.00',
  discounts: [{ key: 'coupon', label: 'Coupon REFER20', amount: '−$33.40', removable: true }],
  discountTotal: '−$33.40',
  taxes: [{ label: 'GST 5%', amount: '$6.68' }, { label: 'PST 7%', amount: '$9.35' }],
  total: '$149.63',
}

const meta = {
  title: 'Product/POS/Components/PosTotals',
  component: PosTotals,
  tags: ['autodocs'],
  decorators: [posSurface, constrain('narrow')],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The sale's totals, where every row adds up to the Charge amount. Discounts fold into one row the cashier
can open (\`v-model:open\`); a coupon or whole-sale discount can be removed from its row (\`removable\`,
emits \`remove\` with its key). Tax follows the store: added on top as rows (\`taxes\` — Canada's GST + PST)
or noted under the total (\`taxNote\` — Australia's GST-inclusive prices). Figma kit: **Totals**.

All amounts arrive formatted, so the component knows nothing about currency or tax rules.

### A11y
- **Provides:** the discount row is a disclosure button (\`aria-expanded\`, \`aria-controls\`); remove
  buttons are named "Remove {discount}" with a 44px hit area.
        `,
      },
    },
  },
  args: AU,
} satisfies Meta<typeof PosTotals>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: stack({ PosTotals }, [
    { label: 'Australia · GST included', args: { ...AU, open: true } },
    { label: 'Canada · GST + PST added', args: { ...CA, open: true } },
    { label: 'No discounts', args: { subtotal: '$35.00', discounts: [], taxNote: 'Includes GST $3.18', total: '$35.00' } },
  ]),
}

export const Sizes: Story = {
  parameters: { docs: { description: { story: 'One size: the cart pane sets the width; long discount names truncate before their amounts do.' } } },
  render: stack({ PosTotals }, [
    { label: 'Long discount name', args: { ...AU, open: true, discounts: [{ key: 'order', label: 'Whole sale · Staff — manager approved', amount: '−$16.70', removable: true }] } },
  ]),
}

export const States: Story = {
  render: stack({ PosTotals }, [
    { label: 'Discounts closed', args: { ...AU, open: false } },
    { label: 'Discounts open, one removable', args: { ...CA, open: true } },
  ]),
}
