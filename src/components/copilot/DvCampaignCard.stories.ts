import type { Meta, StoryObj } from '@storybook/vue3'
import DvCampaignCard from './DvCampaignCard.vue'

const meta = {
  title: 'Product/Da Vinci/DvCampaignCard',
  component: DvCampaignCard,
  tags: ['autodocs'],
  argTypes: {
    draftId: { control: 'number', description: 'Id of the campaign draft this card represents, used to open it in the builder.' },
    remaining: { control: 'object', description: '`string[]` of what still needs doing before the campaign can send. An empty array reads as ready; each entry renders as its own outstanding-item line.' },
    name: {
      control: 'text',
      description: 'Campaign name'
    },
    subject: {
      control: 'text',
      description: 'Email subject line or campaign headline'
    },
    audience: {
      control: 'text',
      description: 'Target audience or segment name'
    },
    audienceSize: {
      control: 'number',
      description: 'Number of contacts in the target audience'
    },
    sendTime: {
      control: 'text',
      description: 'Scheduled send time or delivery window'
    },
    channel: {
      control: 'text',
      description: 'Communication channel (Email, SMS, Push, etc.)'
    },
    status: {
      control: 'select',
      options: ['Draft', 'Scheduled', 'Sent', 'Paused'],
      description: 'Current campaign status'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvCampaignCard displays an editable campaign draft with the details Da Vinci prepared,
the work still remaining, and a safe handoff into the campaign builder.

## Do's
- Show complete campaign overview at a glance
- Use for AI-prepared drafts that still require merchant review
- Always include audience size for context
- Display channel prominently
- Use status badges to indicate campaign state

## Don'ts
- Don't truncate subject lines unnecessarily
- Don't hide audience size information
- Don't use without a clear action button
- Never imply that a draft was sent or scheduled

## Best Practices
- Keep Review editable draft as the primary action
- Show every remaining prerequisite before handoff
        `
      }
    }
  }
} satisfies Meta<typeof DvCampaignCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'Spring Sale - Email Campaign',
    subject: 'Limited Time: Save 30% on Spring Collection',
    audience: 'Active Customers (Last 90 Days)',
    audienceSize: 5234,
    sendTime: 'Tomorrow at 10:00 AM EST',
    channel: 'Email',
    status: 'Draft',
    draftId: 26,
    remaining: ['Email content', 'Send time'],
  }
}

export const NeedsDomainSetup: Story = {
  args: {
    name: 'Win-back offer',
    subject: 'It’s been a while — here’s what’s new',
    audience: 'Win-Back Segment',
    audienceSize: 8912,
    sendTime: 'Not scheduled',
    channel: 'Email',
    status: 'Draft',
    draftId: 27,
    remaining: ['Sending domain', 'Email content', 'Send time'],
  }
}
