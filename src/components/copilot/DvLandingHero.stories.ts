import type { Meta, StoryObj } from '@storybook/vue3'
import DvLandingHero from './DvLandingHero.vue'

const meta = {
  title: 'Copilot/DvLandingHero',
  component: DvLandingHero,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text', description: 'First name shown in the greeting' },
    prompt: { control: 'text', description: 'Gradient second line' },
    suggestions: { control: 'object', description: 'Suggestion chips (2-column grid)' },
    orbSize: { control: { type: 'number', min: 56, max: 160 }, description: 'Identity orb size in px' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvLandingHero is the shared Da Vinci front page — the twin-ring Orbit identity
orb with dotted pulse ripples, a two-line greeting ("Hi Ross," + gradient
prompt), a gradient rule, and a 2-column grid of suggestion chips. Used by
both the text-mode landing (MpDaVinciBot) and the voice-mode ready state
(DvOrbitVoiceSurface); only the host footer differs.
`,
      },
    },
  },
} satisfies Meta<typeof DvLandingHero>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    suggestions: [
      'Show open rate trend for last 30 days',
      'Create a revenue by channel widget',
      'Add a recent orders table',
      'Show ticket volume over time',
    ],
  },
}
