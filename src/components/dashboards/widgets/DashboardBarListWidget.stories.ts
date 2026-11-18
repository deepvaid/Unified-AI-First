import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardBarListData } from '@/stores/dashboards/types'
import DashboardBarListWidget from './DashboardBarListWidget.vue'

const BEST_SELLERS: DashboardBarListData = {
  kind: 'bar_list',
  rows: [
    { label: 'Trail Runner XT', value: '$6,480', pct: 100, meta: '54 units · 4 left in stock' },
    { label: 'Alpine Shell Jacket', value: '$4,180', pct: 65, meta: '19 units · 96 in stock' },
    { label: 'Canvas Tote', value: '$2,240', pct: 35, meta: '56 units · 7 left in stock' },
    { label: 'Merino crew socks, 3-pack', value: '$1,104', pct: 17, meta: '46 units · 210 in stock' },
  ],
}

const RETAIL: DashboardBarListData = {
  kind: 'bar_list',
  headline: { value: '$620', delta: '+9.4%', deltaPositive: true },
  rows: [
    { label: 'Melbourne CBD', value: '$236', pct: 38 },
    { label: 'Chadstone', value: '$180', pct: 29 },
    { label: 'Click & collect', value: '$120', pct: 19 },
    { label: 'Brisbane', value: '$84', pct: 14 },
  ],
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardBarListWidget',
  component: DashboardBarListWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Progress-bar list from the Overview v2 design: label/value rows over gradient pills, with optional per-row meta and an optional big-number headline (used by Retail today).',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardBarListData` — `{ kind: \'bar_list\', headline?, rows }`. Each row is `{ label, value, pct, meta? }` where `pct` (0–100) drives the bar width. The optional `headline` renders a value + delta above the list.',
    },
  },
} satisfies Meta<typeof DashboardBarListWidget>

export default meta
type Story = StoryObj<typeof meta>

export const BestSellers: Story = {
  args: { data: BEST_SELLERS },
}

export const WithHeadline: Story = {
  args: { data: RETAIL },
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget inside a card, at the size a dashboard row gives it. The inset is
 * the card's (`mp-card-inset`, `component.card.padding`), so its content starts on the same
 * edge as every other widget in the family.
 */
export const InContextDashboardRow: Story = {
  args: { data: BEST_SELLERS },
  render: (args) => ({
    components: { DashboardBarListWidget },
    setup: () => ({ args, second: RETAIL }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-component-card-gap)">
        <v-card flat border rounded="lg" class="mp-card-inset" style="height: 320px"><DashboardBarListWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" class="mp-card-inset" style="height: 320px"><DashboardBarListWidget :data="second" /></v-card>
      </div>
    `,
  }),
}
