import type { Meta, StoryObj } from '@storybook/vue3'
import DvInsightCard from './DvInsightCard.vue'

const meta = {
  title: 'Product/Da Vinci/DvInsightCard',
  component: DvInsightCard,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'text',
      description: 'Lucide icon name for the insight'
    },
    headline: {
      control: 'text',
      description: 'Main headline of the insight'
    },
    description: {
      control: 'textarea',
      description: 'Detailed explanation of the insight'
    },
    actionLabel: {
      control: 'text',
      description: 'Label for the call-to-action button'
    },
    severity: {
      control: 'select',
      options: ['info', 'warning', 'success', 'error'],
      description: 'Severity level determining color and icon styling'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvInsightCard surfaces AI-generated insights, recommendations, and alerts to the user. It supports different severity levels (info, warning, success, error) with accompanying icons and call-to-action buttons.

## Do's
- Use for actionable insights from the AI copilot
- Match severity to the actual impact (error for critical issues, info for suggestions)
- Provide clear, actionable descriptions
- Include relevant icons to reinforce the message
- Use success for positive recommendations and achievements

## Don'ts
- Don't use for critical system errors (use proper error handling)
- Don't mix multiple unrelated insights in one card
- Don't use vague language in headlines
- Don't ignore the severity level meanings

## Best Practices
- Error: System failures, data issues, critical action needed
- Warning: Potential issues, best practices, improvements
- Success: Goals achieved, campaigns performing well
- Info: Suggestions, tips, general information
- Always provide actionable next steps via CTA button
        `
      }
    }
  }
} satisfies Meta<typeof DvInsightCard>

export default meta
type Story = StoryObj<typeof meta>

export const InfoInsight: Story = {
  args: {
    icon: 'lightbulb',
    headline: 'Optimize Your Send Time',
    description: 'Your audience typically opens emails between 10 AM and 2 PM EST. Consider scheduling this campaign for Tuesday at 11 AM to maximize engagement.',
    actionLabel: 'Apply Recommendation',
    severity: 'info'
  }
}

export const WarningInsight: Story = {
  args: {
    icon: 'triangle-alert',
    headline: 'Low Audience Engagement',
    description: 'Your last 3 campaigns had below-average open rates (18% vs 24% industry average). Review your subject lines and consider A/B testing.',
    actionLabel: 'View Analytics',
    severity: 'warning'
  }
}

export const SuccessInsight: Story = {
  args: {
    icon: 'circle-check',
    headline: 'Campaign Performing Well',
    description: 'Your spring sale campaign exceeded projections with a 34% open rate and 12% click-through rate. This segment responds well to promotional content.',
    actionLabel: 'View Details',
    severity: 'success'
  }
}

export const ErrorInsight: Story = {
  args: {
    icon: 'circle-x',
    headline: 'Campaign Launch Failed',
    description: 'Your email campaign could not be sent due to missing sender verification. Complete domain verification in Settings to continue.',
    actionLabel: 'Fix Now',
    severity: 'error'
  }
}
