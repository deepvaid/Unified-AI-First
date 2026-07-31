import type { Meta, StoryObj } from '@storybook/vue3'
import DvIntentCardList from './DvIntentCardList.vue'
import type { DvCardDescriptor } from '@/composables/useDaVinciIntents'

const meta = {
  title: 'Copilot/Voice/DvIntentCardList',
  component: DvIntentCardList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvIntentCardList renders the typed card descriptors produced by the unified Da Vinci
intent layer (\`useDaVinciIntents\`) onto the existing Dv* card components. It is the
shared renderer for both the copilot drawer and the full-screen AI experience, and
re-emits all card actions as a single \`action\` event.
`,
      },
    },
  },
} satisfies Meta<typeof DvIntentCardList>

export default meta
type Story = StoryObj<typeof meta>

const campaignCards: DvCardDescriptor[] = [
  {
    type: 'campaign',
    props: {
      name: 'Weekend Flash Sale',
      subject: 'Weekend Flash Sale — picked for you',
      audience: 'VIP customers',
      audienceSize: 3120,
      sendTime: 'Not scheduled',
      channel: 'Email',
      status: 'Planning',
      remaining: ['Email content', 'Send time'],
    },
  },
]

const revenueCards: DvCardDescriptor[] = [
  {
    type: 'kpis',
    props: {
      kpis: [
        { label: 'Revenue', value: '$128,420', trend: '+12.4%', trendUp: true, icon: 'dollar-sign' },
        { label: 'Orders', value: '1,284', trend: '+8.1%', trendUp: true, icon: 'shopping-cart' },
        { label: 'Avg order value', value: '$99.86', trend: '+3.9%', trendUp: true, icon: 'receipt' },
      ],
    },
  },
  {
    type: 'chart',
    props: {
      title: 'Revenue · last 7 days',
      subtitle: '$128.4k total · +12.4% vs prior week',
      bars: [[14.2], [16.8], [12.4], [18.1], [20.6], [17.9], [28.4]],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      seriesNames: ['Revenue ($k)'],
    },
  },
]

const mixedCards: DvCardDescriptor[] = [
  {
    type: 'segment',
    props: {
      name: 'VIP Customers',
      rules: ['Lifetime spend > $500', 'Ordered in the last 90 days', 'Email engagement: high'],
      estimatedSize: 3120,
    },
  },
  {
    type: 'content',
    props: {
      type: 'product',
      title: 'Aurora Trail Jacket',
      content:
        'Built for shoulder-season hikes, the Aurora Trail Jacket pairs a windproof ripstop shell with a brushed-mesh lining that breathes when the pace picks up.',
    },
  },
  {
    type: 'insight',
    props: {
      headline: 'Try a Da Vinci command',
      description: 'Ask things like "Run a campaign to VIP customers" or "How\'s revenue this week?"',
      severity: 'info',
      icon: 'sparkles',
    },
  },
]

export const CampaignResult: Story = {
  args: { cards: campaignCards },
}

export const RevenueResult: Story = {
  args: { cards: revenueCards },
}

export const MixedCards: Story = {
  args: { cards: mixedCards },
}
