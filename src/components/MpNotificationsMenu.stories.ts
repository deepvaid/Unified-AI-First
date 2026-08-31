import type { Meta, StoryObj } from '@storybook/vue3'
import MpNotificationsMenu from './MpNotificationsMenu.vue'
import { useNotifications, type AppNotification } from '@/stores/useNotifications'
import { NOTIFICATIONS } from '@/stories/fixtures'

const meta = {
  title: 'Molecules/MpNotificationsMenu',
  component: MpNotificationsMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpNotificationsMenu\` is the app bar's notification centre, aligned with the real product's
feed: a bell trigger whose unread badge **wraps** the button (the app's \`v-badge\` convention,
capped at 99+), opening a \`role="dialog"\` panel of notification rows — **one generic icon**
(the real system carries no classification, so severity iconography would be invented), the
message with an **absolute timestamp** ("Aug 26, 2026 at 02:40 AM"), a **download action** on
report/export rows — with "See all" (→ the /notifications page) and "Mark all read" in the
header, and an \`MpEmptyState\` when the feed is empty. The row itself is the shared
\`notifications/NotificationRow\`, used by the panel and the page.

It is **store-driven and has no props** — it reads \`useNotifications\` (items, unread count)
and calls \`markRead\`/\`markAllRead\` on it, exactly like the app bar reads the accounts and
theme stores. Attrs fall through to the bell button, so the app bar passes
\`class="appbar-action-btn"\` for its 40px utility-button treatment.

**Use when:** the global app bar needs its notification bell. This is a singleton surface —
one per app frame.

**Don't use when:** a page needs an inline activity feed (compose \`MpListRow\`s directly —
see the ActivityFeed story on MpListRow) or a transient confirmation (that's \`useToast\`).

### Usage
\`\`\`html
<MpNotificationsMenu class="appbar-action-btn" />
\`\`\`

### 🟢 Do's
- **Do** keep timestamps absolute ("Aug 26, 2026 at 02:40 AM") — this feed mirrors the real
  centre, which never shows relative times.
- **Do** set \`downloadable\` only on rows that genuinely produce a file (reports, exports) —
  the trailing action is a promise.

### 🔴 Don'ts
- **Don't** render a second bell anywhere — one notification centre per frame.
- **Don't** push transient confirmations into the store — auto-dismissing feedback is
  \`useToast\`'s job; notifications are a persistent, catch-up feed.

### A11y
- **Provides:** the trigger's \`aria-label\` carries the live unread count
  ("Notifications, 3 unread"), \`aria-haspopup="dialog"\` (the panel has a header and a
  button — it is a dialog, not a \`role="menu"\`), and Vuetify wires \`aria-expanded\`; the
  panel is \`role="dialog"\` with an accessible name; every row is a real button
  (\`MpListRow clickable\`) with an sr-only "Unread — " prefix; the download button carries a
  per-row \`aria-label\` and swallows its click (it never marks the row read); the badge is
  decorative (the label already announces the count).
- **Consumer must:** nothing — the component is self-contained.
- **Gaps:** no \`aria-live\` region announces count changes while the panel is closed (the
  pre-existing app-bar gap, carried over); the download action is a prototype stub (toast).

### Controls
The component has no props — state comes from \`useNotifications\`. Stories seed the store in
\`setup()\` (reset first, then push fixtures) so they don't bleed into each other.
        `,
      },
    },
  },
} satisfies Meta<typeof MpNotificationsMenu>

export default meta
type Story = StoryObj<typeof meta>

/** Seeds the useNotifications store from setup() — reset first so stories don't bleed into
 * each other. Same idiom as MpToastStack.stories.ts. */
function seededStory(seed: AppNotification[], open = false): Story {
  return {
    render: () => ({
      components: { MpNotificationsMenu },
      setup() {
        const store = useNotifications()
        store.items = seed.map((n) => ({ ...n }))
        return {}
      },
      template: `
        <div class="d-flex justify-end" style="min-height: 480px; padding: 24px;">
          <MpNotificationsMenu />
        </div>
      `,
    }),
    ...(open
      ? {
          play: async ({ canvasElement }) => {
            await new Promise((r) => setTimeout(r, 300))
            canvasElement.querySelector<HTMLElement>('[aria-label^="Notifications"]')?.click()
          },
        }
      : {}),
    args: {} as never,
  }
}

/** The resting trigger: bell + wrapping unread badge. Click it to open the panel. */
export const Default: Story = seededStory(NOTIFICATIONS as AppNotification[])

/** The open panel: See all + Mark all read in the header, generic-icon rows with absolute
 * times, download actions on report/export rows, unread dots. */
export const OpenPanel: Story = seededStory(NOTIFICATIONS as AppNotification[], true)

/** All caught up — the badge hides at zero unread and "Mark all read" disables. */
export const AllRead: Story = seededStory(
  (NOTIFICATIONS as AppNotification[]).map((n) => ({ ...n, read: true })),
  true
)

/** Empty feed — the panel composes MpEmptyState. */
export const Empty: Story = seededStory([], true)

// ── Scenarios ────────────────────────────────────────────────────────────────

/** Download rows — reports and exports carry the trailing download action; it swallows its
 * click, so downloading never marks the row read or closes the panel. */
export const WithDownloads: Story = seededStory(
  [
    { id: 'd-1', title: 'Custom report allfin generated for 206 campaigns', time: 'Aug 26, 2026 at 02:33 AM', read: false, downloadable: true },
    { id: 'd-2', title: "Export report from Aug 26, 2026 to Aug 26, 2026 for 'transab' campaigns", time: 'Aug 26, 2026 at 02:31 AM', read: false, downloadable: true },
    { id: 'd-3', title: "Import 10000 contacts to 'HB list 1' started. Emails imported: 9,988", time: 'Aug 31, 2026 at 02:54 AM', read: true },
  ],
  true
)
