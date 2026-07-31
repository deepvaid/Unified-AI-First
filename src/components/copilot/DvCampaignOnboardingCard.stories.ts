import type { Meta, StoryObj } from '@storybook/vue3'
import DvCampaignOnboardingCard from './DvCampaignOnboardingCard.vue'

const meta = {
  title: 'Copilot/DvSetupOnboardingCard', component: DvCampaignOnboardingCard, tags: ['autodocs'],
  args: {
    kind: 'task', title: 'Authenticate your sending domain',
    description: 'Authentication protects your reputation and improves inbox placement.',
    step: 1, totalSteps: 6, taskId: 'sending-domain', status: 'pending',
    primaryAction: { label: 'Set up DNS', action: 'open-task:sending-domain', icon: 'arrow-up-right' },
    secondaryAction: { label: 'Skip for now', action: 'skip-current-task', icon: 'redo-2' },
  },
} satisfies Meta<typeof DvCampaignOnboardingCard>

export default meta
type Story = StoryObj<typeof meta>
export const CurrentTask: Story = {}
export const Plan: Story = {
  args: {
    kind: 'plan', title: 'Your marketing setup path', description: 'One task at a time.',
    items: [
      { id: 'sending-domain', label: 'Authenticate your sending domain', status: 'pending', minutes: 5 },
      { id: 'link-tracking', label: 'Configure link tracking', status: 'pending', minutes: 2 },
      { id: 'first-list', label: 'Create a contact list', status: 'pending', minutes: 2 },
    ],
    primaryAction: { label: 'Start first task', action: 'start-current-task', icon: 'arrow-right' },
  },
}
export const ManualConfirmation: Story = {
  args: {
    kind: 'verification', title: 'Could not verify this task', status: 'pending',
    primaryAction: { label: 'I completed this', action: 'confirm-current-task', icon: 'circle-check' },
  },
}
