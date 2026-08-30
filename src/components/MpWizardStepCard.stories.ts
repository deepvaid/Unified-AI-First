import type { Meta, StoryObj } from '@storybook/vue3'
import MpWizardStepCard from './MpWizardStepCard.vue'

const fields = `
  <div class="d-flex flex-column ga-4">
    <v-text-field label="Campaign name *" placeholder="e.g. Black Friday 2026 — VIP Early Access" />
    <v-text-field label="Subject *" placeholder="e.g. 40% off sitewide — today only" />
  </div>
`

const meta = {
  title: 'Molecules/MpWizardStepCard',
  component: MpWizardStepCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The step-content card inside \`MpWizardShell\`'s measure: a semantic heading
(the step's section heading under the page h1), a one-line description, a
divider, then the fields. Insets on \`component.card.paddingSpacious\` (32),
matching the canonical wizard cards it replaces.

Not \`MpFormSection\` — that is the 13px in-form overline for groups *within*
a form. Galleries and canvas steps skip the card and render bare in the
shell's measure.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: "The step's heading." },
    description: { control: 'text', description: 'One line under the heading. Omitting it tightens the preamble.' },
    headingLevel: { control: 'select', options: [2, 3], description: 'h2 by default — the step title sits directly under the page h1. Use 3 for a second card on the same step.' },
    divider: { control: 'boolean', description: 'Divider between preamble and content (default true). Skip for dense gallery cards.' },
  },
} satisfies Meta<typeof MpWizardStepCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Campaign details',
    description: 'Name your campaign and write the subject line recipients will see.',
  },
  render: (args) => ({
    components: { MpWizardStepCard },
    setup: () => ({ args }),
    template: `<div style="max-width:780px"><MpWizardStepCard v-bind="args">${fields}</MpWizardStepCard></div>`,
  }),
}

/** Preamble variants: with/without description, without divider, title-append chip, h3 for a second card. */
export const Variants: Story = {
  args: { title: '' },
  render: () => ({
    components: { MpWizardStepCard },
    template: `
      <div class="d-flex flex-column ga-6" style="max-width:780px">
        <MpWizardStepCard title="With description" description="The canonical preamble — heading, one line, divider.">${fields}</MpWizardStepCard>
        <MpWizardStepCard title="No description">${fields}</MpWizardStepCard>
        <MpWizardStepCard title="No divider" description="Dense gallery cards skip the rule." :divider="false">${fields}</MpWizardStepCard>
        <MpWizardStepCard title="Title append" description="A chip rides beside the heading.">
          <template #title-append><v-chip size="small" variant="tonal" color="success" class="font-weight-medium">Optional</v-chip></template>
          ${fields}
        </MpWizardStepCard>
        <MpWizardStepCard title="Second card on a step" description="headingLevel 3 keeps the outline honest." :heading-level="3">${fields}</MpWizardStepCard>
      </div>
    `,
  }),
}
