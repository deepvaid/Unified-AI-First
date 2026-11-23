import { onUnmounted } from 'vue'
import type { Decorator, Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage } from '@/stories/decorators'
import { useCommerceStore } from '@/stores/useCommerce'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import type { CartLine } from '@/stores/useStorefrontCart'
import { vehicleLabel } from '@/storefront/fitment'
import StorefrontCart from './StorefrontCart.vue'
import { F150, torqlinePart } from './listingStoryFixtures'
import { withStorefront } from './sections/storyContext'
import { northfoldProduct } from './storefrontStoryFixtures'

/**
 * Puts `lines` in the store's cart for the story, and the cart back as it was when the
 * story unmounts (the cart lives in the tab's sessionStorage, which isolateStorage leaves alone).
 */
function withCart(channelId: string, lines: () => CartLine[]): Decorator {
  return (story) => ({
    components: { story },
    setup() {
      const cart = useStorefrontCartStore()
      const before = cart.carts[channelId]
      cart.carts[channelId] = lines()
      onUnmounted(() => {
        if (before) cart.carts[channelId] = before
        else delete cart.carts[channelId]
      })
      return {}
    },
    template: '<story />',
  })
}

/**
 * The cart as a store change leaves it: `lines` were in it, then a theme was applied
 * (or the store restored), so it was emptied and remembers what went. Put back as it
 * was, code included, when the story unmounts.
 */
function withStoreChanged(channelId: string, lines: () => CartLine[]): Decorator {
  return (story) => ({
    components: { story },
    setup() {
      const cart = useStorefrontCartStore()
      const before = cart.carts[channelId]
      const code = cart.codeFor(channelId)
      cart.carts[channelId] = lines()
      cart.storeChanged(channelId)
      onUnmounted(() => {
        cart.dismissNotice(channelId)
        if (before) cart.carts[channelId] = before
        else delete cart.carts[channelId]
        cart.setCode(channelId, code)
      })
      return {}
    },
    template: '<story />',
  })
}

/** A cart line for a product's variant, as the cart store writes one. */
function lineOf(product: ReturnType<typeof torqlinePart>, variantIndex: number, extra: Partial<CartLine> = {}): CartLine {
  const variant = product.detail!.variantsList[variantIndex]!
  return {
    productId: product.id,
    name: product.name,
    sku: variant.sku,
    price: variant.price,
    qty: 1,
    ...(product.detail!.options.length ? { variantId: variant.id, variantTitle: variant.title } : {}),
    ...extra,
  }
}

const meta = {
  title: 'Product/Storefront/StorefrontCart',
  component: StorefrontCart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The storefront cart (/cart-page): its lines, the totals, a campaign's code, and Checkout with the
express buttons the store offers. Shown here with the seeded demo stores.

### Lines
Under each line's name, what was bought, from \`lineDetailText\` (src/storefront/shopperOrders.ts):
- a store that sells parts (Torqline): the position or grade, the **part number** and, when the part
  fit the shopper's vehicle as it was added, the vehicle: "Front · Part # TQ-BRK-4471 · Fits 2019
  Ford F-150". A universal part names no vehicle. Part numbers read in tabular figures;
- any other store, as before: "Size M · Sand", or nothing for a product without a choice.

The same words are on the checkout summary, the order page and the account's orders.

### The store changed
Applying a theme or restoring the store replaces every product, so the cart is emptied
(\`storeChanged\` on the cart store). Above the empty cart a polite notice (\`role="status"\`) says
why and names what went, three at most and then "and N more"; **Got it** dismisses it
(\`dismissNotice\`) and moves focus to the heading. It draws with the theme's surface and ink,
on the classic and the sections drawing alike.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
} satisfies Meta<typeof StorefrontCart>

export default meta
type Story = StoryObj<typeof meta>

/** Torqline: front pads bought for a 2019 Ford F-150, a universal motor oil, and a filter with no options. */
export const Default: Story = {
  decorators: [
    withCart('torqline-demo', () => [
      lineOf(torqlinePart('Ceramic Brake Pads, Truck & SUV'), 0, { vehicle: vehicleLabel(F150) }),
      lineOf(torqlinePart('Full Synthetic Motor Oil'), 2),
      lineOf(torqlinePart('Extended-Life Oil Filter, Truck'), 0, { vehicle: vehicleLabel(F150), qty: 2 }),
    ]),
    withStorefront({ channelId: 'torqline-demo' }),
    isolateStorage,
  ],
}

/** Northfold: clothing lines read as they always have, "Size M · Sand". */
export const Clothing: Story = {
  decorators: [
    withCart('northfold-demo', () => {
      const overshirt = northfoldProduct('Linen Overshirt')
      const sandM = overshirt.detail!.variantsList.find((v) => v.title === 'Sand / M') ?? overshirt.detail!.variantsList[0]!
      const tote = northfoldProduct('Canvas Market Tote')
      return [
        { productId: overshirt.id, name: overshirt.name, sku: sandM.sku, price: sandM.price, qty: 1, variantId: sandM.id, variantTitle: sandM.title },
        { productId: tote.id, name: tote.name, sku: tote.sku, price: tote.price, qty: 1 },
      ]
    }),
    withStorefront(),
    isolateStorage,
  ],
}

/**
 * Vitaheal after another theme was applied: the cart was emptied, and the notice names the
 * four products that went. Its own store, so the other stories' carts on the docs page stay full.
 */
export const StoreChanged: Story = {
  decorators: [
    withStoreChanged('vitaheal-demo', () => ['Unwind', 'Clear Focus', 'Daily NAD+', 'Nasal Strips'].map((name) => {
      const product = useCommerceStore().products.find((p) => p.name === name && p.channelIds?.includes('vitaheal-demo'))
      if (!product) throw new Error(`No Vitaheal product "${name}"`)
      return { productId: product.id, name: product.name, sku: product.sku, price: product.price, qty: 1 }
    })),
    withStorefront({ channelId: 'vitaheal-demo' }),
    isolateStorage,
  ],
}
