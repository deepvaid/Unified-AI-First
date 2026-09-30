import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import DvHistoryDrawer from './DvHistoryDrawer.vue'
import { useDaVinciHistory } from '@/composables/useDaVinciHistory'
import { inferIcon, type HistoryConversation } from '@/davinci/history'

// Stories drive the useDaVinciHistory() module singleton from setup() — same
// convention as DvToastStack.stories.ts: clear the list, then re-seed it with
// conversations dated to spread across the Today / Yesterday / Last 7 days /
// Older groups deterministically. Seeding goes through save(), so the seeds also
// land in localStorage ('davinci-history-v2'), like real conversations would.

interface HistorySeed {
  title: string
  draftedCount: number
  addedCount?: number
  /** Last activity — what the list sorts and groups by. */
  at: number
}

function buildSeeds(): HistorySeed[] {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const base = startOfToday.getTime()
  const HOUR = 3_600_000
  const DAY = 24 * HOUR
  // "Today" items are clamped so they never land before midnight when the
  // story is viewed early in the morning; distinct floors keep their order stable.
  const todayAt = (msAgo: number, floorMinutes: number) =>
    Math.max(Date.now() - msAgo, base + floorMinutes * 60_000)

  return [
    { title: 'Revenue by channel this quarter', draftedCount: 2, addedCount: 1, at: todayAt(2 * HOUR, 2) },
    { title: 'Open rate trend for VIP segment', draftedCount: 1, at: todayAt(5 * HOUR, 1) },
    { title: 'Ticket backlog by priority', draftedCount: 3, addedCount: 2, at: base - 8 * HOUR }, // yesterday
    { title: 'Abandoned cart recovery funnel', draftedCount: 1, addedCount: 1, at: base - 3 * DAY }, // last 7 days
    { title: 'Top products by repeat purchases', draftedCount: 2, at: base - 20 * DAY }, // older
  ]
}

/** Reset + seed the history singleton; returns the id of the newest conversation. */
function seedHistory(seeds: HistorySeed[]): string | undefined {
  const { items, save, clearAll } = useDaVinciHistory()
  clearAll()
  seeds.forEach((seed, index) => {
    const conversation: HistoryConversation = {
      id: `seed-${index}`,
      title: seed.title,
      icon: inferIcon(seed.title),
      createdAt: seed.at,
      updatedAt: seed.at,
      draftedCount: seed.draftedCount,
      addedCount: seed.addedCount ?? 0,
      questions: 1,
      messages: [
        { id: `seed-${index}-u`, role: 'user', text: seed.title },
        { id: `seed-${index}-a`, role: 'assistant', text: `Here’s what I found for “${seed.title}”.` },
      ],
    }
    save(conversation)
  })
  return items.value[0]?.id
}

const meta = {
  title: 'Product/Da Vinci/DvHistoryDrawer',
  component: DvHistoryDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`DvHistoryDrawer\` lists past Da Vinci conversations from \`useDaVinciHistory()\`, grouped into
Today / Yesterday / Last 7 days / Older by last activity. It renders in two modes: \`overlay\` (a
modal panel with full dialog semantics) and \`rail\` (inline inside the copilot surface, non-modal).
Choosing a row restores that conversation as the live thread (\`copilot.restoreConversation\`) — the
transcript comes back on every surface. Per-row and "Delete all" deletions route through
\`MpConfirmDialog\`; deleting the conversation on screen clears the screen too.

**Use when:** offering conversation history inside a copilot surface.

**Don't use when:** you need a general list view — this is bound to the Da Vinci history store.

### 🟢 Do's
- **Do** pass \`activeId\` so the current conversation is marked in the list.
- **Do** use \`rail\` mode when the drawer sits inside an already-modal surface — nested focus
  traps fight each other.

### 🔴 Don'ts
- **Don't** delete history without the confirm step; clearing all is irreversible.

### A11y
- **Provides:** in \`overlay\` mode the panel has \`role="dialog"\`, \`aria-modal\`,
  \`aria-labelledby\`, Escape-to-close, focus-in/restore, and a Tab trap — and while it is closed
  it is \`inert\`, so Tab and assistive tech can't reach it; in \`rail\` mode those are deliberately
  inert since the drawer is inline, not modal. Each row is a select button with a sibling delete
  button (no button inside a button), and the search field shows a focus ring.
- **Consumer must:** keep exactly one modal overlay open at a time.
        `,
      },
      // The drawer positions absolutely inside its host panel — isolate docs
      // examples in iframes so each story shows its own singleton state.
      story: { inline: false, height: '640px' },
    },
    canvas: 'full',
  },
  argTypes: {
    open: { control: false, description: 'Slides the drawer in (overlay mode). Ignored in rail mode, which is always visible.' },
    activeId: { control: false, description: 'Id of the currently open conversation — highlights its row.' },
    mode: {
      control: false,
      description: '"overlay" (default): slides in over the copilot panel below its 48px header, with a close button. "rail": fills a persistent side rail and swaps the close button for a kebab menu with "Delete all conversations" (gated behind an MpConfirmDialog — replaced window.confirm in the Phase 4 a11y pass, which also gave the search input an aria-label).',
    },
    close: { control: false, description: 'Event — X button clicked (overlay mode only).', table: { category: 'events' } },
    select: { control: false, description: 'Event — conversation chosen and restored (click or Enter/Space); payload is the conversation id. The host only closes the overlay — the drawer itself restores the thread.', table: { category: 'events' } },
    newChat: { control: false, description: 'Event — declared for consumers; not fired internally today.', table: { category: 'events' } },
  },
} satisfies Meta<typeof DvHistoryDrawer>

export default meta
type Story = StoryObj<typeof meta>

// 380×560 stage mimicking the copilot panel the drawer overlays; the header
// (--mp-space-48) matches the inset the drawer leaves for the real panel header.
const FRAME_STYLE = 'position:relative; width:380px; height:560px; overflow:hidden;'
  + ' border:1px solid rgb(var(--v-theme-outline-variant)); border-radius:16px;'
  + ' background: rgb(var(--v-theme-surface));'
const HEAD_STYLE = 'height:var(--mp-space-48); display:flex; align-items:center; padding:0 16px;'
  + ' border-bottom:1px solid rgb(var(--v-theme-outline-variant));'
  + ' font-weight:600; font-size:13.5px; color: rgb(var(--v-theme-on-surface));'

/**
 * Overlay mode as used inside MpDaVinciBot: grouped history with an active
 * row, search, hover/focus delete buttons, and a working close → reopen cycle.
 */
export const Default: Story = {
  args: { open: true },
  render: () => ({
    components: { DvHistoryDrawer },
    setup() {
      const activeId = ref(seedHistory(buildSeeds()))
      const open = ref(true)
      return { activeId, open }
    },
    template: `
      <div class="pa-6 d-flex flex-column align-center ga-4">
        <v-btn size="small" variant="tonal" color="primary" class="text-none" @click="open = !open">
          {{ open ? 'Close drawer' : 'Reopen drawer' }}
        </v-btn>
        <div style="${FRAME_STYLE}">
          <div style="${HEAD_STYLE}">Da Vinci</div>
          <DvHistoryDrawer
            :open="open"
            :active-id="activeId"
            mode="overlay"
            @close="open = false"
            @select="(id) => (activeId = id)"
          />
        </div>
      </div>
    `,
  }),
}

/**
 * Rail mode as used by the DaVinciCopilot full page: always visible, no close
 * button, kebab menu with the destructive "Delete all conversations" action.
 */
export const RailMode: Story = {
  args: { open: true, mode: 'rail' },
  render: () => ({
    components: { DvHistoryDrawer },
    setup() {
      const activeId = ref(seedHistory(buildSeeds()))
      return { activeId }
    },
    template: `
      <div class="pa-6 d-flex justify-center">
        <div style="${FRAME_STYLE}">
          <DvHistoryDrawer
            open
            :active-id="activeId"
            mode="rail"
            @select="(id) => (activeId = id)"
          />
        </div>
      </div>
    `,
  }),
}

/** No conversations yet — the built-in empty state (also shown when a search matches nothing). */
export const Empty: Story = {
  args: { open: true },
  render: () => ({
    components: { DvHistoryDrawer },
    setup() {
      const { clearAll } = useDaVinciHistory()
      clearAll()
    },
    template: `
      <div class="pa-6 d-flex justify-center">
        <div style="${FRAME_STYLE}">
          <div style="${HEAD_STYLE}">Da Vinci</div>
          <DvHistoryDrawer open mode="overlay" />
        </div>
      </div>
    `,
  }),
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** Two structures: the full drawer and the narrow rail mode the copilot uses when it is docked beside a page. */
export const Variants: Story = {
  render: (args) => ({
    components: { DvHistoryDrawer },
    setup: () => ({ args }),
    template: `<DvHistoryDrawer v-bind="args" />`,
  }),
}

/** There is no `size` prop — the drawer takes its width from the copilot surface it lives in. Its rows sit on `component.listItem.*`, the same 40px floor as every other list in the system, so a history entry and a nav row line up. */
export const Sizes: Story = {
  render: (args) => ({
    components: { DvHistoryDrawer },
    setup: () => ({ args }),
    template: `<DvHistoryDrawer v-bind="args" />`,
  }),
}

/** Populated, and empty — a first session with nothing to look back at yet. */
export const States: Story = {
  render: (args) => ({
    components: { DvHistoryDrawer },
    setup: () => ({ args }),
    template: `<DvHistoryDrawer v-bind="args" />`,
  }),
}
