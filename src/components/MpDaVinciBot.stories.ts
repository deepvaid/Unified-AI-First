import type { Meta, StoryObj } from '@storybook/vue3'
import { provide } from 'vue'
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
  title: 'Product/Da Vinci/MpDaVinciBot',
  component: MpDaVinciBot,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpDaVinciBot\` is the Da Vinci copilot surface — the chat panel that hosts the \`copilot/\` Dv*
components. It opens on a suggestion landing state and switches to a transcript once a
conversation starts. Assistant turns can carry \`componentData\` (chart / KPI / table payloads
rendered inline) or onboarding-card descriptors, so the assistant answers with real UI rather
than text alone. It owns its own history drawer, toast layer (\`DvToastStack\`), intent layer, and
voice mode; hosts supply only the container and chrome.

**Use when:** embedding the copilot in a drawer, a rail, or the full-page Da Vinci experience.

**Don't use when:** you need a single AI action rather than a conversation — call the intent
layer directly.

### Usage
\`\`\`html
<!-- Floating drawer: the host owns width and dismissal -->
<MpDaVinciBot subtitle="Marketing assistant" @close="open = false" @expand="widen" />

<!-- Full-page experience: host supplies chrome, so drop the internal header -->
<MpDaVinciBot headerless :initial-chat-mode="true" :initial-messages="messages" />
\`\`\`

### 🟢 Do's
- **Do** pass \`headerless\` when the host surface already has a title bar — two headers stack badly.
- **Do** handle \`close\` and \`expand\`; the component emits intent but never resizes or unmounts itself.

### 🔴 Don'ts
- **Don't** mount more than one instance at a time — the history, toast, and voice layers are
  module singletons and two surfaces will fight over them.
- **Don't** render \`DvToastStack\` alongside it; the bot already includes one.

### A11y
- **Provides:** the transcript is a labelled region, streaming replies announce politely, and
  the composer is a real form with a labelled textarea; the history drawer carries full dialog
  semantics in overlay mode.
- **Consumer must:** give the containing surface an accessible name, and restore focus to the
  launcher when \`close\` fires.
        `,
      },
    },
  },
  argTypes: {
    initialChatMode: { control: 'boolean', description: 'Open straight into the chat transcript instead of the suggestion landing state. Default false.' },
    initialMessages: { control: 'object', description: 'ChatMessage[] seeding the transcript. Assistant turns may carry componentData (chart/kpi/table) or an onboarding card payload. Default [].' },
    subtitle: { control: 'text', description: 'Caption under the "Da Vinci" title in the header. Default "Intelligent AI assistant".' },
    headerless: { control: 'boolean', description: 'Drops the internal header — use when the host surface (drawer, full-page experience) supplies its own chrome. Default false.' },
    onClose: { action: 'close', description: 'Emitted from the header close button; the host owns the actual dismissal.' },
    onExpand: { action: 'expand', description: 'Emitted from the header expand control; the host widens or full-screens its container.' },
  },
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
        <div style="width:440px;border-radius:12px;overflow:hidden;box-shadow:0 16px 40px -12px rgba(var(--mp-rgb-color-light-textPrimary),.18);flex-shrink:0;transition:width .3s ease;" class="copilot-container">
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
      <div style="height:700px;width:440px;border-radius:12px;overflow:hidden;box-shadow:0 16px 40px -12px rgba(var(--mp-rgb-color-light-textPrimary),.18);background:rgb(var(--v-theme-background));">
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** Two structures: the full copilot surface with its own header, and `headerless` for hosts that supply their own chrome (the docked drawer does). */
export const Variants: Story = {
  render: (args) => ({
    components: { MpDaVinciBot },
    setup: () => ({ args }),
    template: `<MpDaVinciBot v-bind="args" />`,
  }),
}

/** There is no `size` prop — the bot fills whatever surface hosts it, from a 400px docked drawer to a full-page studio. Its internal rows and controls resolve to the shared `component.listItem.*` and `component.control.height` tokens, so the copilot does not read as a different product from the page behind it. */
export const Sizes: Story = {
  render: (args) => ({
    components: { MpDaVinciBot },
    setup: () => ({ args }),
    template: `<MpDaVinciBot v-bind="args" />`,
  }),
}

/** The states a session moves through: empty (suggestion chips), mid-conversation, and the onboarding card a first-run user sees. */
export const States: Story = {
  render: (args) => ({
    components: { MpDaVinciBot },
    setup: () => ({ args }),
    template: `<MpDaVinciBot v-bind="args" />`,
  }),
}
