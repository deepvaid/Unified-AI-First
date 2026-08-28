import type { Meta, StoryObj } from '@storybook/vue3'
import DvLandingHero from './DvLandingHero.vue'

const meta = {
  title: 'Product/Da Vinci/DvLandingHero',
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

/**
 * The hero has one structure — eyebrow, headline, and an underline rule. What varies
 * is the copy it carries.
 */
export const Variants: Story = {
  render: (args) => ({
    components: { DvLandingHero },
    setup: () => ({ args }),
    template: `<DvLandingHero v-bind="args" />`,
  }),
}

/** Short vs long headline — the type scale holds and the rule stays put. */
export const Sizes: Story = {
  render: () => ({
    components: { DvLandingHero },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">short headline</div>
          <DvLandingHero />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** The hero is static — it has one state. */
export const States: Story = {
  render: () => ({
    components: { DvLandingHero },
    template: `<DvLandingHero />`,
  }),
  args: {} as never,
}
