import type { Meta, StoryObj } from '@storybook/vue3'
import DvOrbitWaveBars from './DvOrbitWaveBars.vue'
// Global orbit keyframes (dv-orbit-bar) — imported by src/main.ts in the app;
// pulled in here for the Storybook preview bundle.
import '@/styles/dv-orbit.css'

const meta = {
  title: 'Product/Da Vinci/Voice/DvOrbitWaveBars',
  component: DvOrbitWaveBars,
  tags: ['autodocs'],
  args: {
    count: 4,
    maxHeight: 16,
    barWidth: 3,
    gap: 3,
  },
  argTypes: {
    count: {
      control: { type: 'number', min: 1, max: 24 },
      description: 'Number of bars. The component draws exactly this many; it does not wrap or scroll.',
    },
    maxHeight: {
      control: { type: 'number', min: 4, max: 48 },
      description: 'Peak bar height in px at full amplitude. Canvas geometry, deliberately off the spacing scale.',
    },
    barWidth: {
      control: { type: 'number', min: 1, max: 8, step: 0.5 },
      description: 'Width of a single bar in px.',
    },
    gap: {
      control: { type: 'number', min: 1, max: 10, step: 0.5 },
      description: 'Gap between bars in px. Total width is `count * barWidth + (count - 1) * gap`, so these four props size the component together.',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvOrbitWaveBars is the Orbit handoff \`bars()\` waveform primitive — gradient bars
with deterministic resting heights (so static renders match the reference) and a
staggered CSS pulse. Used at 4×16px in the responding strip while TTS is speaking,
and at 3×10px inside \`DvOrbitStatusPill\`'s listening state.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvOrbitWaveBars },
    setup: () => ({ args }),
    template: `
      <div class="d-inline-flex align-center pa-4 rounded-lg" style="background: rgb(var(--v-theme-surface)); border: 1px solid rgb(var(--v-theme-outline-variant));">
        <DvOrbitWaveBars v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvOrbitWaveBars>

export default meta
type Story = StoryObj<typeof meta>

/** Responding-strip waveform — 4 bars, 16px tall (shown while TTS speaks). */
export const SpeakingStrip: Story = {}

/** Status-pill waveform — 3 slim bars, 10px tall (listening pill). */
export const StatusPill: Story = {
  args: { count: 3, maxHeight: 10, barWidth: 2.5, gap: 2.5 },
}

/** Wider meter — shows the deterministic height pattern across many bars. */
export const WideMeter: Story = {
  args: { count: 16, maxHeight: 28, barWidth: 3, gap: 4 },
}
