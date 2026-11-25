import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ProductSizeGuideCard from './ProductSizeGuideCard.vue'
import { constrain } from '@/stories/decorators'
import { northfold, northfoldChart, northfoldProduct } from '@/views/Storefront/storefrontStoryFixtures'

// Northfold (demo)'s five size charts and the Linen Overshirt, from the store's seed.
const charts = northfold.sizeCharts
const overshirt = northfoldProduct('Linen Overshirt')
const sizes = overshirt.detail!.options.find((option) => option.name === 'Size')!.values

const meta = {
  title: 'Product/Products/ProductSizeGuideCard',
  component: ProductSizeGuideCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The **Size guide** card in the side rail of a product's page in Products. It picks which of the
store's size charts the product page opens beside its sizes (\`detail.sizeChartId\`), and previews
the chart chosen. Charts are written on Products › Size charts ("Manage size charts").

### Behaviour
- The product editor shows it only for a store that has size charts, on a product that has
  sizes or already links a chart. The choice is saved with the page's Save.
- "No size guide" unlinks the chart. A chart that was deleted reads as none.
- When the chart leaves out sizes the product sells, a warning names them.
        `,
      },
    },
  },
  decorators: [constrain('narrow')],
  args: { charts, sizes, modelValue: overshirt.detail!.sizeChartId, manageTo: { name: 'SizeCharts', params: { accountId: '2000290' } } },
  render: (args) => ({
    components: { ProductSizeGuideCard },
    setup() {
      const chartId = ref(args.modelValue)
      return { args, chartId }
    },
    template: '<ProductSizeGuideCard v-bind="args" v-model="chartId" />',
  }),
} satisfies Meta<typeof ProductSizeGuideCard>

export default meta
type Story = StoryObj<typeof meta>

/** The Linen Overshirt on the Outerwear chart. */
export const Default: Story = {}

/** A product that shows no size guide yet. */
export const NoChartChosen: Story = { args: { modelValue: undefined } }

/** The product sells a size the chart has no row for. */
export const SizesLeftOut: Story = {
  args: { modelValue: northfoldChart('Men’s tops').id, sizes: [...sizes, 'XXL'] },
}
