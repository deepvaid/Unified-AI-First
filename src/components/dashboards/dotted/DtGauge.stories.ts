import type { Meta, StoryObj } from '@storybook/vue3'
import { darkModeGlobals } from '@/stories/storybookTheme'
import DtGauge from './DtGauge.vue'

const meta = {
  title: 'Dashboards/Dotted/DtGauge',
  component: DtGauge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`DtGauge\` is the goal gauge behind \`DashboardGaugeWidget\`: a round-capped progress arc on a
soft track with a centered value + caption. The arc shades from the base colour toward a lighter
tint along the sweep; \`emboss\` switches to the lit-crown vertical ramp shared with the bar
marks, and \`flat\` renders a solid arc for Polaris-style themes. SVG gradient ids are scoped per
instance via \`useId()\`, so multiple gauges on one page never collide.

### Use when
- Rendering a single 0–100 goal metric inside a dashboard widget.

### Don't use when
- Comparing multiple series — use the donut/ring widgets instead.

### A11y
- The SVG carries \`role="img"\` with an \`aria-label\` composed from \`centerValue\` + \`centerCaption\`.
        `,
      },
    },
  },
  argTypes: {
    pct: { control: { type: 'range', min: 0, max: 100, step: 1 }, description: 'Progress 0–100 (clamped).' },
    centerValue: { control: 'text', description: 'Large center figure.' },
    centerCaption: { control: 'text', description: 'Small caption under the center figure.' },
    sweep: { control: { type: 'range', min: 90, max: 360, step: 10 }, description: 'Arc sweep in degrees. 270 gives the shadcn radial that opens at the bottom; 360 is a full ring.' },
    color: { control: 'color', description: 'Arc colour (theme-driven for flat Polaris themes).' },
    flat: { control: 'boolean', description: 'Solid arc, no gradient shading.' },
    emboss: { control: 'boolean', description: 'Lit crown + darkened base lip, matching the embossed bar marks.' },
  },
} satisfies Meta<typeof DtGauge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { pct: 68, centerValue: '68%', centerCaption: 'of $30,000' },
}

/** 270° shadcn radial — the gap centers on the bottom. */
export const ThreeQuarterSweep: Story = {
  args: { pct: 100, centerValue: '10 / 10', centerCaption: 'score', sweep: 270 },
}

/** Flat (Polaris) mode: solid arc in the given colour, no gradient. */
export const Flat: Story = {
  args: { pct: 45, centerValue: '45%', centerCaption: 'complete', flat: true, color: '#7E3AF2' },
}

/** Embossed mode: the vertical lit-crown ramp shared with the bar marks. */
export const Embossed: Story = {
  args: { pct: 82, centerValue: '82%', centerCaption: 'to goal', emboss: true },
}

/** Edge values render without artefacts — 0% leaves the track only, 100% closes the arc. */
export const EdgeValues: Story = {
  render: () => ({
    components: { DtGauge },
    template: `
      <div class="d-flex ga-6 flex-wrap">
        <DtGauge :pct="0" center-value="0%" center-caption="no progress" />
        <DtGauge :pct="100" center-value="100%" center-caption="complete" />
      </div>
    `,
  }),
}

export const DarkMode: Story = {
  ...Default,
  globals: darkModeGlobals,
}
