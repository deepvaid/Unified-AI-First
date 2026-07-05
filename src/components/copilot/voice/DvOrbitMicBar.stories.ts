import type { Meta, StoryObj } from '@storybook/vue3'
import DvOrbitMicBar from './DvOrbitMicBar.vue'
// Global orbit keyframes (dv-orbit-ripple) — imported by src/main.ts in the app;
// pulled in here for the Storybook preview bundle.
import '@/styles/dv-orbit.css'

const meta = {
  title: 'Copilot/Voice/DvOrbitMicBar',
  component: DvOrbitMicBar,
  tags: ['autodocs'],
  args: {
    micSize: 56,
    ripple: false,
    muted: false,
    ghost: 'keyboard',
    micLabel: 'Tap to talk',
  },
  argTypes: {
    micSize: { control: 'select', options: [50, 56], description: '56 in hero states, 50 in stacked states' },
    ripple: { control: 'boolean', description: 'Twin violet/cyan ripple rings (ready/listening/responding)' },
    muted: { control: 'boolean', description: 'Gray mic with white slash (paused)' },
    ghost: { control: 'select', options: ['keyboard', 'cancel', 'none'], description: 'Right-side 40px ghost action' },
    micLabel: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvOrbitMicBar is the fixed footer of the Orbit voice surface: the gradient mic
button (with optional twin ripple rings) plus a right-aligned ghost action —
keyboard (switch to typing) or ✕ (cancel listening). Sizes and flags per state are
mapped by \`DvOrbitVoiceSurface\`; stories below mirror those combinations. The
drawer is 420px wide, so stories render inside a fixed-width host.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvOrbitMicBar },
    setup: () => ({ args }),
    template: `
      <div style="width: 420px; background: rgb(var(--v-theme-surface)); border: 1px solid rgb(var(--v-theme-outline-variant)); border-radius: 16px; padding-top: 20px;">
        <DvOrbitMicBar v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof DvOrbitMicBar>

export default meta
type Story = StoryObj<typeof meta>

/** Ready — 56px mic, ripple on, keyboard ghost. */
export const Ready: Story = {
  args: { ripple: true },
}

/** Listening — ripple on, ghost becomes cancel ✕. */
export const Listening: Story = {
  args: { ripple: true, ghost: 'cancel', micLabel: 'Tap to stop' },
}

/** Thinking — 50px mic, no ripple, ghost hidden. */
export const Thinking: Story = {
  args: { micSize: 50, ghost: 'none' },
}

/** Paused — muted gray mic with slash. */
export const Paused: Story = {
  args: { muted: true, micLabel: 'Tap to resume' },
}
