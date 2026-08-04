import type { Meta, StoryObj } from '@storybook/vue3'
import DvSetupOnboardingCard from './DvSetupOnboardingCard.vue'

const meta = {
  title: 'Copilot/DvSetupOnboardingCard',
  component: DvSetupOnboardingCard,
  tags: ['autodocs'],
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
    kind: { control: 'select', options: ['goal', 'plan', 'task', 'verification', 'complete', 'unsupported'] },
    step: { control: { type: 'number', min: 1, max: 8 } },
    totalSteps: { control: { type: 'number', min: 1, max: 16 } },
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
