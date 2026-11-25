import type { Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage, overlayDocs } from '@/stories/decorators'
import type { Product } from '@/stores/useCommerce'
import { northfold, northfoldProduct, storefrontFrame } from '../storefrontStoryFixtures'
import { provideNorthfold } from './productStoryFixtures'
import StorefrontProductMain from './StorefrontProductMain.vue'

const section = northfold.theme.templates.product.find((s) => s.kind === 'product-detail')!
const product = (name: string) => ({ ...northfoldProduct(name), status: 'Active' }) as Product

const meta = {
  title: 'Product/Storefront/StorefrontProductMain',
  component: StorefrontProductMain,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The \`product-detail\` section of a product template in the richer theme drawing (Northfold,
Torqline): the gallery beside the buy box. Shown with Northfold's own products, size charts and
theme, and the section exactly as Northfold's product template has it.

### Behaviour
- **Gallery** (StorefrontProductGallery) follows the chosen colour; a colour without photos of its
  own says "Shown in Ivory".
- **Price** with the sale price, the usual price struck through and "−25%" (StorefrontProductPrice).
- **Colour and size** with StorefrontVariantPicker: sold-out sizes struck through,
  "Only 2 left in M". The choice is kept in the URL (\`?color=sand&size=m\`), so a shared link
  opens the same colour and size.
- **Fit note** under the sizes, and a **Size guide** link that opens the product's chart in a
  drawer (StorefrontDrawer + StorefrontSizeGuide) with the chosen size picked out, and only the
  columns for the piece's wearer on a shared chart (the men's overshirt sees Chest and Sleeve).
  \`?sizeGuide=1\` opens it too (the chat's "Open the size guide").
- **Add to cart** is never disabled: without a size it says "Select a size" under the sizes, moves
  focus there and says it to screen readers. Added: the button reads "Added to cart" for two
  seconds, "Added to your cart · Size M · Sand" with "View cart (1)" shows under it, and a screen
  reader hears it. A sold-out choice reads "Sold out" and sends focus back to the sizes.
- **Buy now** goes to the checkout with just this choice: \`?buy=3015&variant=301503&qty=1\`.
- **Rows** from the section's \`collapsible-row\` blocks (StorefrontProductRows).
- On a **desktop** the buy box stays beside the photos as they scroll (sticky, under a sticky
  header; one taller than the window sticks by its foot). The choices and the buttons carry
  \`data-sf-clear\`, so the store's chat launcher fades out while it would cover them.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame('1200px'), provideNorthfold, isolateStorage],
  args: { product: product('Linen Overshirt'), section },
} satisfies Meta<typeof StorefrontProductMain>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt: Sand chosen, no size yet. Try Add to cart. */
export const Default: Story = {}

/** Washed Silk Blouse, on sale: $88.00, usually $118.00. Choose Black to see "Shown in Ivory". */
export const OnSale: Story = {
  args: { product: product('Washed Silk Blouse') },
}

/** Merino Crewneck Sweater: Oat is sold out in S, Navy has two left in M. */
export const SoldOutAndLowStock: Story = {
  args: { product: product('Merino Crewneck Sweater') },
}

/** Canvas Market Tote: one look, no choice to make; Add to cart adds it straight away. */
export const NoChoiceToMake: Story = {
  args: { product: product('Canvas Market Tote') },
}

/** A phone: the swipe gallery first, then the buy box. */
export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  decorators: [storefrontFrame('375px', '16px 24px')],
}

/** The thumbnail layout of the same section, for a theme that sets it. */
export const ThumbnailGallery: Story = {
  args: { section: { ...section, settings: { ...section.settings, galleryLayout: 'Thumbnails' } } },
}

/** The size guide open from the Size guide link. */
export const SizeGuideOpen: Story = {
  parameters: overlayDocs('820px'),
  play: async ({ canvasElement }) => {
    const link = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Size guide')
    link?.click()
  },
}
