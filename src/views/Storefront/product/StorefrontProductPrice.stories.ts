import type { Meta, StoryObj } from '@storybook/vue3'
import { storefrontFrame } from '../storefrontStoryFixtures'
import StorefrontProductPrice from './StorefrontProductPrice.vue'

const meta = {
  title: 'Product/Storefront/StorefrontProductPrice',
  component: StorefrontProductPrice,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A product's price on a product page of a store with the richer theme drawing (Northfold, Torqline),
in Northfold's theme. Amounts arrive formatted the store's way; \`priceFor\` in
src/storefront/productPage.ts decides which price, "was" price and percent off apply.

### Behaviour
- **On sale**: the price in the theme's sale colour, the usual price struck through and a "−25%"
  badge. A screen reader hears "Sale price $88.00, Usual price $118.00, 25% off".
- **From**: the variants differ in price and none is chosen yet.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame()],
  args: { price: '$98.00' },
} satisfies Meta<typeof StorefrontProductPrice>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt: one price. */
export const Default: Story = {}

/** Washed Silk Blouse: $88.00, usually $118.00. */
export const OnSale: Story = {
  args: { price: '$88.00', compareAt: '$118.00', percentOff: 25 },
}

/** Variants at different prices, none chosen yet. */
export const FromTheLowest: Story = {
  args: { price: '$34.00', from: true },
}
