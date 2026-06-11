import type { Meta, StoryObj } from '@storybook/vue3'
import DvVoiceStatePill from './DvVoiceStatePill.vue'

const meta = {
  title: 'Copilot/Voice/DvVoiceStatePill',
  component: DvVoiceStatePill,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'listening', 'thinking', 'speaking'],
      description: 'Current voice-engine state',
    },
    label: {
      control: 'text',
      description: 'Overrides the default state label (e.g. a live caption while speaking)',
    },
    variant: {
      control: 'select',
      options: ['pill', 'dot'],
      description: 'Full pill with icon + text, or a compact status dot',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvVoiceStatePill reflects the Da Vinci voice engine state (idle / listening / thinking / speaking).
The pill variant is used on the full-screen AI experience; the dot variant fits compact surfaces
like the copilot drawer composer.
`,
      },
    },
  },
} satisfies Meta<typeof DvVoiceStatePill>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  args: { state: 'idle' },
}

export const Listening: Story = {
  args: { state: 'listening' },
}

export const Thinking: Story = {
  args: { state: 'thinking' },
}

export const Speaking: Story = {
  args: { state: 'speaking', label: 'Revenue is up 12% this week…' },
}

export const Dot: Story = {
  args: { state: 'listening', variant: 'dot' },
}
