import type { Meta, StoryObj } from '@storybook/vue3'
import MpWizardSteps from './MpWizardSteps.vue'

const meta = {
  title: 'Navigation/MpWizardSteps',
  component: MpWizardSteps,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpWizardSteps\` renders the compact step chips used in wizard toolbars (numbered circles,
check icon for completed steps, rail separators). \`current\` is 1-based. Below 700px the labels
collapse and only the numbered circles remain, so the toolbar still fits.

### 🟢 Do's
- **Do** keep labels short (1–2 words) — they live in a toolbar row.
- **Do** drive \`current\` from the wizard's step state.

### 🔴 Don'ts
- **Don't** use it for click-to-navigate steppers — it is a passive indicator.
- **Don't** exceed ~4 steps; use a full \`v-stepper\` for longer flows.
        `,
      },
    },
  },
  args: {
    steps: ['Choose template', 'Settings'],
    current: 1,
  },
  argTypes: {
    current: { control: { type: 'number', min: 1, max: 5, step: 1 } },
  },
} satisfies Meta<typeof MpWizardSteps>

export default meta
type Story = StoryObj<typeof meta>

export const TwoSteps: Story = {}

export const TwoStepsOnSettings: Story = {
  args: { current: 2 },
}

export const FourStepsMidProgress: Story = {
  args: {
    steps: ['Setup', 'Template', 'Audience', 'Review'],
    current: 3,
  },
}
