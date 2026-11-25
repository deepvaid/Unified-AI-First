import type { Meta, StoryObj } from '@storybook/vue3'
import VariantGrid from './VariantGrid.vue'
import { constrain } from '@/stories/decorators'
import { northfoldProduct } from '@/views/Storefront/storefrontStoryFixtures'

// Northfold (demo)'s own products, from the store's seed.
const of = (name: string) => {
  const product = northfoldProduct(name)
  return { options: product.detail!.options, variants: product.detail!.variantsList, caption: `Variants of ${name}` }
}

const meta = {
  title: 'Product/Products/VariantGrid',
  component: VariantGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A product's variants on its page in Products (the product editor), read-only. Prices and stock
are edited in the product wizard ("Edit options and variants").

### Behaviour
- **Grouped by colour** when a colour shares the product with another option: the group row
  shows the swatch, the colour, how many sizes and its stock. Without a colour (or a colour-only
  product) it is one row per variant.
- Rows: the size (or the other options) | SKU | Price | Compare-at | Stock | stock chip
  (\`MpStatusChip type="stock"\`). "Low stock" matches the storefront's "Only 3 left".
- **Folds by its own width, never drops:** below \`layout.tableColumnsSm\` the SKU moves under
  the size, the compare-at price under the price and the chip under the count.
- No variants: \`MpEmptyState\`, with an optional button (\`emptyActionLabel\`, emits \`empty-action\`).
        `,
      },
    },
  },
  decorators: [constrain('dialog')],
  args: of('Linen Overshirt'),
} satisfies Meta<typeof VariantGrid>

export default meta
type Story = StoryObj<typeof meta>

/** The Linen Overshirt: three colours × five sizes, Sand in L sold out. */
export const Default: Story = {}

/** Sold out and running low: the Merino Crewneck Sweater (Oat in S sold out, Navy in M down to its last units). */
export const SoldOutAndLowStock: Story = { args: of('Merino Crewneck Sweater') }

/** On sale: every variant of the Washed Silk Blouse shows the price it was. */
export const OnSale: Story = { args: of('Washed Silk Blouse') }

/** A colour-only product (the Lambswool Scarf): one row per colour, no groups. */
export const ColoursOnly: Story = { args: of('Lambswool Scarf') }

/** A product without options (the Canvas Market Tote): its one default variant. */
export const OneVariant: Story = { args: of('Canvas Market Tote') }

/** A phone-width card: SKU, compare-at and chip fold into the cells beside them. */
export const Narrow: Story = {
  args: of('Washed Silk Blouse'),
  decorators: [constrain('narrow')],
}

/** Options without variants yet. */
export const Empty: Story = {
  args: { options: [], variants: [], emptyActionLabel: 'Add options and variants' },
}
