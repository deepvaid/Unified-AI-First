import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { overlayDocs } from '@/stories/decorators'
import StorefrontDrawer from './StorefrontDrawer.vue'
import StorefrontSizeGuide from './StorefrontSizeGuide.vue'
import { northfoldChart, northfoldProduct, storefrontFrame } from './storefrontStoryFixtures'

const womensTops = northfoldChart('Women’s tops')
const outerwear = northfoldChart('Outerwear')
const mensTrousers = northfoldChart('Men’s trousers')
const overshirt = northfoldProduct('Linen Overshirt')
const tee = northfoldProduct('Organic Cotton Tee')

const meta = {
  title: 'Product/Storefront/StorefrontSizeGuide',
  component: StorefrontSizeGuide,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
What the size guide drawer shows on a product page of a store with size charts (Northfold): how
the style fits, the product's chart (Products › Size charts) in inches or centimetres, what to do
between sizes, and how to measure. Shown here with Northfold's own charts and theme.

### Behaviour
- **in / cm** are two real radios drawn as one switch; it starts on the chart's own unit
  (\`v-model:unit\` to start elsewhere). Measurements are converted by \`chartInUnit\`; ranges read
  "32–33".
- The shopper's chosen **size** is picked out in the table (and named "your size" for screen readers).
- The **Size column stays put** while a wide chart scrolls sideways; the scroll area takes focus,
  so the keyboard can scroll it too.
- A chart's fit note may end with its **"Between sizes?"** advice: it gets its own heading.
  \`betweenSizes\` gives the advice when the chart has none.
- **How to measure** lines ("Bust: around…") become a list of measurements.
- A chart shared by women's and men's pieces (Outerwear) shows a piece only its own columns
  (\`audience\`: "Men’s chest" reads "Chest", and the women's columns and the "Bust" line go), the
  rule the chat assistant reads too (src/storefront/audience.ts).

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [storefrontFrame()],
  args: { chart: womensTops, size: 'M', fitNote: tee.detail?.fitNote },
} satisfies Meta<typeof StorefrontSizeGuide>

export default meta
type Story = StoryObj<typeof meta>

/** Organic Cotton Tee, size M chosen: Women's tops in inches. */
export const Default: Story = {}

/** The same chart switched to centimetres. */
export const Centimeters: Story = {
  render: (args) => ({
    components: { StorefrontSizeGuide },
    setup: () => ({ args, unit: ref<'in' | 'cm'>('cm') }),
    template: '<StorefrontSizeGuide v-bind="args" v-model:unit="unit" />',
  }),
}

/** Outerwear as written (no audience given): four measurements, so on a phone the table scrolls with the Size column kept. */
export const WideChartOnAPhone: Story = {
  args: { chart: outerwear, size: 'L', fitNote: overshirt.detail?.fitNote },
  decorators: [storefrontFrame('343px', '0')],
}

/** Outerwear on the men's Linen Overshirt: the men's chest and sleeve only, and how to measure them. */
export const SharedChartForAMensPiece: Story = {
  args: { chart: outerwear, size: 'M', fitNote: overshirt.detail?.fitNote, audience: 'him' },
}

/** Men's trousers: sized by waist, nothing chosen yet. */
export const WaistSizes: Story = {
  args: { chart: mensTrousers, size: undefined, fitNote: undefined },
}

/** In the drawer, as the product page opens it from "Size guide". */
export const InTheDrawer: Story = {
  parameters: overlayDocs('760px'),
  render: (args) => ({
    components: { StorefrontDrawer, StorefrontSizeGuide },
    setup: () => ({ args, open: ref(true) }),
    template: `
      <div>
        <button type="button" style="min-height: 44px; padding: 0 16px; border: 1px solid currentColor; background: none; color: inherit; font: inherit; cursor: pointer;" @click="open = true">Size guide</button>
        <StorefrontDrawer v-model="open" title="Size guide" description="Organic Cotton Tee" size="lg">
          <StorefrontSizeGuide v-bind="args" />
        </StorefrontDrawer>
      </div>
    `,
  }),
}
