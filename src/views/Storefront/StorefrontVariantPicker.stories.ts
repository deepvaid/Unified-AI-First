import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import type { ProductVariant } from '@/stores/useCommerce'
import { describeVariant } from '@/storefront/variants'
import StorefrontVariantPicker from './StorefrontVariantPicker.vue'
import { northfoldProduct, storefrontFrame } from './storefrontStoryFixtures'

const overshirt = northfoldProduct('Linen Overshirt')
const sweater = northfoldProduct('Merino Crewneck Sweater')
const chino = northfoldProduct('Slim Chino')
const scarf = northfoldProduct('Lambswool Scarf')

/** The picker, and under it what it emitted, as the product page reads it. */
function withReadout(product: typeof overshirt, extra = '') {
  return () => ({
    components: { StorefrontVariantPicker },
    setup() {
      const selection = ref<Record<string, string>>()
      const variant = ref<ProductVariant>()
      const label = (v?: ProductVariant) => (v ? `${describeVariant(v, product.detail!.options)} · ${v.sku}` : 'Not chosen yet')
      return { product, selection, variant, label }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <StorefrontVariantPicker :product="product" v-model="selection" ${extra} @variant="variant = $event" />
        <p style="margin: 0; font-size: 13px; color: var(--sf-muted);">Chosen: {{ label(variant) }}</p>
      </div>
    `,
  })
}

const meta = {
  title: 'Product/Storefront/StorefrontVariantPicker',
  component: StorefrontVariantPicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The product's options as a shopper chooses them on a store with the richer theme drawing
(Northfold, Torqline): on the product page and in quick add. Shown here with Northfold's own
products and theme.

### Behaviour
- **Real radio groups**, one \`fieldset\` per option with its \`legend\`: arrow keys move within a
  group, Tab between groups.
- **Colour as swatches**: 28px dots in 44px targets; the chosen colour's name is in the legend
  ("Color: Sand"), and every dot is named for screen readers.
- **Sizes as buttons**, XS to XL or waist sizes. A size **sold out** in the chosen colour is struck
  through but can still be chosen; its name says "sold out", and choosing it says
  "Sorry, L just sold out. Choose another size." A combination the product does not have is disabled.
- **Low stock**: "Only 2 left in M" under the sizes, said politely to screen readers as it appears.
- \`validate()\` (exposed) shows "Select a size" under an unchosen option and moves focus there, so
  Add to cart is never disabled. The \`errors\` prop shows a message of the page's own.
- \`v-model\` is the selection; without one the picker starts on the first colour in stock and no
  size (\`initialSelection\`). It emits \`variant\` with the variant chosen, or \`undefined\`.
- \`kinds\` leaves options out (quick add shows sizes only); \`layout="sheet"\` makes larger buttons.
- Slot \`#option-aside\` puts a link beside a legend (the "Size guide" link beside Size).

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame()],
  args: { product: overshirt },
} satisfies Meta<typeof StorefrontVariantPicker>

export default meta
type Story = StoryObj<typeof meta>

/** Linen Overshirt: three colours, five sizes; Sand in L is sold out. */
export const Default: Story = {
  render: (args) => ({
    components: { StorefrontVariantPicker },
    setup: () => ({ args }),
    template: '<StorefrontVariantPicker v-bind="args" />',
  }),
}

/** Sand in L: struck through, still chosen, and the picker says so. */
export const SoldOutSizeChosen: Story = {
  args: { modelValue: { Color: 'Sand', Size: 'L' } },
  render: (args) => ({
    components: { StorefrontVariantPicker },
    setup: () => ({ args, selection: ref({ ...args.modelValue }) }),
    template: '<StorefrontVariantPicker :product="args.product" v-model="selection" />',
  }),
}

/** Merino Crewneck Sweater in Navy, M: two left. */
export const LowStock: Story = {
  args: { product: sweater, modelValue: { Color: 'Navy', Size: 'M' } },
  render: (args) => ({
    components: { StorefrontVariantPicker },
    setup: () => ({ args, selection: ref({ ...args.modelValue }) }),
    template: '<StorefrontVariantPicker :product="args.product" v-model="selection" />',
  }),
}

/** Add to cart with no size chosen: the page shows its message under the sizes. */
export const SelectASize: Story = {
  args: { errors: { Size: 'Select a size' } },
  render: (args) => ({
    components: { StorefrontVariantPicker },
    setup: () => ({ args }),
    template: '<StorefrontVariantPicker v-bind="args" />',
  }),
}

/**
 * Add to cart is never disabled: with no size chosen, `validate()` says "Select a size" under the
 * sizes and moves focus there; once a size is chosen the message goes.
 */
export const AddToCart: Story = {
  render: () => ({
    components: { StorefrontVariantPicker },
    setup() {
      const picker = ref<{ validate: () => boolean } | null>(null)
      const variant = ref<ProductVariant>()
      const added = ref('')
      function add() {
        added.value = ''
        if (!picker.value?.validate() || !variant.value) return
        added.value = `Added to your cart · ${describeVariant(variant.value, overshirt.detail!.options)}`
      }
      return { product: overshirt, picker, variant, added, add }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <StorefrontVariantPicker ref="picker" :product="product" @variant="variant = $event" />
        <button type="button" style="min-height: 50px; border: 0; border-radius: var(--sf-radius); background: var(--sf-text); color: var(--sf-bg); font: inherit; font-weight: 500; cursor: pointer;" @click="add">Add to cart</button>
        <p role="status" style="margin: 0; min-height: 24px;">{{ added }}</p>
      </div>
    `,
  }),
}

/** What the picker emits as the shopper chooses: the variant, as a cart line reads it. */
export const EmitsTheVariant: Story = { render: withReadout(overshirt) }

/** Slim Chino: sized by waist; Khaki in 32 is sold out. */
export const WaistSizes: Story = { render: withReadout(chino) }

/** Lambswool Scarf: colour only, one size. */
export const ColourOnly: Story = { render: withReadout(scarf) }

/** The "Size guide" link beside the Size legend. */
export const WithSizeGuideLink: Story = {
  render: () => ({
    components: { StorefrontVariantPicker },
    setup: () => ({ product: overshirt }),
    template: `
      <StorefrontVariantPicker :product="product">
        <template #option-aside="{ kind }">
          <button v-if="kind === 'size'" type="button" style="min-height: 24px; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer;">Size guide</button>
        </template>
      </StorefrontVariantPicker>
    `,
  }),
}

/** Quick add: the colour came from the card, so only sizes, as larger buttons. */
export const QuickAddSheet: Story = {
  args: { kinds: ['size', 'plain'], layout: 'sheet', modelValue: { Color: 'Olive' } },
  render: (args) => ({
    components: { StorefrontVariantPicker },
    setup: () => ({ args, selection: ref({ ...args.modelValue }) }),
    template: '<StorefrontVariantPicker :product="args.product" :kinds="args.kinds" layout="sheet" v-model="selection" />',
  }),
}

/** A phone (343px of a 375px screen): five sizes to a row, 48px tall. */
export const Phone: Story = {
  decorators: [storefrontFrame('343px', '0')],
  render: withReadout(overshirt),
}
