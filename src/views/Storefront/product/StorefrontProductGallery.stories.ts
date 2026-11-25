import type { Meta, StoryObj } from '@storybook/vue3'
import { galleryFor } from '@/storefront/productPage'
import { northfoldProduct, storefrontFrame } from '../storefrontStoryFixtures'
import StorefrontProductGallery from './StorefrontProductGallery.vue'

const overshirt = northfoldProduct('Linen Overshirt')
const blouse = northfoldProduct('Washed Silk Blouse')
const sand = galleryFor(overshirt, { Color: 'Sand' })
const olive = galleryFor(overshirt, { Color: 'Olive' })
const blouseBlack = galleryFor(blouse, { Color: 'Black' })

const meta = {
  title: 'Product/Storefront/StorefrontProductGallery',
  component: StorefrontProductGallery,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The product's photos on a product page of a store with the richer theme drawing (Northfold,
Torqline). The page gives it the photos of the chosen colour (\`galleryFor\` in
src/storefront/productPage.ts), so the gallery follows the colour and starts again at the first
photo. Shown here with Northfold's own photos and theme.

### Behaviour
- **Stacked** (Northfold's product template): the photos large, one under the other. Every photo
  comes into view as the page scrolls, so there are no thumbnails beside them.
- **Thumbnails**: one large photo and a row of thumbnails that switch it.
- **900px and narrower**, either layout: a swipe carousel that snaps photo by photo, the next one
  peeking in, with a "1 / 2" count. The carousel takes focus and the arrow keys move it.
- Thumbnails are buttons named "Show picture 2 of 4", the current one marked with \`aria-current\`.
  Alt text names the product and the colour that photo shows: "Linen Overshirt in Sand" (\`colors\`,
  one per photo). A photo listed under several colours names none.
- A colour without photos of its own shows the first colour's, with **"Shown in Ivory"** on the
  first photo.
- A photo that fails to load is replaced by a drawn shirt.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame('720px')],
  args: { images: sand.images, name: overshirt.name, color: sand.color, colors: sand.colors, note: sand.shownIn, layout: 'Stacked', ratio: 'Portrait' },
} satisfies Meta<typeof StorefrontProductGallery>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt in Sand: its own two photos (the close-up is of the sand linen), stacked. */
export const Default: Story = {}

/** Olive chosen: the gallery shows Olive's own photo. */
export const FollowsTheColor: Story = {
  args: { images: olive.images, color: olive.color, colors: olive.colors },
}

/** Washed Silk Blouse in Black, which has no photos of its own: the Ivory ones, saying so. */
export const ShownInFirstColor: Story = {
  args: { images: blouseBlack.images, name: blouse.name, color: blouseBlack.color, colors: blouseBlack.colors, note: blouseBlack.shownIn },
}

/** The template's other layout: one large photo, thumbnails underneath. */
export const Thumbnails: Story = {
  args: { layout: 'Thumbnails' },
  decorators: [storefrontFrame('520px')],
}

/** A phone: the swipe carousel with the next photo peeking in and the count. */
export const OnAPhone: Story = {
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  decorators: [storefrontFrame('375px', '0 24px')],
}

/** A photo that cannot be shown (here, a broken file) is drawn as a shirt, named like the photo. */
export const MissingPhoto: Story = {
  args: { images: ['data:image/jpeg;base64,AAAA'], note: '' },
  decorators: [storefrontFrame('480px')],
}
