import type { Meta, StoryObj } from '@storybook/vue3'
import MpWizardStepCard from './MpWizardStepCard.vue'
import { constrain } from '@/stories/decorators'

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
    headless: { control: 'boolean', description: 'Renders only the fields: use it when the wizard shell\'s header already shows the step\'s title and description. `title` is still read out as the card\'s heading.' },
  },
  decorators: [constrain('section')],
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
    template: `<MpWizardStepCard v-bind="args">${fields}</MpWizardStepCard>`,
  }),
}

/**
 * The two structures. With its own **preamble** (heading, description, divider) the card names
 * the step. **Headless** drops the preamble because the wizard shell's header already shows the
 * step's title and description; the heading stays in the DOM for assistive tech.
 */
export const Variants: Story = {
  args: { title: '' },
  render: () => ({
    components: { MpWizardStepCard },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">with a preamble (default)</div>
          <MpWizardStepCard title="Campaign details" description="Name your campaign and write the subject line recipients will see.">${fields}</MpWizardStepCard>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">headless — the shell's header carries the title</div>
          <MpWizardStepCard title="Campaign details" headless>${fields}</MpWizardStepCard>
        </div>
      </div>
    `,
  }),
}

/** What the preamble can hold: no description, no divider, a chip beside the title, and an h3 for a second card on one step. */
export const States: Story = {
  args: { title: '' },
  render: () => ({
    components: { MpWizardStepCard },
    template: `
      <div class="d-flex flex-column ga-6">
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
