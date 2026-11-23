import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpFormGrid from '@/components/MpFormGrid.vue'
import SwatchHexField from './SwatchHexField.vue'
import { constrain } from '@/stories/decorators'
import { northfold, northfoldProduct } from '@/views/Storefront/storefrontStoryFixtures'

// Northfold (demo)'s page colour and the Linen Overshirt's three colours, as the
// product wizard shows them.
const PAGE = northfold.theme.styles.background
const overshirt = northfoldProduct('Linen Overshirt')
const colour = overshirt.detail!.options.find((option) => option.name === 'Color')!

const meta = {
  title: 'Product/Products/SwatchHexField',
  component: SwatchHexField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The colour of one option value in the product wizard (Variants step), when the option is
shown as **Swatches**. The well previews the swatch as the product page draws it, a round
dot on the store's page colour; clicking it opens a hex picker. The hex can also be typed.

### Behaviour
- Only a valid colour is emitted, always as lowercase \`#rrggbb\` ("C8B89A" and "#cba" are
  accepted). While the text is not a colour the field says so and the last good colour stays,
  so a product never saves a broken swatch.
- A colour close to the store's page colour gets the outline the storefront gives it, and a
  hint says shoppers see it that way.
- It composes \`MpFormField\` for the value's name, as a well plus a field is a composite control.
  It copies the swatch + \`v-menu\` + \`v-color-picker\` markup of the chatbot builder until a
  shared \`MpColorPicker\` exists.
        `,
      },
    },
  },
  args: { label: 'Sand', modelValue: colour.swatches!.Sand!, background: PAGE },
  render: (args) => ({
    components: { SwatchHexField },
    setup() {
      const hex = ref(args.modelValue)
      return { args, hex }
    },
    template: '<SwatchHexField v-bind="args" v-model="hex" />',
  }),
} satisfies Meta<typeof SwatchHexField>

export default meta
type Story = StoryObj<typeof meta>

/** One field at a control's measure; the option's colours (below) at a form's. */
const oneField = [constrain('narrow')]

/** Sand, on Northfold's page colour. */
export const Default: Story = { decorators: oneField }

/** A colour close to the page colour: the swatch keeps an outline, and the hint says so. */
export const LightColour: Story = {
  args: { label: 'Ivory', modelValue: '#f7f3ea' },
  decorators: oneField,
}

/** A value with no colour yet: the field asks for one. */
export const NoColourYet: Story = {
  args: { label: 'Terracotta', modelValue: '' },
  decorators: oneField,
}

/** The Linen Overshirt's colours, two to a row, as the wizard lays them out. */
export const OptionColours: Story = {
  decorators: [constrain('dialog')],
  render: () => ({
    components: { MpFormGrid, SwatchHexField },
    setup() {
      const swatches = ref({ ...colour.swatches! })
      return { values: colour.values, swatches, page: PAGE }
    },
    template: `
      <MpFormGrid :cols="2">
        <SwatchHexField v-for="value in values" :key="value" v-model="swatches[value]" :label="value" :background="page" />
      </MpFormGrid>
    `,
  }),
}
