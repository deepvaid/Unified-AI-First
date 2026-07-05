import type { Meta, StoryObj } from '@storybook/vue3'
import DvOrbitOrb from './DvOrbitOrb.vue'
// Global orbit keyframes (dv-orbit-spin for the thinking arc) — imported by
// src/main.ts in the app; pulled in here for the Storybook preview bundle.
import '@/styles/dv-orbit.css'

const meta = {
  title: 'Copilot/Voice/DvOrbitOrb',
  component: DvOrbitOrb,
  tags: ['autodocs'],
  args: {
    size: 118,
    speed: 1,
    dim: false,
    arc: false,
    inverse: false,
  },
  argTypes: {
    size: { control: { type: 'number', min: 24, max: 160 }, description: 'Base size in px (renders at ×1.44)' },
    speed: { control: { type: 'number', min: 0.1, max: 3, step: 0.1 }, description: 'Spin multiplier — listening 2.4 · thinking 1.6 · strip 1.4 · error 0.6 · paused 0.25' },
    dim: { control: 'boolean', description: 'Slate mark, breathe stilled (error/paused)' },
    arc: { control: 'boolean', description: 'Conic arc sweep outside the orb (thinking)' },
    inverse: { control: 'boolean', description: 'White mark for dark/gradient backgrounds' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvOrbitOrb is the "Glow Mist Medium" particle identity mark used across the Orbit
voice surface — a canvas-rendered halo ring + scatter on one slow spin, with brand
spectral glints and a CSS breathe. It renders live on an animation frame loop; ink
colour is inherited from CSS \`currentColor\` (\`--dv-ink\` / dim slate / inverse white).
Stories pin the exact size/speed combinations each Orbit state uses.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvOrbitOrb },
    setup: () => ({ args }),
    template: `
      <div
        class="d-inline-flex align-center justify-center rounded-lg"
        :style="{
          width: '260px',
          height: '260px',
          background: args.inverse ? 'var(--dv-grad)' : 'rgb(var(--v-theme-surface))',
          border: '1px solid rgb(var(--v-theme-outline-variant))',
        }"
      >
        <DvOrbitOrb v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvOrbitOrb>

export default meta
type Story = StoryObj<typeof meta>

/** Listening hero — 118px at 2.4× spin. */
export const Listening: Story = {
  args: { size: 118, speed: 2.4 },
}

/** Thinking — 96px at 1.6× with the monochrome arc sweep. */
export const Thinking: Story = {
  args: { size: 96, speed: 1.6, arc: true },
}

/** Ambient strip mark — 38px at 1.4× (responding state). */
export const StripMark: Story = {
  args: { size: 38, speed: 1.4 },
}

/** Dimmed slate mark, breathe stilled — error (0.6×) and paused (0.25×) states. */
export const Dimmed: Story = {
  args: { size: 118, speed: 0.6, dim: true },
}

/** Inverse white mark on the Da Vinci brand gradient. */
export const Inverse: Story = {
  args: { size: 118, speed: 1.4, inverse: true },
}
