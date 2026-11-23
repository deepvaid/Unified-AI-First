import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import SizeChartDrawer from './SizeChartDrawer.vue'
import { overlayDocs } from '@/stories/decorators'
import { emptySizeChart } from '@/stores/useSizeCharts'
import { sizesOf } from '@/storefront/sizeChartForm'
import type { SizeChartDraft } from '@/storefront/sizeChartForm'
import { northfold, northfoldChart } from '@/views/Storefront/storefrontStoryFixtures'

// Northfold (demo)'s size charts and the products that show them, from the store's seed.
const STORES = [{ id: 'northfold-demo', name: 'Northfold (demo)' }]
const womensTops = northfoldChart('Women’s tops')
const usersOf = (chartId: string) => northfold.products
  .filter((product) => product.detail?.sizeChartId === chartId)
  .map((product) => ({ id: product.id, name: product.name, sizes: sizesOf(product), to: { name: 'ProductEdit', params: { accountId: '2000290', productId: product.id } } }))

const meta = {
  title: 'Product/Products/SizeChartDrawer',
  component: SizeChartDrawer,
  tags: ['autodocs'],
  parameters: {
    ...overlayDocs('760px'),
    docs: {
      ...overlayDocs('760px').docs,
      description: {
        component: `
### Overview
Creates or edits a size chart on Products › Size charts. An \`MpFormDrawer\` (lg) with the chart's
name, store and unit, its measurements as a \`SizeChartTable\`, the fit note and how-to-measure
lines the size guide shows with it, and (when editing) the products that use it, each linking to
its page.

### Behaviour
- **Save** checks the chart first: a name no other chart in the store has, at least one size and
  one measurement, sizes and measurement names filled in once each, and a number or a range in
  every cell. Problems are listed at the top (each one moves focus to its field) and marked in
  the grid; focus goes to the first. The host gets \`save\` with the chart trimmed and ranges
  written "34-36".
- **Unit:** switching between inches and centimeters converts the numbers already written, so the
  chart still measures the same; the hint says so.
- **Store:** a new chart can go to any store offered; an existing chart stays in its own.
- A product that uses the chart and sells a size the chart has no row for is named in a warning,
  live as rows change.
- Closing with unsaved changes (Esc, the close button, the scrim or Cancel) asks first. Esc in
  an open grid menu closes only that menu.
        `,
      },
    },
  },
  args: { modelValue: true, chart: womensTops, stores: STORES, others: northfold.sizeCharts, usedBy: usersOf(womensTops.id) },
  render: (args) => ({
    components: { SizeChartDrawer },
    setup() {
      const open = ref(args.modelValue)
      const saved = ref<SizeChartDraft | null>(null)
      function save(chart: SizeChartDraft) {
        saved.value = chart
        open.value = false
      }
      return { args, open, saved, save }
    },
    template: `
      <div class="d-flex flex-column ga-3 align-start">
        <v-btn color="primary" variant="flat" class="text-none" @click="open = true">Open the drawer</v-btn>
        <p v-if="saved" class="text-body-2 ma-0">Saved “{{ saved.name }}”: {{ saved.rows.length }} sizes, {{ saved.columns.join(', ') }}, in {{ saved.unit }}.</p>
      </div>
      <SizeChartDrawer v-bind="args" v-model="open" @save="save" />
    `,
  }),
} satisfies Meta<typeof SizeChartDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** Editing Northfold's Women's tops chart, which six products show. */
export const Default: Story = {}

/** A new chart: five letter sizes and two measurements to fill in. */
export const NewChart: Story = {
  args: { chart: emptySizeChart('northfold-demo'), usedBy: [] },
}

/** A product that uses the chart sells XXL, which the chart has no row for. */
export const SizesLeftOut: Story = {
  args: {
    chart: northfoldChart('Men’s tops'),
    usedBy: [
      ...usersOf(northfoldChart('Men’s tops').id).slice(0, 2),
      { id: 3999, name: 'Relaxed Rugby Shirt', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    ],
  },
}

/** Save pressed on a new chart left empty: the problems are listed, marked, and focus is on the first. */
export const Problems: Story = {
  args: { chart: emptySizeChart('northfold-demo'), usedBy: [] },
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const save = [...document.querySelectorAll<HTMLButtonElement>('.mp-form-drawer button')].find((b) => b.textContent?.trim() === 'Create chart')
    save?.click()
  },
}
