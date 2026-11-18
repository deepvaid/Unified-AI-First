import { onUnmounted } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpToastStack from './MpToastStack.vue'
import { useToast } from '@/composables/useToast'
import { liquidskyDocs } from '@/stories/storyTemplate'
import { overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Molecules/MpToastStack',
  component: MpToastStack,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    canvas: 'full',
    // The stack teleports to <body> and positions fixed at the bottom-right of
    // the viewport, and toast state is a module singleton — so every story here
    // gets its own frame on the docs page and shows only its own queue.
    docs: {
      ...overlayDocs('300px').docs,
      description: {
        component: liquidskyDocs('molecules-mptoaststack') + `
### Overview
\`MpToastStack\` is the single shared toast host for the app (WP-C1 — the one approved
exception to the "no new wrapper components" rule). It renders the queue produced by the
\`useToast()\` composable: call \`toast.success()\` / \`toast.error()\` / \`toast.warning()\` /
\`toast.info()\` (or \`toast.show()\` with an explicit \`type\`) from anywhere, and the toast appears bottom-right,
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
- **Do** let success/info auto-dismiss (4500ms default) and warnings at 7000ms; only override
  \`durationMs\` when a call site has a specific, documented reason.
- **Do** use \`warning\` for degraded-but-continuing outcomes ("3 rows skipped") — a failure the
  user must act on is an \`error\` (persistent), a blocking condition is an inline \`MpAlert\`.

### 🔴 Don'ts
- **Don't** use \`type: 'error'\` for anything the user doesn't need to act on — errors persist
  until dismissed, which is disruptive if overused.
- **Don't** rely on color alone to convey type — pair it with the icon and message text, both
  of which \`MpToastStack\` always renders.

### A11y
- **Provides:** one persistent \`aria-live="polite"\` container, mounted for the app's whole
  lifetime — only the toast cards inside it mount/unmount, never the region itself. Each card
  is \`role="status"\` (success/warning/info) or \`role="alert"\` (error, which nested-overrides to an
  assertive announcement — reserved for errors per the a11y audit; an auto-dismissing warning
  announces politely). Type is always icon + text, never color-only. The auto-dismiss timer
  pauses on \`:hover\`/\`:focus-within\` and resumes on leave/blur, so a keyboard user tabbing to
  the action button is never cut off. Entrance/exit are CSS animations, so the app's global
  \`prefers-reduced-motion\` rule zeroes them automatically.
- **Consumer must:** keep \`message\` meaningful on its own (screen readers announce it without
  surrounding page context) and give \`action.label\` a verb ("Undo", "View") — never "Click here".

### API
\`MpToastStack\` takes **no props, emits, or slots** — there is deliberately nothing to configure
on the host. Its public API is the \`useToast()\` composable and the \`Toast\` / \`ToastOptions\` /
\`ToastAction\` types in \`src/composables/useToast.ts\`, all documented inline there. That's why
the Controls panel below is empty.
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

/**
 * Takes over the shared `useToast()` stack for one story: empties it on setup and puts back what
 * was there when the story unmounts, so a seed never reaches the next story.
 */
function useStoryToasts() {
  const toast = useToast()
  const before = toast.toasts.value
  toast.toasts.value = []
  onUnmounted(() => { toast.toasts.value = before })
  return toast
}

/** A story that shows the host with the given toasts already in the stack. */
function seededStory(seed: (toast: ReturnType<typeof useToast>) => void, height?: string): Story {
  return {
    ...(height ? { parameters: overlayDocs(height) } : {}),
    render: () => ({
      components: { MpToastStack },
      setup() {
        seed(useStoryToasts())
        return {}
      },
      template: '<MpToastStack />',
    }),
  }
}

/**
 * The host with nothing queued, driven through the real API: each button calls `useToast()`.
 * This shows the real timing (success and info leave after 4.5s, a warning after 7s, an error
 * stays) and the pause on hover or focus — hover a toast, or Tab to its action, before it
 * times out.
 */
export const Default: Story = {
  render: () => ({
    components: { MpToastStack },
    setup: () => ({ toast: useStoryToasts() }),
    template: `
      <div class="d-flex flex-wrap ga-2 pa-6">
        <v-btn variant="tonal" color="success" @click="toast.success('Segment saved.')">Push success</v-btn>
        <v-btn variant="tonal" color="error" @click="toast.error('Could not save changes.')">Push error</v-btn>
        <v-btn variant="tonal" color="warning" @click="toast.warning('Send rate is throttled.')">Push warning</v-btn>
        <v-btn variant="tonal" color="info" @click="toast.info('3 contacts were skipped.')">Push info</v-btn>
        <v-btn variant="tonal" @click="toast.success('Widget added.', { action: { label: 'View', onClick: () => {} } })">Push with action</v-btn>
        <MpToastStack />
      </div>
    `,
  }),
}

// ── Template: Variants · States ──────────────────────────────────────────────

/**
 * The four types in one stack, oldest at the top: success, error, warning, info. Each pairs its
 * colour with its own icon. It also shows how the stack grows: a new toast is added at the
 * bottom and pushes the older ones up.
 */
export const Variants: Story = seededStory((toast) => {
  toast.success('Segment saved.', { durationMs: STABLE_MS })
  toast.error('Could not save changes. Check your connection and try again.')
  toast.warning('Send rate is throttled — this campaign will take about 40 minutes longer.', { durationMs: STABLE_MS })
  toast.info('3 contacts were skipped because they already exist in this list.', { durationMs: STABLE_MS })
}, '460px')

/**
 * Content states: an optional bold title above the message, and a long message, which wraps
 * inside the fixed-width card instead of widening it. The action button is `WithAction`.
 */
export const States: Story = seededStory((toast) => {
  toast.success('The change applies to all new enrollments immediately.', {
    title: 'Automation activated',
    durationMs: STABLE_MS,
  })
  toast.error(
    'Stopping "Black Friday 2025 — Early Access VIP" cancels delivery for the 18,240 contacts '
    + 'still queued. The 6,411 emails already sent cannot be recalled, and their opens and clicks '
    + 'will keep reporting under this campaign.',
    { title: 'Campaign send stopped' },
  )
}, '420px')

// ── One toast per story ──────────────────────────────────────────────────────
// These stay separate from `Variants` on purpose: the LiquidSky QA map
// (`src/stories/qa/liquidskyMap.ts`) measures the first toast of each, so each type needs a
// story where it is the only toast.

/** A success confirmation. Auto-dismisses after 4.5s in real usage (pinned here so the docs page stays stable). */
export const Success: Story = seededStory((toast) => {
  toast.success('Segment saved.', { durationMs: STABLE_MS })
})

/** Errors never auto-dismiss — the user must close them (or use the action, if any). */
export const PersistentError: Story = seededStory((toast) => {
  toast.error('Could not save changes. Check your connection and try again.')
})

/** A degraded-but-continuing outcome. Auto-dismisses after 7s in real usage (longer read
 * time than success/info); announces politely — assertive announcements stay error-only. */
export const Warning: Story = seededStory((toast) => {
  toast.warning('Send rate is throttled — this campaign will take about 40 minutes longer.', { durationMs: STABLE_MS })
})

/** An informational, non-urgent update. */
export const Info: Story = seededStory((toast) => {
  toast.info('3 contacts were skipped because they already exist in this list.', { durationMs: STABLE_MS })
})

/** At most one action, rendered as a text-link style button under the message. */
export const WithAction: Story = seededStory((toast) => {
  toast.success('Contact archived.', {
    action: { label: 'Undo', onClick: () => {} },
    durationMs: STABLE_MS,
  })
})
