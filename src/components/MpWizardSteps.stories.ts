import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpWizardSteps from './MpWizardSteps.vue'
import { liquidskyDocs, stack } from '@/stories/storyTemplate'

const meta = {
  title: 'Atoms/MpWizardSteps',
  component: MpWizardSteps,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('atoms-mpwizardsteps') + `
### Overview
\`MpWizardSteps\` renders the compact step chips used in wizard toolbars (numbered circles,
check icon for completed steps, rail separators). \`current\` is 1-based. Below 700px viewport
width the labels collapse and only the numbered circles remain, so the toolbar still fits.

**Two supported contracts:**
1. **Wizard navigation** — inside \`MpWizardShell\`'s header: pass \`clickable\` and \`:max-step\`
   (\`useWizardSteps\`' high-water ref — never the current step, or forward jumps die after
   stepping back). Visited steps become jumpable buttons emitting \`select\`.
2. **Passive progress display** — omit \`clickable\` for a read-only position tracker
   (OrderDetail's fulfillment stages, AllContacts' import dialog).

### Usage
\`\`\`html
<MpWizardSteps :steps="['Choose template', 'Settings']" :current="step" />
\`\`\`

### 🟢 Do's
- **Do** keep labels short (1–2 words) — they live in a toolbar row.
- **Do** drive \`current\` from the wizard's step state.

### 🔴 Don'ts
- **Don't** bind \`:max-step\` to the current step — that kills forward jumps the moment the
  user steps back. It wants the high-water mark (\`useWizardSteps().maxStep\`).
- **Don't** exceed ~5 steps; use a full \`v-stepper\` for longer flows.

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
    clickable: { control: 'boolean', description: 'Makes visited steps (those at or below `maxStep`) clickable, emitting `select`. Off by default \u2014 the indicator is passive unless the wizard supports jumping back.' },
    maxStep: { control: 'number', description: 'Highest 1-based step reached; everything up to it is jumpable when `clickable` is on. Defaults to `current`, which means no forward jumping.' },
    steps: { control: 'object', description: 'Ordered step labels (keep to 2–4 short labels).' },
    current: {
      control: { type: 'number', min: 1, max: 5, step: 1 },
      description: '1-based index of the active step. Steps below it render as completed (check); a value beyond the last step marks all steps done.',
    },
    onSelect: { action: 'select', table: { disable: true } },
  },
} satisfies Meta<typeof MpWizardSteps>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

const fourSteps = ['Choose a type', 'Configure', 'Design', 'Review']

/**
 * The two contracts. **Passive** (the default) is a read-only position tracker: every step is a
 * `div`. **Clickable** is wizard navigation: steps up to `maxStep` are buttons that emit
 * `select`. Click a visited step below to jump to it; "Review" stays inert because the wizard
 * has only reached step 3.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpWizardSteps },
    setup() {
      const current = ref(2)
      return { steps: fourSteps, current }
    },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">passive — a progress display</div>
          <MpWizardSteps :steps="steps" :current="2" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">clickable, max-step 3 — visited steps are buttons (on step {{ current }})</div>
          <MpWizardSteps :steps="steps" :current="current" clickable :max-step="3" @select="current = $event" />
        </div>
      </div>
    `,
  }),
}

/** There is no `size` prop: what varies is the number of steps (keep it to five or fewer). */
export const StepCount: Story = {
  render: stack({ MpWizardSteps }, [
    { label: 'two steps', args: { steps: ['Choose a type', 'Configure'], current: 1 } },
    { label: 'four steps', args: { steps: fourSteps, current: 2 } },
  ]),
}

/** Progress through every position: first, mid, and last. `aria-current` follows `current`. */
export const States: Story = {
  render: stack({ MpWizardSteps }, [1, 2, 4].map((current) => ({
    label: `current=${current}`,
    args: { steps: fourSteps, current },
  }))),
}

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
