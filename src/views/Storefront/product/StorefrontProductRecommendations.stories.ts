import type { Meta, StoryObj } from '@storybook/vue3'
import type { Product } from '@/stores/useCommerce'
import { northfoldProduct, storefrontFrame } from '../storefrontStoryFixtures'
import { provideNorthfold } from './productStoryFixtures'
import StorefrontProductRecommendations from './StorefrontProductRecommendations.vue'

const product = (name: string) => ({ ...northfoldProduct(name), status: 'Active' }) as Product
const goesWell = ['Quilted Liner Jacket', 'Waxed Cotton Field Jacket', 'Merino Quarter-Zip', 'Relaxed Wool Trouser'].map(product)

const meta = {
  title: 'Product/Storefront/StorefrontProductRecommendations',
  component: StorefrontProductRecommendations,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The row under a product on a product page of a store with the richer theme drawing (the product
template's \`featured-products\` section). The page chooses the products and the heading: the
store's recommendation engine names it ("Goes well with Linen Overshirt"); without one it is the
section's title. The cards are the collection page's (StorefrontListingCard): sale price, colour
dots and the quick-add "+" (StorefrontQuickAdd) when the store's collection grid offers it. Four
across, two on a phone.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame('1200px'), provideNorthfold],
  args: { heading: 'Goes well with Linen Overshirt', products: goesWell },
} satisfies Meta<typeof StorefrontProductRecommendations>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt's "Goes well with" row, as its engine chooses it. */
export const Default: Story = {}

/** No engine: the product's own collection under the section's title. */
export const YouMayAlsoLike: Story = {
  args: {
    heading: 'You may also like',
    products: ['Heavyweight Pocket Tee', 'Oxford Button-Down Shirt', 'Cotton Cable Sweater', 'Waxed Cotton Field Jacket'].map(product),
  },
}
