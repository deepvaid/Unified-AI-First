import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { productRows } from '@/storefront/productPage'
import { northfold, northfoldProduct, storefrontFrame } from '../storefrontStoryFixtures'
import StorefrontProductRows from './StorefrontProductRows.vue'

const detail = northfold.theme.templates.product.find((s) => s.kind === 'product-detail')!
const overshirt = northfoldProduct('Linen Overshirt')
const scarf = northfoldProduct('Lambswool Scarf')
const rows = productRows(detail.blocks, overshirt, { sizeGuide: true })

const meta = {
  title: 'Product/Storefront/StorefrontProductRows',
  component: StorefrontProductRows,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The collapsible rows under the buy box on a product page of a store with the richer theme drawing:
the product template's \`collapsible-row\` blocks, read for the product by \`productRows\`
(src/storefront/productPage.ts). Northfold's are Description (open), Fit and sizing, Fabric and
care, and Delivery and returns.

### Behaviour
- Each row is a native \`<details>\`/\`<summary>\`: Enter or Space opens it, and a screen reader
  hears whether it is expanded.
- **Fit and sizing**: the product's fit note, then "Open the size guide" (emits \`size-guide\`)
  when the product has a size chart.
- **Fabric and care**: fabric, care and where it is made, as label and value lines.
- A row with nothing to say for the product is left out.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame()],
  args: { rows },
} satisfies Meta<typeof StorefrontProductRows>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt, as its product page shows it: Description open. */
export const Default: Story = {}

/** Every row open; "Open the size guide" says when it was asked for. */
export const AllOpen: Story = {
  args: { rows: rows.map((row) => ({ ...row, open: true })) },
  render: (args) => ({
    components: { StorefrontProductRows },
    setup: () => ({ args, asked: ref(0) }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <StorefrontProductRows v-bind="args" @size-guide="asked++" />
        <p role="status" style="margin: 0; font-size: 13px; color: var(--sf-muted);">{{ asked ? 'The size guide would open.' : '' }}</p>
      </div>
    `,
  }),
}

/** Lambswool Scarf has no size chart: its fit row is its one-size note alone. */
export const WithoutASizeGuide: Story = {
  args: { rows: productRows(detail.blocks, scarf, { sizeGuide: false }).map((row) => ({ ...row, open: row.source === 'fit' || row.open })) },
}
