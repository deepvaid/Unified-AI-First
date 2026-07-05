import type { Meta, StoryObj } from '@storybook/vue3'
import DvOrbCanvas from './DvOrbCanvas.vue'
import type { OrbAudioFrame } from '@/lib/davinci-orb/types'

// Synthetic pull-based audio frames — stand-ins for useDaVinciVoice().getVoiceFrame
// so the orb reacts without a live microphone / TTS session.
function syntheticMicFrame(): OrbAudioFrame {
  const t = performance.now() / 1000
  return {
    micActive: true,
    micLevel: 0.45 + 0.3 * Math.abs(Math.sin(t * 2.1)),
    bands: Float32Array.from({ length: 16 }, (_, i) => 0.3 + 0.5 * Math.abs(Math.sin(t * 1.7 + i * 0.6))),
    speakEnergy: 0,
  }
}

function syntheticSpeakFrame(): OrbAudioFrame {
  const t = performance.now() / 1000
  return {
    micActive: false,
    micLevel: 0,
    bands: new Float32Array(16),
    speakEnergy: 0.5 + 0.45 * Math.sin(t * 5),
  }
}

const meta = {
  title: 'Copilot/Voice/DvOrbCanvas',
  component: DvOrbCanvas,
  tags: ['autodocs'],
  args: {
    state: 'idle',
    audioSource: null,
    paused: false,
    maxPixelRatio: 2,
    opacity: 2.7,
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'listening', 'thinking', 'speaking'],
      description: 'Engine animation state',
    },
    audioSource: { control: false, description: 'Pull-based OrbAudioFrame source (stories inject synthetic frames)' },
    paused: { control: 'boolean' },
    maxPixelRatio: { control: { type: 'number', min: 1, max: 3 } },
    opacity: { control: { type: 'number', min: 0.5, max: 4, step: 0.1 } },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvOrbCanvas hosts the WebGL Da Vinci particle orb (three.js + the shared engine
fetched at runtime from \`public/dv-orb/dv-orb-engine.js\`). It renders live on an
animation frame loop, reacts to an optional pull-based audio source, and resolves
its palette from the \`--dv-*\` theme tokens.

**Storybook notes:** stories pin a fixed-size dark surface so the additive glow
reads clearly. If the runtime engine script cannot be served (e.g. a static
Storybook build without the app's \`public/\` dir), the component's built-in CSS
placeholder orb renders instead — that graceful fallback is part of the component.
Listening/Speaking stories feed synthetic audio frames in place of
\`useDaVinciVoice().getVoiceFrame\`.
`,
      },
    },
  },
  render: (args) => ({
    components: { DvOrbCanvas },
    setup: () => ({ args }),
    template: `
      <v-theme-provider theme="maropostDark" with-background class="rounded-lg" style="display: inline-block;">
        <div style="width: 380px; height: 380px;">
          <DvOrbCanvas v-bind="args" />
        </div>
      </v-theme-provider>
    `,
  }),
} satisfies Meta<typeof DvOrbCanvas>

export default meta
type Story = StoryObj<typeof meta>

/** Resting orb — slow ambient drift. */
export const Idle: Story = {}

/** Listening with a synthetic mic level + 16 frequency bands driving the surface. */
export const Listening: Story = {
  args: { state: 'listening', audioSource: syntheticMicFrame },
}

/** Thinking — the engine's processing churn (no audio input). */
export const Thinking: Story = {
  args: { state: 'thinking' },
}

/** Speaking pulse driven by a synthetic TTS energy envelope. */
export const Speaking: Story = {
  args: { state: 'speaking', audioSource: syntheticSpeakFrame },
}

/** Paused — the frame loop is suspended mid-state. */
export const Paused: Story = {
  args: { paused: true },
}
