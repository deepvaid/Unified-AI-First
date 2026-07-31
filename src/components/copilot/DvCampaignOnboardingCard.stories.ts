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
        checkedAt: '2026-07-31T09:00:00.000Z',
      },
      {
        id: 'audience',
        label: 'Audience',
        description: 'Choose at least one list or segment.',
        status: 'needs-attention',
        routeName: 'ContactLists',
        actionLabel: 'Create an audience',
        checkedAt: '2026-07-31T09:00:00.000Z',
      },
      {
        id: 'content',
        label: 'Email content',
        description: 'Templates are available to use in the builder.',
        status: 'ready',
        routeName: 'EmailContent',
        actionLabel: 'Browse templates',
        checkedAt: '2026-07-31T09:00:00.000Z',
      },
    ],
    actions: [
      { label: 'Review campaign brief', action: 'review-brief', icon: 'clipboard-list' },
      { label: 'Change objective', action: 'change-objective', icon: 'refresh-cw' },
    ],
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
    title: 'Campaign setup is ready',
    description: 'Your sending domain, audience, and content library are available.',
    items: [
      {
        id: 'domain',
        label: 'Sending domain',
        description: 'Your sending identity is authenticated.',
        status: 'ready',
        routeName: 'SettingsDnsSetup',
        actionLabel: 'Review domain',
        checkedAt: '2026-07-31T09:00:00.000Z',
      },
      {
        id: 'audience',
        label: 'Audience',
        description: 'VIP Customer Circle has 312 contacts.',
        status: 'ready',
        routeName: 'ContactLists',
        actionLabel: 'Review audience',
        checkedAt: '2026-07-31T09:00:00.000Z',
      },
      {
        id: 'content',
        label: 'Email content',
        description: 'Templates are available to use in the builder.',
        status: 'ready',
        routeName: 'EmailContent',
        actionLabel: 'Browse templates',
        checkedAt: '2026-07-31T09:00:00.000Z',
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
        checkedAt: '2026-07-31T09:00:00.000Z',
      },
    ],
  },
}

export const Complete: Story = {
  args: {
    kind: 'handoff',
    title: 'Campaign builder opened',
    description: 'Nothing was filled in or saved. Da Vinci remains available to explain each step.',
    step: 4,
    totalSteps: 4,
    items: [],
    actions: [],
  },
}
