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
  args: {
    data: {
      kind: 'gauge',
      pct: 100,
      centerValue: '10 / 10',
      centerCaption: 'score',
      arc: 'three-quarter',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "shadcn radial variant (`arc: 'three-quarter'`): a 270° arc whose gap opens at the bottom — used by the Deliverability score on the Overview.",
      },
    },
  },
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — a single value against a target. Its variants are where the value falls relative to that target. */
export const Variants: Story = {
  render: (args) => ({
    components: { DashboardGaugeWidget },
    setup: () => ({ args }),
    template: `<DashboardGaugeWidget v-bind="args" />`,
  }),
}

/**
 * There is no `size` prop — a widget fills the grid cell it is placed in. What Phase 4
 * (P4-1) guarantees is that the **inset** does not change with the cell: the distance from
 * the card's border to this widget's content is `component.card.padding` at every size,
 * inherited from the card standard set in Phase 3 rather than a second widget-only pair.
 *
 * Rendered below at three cell sizes inside a real `DashboardWidgetCard` — run your eye down
 * the left edges.
 */
export const Sizes: Story = {
  render: (args) => ({
    components: { DashboardGaugeWidget },
    setup: () => ({ args }),
    template: `
      <div class="d-flex ga-6 flex-wrap align-start">
        <div style="width: 280px; height: 220px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardGaugeWidget v-bind="args" /></v-card></div>
        <div style="width: 420px; height: 260px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardGaugeWidget v-bind="args" /></v-card></div>
        <div style="width: 620px; height: 300px"><v-card flat border rounded="lg" class="h-100 pa-5"><DashboardGaugeWidget v-bind="args" /></v-card></div>
      </div>
    `,
  }),
}

/** Under target, on target, and over. */
export const States: Story = {
  render: (args) => ({
    components: { DashboardGaugeWidget },
    setup: () => ({ args }),
    template: `<DashboardGaugeWidget v-bind="args" />`,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The widget where it actually lives — inside a `DashboardWidgetCard`, in a
 * dashboard row beside its siblings. This is the composition P4-1 is judged on: the header
 * band, the body inset and the footer are the card's, and every widget in the family sits on
 * the same edge.
 */
export const InContextDashboardRow: Story = {
  render: (args) => ({
    components: { DashboardGaugeWidget },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--mp-space-16); align-items: stretch">
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardGaugeWidget v-bind="args" /></v-card>
        <v-card flat border rounded="lg" style="height: 280px" class="pa-5"><DashboardGaugeWidget v-bind="args" /></v-card>
      </div>
    `,
  }),
}
