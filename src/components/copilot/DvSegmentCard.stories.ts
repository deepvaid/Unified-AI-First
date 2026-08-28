import type { Meta, StoryObj } from '@storybook/vue3'
import DvSegmentCard from './DvSegmentCard.vue'

const meta = {
  title: 'Product/Da Vinci/DvSegmentCard',
  component: DvSegmentCard,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Name of the audience segment'
    },
    rules: {
      description: 'Array of rule descriptions defining the segment criteria',
      control: false
    },
    estimatedSize: {
      control: 'number',
      description: 'Estimated number of contacts matching the segment'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvSegmentCard displays a customer segment with its defining rules and estimated size. It's used to preview and manage audience segmentation recommendations from the AI copilot.

## Do's
- Show clear, readable rules in plain language
- Always include estimated segment size
- Use for previewing segment criteria
- Provide actions to save or refine segments
- Use human-readable rule descriptions

## Don'ts
- Don't use overly technical rule syntax
- Don't hide segment size information
- Don't create segments with vague criteria
- Don't use without allowing users to preview results

## Best Practices
- List most important rules first
- Use "AND" logic between rules (all must match)
- Include timeframe context (e.g., "Last 30 Days")
- Show both positive and negative criteria
- Estimate segment size based on actual data
        `
      }
    }
  }
} satisfies Meta<typeof DvSegmentCard>

export default meta
type Story = StoryObj<typeof meta>

export const HighValueCustomers: Story = {
  args: {
    name: 'High-Value Customers',
    rules: [
      'Total Spending: Greater than $500',
      'Purchase Frequency: At least 5 purchases',
      'Recent Activity: Last purchase within 60 days',
      'Email Engagement: Opened emails in last 30 days'
    ],
    estimatedSize: 847
  }
}

export const InactiveSubscribers: Story = {
  args: {
    name: 'Inactive Subscribers - 6+ Months',
    rules: [
      'Last Purchase: More than 180 days ago',
      'No Email Opens: Last 90 days',
      'Email Delivery Status: Valid and active',
      'Subscription Status: Active (not unsubscribed)'
    ],
    estimatedSize: 2341
  }
}
