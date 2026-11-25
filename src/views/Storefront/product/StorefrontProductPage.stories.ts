import type { Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage } from '@/stories/decorators'
import { useCommerceStore } from '@/stores/useCommerce'
import type { Product } from '@/stores/useCommerce'
import { northfoldProduct, storefrontFrame } from '../storefrontStoryFixtures'
import { provideNorthfold, provideTorqline, torqlineFrame, torqlineProduct } from './productStoryFixtures'
import StorefrontProductPage from './StorefrontProductPage.vue'

const seeded = (name: string) => ({ ...northfoldProduct(name), status: 'Active' }) as Product

/** The product as the store's catalogue has it, so the row under it is chosen from the store's products. */
const render = (args: { product: Product }) => ({
  components: { StorefrontProductPage },
  setup() {
    const product = useCommerceStore().products.find((p) => p.id === args.product.id) ?? args.product
    return { product }
  },
  template: '<StorefrontProductPage :product="product" />',
})

const meta = {
  title: 'Product/Storefront/StorefrontProductPage',
  component: StorefrontProductPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
A product page of a store whose theme has the richer drawing (\`drawing: 'sections'\`: Northfold,
Torqline). \`StorefrontProduct.vue\` hands the page to it; every other theme keeps the classic
product page. It draws the theme's product template in order: breadcrumbs, then the
\`product-detail\` section (StorefrontProductMain) and the \`featured-products\` section (the row
of other products). The layout draws the header and footer sections.

### Behaviour
- The row under the product is chosen by the store's **recommendation engine** once the store is
  connected to Merchandise Cloud, and named by it: "Goes well with Linen Overshirt". Without one
  it is the product's own collection, under the section's title ("You may also like").
- A template without a product-detail section still gets one, because the page is the product.

### An auto-parts store (Torqline)
- With the section's \`fitment\` on, the **fit banner** sits under the title: fits (green),
  doesn't fit (amber), universal, or Check fit with **Select vehicle**. Icon and words, always.
- **Part #** under the title, in tabular figures, follows the chosen variant (Front or Rear); until
  that choice is made it says to make it.
- Rows: **Specifications** (a two-column table), **Vehicle fit** (Make, Model, Years, Position, the
  shopper's vehicle highlighted and labelled "Your vehicle"; a universal part says so in one line),
  **Warranty**, and Shipping and returns.
- Added to the cart while it fits, the line carries the vehicle ("Fits 2019 Ford F-150").
- The row under it leaves out the parts that don't fit the shopper's vehicle.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame('1280px', '0'), provideNorthfold, isolateStorage],
  args: { product: seeded('Linen Overshirt') },
  render,
} satisfies Meta<typeof StorefrontProductPage>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt, with "Goes well with Linen Overshirt" under it. */
export const Default: Story = {}

/** Washed Silk Blouse, on sale. */
export const SaleProduct: Story = {
  args: { product: seeded('Washed Silk Blouse') },
}

/** A phone. */
export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  decorators: [storefrontFrame('375px', '0')],
}

const torqlineSeeded = (name: string) => ({ ...torqlineProduct(name), status: 'Active' }) as Product
const truckPads = torqlineSeeded('Ceramic Brake Pads, Truck & SUV')

/** Torqline's truck brake pads, no vehicle chosen: Check fit, with Select vehicle. */
export const TorqlinePart: Story = {
  args: { product: truckPads },
  decorators: [torqlineFrame('1280px', '0'), provideTorqline()],
}

/** The shopper's 2019 Ford F-150: the pads fit, and its row in Vehicle fit is marked "Your vehicle". */
export const TorqlinePartFits: Story = {
  args: { product: truckPads },
  decorators: [torqlineFrame('1280px', '0'), provideTorqline({ year: 2019, make: 'Ford', model: 'F-150' })],
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelectorAll<HTMLDetailsElement>('details').forEach((row) => { if (row.textContent?.includes('Vehicle fit')) row.open = true })
  },
}

/** The shopper's 2019 Honda Civic: the truck pads don't fit, and the banner says where to look. */
export const TorqlinePartDoesNotFit: Story = {
  args: { product: truckPads },
  decorators: [torqlineFrame('1280px', '0'), provideTorqline({ year: 2019, make: 'Honda', model: 'Civic' })],
}

/** A universal part (motor oil) on a phone. */
export const TorqlineUniversalOnAPhone: Story = {
  args: { product: torqlineSeeded('Full Synthetic Motor Oil') },
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  decorators: [torqlineFrame('375px', '0'), provideTorqline({ year: 2019, make: 'Ford', model: 'F-150' })],
}
