import { onMounted, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { overlayDocs } from '@/stories/decorators'
import type { Product } from '@/stores/useCommerce'
import StorefrontQuickAdd from './StorefrontQuickAdd.vue'
import { F150, listingProduct, northfoldStore, torqlineFrame, torqlinePart, torqlineStore } from './listingStoryFixtures'
import { storefrontFrame } from './storefrontStoryFixtures'

/**
 * Quick add opened on `name`, as the "+" on its card opens it (in `color` when the card
 * showed one), with a button to open it again once closed.
 */
function opened(name: string, color?: string, find: (name: string) => Product = listingProduct) {
  return () => ({
    components: { StorefrontQuickAdd },
    setup() {
      const product = find(name)
      const quickAdd = ref<InstanceType<typeof StorefrontQuickAdd> | null>(null)
      const open = () => quickAdd.value?.start(product, color)
      onMounted(open)
      return { quickAdd, open, label: `Quick add ${product.name}` }
    },
    template: `
      <div>
        <button type="button" style="min-height: 44px; padding: 0 16px; border: 1px solid currentColor; background: none; color: inherit; font: inherit; cursor: pointer;" @click="open">{{ label }}</button>
        <StorefrontQuickAdd ref="quickAdd" />
      </div>
    `,
  })
}

const meta = {
  title: 'Product/Storefront/StorefrontQuickAdd',
  component: StorefrontQuickAdd,
  tags: ['autodocs'],
  parameters: {
    ...overlayDocs('720px'),
    docs: {
      ...overlayDocs('720px').docs,
      description: {
        component: `
### Overview
Quick add from a product list on a store with the richer theme drawing (the "+" on
StorefrontListingCard). Shown here with Northfold's own products and theme.

### Behaviour
- A product that needs a choice opens a **StorefrontDrawer** (a bottom sheet on a phone): its
  photo, subtitle and live price, **View full details** (the product page, opened on what is
  chosen), and the variant picker, starting on the colour the card showed, never on a size.
- **Add to cart · $98.00** is never disabled. Without a size it says "Select a size" under the sizes,
  moves focus there and says it to screen readers; on a size that is sold out it says so and moves
  focus back to the sizes.
- Once added, the drawer reads **Added to your cart** with the line ("Size M · Sand"), the cart
  subtotal, **View cart (2)** (focused) and **Keep shopping**. Screen readers hear
  "Added to your cart · Linen Overshirt · Size M · Sand".
- A product with one variant (the tote) goes **straight into the cart** from its card; the card's
  "+" reads "Added" and the same announcement is made.
- The list calls \`start(product, color)\`; it emits \`added\`.
- On a store that sells parts (Torqline) the drawer says how the part fits the shopper's vehicle
  (StorefrontFitBanner, compact: "Fits your 2019 Ford F-150"; **Select vehicle** while none is
  chosen), and a part that fits goes into the cart with the vehicle on its line, which then reads
  "Front · Part # TQ-BRK-4471 · Fits 2019 Ford F-150".

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame('100%'), northfoldStore()],
} satisfies Meta<typeof StorefrontQuickAdd>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt from its card: Sand first, no size yet. */
export const Default: Story = {
  render: opened('Linen Overshirt'),
}

/** From a list filtered by Black: the drawer starts on Black. */
export const FromAColorFilter: Story = {
  render: opened('Linen Overshirt', 'Black'),
}

/** Merino Crewneck in Oat: S is sold out (struck through, and says so when chosen); Navy is down to 2 in M. */
export const WithSoldOutSizes: Story = {
  render: opened('Merino Crewneck Sweater'),
}

/** The scarf comes in two colours and one size: the drawer asks for the colour alone. */
export const ColorOnly: Story = {
  render: opened('Lambswool Scarf'),
}

/** A part for the shopper's 2019 Ford F-150: the drawer says it fits, and asks for the position. */
export const PartForAVehicle: Story = {
  decorators: [torqlineFrame('100%'), torqlineStore(F150)],
  render: opened('Ceramic Brake Pads, Truck & SUV', undefined, torqlinePart),
}

/** The same part with no vehicle chosen: "Check fit", with Select vehicle. */
export const PartNoVehicle: Story = {
  decorators: [torqlineFrame('100%'), torqlineStore(null)],
  render: opened('Ceramic Brake Pads, Truck & SUV', undefined, torqlinePart),
}
