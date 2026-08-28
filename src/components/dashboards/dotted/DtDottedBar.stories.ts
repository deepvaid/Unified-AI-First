import type { Meta, StoryObj } from '@storybook/vue3'
import DtDottedBar from './DtDottedBar.vue'
import { BAR_GRADIENT, BAR_GRADIENT_GREEN } from './dottedChartMath'

const meta = {
  title: 'Product/Dashboards/Dotted/DtDottedBar',
  component: DtDottedBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`DtDottedBar\` is the 6px gradient progress pill used inside the dotted dashboard widgets
(\`DashboardBarListWidget\`, \`DashboardBreakdownWidget\`, \`DashboardTabsWidget\`). It renders a
rounded track on \`--surface-secondary\` with a gradient fill clamped to 0–100%.

### Use when
- Rendering per-row progress/share inside a dotted-style widget list.

### Don't use when
- You need a labelled, standalone metric — compose it inside a widget row instead.
        `,
      },
    },
  },
  argTypes: {
    pct: { control: { type: 'range', min: 0, max: 120, step: 1 }, description: 'Fill percentage. Values outside 0–100 are clamped.' },
    gradient: { control: 'text', description: 'CSS background-image for the fill. Defaults to the shared BAR_GRADIENT blue ramp.' },
  },
} satisfies Meta<typeof DtDottedBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { pct: 62 },
}

/** The shared green ramp (used for positive/goal rows). */
export const GreenGradient: Story = {
  args: { pct: 78, gradient: BAR_GRADIENT_GREEN },
}

/** Values outside 0–100 are clamped, so an over-target row never overflows its track. */
export const ClampedEdges: Story = {
  render: () => ({
    components: { DtDottedBar },
    setup: () => ({ BAR_GRADIENT }),
    template: `
      <div class="d-flex flex-column ga-3" style="max-width: 360px">
        <DtDottedBar :pct="0" />
        <DtDottedBar :pct="100" />
        <DtDottedBar :pct="118" :gradient="BAR_GRADIENT" />
      </div>
    `,
  }),
}
