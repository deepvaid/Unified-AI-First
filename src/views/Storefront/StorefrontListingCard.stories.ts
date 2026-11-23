import type { Meta, StoryObj } from '@storybook/vue3'
import StorefrontListingCard from './StorefrontListingCard.vue'
import { listingProduct, northfoldCollection, northfoldStore, soldOutCopy } from './listingStoryFixtures'
import { storefrontFrame } from './storefrontStoryFixtures'

const overshirt = listingProduct('Linen Overshirt')
/** One card, about as wide as it is in a four-column grid. */
const card = storefrontFrame('300px')

const meta = {
  title: 'Product/Storefront/StorefrontListingCard',
  component: StorefrontListingCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A product in a list on a store with the richer theme drawing (Northfold, Torqline): the collection
and search pages. Shown here with Northfold's own products and theme. The classic drawing keeps
\`StorefrontProductCard\` (Vitaheal, Atlas and Neelam are unchanged).

### Anatomy
- **Photo** at 3:4, with one mark: **Sold out**, else the saving (**−25%**, in the theme's sale
  colour), else **New** (a product in a "New…" collection).
- **Name**: the card's one link. Its hit area covers the whole card, so the photo opens the product too.
- **Price**: the lowest a shopper can buy at now; on sale, the sale price in the sale colour and the
  struck "was" price, each named for screen readers ("Sale price", "Usual price").
- **Colours**: up to four dots, then "+2"; "3 colors" on a phone. Screen readers hear
  "Available in Sand, Black and Olive".
- **Quick add "+"**: a button of its own above the link, named "Quick add Linen Overshirt", 40px
  (44px on a phone). It emits \`quick-add\`; the list opens StorefrontQuickAdd. It reads "Added" for
  a moment after a product went straight into the cart. A product sold out in every variant has none.

### Props
- \`colorKeys\`: the list's colour filter. The card leads with the first of those colours the product
  comes in (its own photo when it has one) and opens the product page in it (\`?color=black\`).
- \`quickAdd\`, \`added\`, \`showNew\`, \`headingLevel\`.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [northfoldStore()],
  args: { product: overshirt },
} satisfies Meta<typeof StorefrontListingCard>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt: three colours, $98. */
export const Default: Story = { decorators: [card] }

/** Washed Silk Blouse on sale: $88 instead of $118, marked −25%. */
export const OnSale: Story = {
  decorators: [card],
  args: { product: listingProduct('Washed Silk Blouse') },
}

/** The list is filtered by Black: the card leads with the black overshirt and opens the product page in black. */
export const ShownInAColor: Story = {
  decorators: [card],
  args: { colorKeys: ['black'] },
}

/** A product in the New in collection. */
export const NewArrival: Story = {
  decorators: [card],
  args: { product: listingProduct('Quilted Liner Jacket') },
}

/** Every size sold out: the mark says so, the photo is quieter, and there is no quick add. */
export const SoldOut: Story = {
  decorators: [card],
  args: { product: soldOutCopy(listingProduct('Wool-Blend Car Coat')) },
}

/** The tote went straight into the cart (it has one variant): the "+" reads "Added" for a moment. */
export const JustAdded: Story = {
  decorators: [card],
  args: { product: listingProduct('Canvas Market Tote'), added: true },
}

/** Four cards as the Outerwear collection lists them, at desktop width. */
export const InAGrid: Story = {
  decorators: [storefrontFrame('1040px')],
  render: () => ({
    components: { StorefrontListingCard },
    setup: () => ({ products: northfoldCollection('Outerwear') }),
    template: `
      <ul role="list" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin: 0; padding: 0; list-style: none;">
        <li v-for="product in products" :key="product.id"><StorefrontListingCard :product="product" /></li>
      </ul>
    `,
  }),
}
