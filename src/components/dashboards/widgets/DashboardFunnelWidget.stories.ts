import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardFunnelData } from '@/stores/dashboards/types'
import DashboardFunnelWidget from './DashboardFunnelWidget.vue'

// Reference: the design mockup's hand-tuned path for these exact stages was
// "M0 10 C100 10 100 37 200 37 C300 37 300 80.5 400 80.5 …" — funnelPath()
// reproduces it within ~1px via the share^0.42 perceptual scaling.
const DATA: DashboardFunnelData = {
  kind: 'funnel',
  stages: [
    { label: 'Emails sent', formattedValue: '9,840', share: '100%', pct: 1 },
    { label: 'Opened', formattedValue: '5,370', share: '54.6%', pct: 0.546 },
    { label: 'Clicked through', formattedValue: '1,150', share: '11.7%', pct: 0.117 },
    { label: 'Store sessions', formattedValue: '870', share: '8.8%', pct: 0.088 },
    { label: 'Added to cart', formattedValue: '248', share: '2.5%', pct: 0.025 },
    { label: 'Orders placed', formattedValue: '10', share: '0.10%', pct: 0.001, accent: true },
  ],
  footerStats: [
    { label: 'Attributed revenue', value: '$4,450' },
    { label: 'Share of store revenue', value: '21.9%' },
    { label: 'Cart to order', value: '4.0%' },
  ],
  warning: 'Biggest drop-off: opened → clicked, 78.6% lost',
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardFunnelWidget',
  component: DashboardFunnelWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Campaign-to-purchase funnel from the dotted Overview v2 design: a 6-column stage header (count + share of first stage), a horizontal-gradient funnel path with perceptual (share^0.42) height scaling, footer stats, and a biggest-drop-off warning chip.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardFunnelData` — `{ kind: \'funnel\', stages, footerStats, warning? }`. Each stage carries `pct` (0–1, its size **as a fraction of the first stage**) which draws the funnel path; `formattedValue` and `share` are display-only. Set `accent: true` on the stage the widget should emphasise.',
    },
  },
} satisfies Meta<typeof DashboardFunnelWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { data: DATA },
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget inside a card, at the size a dashboard row gives it. The inset is
 * the card's (`mp-card-inset`, `component.card.padding`), so its content starts on the same
 * edge as every other widget in the family.
 */
export const InContextDashboardRow: Story = {
  args: { data: DATA },
  render: (args) => ({
    components: { DashboardFunnelWidget },
    setup: () => ({ args }),
    template: `
      <v-card flat border rounded="lg" class="mp-card-inset" style="height: 320px"><DashboardFunnelWidget v-bind="args" /></v-card>
    `,
  }),
}
