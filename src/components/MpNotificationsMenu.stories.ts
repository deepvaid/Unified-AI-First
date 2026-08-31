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
\`MpNotificationsMenu\` is the app bar's notification centre: a bell trigger whose unread badge
**wraps** the button (the app's \`v-badge\` convention — no z-index games against sibling
controls), opening a \`role="dialog"\` panel of severity-tinted \`MpListRow\`s with a
"Mark all read" header action and an \`MpEmptyState\` when the feed is empty.

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
- **Do** keep severities on the shared vocabulary — \`'critical' | 'warning' | 'info'\`,
  the same ramp as the dashboard attention widget.
- **Do** give each notification a domain icon (Lucide) and a \`context\` line — the severity
  tint alone shouldn't carry the meaning.

### 🔴 Don'ts
- **Don't** render a second bell anywhere — one notification centre per frame.
- **Don't** push transient confirmations into the store — auto-dismissing feedback is
  \`useToast\`'s job; notifications are a persistent, catch-up feed.

### A11y
- **Provides:** the trigger's \`aria-label\` carries the live unread count
  ("Notifications, 3 unread"), \`aria-haspopup="dialog"\` (the panel has a header and a
  button — it is a dialog, not a \`role="menu"\`), and Vuetify wires \`aria-expanded\`; the
  panel is \`role="dialog"\` with an accessible name; every row is a real button
  (\`MpListRow clickable\`) with an sr-only "Unread — {severity}:" prefix; the badge is
  decorative (the label already announces the count).
- **Consumer must:** nothing — the component is self-contained.
- **Gaps:** no \`aria-live\` region announces count changes while the panel is closed (the
  pre-existing app-bar gap, carried over); rows mark-as-read on click but don't yet navigate
  to their \`to\` target.

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

/** The open panel: header with "Mark all read", severity-tinted rows, unread dots. */
export const OpenPanel: Story = seededStory(NOTIFICATIONS as AppNotification[], true)

/** All caught up — the badge hides at zero unread and "Mark all read" disables. */
export const AllRead: Story = seededStory(
  (NOTIFICATIONS as AppNotification[]).map((n) => ({ ...n, read: true })),
  true
)

/** Empty feed — the panel composes MpEmptyState. */
export const Empty: Story = seededStory([], true)

// ── Scenarios ────────────────────────────────────────────────────────────────

/** One row per severity — the tints mirror the dashboard attention widget exactly. */
export const Severities: Story = seededStory(
  [
    { id: 's-1', severity: 'critical', icon: 'credit-card', title: 'Payment failed on order #10012', context: 'Sales Orders', time: '12m ago', read: false },
    { id: 's-2', severity: 'warning', icon: 'package', title: 'Trail Shell Jacket is low on stock — 4 left', context: 'Inventory', time: '38m ago', read: false },
    { id: 's-3', severity: 'info', icon: 'send', title: 'Campaign "Spring Refresh" finished sending', context: 'Email Campaigns', time: '1h ago', read: false },
  ],
  true
)
