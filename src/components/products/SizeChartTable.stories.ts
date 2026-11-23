import { computed, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import SizeChartTable from './SizeChartTable.vue'
import { constrain, surfaceFrame } from '@/stories/decorators'
import { convertRows, sizeChartIssues } from '@/storefront/sizeChartForm'
import { northfoldChart } from '@/views/Storefront/storefrontStoryFixtures'

// Northfold (demo)'s size charts, from the store's seed.
const womensTops = northfoldChart('Women’s tops')
const outerwear = northfoldChart('Outerwear')

const meta = {
  title: 'Product/Products/SizeChartTable',
  component: SizeChartTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
A size chart's measurements as an editable grid, in the size chart drawer (Products › Size
charts). Sizes are rows and measurements are columns; every cell is a field with its own name
("Chest for size M"). What the size guide on a product page shows comes from here.

### Behaviour
- **Add size** suggests the next size in the run (XL after L, 34 after 30 and 32) and moves
  focus to its first measurement. **Add measurement** focuses the new column's name.
- Each column's menu (in its name field) moves it left or right or removes it; each row's menu
  moves it up or down or removes it. Focus follows the moved row or column, and a polite
  announcement says where it went.
- The arrow keys move between cells: up and down always, left and right once the caret is at
  the edge of the text. Enter moves down.
- A cell with a problem is marked in red with an icon, and its message is read out with the
  field; the line under the grid shows the message of the problem in focus.
- The Size column stays put while a wide chart scrolls sideways. The surface it paints is
  \`--size-chart-table-bg\` (default: the drawer's panel).
        `,
      },
    },
  },
  decorators: [surfaceFrame(), constrain('dialog')],
  args: { columns: womensTops.columns, rows: womensTops.rows, unit: 'in' },
  render: (args) => ({
    components: { SizeChartTable },
    setup() {
      const columns = ref([...args.columns])
      const rows = ref(args.rows.map((row) => ({ size: row.size, values: [...row.values] })))
      return { args, columns, rows }
    },
    template: `
      <div class="pa-5" style="--size-chart-table-bg: var(--surface-primary)">
        <SizeChartTable v-bind="args" v-model:columns="columns" v-model:rows="rows" />
      </div>
    `,
  }),
} satisfies Meta<typeof SizeChartTable>

export default meta
type Story = StoryObj<typeof meta>

/** Northfold's Women's tops chart, written in inches. */
export const Default: Story = {}

/** The same chart written in centimeters. */
export const Centimeters: Story = {
  args: { unit: 'cm', rows: convertRows(womensTops.rows, 'in', 'cm') },
}

/** Four measurements: wider than the drawer, so the grid scrolls sideways and the Size column stays put. */
export const WideChart: Story = {
  args: { columns: outerwear.columns, rows: outerwear.rows },
}

/** A chart with nothing in it yet: Add size and Add measurement start it. */
export const Empty: Story = {
  args: { columns: [], rows: [] },
}

/** After Save with problems: a size written twice, a range the wrong way round, a word and an empty cell. Fixing a cell clears its mark. */
export const Problems: Story = {
  args: {
    rows: [
      { size: 'S', values: ['34-35', '27-28', '37-38'] },
      { size: 'M', values: ['37-36', '29-30', 'roomy'] },
      { size: 'm', values: ['38-40', '', '41-43'] },
    ],
  },
  render: (args) => ({
    components: { SizeChartTable },
    setup() {
      const columns = ref([...args.columns])
      const rows = ref(args.rows.map((row) => ({ size: row.size, values: [...row.values] })))
      const issues = computed(() => sizeChartIssues({ ...womensTops, columns: columns.value, rows: rows.value }))
      return { args, columns, rows, issues }
    },
    template: `
      <div class="pa-5" style="--size-chart-table-bg: var(--surface-primary)">
        <SizeChartTable v-bind="args" v-model:columns="columns" v-model:rows="rows" :issues="issues" />
      </div>
    `,
  }),
}
