import type { Meta, StoryObj } from '@storybook/vue3'
import type {
  ActivityItem,
  ChildPage,
  DaVinciCardConfig,
  PrimaryAction,
  QuickAction,
  SetupCardConfig,
} from './ModuleLandingPage.vue'
import { computed, ref } from 'vue'
import ModuleLandingPage from './ModuleLandingPage.vue'
import MpSegmentedControl from './MpSegmentedControl.vue'

// Realistic config lifted from MarketingLanding.vue (the component's main consumer).
const BASE = '/accounts/2000290'

// The first action is prominent by default; `emphasis: 'default'` is the outlined secondary.
const PRIMARY_ACTIONS: PrimaryAction[] = [
  { label: 'New campaign', icon: 'plus', to: `${BASE}/campaigns/new` },
  { label: 'View reports', icon: 'bar-chart-3', to: `${BASE}/reports`, emphasis: 'default' },
]

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'send', label: 'New campaign', description: 'Send an email to a list', to: `${BASE}/campaigns/new`, color: 'blue' },
  { icon: 'route', label: 'Build a journey', description: 'Multi-step automation', to: `${BASE}/journeys`, color: 'violet' },
  { icon: 'clipboard-list', label: 'Create form', description: 'Capture new contacts', to: `${BASE}/signup_forms`, color: 'green' },
  { icon: 'file-text', label: 'Browse templates', description: 'Reusable email content', to: `${BASE}/contents`, color: 'cyan' },
]

const CHILD_PAGES: ChildPage[] = [
  { icon: 'megaphone', title: 'Campaigns', description: 'Email blasts, transactional sends, and campaign tags.', to: `${BASE}/campaigns`, count: 24, color: 'blue' },
  { icon: 'route', title: 'Journeys', description: 'Multi-step automated customer journeys with branching logic.', to: `${BASE}/journeys`, count: 8, color: 'violet' },
  { icon: 'file-text', title: 'Templates', description: 'Reusable email content and dynamic blocks for fast composition.', to: `${BASE}/contents`, count: 47, color: 'cyan' },
  { icon: 'zap', title: 'Automations', description: 'Triggered flows: cart abandon, win-back, post-purchase, and more.', to: `${BASE}/data_journeys`, count: 12, color: 'amber' },
  { icon: 'clipboard-list', title: 'Forms', description: 'Signup forms, landing pages, and surveys to grow your audience.', to: `${BASE}/signup_forms`, count: 6, color: 'green' },
  { icon: 'bar-chart-3', title: 'Reports', description: 'Email performance, deliverability, and engagement analytics.', to: `${BASE}/reports`, status: 'New', color: 'rose' },
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
  headline: 'Let Da Vinci draft your next campaign',
  ctaLabel: 'Open Da Vinci',
  ctaTo: `${BASE}/da-vinci/dashboard`,
  suggestions: [
    { label: 'Find best send time for VIP segment', to: `${BASE}/da-vinci/dashboard` },
    { label: 'Generate subject line variants', to: `${BASE}/da-vinci/dashboard` },
    { label: 'Score audience engagement risk', to: `${BASE}/da-vinci/dashboard` },
  ],
}

const meta = {
  title: 'Patterns/Module Landing Page',
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

**Use when:** a module needs an overview hub that routes into its child pages (Marketing, Content, and future clouds).

**Don't use when:** the page shows actual data or workflows — this is a launcher, not a dashboard; use dashboard widgets or list views for real content.

### Usage
\`\`\`html
<!-- Views pass module config only; all links are route paths. -->
<ModuleLandingPage
  title="Marketing"
  description="Plan, send, and automate every customer touch."
  :primary-actions="[{ label: 'New campaign', icon: 'plus', to: campaignsNewPath }]"
  :quick-actions="quickActions"
  :child-pages="childPages"
  :recent-activity="recentActivity"
  :setup-card="setupCard"
  :da-vinci-card="daVinciCard"
/>
\`\`\`

### 🟢 Do's
- **Do** drive all links from route paths (\`to\`) so account scoping stays in the view.
- **Do** keep child-page descriptions to one sentence; the cards clamp at ~2 lines.

### 🔴 Don'ts
- **Don't** hand-build module hubs in views — configure this component instead.
- **Don't** exceed ~6 quick actions; the row wraps on tablet and stacks on mobile.

### A11y
- **Provides:** the title renders through \`MpPageHeader\` as the page \`h1\`; quick actions are real \`<button>\`s and child cards are router-links, both with visible \`:focus-visible\` rings via theme tokens; the setup progress bar is a Vuetify progress-linear with proper role; the quick-actions row has an \`aria-label\` landmark.
- **Consumer must:** keep child-page descriptions meaningful (they are the link's supporting text) and route \`to\` paths valid.
- **Gaps:** the "Sections" / "Recent activity" eyebrows now carry \`role="heading"\` + \`aria-level="2"\`, giving the page a sub-heading structure under the h1 *(fixed in the Phase 4 a11y pass)*; activity rows are non-interactive text (fine); setup-list checkmarks still convey completion by icon + strikethrough only — not announced as a checklist (backlog).
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
    title: { control: 'text', description: 'Module name, rendered by MpPageHeader as the page h1.' },
    description: { control: 'text', description: 'One-line module summary under the title.' },
    eyebrow: { control: 'text', description: 'Muted, tracked kicker rendered above the display headline.' },
    inkDaVinciCard: { control: 'boolean', description: 'Renders the Da Vinci card as the ink panel — the page\'s single branded moment. Use at most once per page.' },
    primaryActions: { control: 'object', description: 'Pill buttons in the header ({ label, icon?, to?/href?, emphasis? }[]). `emphasis` is `prominent` (filled, primary colour) or `default` (outlined); the first entry defaults to `prominent`, the rest to `default`.' },
    quickActions: { control: 'object', description: 'Shortcut buttons row under the header ({ icon, label, description?, to, color? }[]). `color` tints the icon tile: blue, violet, rose, green, amber, cyan, indigo or teal; without it the tile takes the module accent.' },
    childPages: { control: 'object', description: 'Required. Grid of section cards ({ icon, title, description, to, count? | status?, color? }[]). `color` tints the icon tile and count pill, with the same hues as a quick action.' },
    recentActivity: { control: 'object', description: 'Feed rows ({ icon, eyebrow, title, meta?, tag? }[]); tag colors the icon chip (email/order/audience/automation).' },
    setupCard: { control: 'object', description: 'Optional setup checklist side card with progress bar ({ title, description, items, ctaLabel?, ctaTo? }); null hides it.' },
    daVinciCard: { control: 'object', description: 'Optional Da Vinci suggestions side card ({ title, description, suggestions }); null hides it.' },
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

/**
 * The full Marketing hub: every optional section populated. Two primary actions (the first
 * `prominent`, the second `emphasis: 'default'`), and a `color` on each quick action and
 * section card, as the app's Marketing landing page sets them.
 */
export const Default: Story = {}

const ABSENT = {
  recentActivity: [],
  setupCard: null,
  quickActions: [],
  daVinciCard: null,
}

/**
 * Each optional block absent in turn, so a module with no activity or no setup card is
 * verifiable. One page at a time: the switch above the page picks the block to leave out.
 */
export const States: Story = {
  render: (args) => ({
    components: { ModuleLandingPage, MpSegmentedControl },
    setup() {
      const absent = ref<string | null>('recentActivity')
      const items = [
        { value: 'recentActivity', label: 'No recent activity' },
        { value: 'setupCard', label: 'No setup card' },
        { value: 'quickActions', label: 'No quick actions' },
        { value: 'daVinciCard', label: 'No Da Vinci card' },
      ]
      const pageArgs = computed(() => ({ ...args, ...(absent.value ? { [absent.value]: ABSENT[absent.value as keyof typeof ABSENT] } : {}) }))
      return { absent, items, pageArgs }
    },
    template: `
      <div>
        <MpSegmentedControl v-model="absent" :items="items" ariaLabel="Optional block to leave out" class="mb-6" />
        <ModuleLandingPage v-bind="pageArgs" />
      </div>
    `,
  }),
}

/**
 * Only the required props — header plus child-page grid, no side column content. The cards
 * carry no `color` here, so their icon tiles take the module accent.
 */
export const Minimal: Story = {
  args: {
    title: 'Content',
    description: 'Templates, snippets, and media for every channel.',
    primaryActions: undefined,
    quickActions: undefined,
    childPages: CHILD_PAGES.slice(2, 5).map((cp) => ({ ...cp, count: undefined, color: undefined })),
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

/**
 * A brand-new module: no activity yet and setup barely started. The activity section is gated on
 * `recentActivity?.length`, so an empty array collapses it entirely rather than leaving a bare
 * heading — the same result as passing `undefined`.
 */
export const EmptyActivity: Story = {
  args: {
    recentActivity: [],
    setupCard: {
      ...SETUP_CARD,
      items: SETUP_CARD.items.map((i) => ({ ...i, complete: false })),
    },
    childPages: CHILD_PAGES.map((cp) => ({ ...cp, count: 0, status: undefined })),
  },
}

/**
 * The Da Vinci card promoted to the ink panel — the page's single branded moment:
 * one message, one action. The CTA is a real `v-btn` (outlined, pill) recoloured for
 * the inverted surface, not a hand-rolled anchor.
 */
export const InkDaVinciCard: Story = {
  args: { inkDaVinciCard: true },
}

/** With the muted kicker above the display headline. */
export const WithEyebrow: Story = {
  args: { eyebrow: 'Marketing cloud' },
}

/** At 375px the quick-actions row stacks and the child-page grid collapses to one column. */
export const Mobile375: Story = {
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
}
