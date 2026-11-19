import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ProductMediaField from './ProductMediaField.vue'
import { placeholderImages } from './productMedia'
import { constrain } from '@/stories/decorators'

// Drawn pack shots stand in for uploaded pictures: deterministic and offline.
const COLOURS = { brandColor: '#0a2240', customBadgeColor: '#e4ff52' }
const TWO = placeholderImages('Unwind', COLOURS)
const FOUR = [...TWO, ...placeholderImages('Clear Focus', COLOURS)]

const meta = {
  title: 'Product/Products/ProductMediaField',
  component: ProductMediaField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The pictures of a product on the product forms (the New product wizard and the product editor).
Pick or drop PNG, JPG or WEBP files; each is shrunk in the browser to 720px and kept on the
product, so nothing is uploaded. The first picture is the main one: lists and storefront cards
show it.

### Behaviour
- The add tile goes away once the product has \`max\` pictures (4 by default).
- A file of another type, a file that cannot be read, or more files than there is room for are
  left out, and a warning toast says so.
- It composes \`MpFormField\` for its label and hint, so it sits in a form like any other field.
        `,
      },
    },
  },
  decorators: [constrain('drawer')],
  render: (args) => ({
    components: { ProductMediaField },
    setup() {
      const pictures = ref([...args.modelValue])
      return { args, pictures }
    },
    template: '<ProductMediaField v-bind="args" v-model="pictures" />',
  }),
} satisfies Meta<typeof ProductMediaField>

export default meta
type Story = StoryObj<typeof meta>

/** A new product: nothing added yet. */
export const Default: Story = { args: { modelValue: [] } }

/** Empty, some pictures, and full: the add tile is gone once there is no room left. */
export const States: Story = {
  args: { modelValue: [] },
  render: () => ({
    components: { ProductMediaField },
    setup() {
      const empty = ref<string[]>([])
      const some = ref([...TWO])
      const full = ref([...FOUR])
      return { empty, some, full }
    },
    template: `
      <div class="d-flex flex-column ga-6">
        <ProductMediaField v-model="empty" label="No pictures yet" />
        <ProductMediaField v-model="some" label="Two pictures" />
        <ProductMediaField v-model="full" label="Full (4 of 4)" />
      </div>
    `,
  }),
}
