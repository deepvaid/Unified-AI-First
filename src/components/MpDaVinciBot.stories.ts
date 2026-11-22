import type { Meta, StoryObj } from '@storybook/vue3'
import { provide } from 'vue'
import { routeLocationKey } from 'vue-router'
import MpDaVinciBot from './MpDaVinciBot.vue'
import { isolateStorage, overlayDocs } from '@/stories/decorators'
import type { ChatMessage } from '@/stores/useCopilot'

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

/** The revenue answer as it really renders: an `intentCards` message with a KPI row and the chart. */
const conversationMessages: ChatMessage[] = [
  {
    id: 'prompt-1',
    role: 'user',
    text: "How's revenue this week?",
  },
  {
    id: 'response-1',
    role: 'assistant',
    text: 'Revenue is up 61.2% on the week before — $7,222 across 10 orders in the last 7 days.',
    toolSteps: ['Query revenue · last 7 days', 'Compare vs prior week'],
    componentData: [
      {
        type: 'intentCards',
        props: {
          cards: [
            {
              type: 'kpis',
              props: {
                kpis: [
                  { label: 'Revenue', value: '$7,222', trend: '+61.2%', trendUp: true, icon: 'dollar-sign' },
                  { label: 'Orders', value: '10', trend: '+0.0%', icon: 'shopping-cart' },
                ],
              },
            },
            {
              type: 'chart',
              props: {
                title: 'Revenue · last 7 days',
                subtitle: '$7,222 total · +61.2% vs prior week',
                labels: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'],
                series: [
                  { name: 'Revenue', data: [940, 1129, 760, 890, 1159, 1040, 1304] },
                  { name: 'Previous 7 days', data: [560, 781, 700, 610, 422, 590, 816], isComparison: true },
                ],
                unit: 'currency',
                saveMetricId: 'commerce_revenue_over_time',
              },
            },
          ],
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
  // A seeded transcript is recorded to the history list, which persists to localStorage: put it back on unmount.
  decorators: [isolateStorage],
  parameters: {
    // A page mock: it lays out its own gutters, edge to edge.
    canvas: 'full',
    docs: {
      // One instance per frame: the history, toast and voice layers are module singletons.
      ...overlayDocs('820px').docs,
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
    visible: { control: 'boolean', description: 'Whether the host surface is on screen. The drawer stays mounted while closed; when false the bot stops speech and the mic, and holds back its toasts, but a reply still being worked out keeps landing (silently) so it is there when the drawer reopens. Default true.' },
    onClose: { action: 'close', description: 'Emitted from the header close button; the host owns the actual dismissal.' },
    onExpand: { action: 'expand', description: 'Emitted from the header expand control; the host widens or full-screens its container.' },
  },
  args: {
    initialChatMode: false,
    initialMessages: [],
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
      <div style="height:800px;display:flex;gap:var(--mp-space-24);padding:var(--mp-space-24);">
        <v-card flat border rounded="lg" class="mp-card-inset flex-grow-1">
          <h2 class="text-h6 font-weight-bold mb-6">Dashboard</h2>
          <div style="background:var(--surface-secondary);height:120px;border-radius:var(--mp-radius-12);margin-bottom:var(--mp-space-16);"></div>
          <div style="background:var(--surface-secondary);height:300px;border-radius:var(--mp-radius-12);"></div>
        </v-card>
        <div style="width:440px;border:1px solid var(--border-subtle);border-radius:var(--mp-component-card-radius);overflow:hidden;box-shadow:var(--elevation-overlay);flex-shrink:0;transition:width .3s ease;" class="copilot-container">
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
  },
}

export const CompactDrawer: Story = {
  parameters: { canvas: 'padded' },
  args: {
    initialChatMode: true,
    initialMessages: conversationMessages,
  },
  render: (args) => ({
    components: { MpDaVinciBot },
    setup() {
      provide(routeLocationKey, storyRoute as any)
      return { args }
    },
    template: `
      <div style="height:700px;width:440px;border:1px solid var(--border-subtle);border-radius:var(--mp-component-card-radius);overflow:hidden;box-shadow:var(--elevation-overlay);">
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

/** The Gemini advisor could not be reached: the canned reply is labelled as such instead of passing for an answer. */
export const AdvisorOffline: Story = {
  args: {
    initialChatMode: true,
    initialMessages: [
      { id: 'offline-user', role: 'user', text: 'Which of my products should I put on sale this week and why?' },
      {
        id: 'offline-assistant',
        role: 'assistant',
        text: "Da Vinci's advisor is offline right now, so I can't answer that one. I can still run campaigns, draft product copy, report on revenue, or build audience segments:",
        toolSteps: ['Consult Da Vinci brain'],
        componentData: [
          {
            type: 'intentCards',
            props: {
              cards: [
                {
                  type: 'insight',
                  props: {
                    headline: 'Advisor offline',
                    description: 'Open-ended answers need the Da Vinci connection. Try again in a moment — the actions below work without it.',
                    severity: 'warning',
                    icon: 'wifi-off',
                  },
                },
              ],
              quickReplies: [
                { label: 'Run a campaign', value: 'Run a campaign', icon: 'megaphone' },
                { label: "How's revenue this week?", value: "How's revenue this week?", icon: 'trending-up' },
              ],
            },
          },
        ],
      },
    ] satisfies ChatMessage[],
  },
}

/** The advisor is rate-limited or slow: labelled "busy" (worth retrying in a moment), distinct from "offline". */
export const AdvisorBusy: Story = {
  args: {
    initialChatMode: true,
    initialMessages: [
      { id: 'busy-user', role: 'user', text: 'Which of my products should I put on sale this week and why?' },
      {
        id: 'busy-assistant',
        role: 'assistant',
        text: "Da Vinci's advisor is busy right now — try that again in a moment. I can still run campaigns, draft product copy, report on revenue, or build audience segments:",
        toolSteps: ['Consult Da Vinci brain'],
        componentData: [
          {
            type: 'intentCards',
            props: {
              cards: [
                {
                  type: 'insight',
                  props: {
                    headline: 'Advisor busy',
                    description: 'Too many requests, or the answer took too long. Try again in a moment — the actions below work without it.',
                    severity: 'warning',
                    icon: 'hourglass',
                  },
                },
              ],
              quickReplies: [
                { label: 'Run a campaign', value: 'Run a campaign', icon: 'megaphone' },
                { label: "How's revenue this week?", value: "How's revenue this week?", icon: 'trending-up' },
              ],
            },
          },
        ],
      },
    ] satisfies ChatMessage[],
  },
}
