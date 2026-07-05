import type { Meta, StoryObj } from '@storybook/vue3'
import type {
  ActivityItem,
  ChildPage,
  DaVinciCardConfig,
  PrimaryAction,
  QuickAction,
  SetupCardConfig,
} from './ModuleLandingPage.vue'
import ModuleLandingPage from './ModuleLandingPage.vue'

// Realistic config lifted from MarketingLanding.vue (the component's main consumer).
const BASE = '/accounts/2000290'

const PRIMARY_ACTIONS: PrimaryAction[] = [
  { label: 'New campaign', icon: 'plus', to: `${BASE}/campaigns/new` },
]

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'send', label: 'New campaign', description: 'Send an email to a list', to: `${BASE}/campaigns/new` },
  { icon: 'route', label: 'Build a journey', description: 'Multi-step automation', to: `${BASE}/journeys` },
  { icon: 'clipboard-list', label: 'Create form', description: 'Capture new contacts', to: `${BASE}/signup_forms` },
  { icon: 'file-text', label: 'Browse templates', description: 'Reusable email content', to: `${BASE}/contents` },
]

const CHILD_PAGES: ChildPage[] = [
  { icon: 'megaphone', title: 'Campaigns', description: 'Email blasts, transactional sends, and campaign tags.', to: `${BASE}/campaigns`, count: 24 },
  { icon: 'route', title: 'Journeys', description: 'Multi-step automated customer journeys with branching logic.', to: `${BASE}/journeys`, count: 8 },
  { icon: 'file-text', title: 'Templates', description: 'Reusable email content and dynamic blocks for fast composition.', to: `${BASE}/contents`, count: 47 },
  { icon: 'zap', title: 'Automations', description: 'Triggered flows: cart abandon, win-back, post-purchase, and more.', to: `${BASE}/data_journeys`, count: 12 },
  { icon: 'clipboard-list', title: 'Forms', description: 'Signup forms, landing pages, and surveys to grow your audience.', to: `${BASE}/signup_forms`, count: 6 },
  { icon: 'bar-chart-3', title: 'Reports', description: 'Email performance, deliverability, and engagement analytics.', to: `${BASE}/reports`, status: 'New' },
]

const RECENT_ACTIVITY: ActivityItem[] = [
  { icon: 'mail', tag: 'email', eyebrow: '2m ago', title: 'Spring Refresh sent to Segment A · 12,408 recipients', meta: '58.2% open' },
  { icon: 'route', tag: 'automation', eyebrow: '14m ago', title: 'Cart abandoned · Step 2 enrolled 84 contacts', meta: 'In flow' },
  { icon: 'users', tag: 'audience', eyebrow: '32m ago', title: 'VIP repeat buyers segment refreshed', meta: '+312' },
  { icon: 'mail', tag: 'email', eyebrow: '1h ago', title: 'Loyalty · April delivered to 4,210 contacts', meta: '63.1% open' },
  { icon: 'package', tag: 'order', eyebrow: '2h ago', title: 'Order #10482 placed from campaign link', meta: '$184.00' },
]

const SETUP_CARD: SetupCardConfig = {
  title: 'Marketing setup',
  description: 'Finish these to send your first campaign with confidence.',
  items: [
    { label: 'Verify sending domain (DKIM, SPF)', complete: true },
    { label: 'Connect a contact list', complete: true },
    { label: 'Send a test campaign', complete: false, to: `${BASE}/campaigns/new` },
    { label: 'Set up a welcome journey', complete: false, to: `${BASE}/journeys` },
  ],
  ctaLabel: 'Open setup guide',
  ctaTo: `${BASE}/campaigns`,
}

const DA_VINCI_CARD: DaVinciCardConfig = {
  title: 'Da Vinci AI · Marketing',
  description: 'Smart suggestions tuned to your audience and recent campaigns.',
  suggestions: [
    { label: 'Find best send time for VIP segment', to: `${BASE}/da-vinci/dashboard` },
    { label: 'Generate subject line variants', to: `${BASE}/da-vinci/dashboard` },
    { label: 'Score audience engagement risk', to: `${BASE}/da-vinci/dashboard` },
  ],
}

const meta = {
  title: 'Design System/ModuleLandingPage',
  component: ModuleLandingPage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`ModuleLandingPage\` is the config-driven hub page for a whole module (used by
\`MarketingLanding\` and \`ContentLanding\`): page header with pill actions, a quick-actions row,
a grid of child-page cards (count or status badge), a recent-activity feed, and optional setup /
Da Vinci AI side cards. Only \`title\` and \`childPages\` are required — every other section
renders conditionally.

### 🟢 Do's
- **Do** drive all links from route paths (\`to\`) so account scoping stays in the view.
- **Do** keep child-page descriptions to one sentence; the cards clamp at ~2 lines.

### 🔴 Don'ts
- **Don't** hand-build module hubs in views — configure this component instead.
- **Don't** exceed ~6 quick actions; the row wraps on tablet and stacks on mobile.

### A11y
Quick actions are real \`<button>\`s, child cards are router-links, and both carry visible
focus rings via the theme tokens.
        `,
      },
    },
  },
  args: {
    title: 'Marketing',
    description: 'Plan, send, and automate every customer touch — campaigns, journeys, content, and forms in one place.',
    primaryActions: PRIMARY_ACTIONS,
    quickActions: QUICK_ACTIONS,
    childPages: CHILD_PAGES,
    recentActivity: RECENT_ACTIVITY,
    setupCard: SETUP_CARD,
    daVinciCard: DA_VINCI_CARD,
  },
  argTypes: {
    childPages: { control: 'object' },
    setupCard: { control: 'object' },
    daVinciCard: { control: 'object' },
  },
  render: (args) => ({
    components: { ModuleLandingPage },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 1240px; margin: 0 auto;">
        <ModuleLandingPage v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof ModuleLandingPage>

export default meta
type Story = StoryObj<typeof meta>

/** The full Marketing hub: every optional section populated. */
export const Default: Story = {}

/** Only the required props — header plus child-page grid, no side column content. */
export const Minimal: Story = {
  args: {
    title: 'Content',
    description: 'Templates, snippets, and media for every channel.',
    primaryActions: undefined,
    quickActions: undefined,
    childPages: CHILD_PAGES.slice(2, 5).map((cp) => ({ ...cp, count: undefined })),
    recentActivity: undefined,
    setupCard: null,
    daVinciCard: null,
  },
}

/** Setup checklist complete — progress bar full, all items struck through. */
export const SetupComplete: Story = {
  args: {
    setupCard: {
      ...SETUP_CARD,
      items: SETUP_CARD.items.map((i) => ({ ...i, complete: true })),
      ctaLabel: undefined,
    },
  },
}
