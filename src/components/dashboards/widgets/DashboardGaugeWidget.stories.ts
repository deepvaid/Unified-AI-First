import type { Meta, StoryObj } from '@storybook/vue3'
import type { DashboardGaugeData } from '@/stores/dashboards/types'
import DashboardGaugeWidget from './DashboardGaugeWidget.vue'

const DATA: DashboardGaugeData = {
  kind: 'gauge',
  pct: 68,
  centerValue: '68%',
  centerCaption: 'of $30,000',
  footerStats: [
    { label: 'Pace per day', value: '$678' },
    { label: 'Needed per day', value: '$2,418' },
  ],
}

const SCORE: DashboardGaugeData = {
  kind: 'gauge',
  pct: 100,
  centerValue: '10 / 10',
  centerCaption: 'score',
  arc: 'three-quarter',
}

const meta = {
  title: 'Product/Dashboards/Widgets/DashboardGaugeWidget',
  component: DashboardGaugeWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Rolling revenue-goal gauge from the Overview v2 design: a round-capped progress ring on a soft track, centered percentage, and pace/needed footer stats.',
      },
    },
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        '`DashboardGaugeData` — `{ kind: \'gauge\', pct, centerValue, centerCaption, arc?, footerStats? }`. `arc` selects the full circle or `three-quarter` (a 270° arc opening at the bottom). `pct` drives the sweep; `centerValue` is rendered verbatim, so formatting stays with the caller.',
    },
  },
} satisfies Meta<typeof DashboardGaugeWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { data: DATA },
}

export const ThreeQuarterArc: Story = {
  args: { data: SCORE },
  parameters: {
    docs: {
      description: {
        story:
          "shadcn radial variant (`arc: 'three-quarter'`): a 270° arc whose gap opens at the bottom — used by the Deliverability score on the Overview.",
      },
    },
  },
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
    components: { DashboardGaugeWidget },
    setup: () => ({ args, second: SCORE }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-component-card-gap)">
        <v-card flat border rounded="lg" class="mp-card-inset" style="height: 320px"><DashboardGaugeWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" class="mp-card-inset" style="height: 320px"><DashboardGaugeWidget :data="second" /></v-card>
      </div>
    `,
  }),
}
