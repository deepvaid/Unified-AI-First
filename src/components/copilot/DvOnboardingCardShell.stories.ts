import type { Meta, StoryObj } from '@storybook/vue3'
import DvOnboardingCardShell from './DvOnboardingCardShell.vue'

const meta = {
  title: 'Product/Da Vinci/DvOnboardingCardShell',
  component: DvOnboardingCardShell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`DvOnboardingCardShell\` is the shared chrome behind the two Da Vinci onboarding chat cards —
\`DvCampaignOnboardingCard\` and \`DvSetupOnboardingCard\`. It owns the avatar + eyebrow + title
header, the optional progress bar, and the primary/secondary action row. The cards differ only
in how their item rows render, so those arrive through the default slot.

**Use when:** building another Da Vinci onboarding-style card. Reach for the shell rather than
copying one of the two existing cards.

**Don't use when:** the surface isn't a stepwise onboarding card — this is not a general card.

### Usage
\`\`\`html
<DvOnboardingCardShell
  icon="route"
  :eyebrow="\`Campaign setup · Step \${step} of \${totalSteps}\`"
  :title="title"
  :progress="progress"
  progress-label="Campaign onboarding progress"
  :primary-action="primaryAction"
  @action="emit('action', $event)"
>
  <!-- card-specific item rows -->
</DvOnboardingCardShell>
\`\`\`

### 🟢 Do's
- **Do** pass \`progress: null\` for phases with no meaningful step position (goal, unsupported)
  — the bar hides rather than showing a misleading zero.
- **Do** give \`progressLabel\` a card-specific name; it's the bar's accessible name.
- **Do** style slotted item rows in the **child** — scoped styles don't cross the slot boundary.

### 🔴 Don'ts
- **Don't** put the action row in the slot; the shell renders it after the slot content.

### A11y
- **Provides:** the progress bar is a Vuetify progress-linear carrying \`aria-label\` from
  \`progressLabel\`; header text is real text, not icon-only.
- **Consumer must:** convey item status with icon **and** text label, never color alone.
        `,
      },
    },
  },
  argTypes: {
    icon: { control: 'text', description: 'Lucide icon name for the header avatar.' },
    eyebrow: { control: 'text', description: 'Muted line above the title. Callers append "· Step n of m" themselves when relevant.' },
    title: { control: 'text', description: 'Card title.' },
    description: { control: 'text', description: 'Optional supporting sentence under the title.' },
    progress: { control: { type: 'range', min: 0, max: 100, step: 1 }, description: '0–100, clamped. Pass null to hide the bar entirely.' },
    progressLabel: { control: 'text', description: 'Accessible name for the progress bar. Default "Progress".' },
    primaryAction: { control: 'object', description: 'CampaignOnboardingAction — { label, action, icon? }. Rendered flat/primary.' },
    secondaryAction: { control: 'object', description: 'CampaignOnboardingAction — rendered outlined.' },
    onAction: { action: 'action', description: 'Emitted with the action string when either action button is pressed.' },
  },
  args: {
    icon: 'route',
    eyebrow: 'Guided setup · Step 2 of 5',
    title: 'Your setup path',
    description: 'Three things left before your first send.',
    progress: 40,
    progressLabel: 'Guided setup progress',
    primaryAction: { label: 'Start first task', action: 'start-current-task', icon: 'arrow-right' },
    secondaryAction: { label: 'Change goal', action: 'change-goal', icon: 'refresh-cw' },
  },
} satisfies Meta<typeof DvOnboardingCardShell>

export default meta
type Story = StoryObj<typeof meta>

const ROWS = `
  <div class="d-flex flex-column ga-2">
    <div v-for="row in ['Authenticate your sending domain', 'Turn on link tracking', 'Create your first list']"
         :key="row"
         class="d-flex align-center ga-3 pa-3"
         style="border-radius: var(--mp-radius-12); background: rgb(var(--v-theme-surface-variant));">
      <v-icon color="info" size="20">circle-dashed</v-icon>
      <div class="flex-grow-1" style="min-width:0"><span class="text-body-2 font-weight-medium">{{ row }}</span></div>
      <span class="text-caption text-medium-emphasis text-no-wrap">≈ 5 min</span>
    </div>
  </div>
`

const render: Story['render'] = (args) => ({
  components: { DvOnboardingCardShell },
  setup: () => ({ args }),
  template: `<div style="max-width:520px"><DvOnboardingCardShell v-bind="args">${ROWS}</DvOnboardingCardShell></div>`,
})

/** The shell with representative slotted item rows. */
export const Default: Story = { render }

/** `progress: null` hides the bar — used by the goal and unsupported phases. */
export const NoProgressBar: Story = {
  args: { progress: null, eyebrow: 'Guided setup', title: 'What would you like to do first?' },
  render,
}

/** Header and actions only — the slot is empty. */
export const NoItems: Story = {
  args: { title: 'Setup complete', description: 'Everything is ready for your first send.', progress: 100 },
  render: (args) => ({
    components: { DvOnboardingCardShell },
    setup: () => ({ args }),
    template: '<div style="max-width:520px"><DvOnboardingCardShell v-bind="args" /></div>',
  }),
}

/** No action row when neither action is provided. */
export const NoActions: Story = {
  args: { primaryAction: undefined, secondaryAction: undefined },
  render,
}
