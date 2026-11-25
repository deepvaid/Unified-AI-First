import type { Meta, StoryObj } from '@storybook/vue3'
import { useStorefrontWishlistStore } from '@/stores/useStorefrontWishlist'
import { isolateStorage } from '@/stories/decorators'
import StorefrontListingCard from './StorefrontListingCard.vue'
import {
  F150, LUMOS_STORY_CHANNEL, auroraFrame, listingProduct, lumosCollection, lumosFrame, lumosProduct, lumosStore, northfoldCollection, northfoldStore,
  soldOutCopy, torqlineCollection, torqlineFrame, torqlinePart, torqlineStore,
} from './listingStoryFixtures'
import { storefrontFrame } from './storefrontStoryFixtures'

const overshirt = listingProduct('Linen Overshirt')
/** One card, about as wide as it is in a four-column grid. */
const card = storefrontFrame('300px')
/** One of Torqline's dense cards, as wide as in its four-column grid. */
const partCard = torqlineFrame('260px')
const truckPads = torqlinePart('Ceramic Brake Pads, Truck & SUV')
/** One of Lumos's boxed cards, about as wide as in its three-column grid. */
const boxedCard = lumosFrame('300px')
/** One of Aurora's framed cards, about as wide as in its three-column grid beside the filters. */
const framedCard = auroraFrame('340px')
const sofa = lumosProduct('Arlo 3-Seat Sofa')

const meta = {
  title: 'Product/Storefront/StorefrontListingCard',
  component: StorefrontListingCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A product in a list on a store with the richer theme drawing (Northfold, Torqline, Lumos): the
collection and search pages, featured products and recommendations. Shown here with Northfold's own
products and theme, Torqline's for the dense parts card, Lumos's for the boxed card and Aurora's look for
the framed card. The classic
drawing keeps
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

### Dense: a part (Torqline)
\`cardStyle: 'Dense'\`, from the collection template's grid (\`cardStyle\` on its \`collection-grid\`):
- **Photo** square, with the saving (**−12%**) when the part is on sale.
- **Name**, the card's one link, its hit area the whole card.
- **Part # TQ-BRK-4471**: the first variant's SKU, in tabular figures.
- **Fit**: how the part stands against the shopper's vehicle, in \`fitLabel\`'s words with an icon,
  so it never rests on colour: "Fits your 2019 Ford F-150" (green), "Doesn’t fit your 2019 Ford F-150"
  (amber), "Universal fit" (neutral). Nothing while no vehicle is chosen: the list's bar asks for one.
- **Stock**: "In stock", "Only 3 left" or "Sold out".
- **Price**, and **Add to cart** in the store's button colours, named "Add to cart, Ceramic Brake
  Pads, Truck & SUV". A part without options goes straight into the cart (with the vehicle on its
  line when it fits); one with options opens quick add. A sold-out part has none.

### Boxed: the Figma product card (Lumos)
\`cardStyle: 'Boxed'\`, from the collection template's grid:
- A **framed card** on the theme's card colour (\`--sf-card\`), card corners (\`--sf-card-radius\`) and
  soft shadow (\`--sf-card-shadow\`), with a hairline in its divider colour.
- **Photo** at 248:273 on the theme's surface, its top corners rounded, with one badge top-left: **Sale**
  (the sale colour), **New** (the store's badge colour) or **Sold out**; 10px uppercase on a 4px pill.
- **Heart**, top-right, on a store with a wishlist: a 36px white disc (44px hit area). A toggle button
  (\`aria-pressed\`) named "Save Arlo 3-Seat Sofa to your wishlist"; saved, the heart is filled in the
  accent. Pressing it is said politely: "Saved to your wishlist · Arlo 3-Seat Sofa".
- **Name** (16px bold, two lines at most), the card's one link; **price** (on sale, the sale price in the
  sale colour and the struck "was" price).
- **Add to cart**: the store's solid button, the card's width, 44px, at the card's foot so a row lines
  up. Straight into the cart when there is nothing to choose; quick add otherwise.

### Framed: Aurora's product card
\`cardStyle: 'Framed'\`, UAT Aurora's card scheme (shown here with Northfold's products in Aurora's look):
- A card on the theme's card colour in a **5px frame** of its divider colour, on the theme's **Card corners**
  (\`--sf-card-radius\`) and **Card shadow** (\`--sf-card-shadow\`): UAT's **24px** and **none** when the
  theme sets neither.
- Everything sits **20px** inside the frame: the **square photo** (two thirds of the card's corners, 16px on
  24; the theme's surface behind it) with one badge top-left, as on Boxed: **Sale**, **New** or **Sold out**.
- **Name** (16px bold, two lines at most), the card's one link, its hit area the whole card, frame and all;
  the **price** under it (on sale, the sale price in the sale colour and the struck "was" price).
- **Add to cart**: the store's solid button with its corners (6px on Aurora), the card's width, 44px, at
  the card's foot. Straight into the cart when there is nothing to choose; quick add otherwise.
- **No heart**: Aurora's card scheme has the wishlist off; the product page keeps its heart.
- A phone shows two to a row: a 3px frame, a 10px inset, the card's corners up to 16px and smaller type.

### Props
- \`colorKeys\`: the list's colour filter. The card leads with the first of those colours the product
  comes in (its own photo when it has one) and opens the product page in it (\`?color=black\`).
- \`cardStyle\`: \`'Editorial'\` (default), \`'Dense'\`, \`'Boxed'\` or \`'Framed'\`.
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

/** A part for the shopper's 2019 Ford F-150: it fits. Two positions, so Add to cart opens quick add. */
export const PartFits: Story = {
  decorators: [partCard, torqlineStore(F150)],
  args: { product: truckPads, cardStyle: 'Dense' },
}

/** The car and crossover pads, for the same F-150: they don't fit, and say so in words and an icon. */
export const PartDoesNotFit: Story = {
  decorators: [partCard, torqlineStore(F150)],
  args: { product: torqlinePart('Ceramic Brake Pads, Car & Crossover'), cardStyle: 'Dense' },
}

/** Motor oil fits any vehicle, chosen or not. */
export const PartUniversal: Story = {
  decorators: [partCard, torqlineStore(null)],
  args: { product: torqlinePart('Full Synthetic Motor Oil'), cardStyle: 'Dense' },
}

/** No vehicle chosen: no fit badge (the list's bar asks for a vehicle). */
export const PartNoVehicle: Story = {
  decorators: [partCard, torqlineStore(null)],
  args: { product: truckPads, cardStyle: 'Dense' },
}

/** On sale and down to its last three: the saving on the photo, "Only 3 left" in the stock line. */
export const PartOnSaleLowStock: Story = {
  decorators: [partCard, torqlineStore(F150)],
  args: { product: torqlinePart('AGM Battery'), cardStyle: 'Dense' },
}

/** Sold out: the stock line says so, the photo is quieter, and there is no Add to cart. */
export const PartSoldOut: Story = {
  decorators: [partCard, torqlineStore(F150)],
  args: { product: soldOutCopy(torqlinePart('Engine Air Filter, Truck & SUV')), cardStyle: 'Dense' },
}

/** The engine air filter (no options) went straight into the cart: its button reads "Added" for a moment. */
export const PartJustAdded: Story = {
  decorators: [partCard, torqlineStore(F150)],
  args: { product: torqlinePart('Engine Air Filter, Truck & SUV'), cardStyle: 'Dense', added: true },
}

/** Torqline's four brake parts for a 2019 Ford F-150, at desktop width: two fit, two don't. */
export const PartsInAGrid: Story = {
  decorators: [torqlineFrame('1100px'), torqlineStore(F150)],
  render: () => ({
    components: { StorefrontListingCard },
    setup: () => ({ products: torqlineCollection('Brakes') }),
    template: `
      <ul role="list" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 44px 20px; margin: 0; padding: 0; list-style: none;">
        <li v-for="product in products" :key="product.id"><StorefrontListingCard :product="product" card-style="Dense" /></li>
      </ul>
    `,
  }),
}

/** Lumos's boxed card: Arlo 3-Seat Sofa in three fabrics, so Add to cart opens quick add. */
export const Boxed: Story = {
  decorators: [boxedCard, lumosStore(), isolateStorage],
  args: { product: sofa, cardStyle: 'Boxed' },
}

/** On sale: the Sale badge, the sale price in the sale colour and the struck "was" price. */
export const BoxedOnSale: Story = {
  decorators: [boxedCard, lumosStore(), isolateStorage],
  args: { product: lumosProduct('Stone Side Table'), cardStyle: 'Boxed' },
}

/** A new arrival, already in the wishlist: the New badge, and the heart filled in the accent (pressed). */
export const BoxedSaved: Story = {
  decorators: [
    boxedCard,
    (story) => ({
      components: { story },
      setup() {
        const wishlist = useStorefrontWishlistStore()
        const desk = lumosProduct('Ledger Desk')
        if (!wishlist.has(LUMOS_STORY_CHANNEL, desk.id)) wishlist.toggle(LUMOS_STORY_CHANNEL, desk.id)
        return {}
      },
      template: '<story />',
    }),
    lumosStore(),
    isolateStorage,
  ],
  args: { product: lumosProduct('Ledger Desk'), cardStyle: 'Boxed' },
}

/** The lantern set (nothing to choose) went straight into the cart: its button reads "Added" for a moment. */
export const BoxedJustAdded: Story = {
  decorators: [boxedCard, lumosStore(), isolateStorage],
  args: { product: lumosProduct('Lantern Set of 3'), cardStyle: 'Boxed', added: true },
}

/** Lumos's Living Room as its collection page lists it, three across at desktop width. */
export const BoxedInAGrid: Story = {
  decorators: [lumosFrame('1000px'), lumosStore(), isolateStorage],
  render: () => ({
    components: { StorefrontListingCard },
    setup: () => ({ products: lumosCollection('Living Room').slice(0, 6) }),
    template: `
      <ul role="list" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px 20px; margin: 0; padding: 0; list-style: none;">
        <li v-for="product in products" :key="product.id"><StorefrontListingCard :product="product" card-style="Boxed" /></li>
      </ul>
    `,
  }),
}

/** Aurora's framed card: the square photo inset in a thick light frame, the name and price, Add to cart. */
export const Framed: Story = {
  decorators: [framedCard],
  args: { cardStyle: 'Framed' },
}

/** A framed card on sale: the Sale badge, the sale price in the sale colour and the struck "was" price. */
export const FramedOnSale: Story = {
  decorators: [framedCard],
  args: { product: listingProduct('Washed Silk Blouse'), cardStyle: 'Framed' },
}

/** A framed card sold out in every size: the badge says so, the photo is quieter, and there is no Add to cart. */
export const FramedSoldOut: Story = {
  decorators: [framedCard],
  args: { product: soldOutCopy(listingProduct('Wool-Blend Car Coat')), cardStyle: 'Framed' },
}

/** The tote went straight into the cart (it has one variant): the button reads "Added" for a moment. */
export const FramedJustAdded: Story = {
  decorators: [framedCard],
  args: { product: listingProduct('Canvas Market Tote'), cardStyle: 'Framed', added: true },
}

/** Three framed cards to a row, as Aurora's collection page lists them beside its filters. */
export const FramedInAGrid: Story = {
  decorators: [auroraFrame('1040px')],
  render: () => ({
    components: { StorefrontListingCard },
    setup: () => ({ products: northfoldCollection('Outerwear').slice(0, 3) }),
    template: `
      <ul role="list" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px 20px; margin: 0; padding: 0; list-style: none;">
        <li v-for="product in products" :key="product.id"><StorefrontListingCard :product="product" card-style="Framed" /></li>
      </ul>
    `,
  }),
}
