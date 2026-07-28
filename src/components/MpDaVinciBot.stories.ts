import { provide } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { routeLocationKey } from 'vue-router'
import MpDaVinciBot from './MpDaVinciBot.vue'
import type { ChatMessage } from '@/stores/useCopilot'

type StoryMessage = {
  id: string
  role: 'user' | 'assistant'
  text?: string
  componentData?: {
    type: 'chart' | 'kpi' | 'table'
    props: Record<string, unknown>
  }[]
}

const storyRoute = {
  fullPath: '/accounts/2000290/dashboards',
  path: '/accounts/2000290/dashboards',
  query: {},
  hash: '',
  name: 'DashboardDetail',
  params: { accountId: '2000290' },
  matched: [],
  meta: {},
  redirectedFrom: undefined,
}

const conversationMessages: StoryMessage[] = [
  {
    id: 'prompt-1',
    role: 'user',
    text: 'Top 10 products by revenue',
  },
  {
    id: 'response-1',
    role: 'assistant',
    text: 'Here are the results you requested:',
    componentData: [
      {
        type: 'kpi',
        props: {
          kpis: [{ label: 'Total Revenue (Top 10)', value: '$842K', trend: '12%', trendUp: true }],
        },
      },
      {
        type: 'chart',
        props: {
          title: 'Revenue Share (Top 10)',
          subtitle: 'Last 30 Days',
          bars: [[400], [350], [300], [250], [200], [150], [100], [80], [60], [40]],
          labels: ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E', 'Prod F', 'Prod G', 'Prod H', 'Prod I', 'Prod J'],
        },
      },
    ],
  },
]

const onboardingMessages: ChatMessage[] = [
  {
    id: 'onboarding-user',
    role: 'user',
    text: 'Promote an offer to VIP customers',
  },
  {
    id: 'onboarding-assistant',
    role: 'assistant',
    text: 'I found one setup item to review. We can still save an editable draft without sending anything.',
    componentData: [
      {
        type: 'campaignOnboarding',
        props: {
          title: 'Review your campaign setup',
          description: 'Da Vinci checks readiness, but you keep control of content, timing, and send.',
          step: 3,
          totalSteps: 4,
          items: [
            {
              id: 'domain',
              label: 'Sending domain',
              description: 'This prototype cannot verify the domain yet.',
              status: 'unknown',
              routeName: 'SettingsDnsSetup',
              actionLabel: 'Check DNS setup',
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
              description: 'Templates are available in the campaign builder.',
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
      },
    ],
  },
]

const meta = {
  title: 'AI/MpDaVinciBot',
  component: MpDaVinciBot,
  tags: ['autodocs'],
  args: {
    initialChatMode: false,
    initialMessages: [],
    attachmentName: '',
    attachmentMeta: 'CSV, image, or PDF - max 25 MB',
    subtitle: 'Intelligent AI assistant',
  },
  render: (args) => ({
    components: { MpDaVinciBot },
    setup() {
      const toggleExpand = () => {
        const container = document.querySelector('.copilot-container') as HTMLElement | null
        if (container) {
          container.style.width = container.style.width === '800px' ? '440px' : '800px'
        }
      }

      provide(routeLocationKey, storyRoute as any)

      return { args, toggleExpand }
    },
    template: `
      <div style="height:800px;display:flex;background:rgb(var(--v-theme-background));padding:24px;">
        <div style="flex:1;border-radius:12px;background:rgb(var(--v-theme-surface));margin-right:24px;padding:24px;border:1px solid rgb(var(--v-theme-outline-variant));overflow:hidden;">
          <h2 class="text-h6 font-weight-bold mb-6">Dashboard</h2>
          <div style="background:rgb(var(--v-theme-surface-variant));height:120px;border-radius:8px;margin-bottom:16px;"></div>
          <div style="background:rgb(var(--v-theme-surface-variant));height:300px;border-radius:8px;"></div>
        </div>
        <div style="width:440px;border-radius:12px;overflow:hidden;box-shadow:0 16px 40px -12px rgba(26,24,20,.18);flex-shrink:0;transition:width .3s ease;" class="copilot-container">
          <MpDaVinciBot v-bind="args" @expand="toggleExpand" />
        </div>
      </div>
    `,
  }),
} satisfies Meta<typeof MpDaVinciBot>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyState: Story = {}

export const Conversation: Story = {
  args: {
    initialChatMode: true,
    initialMessages: conversationMessages,
    attachmentName: 'top-products.csv',
    attachmentMeta: 'CSV - 25 KB',
  },
}

export const CompactDrawer: Story = {
  args: {
    initialChatMode: true,
    initialMessages: conversationMessages,
    attachmentName: 'top-products.csv',
    attachmentMeta: 'CSV - 25 KB',
  },
  render: (args) => ({
    components: { MpDaVinciBot },
    setup() {
      provide(routeLocationKey, storyRoute as any)
      return { args }
    },
    template: `
      <div style="height:700px;width:440px;border-radius:12px;overflow:hidden;box-shadow:0 16px 40px -12px rgba(26,24,20,.18);background:rgb(var(--v-theme-background));">
        <MpDaVinciBot v-bind="args" />
      </div>
    `,
  }),
}

export const CampaignOnboarding: Story = {
  args: {
    initialChatMode: true,
    initialMessages: onboardingMessages,
    subtitle: 'Guiding your first campaign',
  },
}
