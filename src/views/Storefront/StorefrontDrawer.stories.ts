import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { overlayDocs } from '@/stories/decorators'
import type { ProductVariant } from '@/stores/useCommerce'
import { describeVariant } from '@/storefront/variants'
import StorefrontDrawer from './StorefrontDrawer.vue'
import StorefrontVariantPicker from './StorefrontVariantPicker.vue'
import { announce } from './storefrontAnnouncer'
import { northfoldProduct, storefrontFrame } from './storefrontStoryFixtures'

const overshirt = northfoldProduct('Linen Overshirt')

/** A storefront button, as the store's theme draws one. */
const BUTTON = 'min-height: 44px; padding: 0 20px; border: 1px solid var(--sf-text); border-radius: var(--sf-radius); font: inherit; font-size: 15px; font-weight: 500; cursor: pointer;'
const SOLID = `${BUTTON} background: var(--sf-text); color: var(--sf-bg);`
const QUIET = `${BUTTON} background: transparent; color: var(--sf-text);`

const meta = {
  title: 'Product/Storefront/StorefrontDrawer',
  component: StorefrontDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The panel that slides over a storefront page on a store with the richer theme drawing: the size
guide, quick add, the filters on a phone. Shown here in Northfold's theme.

### Behaviour
- A native modal \`<dialog>\` (\`showModal()\`): the page behind is inert, focus stays inside, and
  **Esc**, the **close button** and a **click on the backdrop** close it, all through \`v-model\`.
- Focus goes to the first control (the close button, unless the body has an \`autofocus\`
  element) and **back to what opened it** on close.
- The page does not scroll behind it; the body scrolls, the footer stays.
- \`side="end"\` (default) comes in from the end on a desktop, \`side="bottom"\` up from the
  bottom; on a phone (600px and narrower) it is a **bottom sheet** unless \`phone-sheet\` is false.
- \`size\`: \`md\` 440px, \`lg\` 560px for a wide table.
- Labelled by its title (\`aria-labelledby\`) and described by \`description\`. Slots: default
  (body) and \`#footer\`.
- Motion is off under reduced motion.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame()],
  args: { title: 'Size guide', description: 'Linen Overshirt' },
} satisfies Meta<typeof StorefrontDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** Closed, with the button that opens it: focus comes back to the button on close. */
export const Default: Story = {
  render: (args) => ({
    components: { StorefrontDrawer },
    setup: () => ({ args, open: ref(false), BUTTON: QUIET }),
    template: `
      <div>
        <button type="button" :style="BUTTON" @click="open = true">Open size guide</button>
        <StorefrontDrawer v-bind="args" v-model="open">
          <p style="margin: 0;">Body measurements. Our tops are cut true to size; each product's fit note says when a style is cut loose.</p>
        </StorefrontDrawer>
      </div>
    `,
  }),
}

/**
 * Open, with a footer: quick add, composed with the variant picker. Add to cart without a size
 * says "Select a size"; with one, the panel says it was added, and so does the live announcer
 * (inside the dialog, where a screen reader can hear it while the page behind is inert).
 */
export const WithFooter: Story = {
  args: { title: 'Linen Overshirt', description: 'Olive · $98.00' },
  parameters: overlayDocs('560px'),
  render: (args) => ({
    components: { StorefrontDrawer, StorefrontVariantPicker },
    setup() {
      const open = ref(true)
      const picker = ref<{ validate: () => boolean } | null>(null)
      const selection = ref<Record<string, string>>({ Color: 'Olive' })
      const variant = ref<ProductVariant>()
      const added = ref('')
      function add() {
        if (!picker.value?.validate() || !variant.value) return
        added.value = `Added to your cart · ${describeVariant(variant.value, overshirt.detail!.options)}`
        announce(added.value)
      }
      return { args, open, picker, selection, variant, added, add, product: overshirt, SOLID }
    },
    template: `
      <StorefrontDrawer v-bind="args" v-model="open">
        <StorefrontVariantPicker ref="picker" v-model="selection" :product="product" :kinds="['size', 'plain']" layout="sheet" @variant="variant = $event; added = ''" />
        <p v-if="added" style="margin: 20px 0 0; font-weight: 500;">{{ added }}</p>
        <template #footer>
          <button type="button" :style="SOLID + ' flex: 1;'" @click="add">Add to cart · $98.00</button>
        </template>
      </StorefrontDrawer>
    `,
  }),
}

/** Up from the bottom with a long body: the body scrolls, the footer stays (the filters on a phone). */
export const BottomSheet: Story = {
  args: { title: 'Filter and sort', description: undefined, side: 'bottom' },
  parameters: overlayDocs('640px'),
  render: (args) => ({
    components: { StorefrontDrawer },
    setup: () => ({
      args, open: ref(true), SOLID, QUIET,
      sizes: ['XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '34', '36'],
      colors: ['White', 'Black', 'Sage', 'Heather Gray', 'Navy', 'Oat', 'Rust', 'Camel', 'Olive', 'Charcoal'],
    }),
    template: `
      <StorefrontDrawer v-bind="args" v-model="open">
        <fieldset style="margin: 0 0 20px; padding: 0; border: 0;">
          <legend style="margin-bottom: 8px; font-weight: 600;">Size</legend>
          <label v-for="size in sizes" :key="size" style="display: flex; align-items: center; gap: 10px; min-height: 44px;">
            <input type="checkbox" style="width: 18px; height: 18px; accent-color: var(--sf-text);"> {{ size }}
          </label>
        </fieldset>
        <fieldset style="margin: 0; padding: 0; border: 0;">
          <legend style="margin-bottom: 8px; font-weight: 600;">Color</legend>
          <label v-for="color in colors" :key="color" style="display: flex; align-items: center; gap: 10px; min-height: 44px;">
            <input type="checkbox" style="width: 18px; height: 18px; accent-color: var(--sf-text);"> {{ color }}
          </label>
        </fieldset>
        <template #footer>
          <button type="button" :style="QUIET + ' flex: 1;'">Clear all</button>
          <button type="button" :style="SOLID + ' flex: 1;'" @click="open = false">Show 20 results</button>
        </template>
      </StorefrontDrawer>
    `,
  }),
}
