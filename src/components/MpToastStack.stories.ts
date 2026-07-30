import type { Meta, StoryObj } from '@storybook/vue3'
import MpToastStack from './MpToastStack.vue'
import { useToast } from '@/composables/useToast'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'Feedback/MpToastStack',
  component: MpToastStack,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // The stack teleports to <body> and positions fixed at the bottom-right of
    // the viewport — render docs examples in isolated iframes so each story
    // shows its own queue (toast state is a module singleton, same convention
    // as DvToastStack.stories.ts).
    docs: {
      story: { inline: false, height: '300px' },
      description: {
        component: `
### Overview
\`MpToastStack\` is the single shared toast host for the app (WP-C1 — the one approved
exception to the "no new wrapper components" rule). It renders the queue produced by the
\`useToast()\` composable: call \`toast.success()\` / \`toast.error()\` / \`toast.info()\` (or
\`toast.show()\` with an explicit \`type\`) from anywhere, and the toast appears bottom-right,
stacking upward as more arrive. \`MpToastStack\` itself is mounted once, in \`App.vue\` — components
never render it directly.

**Use when:** confirming an action succeeded, reporting an error, or surfacing a passive
status update — anything that used to be a one-off \`v-snackbar\`.

**Don't use when:** the message requires a decision (use \`MpConfirmDialog\`) or blocks the
user from continuing (use a dialog or inline form error instead).

### Usage
\`\`\`ts
import { useToast } from '@/composables/useToast'

const toast = useToast()
toast.success('Segment saved.')
toast.error('Could not save changes. Check your connection and try again.')
toast.info('3 contacts were skipped because they already exist in this list.', {
  title: 'Import finished',
  action: { label: 'View', onClick: () => router.push('/contacts') },
})
\`\`\`

### 🟢 Do's
- **Do** keep the message to one short sentence; use \`title\` only when a label above it adds
  real clarity.
- **Do** pass at most one \`action\` — a second action means this should be a dialog instead.
- **Do** let success/info auto-dismiss (4500ms default); only override \`durationMs\` when a
  call site has a specific, documented reason.

### 🔴 Don'ts
- **Don't** use \`type: 'error'\` for anything the user doesn't need to act on — errors persist
  until dismissed, which is disruptive if overused.
- **Don't** rely on color alone to convey type — pair it with the icon and message text, both
  of which \`MpToastStack\` always renders.

### A11y
- **Provides:** one persistent \`aria-live="polite"\` container, mounted for the app's whole
  lifetime — only the toast cards inside it mount/unmount, never the region itself. Each card
  is \`role="status"\` (success/info) or \`role="alert"\` (error, which nested-overrides to an
  assertive announcement). Type is always icon + text, never color-only. The auto-dismiss timer
  pauses on \`:hover\`/\`:focus-within\` and resumes on leave/blur, so a keyboard user tabbing to
  the action button is never cut off. Entrance/exit are CSS animations, so the app's global
  \`prefers-reduced-motion\` rule zeroes them automatically.
- **Consumer must:** keep \`message\` meaningful on its own (screen readers announce it without
  surrounding page context) and give \`action.label\` a verb ("Undo", "View") — never "Click here".
        `,
      },
    },
  },
} satisfies Meta<typeof MpToastStack>

export default meta
type Story = StoryObj<typeof meta>

// Long enough that the docs page stays stable while reviewing — real call sites
// never pass this. Errors already persist by default (no override needed).
const STABLE_MS = 3_600_000

/** Seeds the useToast() singleton from setup() — reset first so stories don't bleed into
 * each other, then push the story's fixture toast(s). Same idiom as DvToastStack.stories.ts. */
function seededStory(seed: (toast: ReturnType<typeof useToast>) => void): Story {
  return {
    render: () => ({
      components: { MpToastStack },
      setup() {
        const toast = useToast()
        toast.toasts.value = []
        seed(toast)
        return {}
      },
      template: `
        <div style="min-height: 260px; padding: 24px;">
          <MpToastStack />
        </div>
      `,
    }),
  }
}

/** A success confirmation. Auto-dismisses after 4.5s in real usage (pinned here so the docs page stays stable). */
export const Success: Story = seededStory((toast) => {
  toast.success('Segment saved.', { durationMs: STABLE_MS })
})

/** Errors never auto-dismiss — the user must close them (or use the action, if any). */
export const PersistentError: Story = seededStory((toast) => {
  toast.error('Could not save changes. Check your connection and try again.')
})

/** An informational, non-urgent update. */
export const Info: Story = seededStory((toast) => {
  toast.info('3 contacts were skipped because they already exist in this list.', { durationMs: STABLE_MS })
})

/** Optional bold title above the message. */
export const WithTitle: Story = seededStory((toast) => {
  toast.success('The change applies to all new enrollments immediately.', {
    title: 'Automation activated',
    durationMs: STABLE_MS,
  })
})

/** At most one action, rendered as a text-link style button next to the message. */
export const WithAction: Story = seededStory((toast) => {
  toast.success('Contact archived.', {
    action: { label: 'Undo', onClick: () => {} },
    durationMs: STABLE_MS,
  })
})

/** A long message wraps inside the fixed ~320px card instead of widening it. */
export const LongMessage: Story = seededStory((toast) => {
  toast.error(
    'Stopping "Black Friday 2025 — Early Access VIP" cancels delivery for the 18,240 contacts '
    + 'still queued. The 6,411 emails already sent cannot be recalled, and their opens and clicks '
    + 'will keep reporting under this campaign.',
    { title: 'Campaign send stopped' },
  )
})

/** Multiple toasts at once — newest appended at the bottom, older ones pushed upward. */
export const MultipleStacked: Story = seededStory((toast) => {
  toast.info('Draft autosaved.', { durationMs: STABLE_MS })
  toast.success('Widget added to Overview.', {
    action: { label: 'View', onClick: () => {} },
    durationMs: STABLE_MS,
  })
  toast.error('2 items failed to import.')
})

/** L4 overlay surface in dark mode. */
export const DarkModeStacked: Story = {
  globals: darkModeGlobals,
  ...MultipleStacked,
}

/** Drives the real API from buttons — demonstrates the actual 4.5s auto-dismiss timing and
 * hover/focus-to-pause behavior (hover a toast, or Tab to its action button, before it times out). */
export const Interactive: Story = {
  render: () => ({
    components: { MpToastStack },
    setup() {
      const toast = useToast()
      toast.toasts.value = []
      return { toast }
    },
    template: `
      <div style="min-height: 260px; padding: 24px; display: flex; gap: 8px; flex-wrap: wrap; align-content: flex-start;">
        <v-btn variant="tonal" color="success" class="text-none" @click="toast.success('Segment saved.')">Push success</v-btn>
        <v-btn variant="tonal" color="error" class="text-none" @click="toast.error('Could not save changes.')">Push error</v-btn>
        <v-btn variant="tonal" color="info" class="text-none" @click="toast.info('3 contacts were skipped.')">Push info</v-btn>
        <v-btn variant="tonal" class="text-none" @click="toast.success('Widget added.', { action: { label: 'View', onClick: () => {} } })">Push with action</v-btn>
        <MpToastStack />
      </div>
    `,
  }),
}
