import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import DvHistoryDrawer from './DvHistoryDrawer.vue'
import { useDaVinciHistory } from '@/composables/useDaVinciHistory'

// Stories drive the useDaVinciHistory() module singleton from setup() — same
// convention as DvToastStack.stories.ts: clear the list, re-seed it, then
// re-date the items (through the reactive proxies) so they spread across the
// Today / Yesterday / Last 7 days / Older groups deterministically. Seeding
// goes through addItem(), so the seeds also land in localStorage
// ('davinci-history-v1'), like real conversations would.

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
  title: 'Copilot/DvHistoryDrawer',
  component: DvHistoryDrawer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // The drawer positions absolutely inside its host panel — isolate docs
    // examples in iframes so each story shows its own singleton state.
    docs: { story: { inline: false, height: '640px' } },
  },
  argTypes: {
    open: { control: false, description: 'Slides the drawer in (overlay mode). Ignored in rail mode, which is always visible.' },
    activeId: { control: false, description: 'Id of the currently open conversation — highlights its row.' },
    mode: {
      control: false,
      description: '"overlay" (default): slides in over the copilot panel below its 60px header, with a close button. "rail": fills a persistent side rail and swaps the close button for a kebab menu with "Delete all conversations" (gated behind an MpConfirmDialog — replaced window.confirm in the Phase 4 a11y pass, which also gave the search input an aria-label).',
    },
    close: { control: false, description: 'Event — X button clicked (overlay mode only).', table: { category: 'events' } },
    select: { control: false, description: 'Event — conversation chosen (click or Enter/Space); payload is the item id.', table: { category: 'events' } },
    newChat: { control: false, description: 'Event — declared for consumers; not fired internally today.', table: { category: 'events' } },
  },
} satisfies Meta<typeof DvHistoryDrawer>

export default meta
type Story = StoryObj<typeof meta>

// 380×560 stage mimicking the copilot panel the drawer overlays; the 60px
// header matches the inset the drawer leaves for the real panel header.
const FRAME_STYLE = 'position:relative; width:380px; height:560px; overflow:hidden;'
  + ' border:1px solid rgb(var(--v-theme-outline-variant)); border-radius:16px;'
  + ' background: rgb(var(--v-theme-surface));'
const HEAD_STYLE = 'height:60px; display:flex; align-items:center; padding:0 16px;'
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
