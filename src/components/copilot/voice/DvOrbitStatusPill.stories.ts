import type { Meta, StoryObj } from '@storybook/vue3'
import DvOrbitStatusPill from './DvOrbitStatusPill.vue'
// Global orbit keyframes (dv-orbit-pulse-dot, dv-orbit-bar) — imported by
// src/main.ts in the app; pulled in here for the Storybook preview bundle.
import '@/styles/dv-orbit.css'

const meta = {
  title: 'Copilot/Voice/DvOrbitStatusPill',
  component: DvOrbitStatusPill,
  tags: ['autodocs'],
  args: {
    state: 'ready',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['ready', 'listening', 'thinking', 'error', 'paused', 'responding', 'added'],
      description: 'Orbit state — responding/added render no pill (those states use strips instead)',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvOrbitStatusPill is the uppercase status capsule shown under the orb in the Orbit
voice surface: READY (pulsing gradient dot), LISTENING (mini waveform), THINKING
(three pulsing dots), DIDN'T CATCH THAT (warn tint), and MIC PAUSED (muted tint).
The \`responding\` and \`added\` states intentionally render nothing — those states
use the ambient/success strips in \`DvOrbitVoiceSurface\` instead.
`,
      },
    },
  },
} satisfies Meta<typeof DvOrbitStatusPill>

export default meta
type Story = StoryObj<typeof meta>

/** READY — pulsing gradient dot. */
export const Ready: Story = {}

/** LISTENING — mini 3-bar waveform on the strip gradient. */
export const Listening: Story = {
  args: { state: 'listening' },
}

/** THINKING — three staggered pulsing dots. */
export const Thinking: Story = {
  args: { state: 'thinking' },
}

/** DIDN'T CATCH THAT — warn tint. */
export const Error: Story = {
  args: { state: 'error' },
}

/** MIC PAUSED — muted slate tint. */
export const Paused: Story = {
  args: { state: 'paused' },
}
