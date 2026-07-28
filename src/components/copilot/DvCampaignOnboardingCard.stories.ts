import type { Meta, StoryObj } from '@storybook/vue3'
import DvCampaignOnboardingCard from './DvCampaignOnboardingCard.vue'

const meta = {
  title: 'Copilot/DvCampaignOnboardingCard',
  component: DvCampaignOnboardingCard,
  tags: ['autodocs'],
  args: {
    title: 'Your campaign setup',
    description: 'Da Vinci checked the three things needed for a safe first send.',
    step: 3,
    totalSteps: 4,
    items: [
      {
        id: 'domain',
        label: 'Sending domain',
        description: 'Your sending identity is authenticated.',
        status: 'ready',
        routeName: 'SettingsDnsSetup',
        actionLabel: 'Set up domain',
      },
      {
        id: 'audience',
        label: 'Audience',
        description: 'Choose at least one list or segment.',
        status: 'needs-setup',
        routeName: 'ContactLists',
        actionLabel: 'Create an audience',
      },
      {
        id: 'content',
        label: 'Email content',
        description: 'Templates are available to use in the builder.',
        status: 'ready',
        routeName: 'EmailContent',
        actionLabel: 'Browse templates',
      },
    ],
    primaryAction: {
      label: 'Continue with a draft',
      action: 'continue-draft',
      icon: 'file-pen-line',
    },
    secondaryAction: {
      label: 'Change brief',
      action: 'change-brief',
      icon: 'refresh-cw',
    },
  },
  argTypes: {
    step: { control: { type: 'number', min: 1, max: 4 } },
    totalSteps: { control: { type: 'number', min: 1, max: 6 } },
  },
} satisfies Meta<typeof DvCampaignOnboardingCard>

export default meta
type Story = StoryObj<typeof meta>

export const NeedsSetup: Story = {}

export const Ready: Story = {
  args: {
    title: 'Everything is ready for a draft',
    description: 'Your sending domain, audience, and content library are available.',
    items: [
      {
        id: 'domain',
        label: 'Sending domain',
        description: 'Your sending identity is authenticated.',
        status: 'ready',
        routeName: 'SettingsDnsSetup',
        actionLabel: 'Review domain',
      },
      {
        id: 'audience',
        label: 'Audience',
        description: 'VIP Customer Circle has 312 contacts.',
        status: 'ready',
        routeName: 'ContactLists',
        actionLabel: 'Review audience',
      },
      {
        id: 'content',
        label: 'Email content',
        description: 'Templates are available to use in the builder.',
        status: 'ready',
        routeName: 'EmailContent',
        actionLabel: 'Browse templates',
      },
    ],
  },
}

export const CannotVerify: Story = {
  args: {
    title: 'One item needs a closer look',
    description: 'Da Vinci will not claim readiness when the prototype cannot verify it.',
    items: [
      {
        id: 'domain',
        label: 'Sending domain',
        description: 'Open DNS setup to confirm the current status.',
        status: 'unknown',
        routeName: 'SettingsDnsSetup',
        actionLabel: 'Check DNS setup',
      },
    ],
  },
}

export const Complete: Story = {
  args: {
    title: 'Draft opened in the campaign builder',
    description: 'Da Vinci prepared the details and audience. The merchant still controls content, timing, and send.',
    step: 4,
    totalSteps: 4,
    items: [],
    primaryAction: undefined,
    secondaryAction: undefined,
  },
}
