import type { Meta, StoryObj } from '@storybook/vue3'
import PlgTrialBanner from './PlgTrialBanner.vue'
import { usePlgStore, type PlgDemoPreset } from '@/stores/usePlg'
import { isolateStorage, overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Product/PLG/PlgTrialBanner',
  component: PlgTrialBanner,
  tags: ['autodocs'],
  // applyDemoPreset() persists the PLG state to localStorage: put it back on unmount.
  decorators: [isolateStorage],
  parameters: {
    // Every story seeds the same shared usePlgStore singleton via applyDemoPreset(), and the
    // component's dismissal flag is module-scoped — a frame per story on the docs page (same
    // idiom as PlgTrialChip.stories.ts) keeps one story's preset or dismissal from leaking.
    docs: {
      ...overlayDocs('160px').docs,
      description: {
        component: `
### Overview
\`PlgTrialBanner\` is the full-width shell banner that appears above the content area when a free
trial is nearly over or has lapsed. Like \`PlgTrialChip\` it takes no props and reads
\`usePlgStore\` directly, rendering nothing unless
\`isTrial && ((isExpiring && !dismissed) || isExpired)\`. Amber while expiring (last 3 days), red
once expired. "Talk to sales" opens \`PlgTalkToSalesDialog\`; "Upgrade" routes to the Plans page.

**Use when:** mounted once in the app shell, above the router view — it's the high-urgency
counterpart to the AppBar's \`PlgTrialChip\`.

**Don't use when:** the account is steady mid-trial or paid — it already renders nothing itself,
so don't wrap it in your own \`v-if\`.

### Usage
\`\`\`html
<PlgTrialBanner />
\`\`\`

### 🟢 Do's
- **Do** mount it once, in the shell — it derives everything from \`usePlgStore().active\`.
- **Do** drive demo/story states through \`usePlgStore().applyDemoPreset(...)\`.

### 🔴 Don'ts
- **Don't** pass props — it takes none.
- **Don't** expect the dismissal to persist across a reload: \`dismissedThisSession\` is a
  module-scoped ref, so it survives unmount/remount within the shell but resets on page load.
  Only the *expiring* state is dismissible — an expired trial always shows.

### A11y
- **Provides:** the dismiss control is a real \`<button>\` with
  \`aria-label="Dismiss for this session"\` and a visible \`:focus-visible\` state; urgency is
  carried by the message text, not color alone.
- **Consumer must:** nothing beyond mounting it.

### Controls
This banner takes **no props** — the Controls panel is empty by design. It reads \`usePlgStore()\` and \`useAccountsStore()\`, so the way to change what it shows is to change the PLG demo state (the user-menu switcher, or the \`?plg=\` param).
`,
      },
    },
  },
} satisfies Meta<typeof PlgTrialBanner>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Seeds usePlgStore from setup() via applyDemoPreset — same idiom as PlgTrialChip.stories.ts.
 * `hiddenNote` is shown under the banner for a preset the banner renders nothing for.
 */
function presetStory(preset: PlgDemoPreset, hiddenNote = ''): Story {
  return {
    render: () => ({
      components: { PlgTrialBanner },
      setup() {
        const plg = usePlgStore()
        plg.applyDemoPreset(preset)
        return { hiddenNote }
      },
      template: `
        <div>
          <PlgTrialBanner />
          <p v-if="hiddenNote" class="text-body-2 text-medium-emphasis">{{ hiddenNote }}</p>
        </div>
      `,
    }),
  }
}

/** Inside the last 3 days — amber banner, day countdown, dismissible. */
export const Default: Story = presetStory('trial-d12')

/** Trial lapsed — red banner, data-retention message, and no dismiss control. */
export const Expired: Story = presetStory('trial-expired')

/**
 * Steady mid-trial (day 3 of the window): `isExpiring` is false, so the banner renders nothing.
 * The same is true for every paid preset — this is the component's default state in the shell.
 */
export const NotVisible: Story = presetStory(
  'trial-d3',
  'The banner is hidden for this preset: day 3 of the trial is not yet "expiring".',
)
