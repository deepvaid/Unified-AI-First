import type { Meta, StoryObj } from '@storybook/vue3'
import DvOrbMark from './DvOrbMark.vue'

const meta = {
  title: 'Copilot/DvOrbMark',
  component: DvOrbMark,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'number', min: 16, max: 96 },
      description: 'CSS size in px',
    },
    variant: {
      control: 'select',
      options: ['bare', 'tile'],
      description: 'tile = --dv-grad rounded background like the classic avatars',
    },
    tileRadius: {
      control: 'text',
      description: "Tile border radius ('50%' circles, '10px' squircles)",
    },
    active: {
      control: 'boolean',
      description: 'Continuously animate (assistant typing/speaking)',
    },
    ambient: {
      control: 'boolean',
      description: 'Idle ambient pulse — keeps the loop running (hero usage)',
    },
    hoverAnimate: {
      control: 'boolean',
      description: 'Breathe when the closest interactive ancestor is hovered/focused',
    },
    state: {
      control: 'select',
      options: ['idle', 'listening', 'thinking', 'speaking'],
      description: 'Activity flavor — rotation speed/brightness modifier',
    },
    ink: {
      control: 'select',
      options: ['auto', 'dark', 'light'],
      description: 'Ink override for fixed-luminance hosts',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvOrbMark is the Da Vinci identity mark — a small particle-circle orb (a 2D-canvas
miniature of the WebGL orb) used at avatar/logo positions across the copilot UI.
It renders one static frame at rest, and **breathes** (ring radius oscillation +
gradient state-layer bloom + shimmer) while its host control is hovered or focused.
Set \`active\` to animate continuously (e.g. while the assistant is typing).

The dark-theme story exercises the runtime token re-resolution path
(\`.v-theme--maropostDark\` overrides). Decorative only — always \`aria-hidden\`.
`,
      },
    },
  },
} satisfies Meta<typeof DvOrbMark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 28, variant: 'bare' },
}

export const Tile: Story = {
  args: { size: 40, variant: 'tile' },
}

export const Landing: Story = {
  args: { size: 104, variant: 'bare', ambient: true },
}

export const Active: Story = {
  args: { size: 28, variant: 'tile', active: true, state: 'thinking' },
}

export const TopbarRoundedTile: Story = {
  args: { size: 30, variant: 'tile', tileRadius: '10px' },
}

export const SizesGrid: Story = {
  render: () => ({
    components: { DvOrbMark },
    template: `
      <div style="display:flex; align-items:flex-end; gap:20px; padding: 8px;">
        <DvOrbMark v-for="s in [16, 20, 28, 32, 40, 56]" :key="s" :size="s" variant="bare" />
        <DvOrbMark v-for="s in [28, 40, 56]" :key="'t' + s" :size="s" variant="tile" />
      </div>
    `,
  }),
}
