import type { Meta, StoryObj } from '@storybook/vue3'
import MpWizardSteps from './MpWizardSteps.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

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
check icon for completed steps, rail separators). \`current\` is 1-based. Below 700px viewport
width the labels collapse and only the numbered circles remain, so the toolbar still fits.

**Use when:** a 2–4 step create flow needs a passive progress indicator in its toolbar
(campaign/journey create wizards).

**Don't use when:** steps must be clickable navigation (use a pill navigator like EngineEditor's,
or \`v-stepper\`), or the flow has 5+ steps (use a full \`v-stepper\`).

### Usage
\`\`\`html
<MpWizardSteps :steps="['Choose template', 'Settings']" :current="step" />
\`\`\`

### 🟢 Do's
- **Do** keep labels short (1–2 words) — they live in a toolbar row.
- **Do** drive \`current\` from the wizard's step state.

### 🔴 Don'ts
- **Don't** use it for click-to-navigate steppers — it is a passive indicator.
- **Don't** exceed ~4 steps; use a full \`v-stepper\` for longer flows.

### 💡 Best Practices
- **Done state:** a \`current\` greater than \`steps.length\` marks every step complete — useful
  for a final confirmation screen.
- **Small screens:** the collapse is a viewport media query (\`max-width: 700px\`), not a
  container query — it reacts to the browser window, not the parent element's width.

### A11y
- **Provides:** semantic \`role="list"\`/\`role="listitem"\` with an \`aria-label="Wizard steps"\`
  group name; the active step carries \`aria-current="step"\`; label text stays in the DOM when
  visually collapsed (font-size 0), so screen readers still hear the step names on small screens.
- **Consumer must:** announce step changes elsewhere (e.g. move focus to the new step's heading)
  — the indicator itself is not a live region.
- **Provides (Phase 4):** completed steps append a visually-hidden "(completed)" text
  alternative, so state is no longer conveyed by the check icon and color alone.
- **Gaps:** none known.
        `,
      },
    },
  },
  args: {
    steps: ['Choose template', 'Settings'],
    current: 1,
  },
  argTypes: {
    steps: { control: 'object', description: 'Ordered step labels (keep to 2–4 short labels).' },
    current: {
      control: { type: 'number', min: 1, max: 5, step: 1 },
      description: '1-based index of the active step. Steps below it render as completed (check); a value beyond the last step marks all steps done.',
    },
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

/** `current` beyond the last step marks every step complete — the "all done" confirmation state. */
export const AllStepsDone: Story = {
  args: {
    steps: ['Setup', 'Template', 'Audience', 'Review'],
    current: 5,
  },
}

/**
 * Below 700px viewport width the labels collapse to numbered circles only (viewport media
 * query — view this story in the canvas, where the iframe is sized to 375px).
 */
export const SmallScreenCollapse: Story = {
  args: {
    steps: ['Setup', 'Template', 'Audience', 'Review'],
    current: 2,
  },
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
}

/** Step rail mid-progress on the dark theme. */
export const DarkMode: Story = {
  ...FourStepsMidProgress,
  globals: darkModeGlobals,
}
