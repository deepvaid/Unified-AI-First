import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import DvHistoryDrawer from './DvHistoryDrawer.vue'
import { useDaVinciHistory } from '@/composables/useDaVinciHistory'
import { isolateStorage, overlayDocs } from '@/stories/decorators'

// Stories drive the useDaVinciHistory() module singleton from setup() — same
// convention as DvToastStack.stories.ts: clear the list, re-seed it, then
// re-date the items (through the reactive proxies) so they spread across the
// Today / Yesterday / Last 7 days / Older groups deterministically. Seeding
// goes through addItem(), so the seeds also land in localStorage
// ('davinci-history-v1'), like real conversations would; the isolateStorage
// decorator puts localStorage back when the story unmounts.

interface HistorySeed {
  title: string
  draftedCount: number
  addedCount?: number
  /** Absolute createdAt override applied after seeding. */
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

/** Reset + seed the history singleton; returns the id of the newest item. */
function seedHistory(seeds: HistorySeed[]): string | undefined {
  const { items, addItem, clearAll } = useDaVinciHistory()
  clearAll()
  seeds.forEach((seed) => addItem({ title: seed.title, draftedCount: seed.draftedCount, addedCount: seed.addedCount }))
  const atByTitle = new Map(seeds.map((seed) => [seed.title, seed.at]))
  // items exposes reactive proxies — mutating createdAt re-sorts and re-groups.
  items.value.forEach((item) => {
    const at = atByTitle.get(item.title)
    if (at != null) item.createdAt = at
  })
  return items.value[0]?.id
}

const meta = {
  title: 'Product/Da Vinci/DvHistoryDrawer',
  component: DvHistoryDrawer,
  tags: ['autodocs'],
  decorators: [isolateStorage],
  parameters: {
    docs: {
      // The history list is a module singleton: a frame per story keeps each one's own state.
      ...overlayDocs().docs,
      description: {
        component: `
### Overview
\`DvHistoryDrawer\` lists past Da Vinci conversations from \`useDaVinciHistory()\`, grouped into
Today / Yesterday / Last 7 days / Older. It renders in two modes: \`overlay\` (a modal panel with
full dialog semantics) and \`rail\` (inline inside the copilot surface, non-modal). Rows select a
conversation; per-row and "Clear all" deletions route through \`MpConfirmDialog\`.

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
  \`aria-labelledby\`, Escape-to-close, focus-in/restore, and a Tab trap; in \`rail\` mode those
  are deliberately inert since the drawer is inline, not modal.
- **Consumer must:** keep exactly one modal overlay open at a time.
        `,
      },
    },
  },
  argTypes: {
    open: { control: false, description: 'Slides the drawer in (overlay mode). Ignored in rail mode, which is always visible.' },
    activeId: { control: false, description: 'Id of the currently open conversation — highlights its row.' },
    mode: {
      control: false,
      description: '"overlay" (default): slides in over the copilot panel below its 56px header, with a close button. "rail": fills a persistent side rail and swaps the close button for a kebab menu with "Delete all conversations" (gated behind an MpConfirmDialog — replaced window.confirm in the Phase 4 a11y pass, which also gave the search input an aria-label).',
    },
    close: { control: false, description: 'Event — X button clicked (overlay mode only).', table: { category: 'events' } },
    select: { control: false, description: 'Event — conversation chosen (click or Enter/Space); payload is the item id.', table: { category: 'events' } },
    newChat: { control: false, description: 'Event — declared for consumers; not fired internally today.', table: { category: 'events' } },
  },
} satisfies Meta<typeof DvHistoryDrawer>

export default meta
type Story = StoryObj<typeof meta>

// 380×560 stage mimicking the copilot panel the drawer overlays; the header is
// the 56px inset the drawer leaves for the real panel header.
const FRAME_STYLE = 'position:relative; width:380px; height:560px; overflow:hidden;'
  + ' border:1px solid var(--border-subtle); border-radius:var(--mp-component-card-radius);'
  + ' background:var(--surface-primary); color:var(--on-surface);'
const HEAD_STYLE = 'height:var(--mp-layout-appbarHeight); display:flex; align-items:center;'
  + ' padding-inline:var(--mp-space-16); border-bottom:1px solid var(--border-subtle);'
  + ' font-size:var(--mp-fontSize-14); font-weight:var(--mp-fontWeight-semibold);'

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
      <div class="d-flex flex-column align-center ga-4">
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
      <div class="d-flex justify-center">
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
      <div class="d-flex justify-center">
        <div style="${FRAME_STYLE}">
          <div style="${HEAD_STYLE}">Da Vinci</div>
          <DvHistoryDrawer open mode="overlay" />
        </div>
      </div>
    `,
  }),
}
