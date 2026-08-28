import type { Meta, StoryObj } from '@storybook/vue3'
import DvSetupOnboardingCard from './DvSetupOnboardingCard.vue'

const meta = {
  title: 'Product/Da Vinci/DvSetupOnboardingCard',
  component: DvSetupOnboardingCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`DvSetupOnboardingCard\` is the guided-setup chat card — the Da Vinci onboarding counterpart of
\`DvCampaignOnboardingCard\`, sharing its shell (progress bar, item list, status chips, action
row) but keyed to setup tasks rather than campaign readiness. The \`kind\` prop drives the eyebrow
and icon across the flow's phases: \`goal\`, \`plan\`, \`task\`, \`verification\`, and \`complete\`.
Task items render per-status chips distinguishing verified from user-confirmed from skipped.

**Use when:** the assistant is guiding a merchant through account setup.

**Don't use when:** the checklist is campaign send-readiness — use \`DvCampaignOnboardingCard\`.

### 🟢 Do's
- **Do** set \`kind\` to match the phase; it's the only thing distinguishing a plan card from a
  verification card.
- **Do** pass \`minutes\` on task items — the time estimate is what makes the plan feel finite.

### 🔴 Don'ts
- **Don't** render more than one card per assistant turn; the flow is stepwise by design.

### A11y
- **Provides:** status chips pair icon with text; the progress bar carries its Vuetify role.
- **Consumer must:** handle the emitted \`action\` string — the card is presentational.
        `,
      },
    },
  },
  args: {
    kind: 'plan',
    title: 'Your setup path',
    description: 'First: Authenticate your sending domain',
    step: 1,
    totalSteps: 6,
    items: [
      { id: 'sending-domain', label: 'Authenticate your sending domain', status: 'pending', minutes: 5 },
      { id: 'link-tracking', label: 'Turn on link tracking', status: 'pending', minutes: 2 },
      { id: 'first-list', label: 'Create your first list', status: 'pending', minutes: 2 },
    ],
    primaryAction: { label: 'Start first task', action: 'start-current-task', icon: 'arrow-right' },
    secondaryAction: { label: 'Change goal', action: 'change-goal', icon: 'refresh-cw' },
  },
  argTypes: {
    title: { control: 'text', description: 'Card heading for this stage of guided setup.' },
    description: { control: 'text', description: 'Supporting line under the title. Defaults to empty.' },
    taskId: { control: 'text', description: 'Id of the task this card is about, when `kind` is `task` or `verification`.' },
    status: { control: 'text', description: '`SetupTaskStatus` \u2014 `pending`, `verified` and so on. Selects the status icon, label and colour.' },
    items: { control: 'object', description: '`SetupTaskCardItem[]` \u2014 the checklist rows, each with its own `status` and optional `minutes` estimate.' },
    primaryAction: { control: 'object', description: '`CampaignOnboardingAction` for the main button. Emits `action` with its key.' },
    secondaryAction: { control: 'object', description: 'Optional second action at lower emphasis.' },
    kind: {
      control: 'select', options: ['goal', 'plan', 'task', 'verification', 'complete', 'unsupported'],
      description: 'Which stage of guided setup this card is. Each value selects its own eyebrow and icon: `goal`/`task` (Guided setup), `plan` (Your path), `verification` (Check), `complete`, `unsupported`.',
    },
    step: {
      control: { type: 'number', min: 1, max: 8 },
      description: 'Current step, 1-based. Drives the progress indicator.',
    },
    totalSteps: {
      control: { type: 'number', min: 1, max: 16 },
      description: 'Total steps in the guided-setup path. The progress denominator.',
    },
  },
} satisfies Meta<typeof DvSetupOnboardingCard>

export default meta
type Story = StoryObj<typeof meta>

export const Plan: Story = {}

export const Goal: Story = {
  args: {
    kind: 'goal',
    title: 'Choose your first milestone',
    description: 'Da Vinci guides one setup task at a time. You make every change.',
    step: 1,
    totalSteps: 1,
    items: [],
    primaryAction: undefined,
    secondaryAction: undefined,
  },
}

export const Task: Story = {
  args: {
    kind: 'task',
    title: 'Authenticate your sending domain',
    description: 'Authenticated domains see dramatically better inbox placement.',
    taskId: 'sending-domain',
    status: 'pending',
    step: 1,
    totalSteps: 6,
    items: [],
    primaryAction: { label: 'Set up DNS', action: 'open-task:sending-domain', icon: 'arrow-up-right' },
    secondaryAction: { label: 'Skip for now', action: 'skip-current-task', icon: 'redo-2' },
  },
}

export const Verification: Story = {
  args: {
    kind: 'verification',
    title: 'Couldn’t verify this task',
    description: 'Manual confirmation is tracked separately from product-verified completion.',
    taskId: 'sending-domain',
    status: 'pending',
    step: 1,
    totalSteps: 6,
    items: [],
    primaryAction: { label: 'I completed this', action: 'confirm-current-task', icon: 'circle-check' },
    secondaryAction: { label: 'Back to the task', action: 'open-task:sending-domain', icon: 'arrow-up-right' },
  },
}

export const Complete: Story = {
  args: {
    kind: 'complete',
    title: 'Setup complete',
    description: 'Your account is ready to work.',
    step: 6,
    totalSteps: 6,
    items: [
      { id: 'sending-domain', label: 'Authenticate your sending domain', status: 'verified' },
      { id: 'link-tracking', label: 'Turn on link tracking', status: 'user-confirmed' },
      { id: 'first-list', label: 'Create your first list', status: 'skipped' },
    ],
    primaryAction: { label: 'Go to dashboard', action: 'explore-dashboard', icon: 'layout-dashboard' },
    secondaryAction: { label: 'View all setup tasks', action: 'view-all-tasks', icon: 'list-checks' },
  },
}

export const Unsupported: Story = {
  args: {
    kind: 'unsupported',
    title: 'Guidance only',
    description: 'Da Vinci explains each step and points to the right page. Only you make changes.',
    step: 2,
    totalSteps: 6,
    items: [],
    primaryAction: { label: 'Set up DNS', action: 'open-task:sending-domain', icon: 'arrow-up-right' },
    secondaryAction: undefined,
  },
}
