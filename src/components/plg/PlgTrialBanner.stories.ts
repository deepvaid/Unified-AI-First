import type { Meta, StoryObj } from '@storybook/vue3'
import PlgTrialBanner from './PlgTrialBanner.vue'
import { usePlgStore, type PlgDemoPreset } from '@/stores/usePlg'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta = {
  title: 'PLG/PlgTrialBanner',
  component: PlgTrialBanner,
  tags: ['autodocs'],
  parameters: {
    // Every story seeds the same shared usePlgStore singleton via applyDemoPreset(), and the
    // component's dismissal flag is module-scoped — render docs examples in isolated iframes
    // (same idiom as PlgTrialChip.stories.ts) so one story's preset or dismissal can't leak.
    docs: {
      story: { inline: false, height: '160px' },
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
        `,
      },
    },
  },
} satisfies Meta<typeof PlgTrialBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Seeds usePlgStore from setup() via applyDemoPreset — same idiom as PlgTrialChip.stories.ts. */
function presetStory(preset: PlgDemoPreset): Story {
  return {
    render: () => ({
      components: { PlgTrialBanner },
      setup() {
        const plg = usePlgStore()
        plg.applyDemoPreset(preset)
        return {}
      },
      template: `
        <div style="min-height: 80px;">
          <PlgTrialBanner />
        </div>
      `,
    }),
  }
}

/** Inside the last 3 days — amber banner, day countdown, dismissible. */
export const ExpiringSoon: Story = presetStory('trial-d12')

/** Trial lapsed — red banner, data-retention message, and no dismiss control. */
export const Expired: Story = presetStory('trial-expired')

/**
 * Steady mid-trial (day 3 of the window): `isExpiring` is false, so the banner renders nothing.
 * The same is true for every paid preset — this is the component's default state in the shell.
 */
export const NotVisible: Story = presetStory('trial-d3')

/** Amber banner on the dark theme. */
export const DarkMode: Story = {
  ...presetStory('trial-d12'),
  globals: darkModeGlobals,
}
