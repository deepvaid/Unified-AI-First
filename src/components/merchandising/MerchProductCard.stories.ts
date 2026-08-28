import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import type { MerchProduct } from '@/stores/useMerchandising'
import MerchProductCard from './MerchProductCard.vue'

// Mirrors the seeded catalog in useMerchandising.ts (picsum images, same shape).
function makeProduct(overrides: Partial<MerchProduct> & { id: string; title: string }): MerchProduct {
  return {
    image: `https://picsum.photos/seed/${overrides.id}/400/500`,
    price: 129,
    qty: 12,
    brand: 'Verve',
    color: 'Black',
    size: 'M',
    category: "Women's Dresses",
    tags: [],
    popularity: 62,
    createdAt: '2026-05-12T00:00:00.000Z',
    ...overrides,
  }
}

const DRESS = makeProduct({ id: 'merch7', title: 'Asymmetric Dress in Black', price: 261, qty: 15 })
const SALE_JEANS = makeProduct({
  id: 'merch2', title: 'Boyfriend Jeans', price: 76, compareAt: 122, qty: 8,
  brand: 'Nordica', color: 'Blue', category: 'Denim', tags: ['sale'],
})
const BRACELET = makeProduct({
  id: 'merch1', title: 'Azur Bracelet in Blue Azurite', price: 39, qty: 22,
  brand: 'Atlas', color: 'Blue', category: 'Jewelry',
})
const BOOTS = makeProduct({
  id: 'merch30', title: 'Suede Ankle Boots', price: 214, qty: 5,
  brand: 'Kinfolk', color: 'Cream', category: 'Shoes',
})

const meta = {
  title: 'Product/Merchandising/MerchProductCard',
  component: MerchProductCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MerchProductCard\` is the product tile of the merchandising collection grids (pinning UI and
rule previews). It shows image, title, price (sale price + strikethrough when \`compareAt\` is
set), and stock qty. Hover or focus the card to reveal the select checkbox and pin button;
\`rank\` renders the 1-based position badge on pinned cards, and \`interactive: false\` strips all
affordances for read-only rule previews.

In these stories \`toggle-pin\` / \`toggle-select\` are wired to local state — click them to see
the pinned/selected chrome.
        `,
      },
    },
  },
  args: {
    product: DRESS,
    pinned: false,
    selected: false,
    selectable: true,
    interactive: true,
  },
  argTypes: {
    product: {
      control: 'object',
      description: '`MerchProduct` — image, title, price and inventory state for the card.',
    },
    pinned: {
      control: 'boolean',
      description: 'Shows the pinned treatment. Pinning is controlled: the card emits `togglePin` and never flips this itself.',
    },
    rank: {
      control: 'number',
      description: '1-based position badge, shown only on pinned cards to say where in the manual order this product sits.',
    },
    selected: {
      control: 'boolean',
      description: 'Selection state for bulk actions. Controlled — the card emits `toggleSelect`.',
    },
    selectable: {
      control: 'boolean',
      description: 'Whether the selection checkbox is offered at all. On by default.',
    },
    interactive: {
      control: 'boolean',
      description: 'False renders a read-only card with no pin or select affordances — used for rule previews, where the card is an illustration rather than a control.',
    },
  },
  render: (args) => ({
    components: { MerchProductCard },
    setup() {
      const pinned = ref(args.pinned ?? false)
      const selected = ref(args.selected ?? false)
      return { args, pinned, selected }
    },
    template: `
      <div style="width: 220px;">
        <MerchProductCard v-bind="args" :pinned="pinned" :selected="selected"
          @toggle-pin="pinned = !pinned" @toggle-select="selected = !selected" />
      </div>
    `,
  }),
} satisfies Meta<typeof MerchProductCard>

export default meta
type Story = StoryObj<typeof meta>


/** Hover the card to reveal the select checkbox and pin button. */
export const Default: Story = {}

/** `compareAt` renders the sale price in error red with a strikethrough original. */
/** Pinned, selectable, and read-only — the three structural modes. */
export const Variants: Story = {
  render: () => ({
    components: { MerchProductCard },
    setup: () => ({ product: DRESS }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--mp-space-16);">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">interactive (default)</div>
          <MerchProductCard :product="product" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">pinned with rank</div>
          <MerchProductCard :product="product" pinned :rank="1" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">read-only — no pin/select affordances</div>
          <MerchProductCard :product="product" :interactive="false" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop — the card fills its grid track. This shows it at the
 * narrowest and widest tracks the merchandising grid actually uses.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MerchProductCard },
    setup: () => ({ product: DRESS }),
    template: `
      <div class="d-flex ga-6 align-start">
        <div style="width: 160px;">
          <div class="text-caption text-medium-emphasis mb-2">160px track</div>
          <MerchProductCard :product="product" />
        </div>
        <div style="width: 240px;">
          <div class="text-caption text-medium-emphasis mb-2">240px track</div>
          <MerchProductCard :product="product" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Selected, on sale, and out of stock. Hover a card to reveal the pin and checkbox. */
export const States: Story = {
  render: () => ({
    components: { MerchProductCard },
    setup: () => ({
      product: DRESS,
      sale: SALE_JEANS,
      empty: { ...DRESS, qty: 0 },
    }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--mp-space-16);">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">default — hover to reveal actions</div>
          <MerchProductCard :product="product" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">selected</div>
          <MerchProductCard :product="product" selected />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">on sale</div>
          <MerchProductCard :product="sale" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">out of stock</div>
          <MerchProductCard :product="empty" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Pinned to position 1 — pin button stays visible, rank badge bottom-left. */
export const OnSale: Story = {
  args: { product: SALE_JEANS },
}

export const PinnedWithRank: Story = {
  args: { product: BRACELET, pinned: true, rank: 1 },
}

/** Selected — primary border ring, checkbox stays visible. */
export const Selected: Story = {
  args: { product: BOOTS, selected: true },
}

/** `interactive: false` — read-only tile for merchandising rule previews. */
export const ReadOnly: Story = {
  args: { product: DRESS, interactive: false },
}

/** How the collection grid composes cards: pinned ranks first, then organic results. */
export const CollectionGrid: Story = {
  render: () => ({
    components: { MerchProductCard },
    setup: () => ({ products: [BRACELET, SALE_JEANS, DRESS, BOOTS] }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(4, 180px); gap: 12px;">
        <MerchProductCard v-for="(p, i) in products" :key="p.id" :product="p"
          :pinned="i < 2" :rank="i < 2 ? i + 1 : undefined" />
      </div>
    `,
  }),
}
