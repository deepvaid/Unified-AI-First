import type { Meta, StoryObj } from '@storybook/vue3'
import type { Decorator } from '@storybook/vue3'
import { useCommerceStore } from '@/stores/useCommerce'
import { useStorefrontWishlistStore } from '@/stores/useStorefrontWishlist'
import { isolateStorage, overlayDocs } from '@/stories/decorators'
import StorefrontWishlist from './StorefrontWishlist.vue'
import { LUMOS_STORY_CHANNEL, lumosFrame, lumosProduct, lumosProducts, lumosStore } from './listingStoryFixtures'

/**
 * Saves `names` to Lumos's wishlist, oldest first, and makes sure the app's catalogue
 * sells Lumos's pieces (the page lists only what the store sells).
 */
function saved(names: string[]): Decorator {
  return (story) => ({
    components: { story },
    setup() {
      const commerce = useCommerceStore()
      const known = new Set(commerce.products.map((p) => p.id))
      commerce.products.push(...lumosProducts.filter((p) => !known.has(p.id)))
      const wishlist = useStorefrontWishlistStore()
      for (const id of wishlist.idsFor(LUMOS_STORY_CHANNEL)) wishlist.remove(LUMOS_STORY_CHANNEL, id)
      for (const name of names) wishlist.toggle(LUMOS_STORY_CHANNEL, lumosProduct(name).id)
      return {}
    },
    template: '<story />',
  })
}

const meta = {
  title: 'Product/Storefront/StorefrontWishlist',
  component: StorefrontWishlist,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
The shopper's wishlist (\`/wishlist\`) on a store whose theme has one: the sections drawing with
\`'wishlist'\` among the header's tools (Lumos). Shown here with Lumos's own products and theme.

- The products saved with a heart (on a Boxed card or the product page), **newest first**, as Boxed
  cards with their heart and Add to cart (quick add when there is a choice to make).
- It is kept **in this browser**, per store (\`useStorefrontWishlist\`, \`mp.storefront.wishlist.v1\`), and
  the page says so. A product the store no longer sells is left out, and not counted in the header.
- **Empty**: a heart on the theme's tint, "Nothing saved yet", a line, and **Shop all**.
- Any other store has no wishlist: this address is its 404 page. The classic drawing keeps its own
  header heart, which leads to \`/wishlist-page\`.

### A11y
- One \`h1\`; each card's name is an \`h2\`.
- A heart is a toggle button (\`aria-pressed\`) named "Save Arlo 3-Seat Sofa to your wishlist".
  Pressing it here takes the product off: "Removed from your wishlist · Arlo 3-Seat Sofa" is said
  politely, and focus moves to the heart of the card now in its place (the title once none is left).

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [lumosFrame('1240px', '0'), lumosStore({}, 'wishlist'), isolateStorage],
} satisfies Meta<typeof StorefrontWishlist>

export default meta
type Story = StoryObj<typeof meta>

/** Four pieces saved, the newest first: the desk, the rug, the sale side table and the sofa. */
export const Default: Story = {
  decorators: [saved(['Arlo 3-Seat Sofa', 'Stone Side Table', 'Weave Wool Rug', 'Ledger Desk'])],
}

/** Nothing saved yet: the empty state leads to every product. */
export const Empty: Story = {
  decorators: [saved([])],
}

/** One piece saved; its heart pressed takes it off, and focus goes to the title. */
export const RemoveTheLast: Story = {
  decorators: [saved(['Orbit Floor Lamp'])],
  parameters: overlayDocs('720px'),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLButtonElement>('.sf-bcard__heart')?.click()
  },
}
