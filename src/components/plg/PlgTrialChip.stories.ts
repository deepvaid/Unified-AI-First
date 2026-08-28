import type { Meta, StoryObj } from '@storybook/vue3'
import PlgTrialChip from './PlgTrialChip.vue'
import { usePlgStore, type PlgDemoPreset } from '@/stores/usePlg'

const meta = {
  title: 'Product/PLG/PlgTrialChip',
  component: PlgTrialChip,
  tags: ['autodocs'],
  parameters: {
    // Every story seeds the same shared usePlgStore singleton via applyDemoPreset() so it can
    // show a different trial state — render docs examples in isolated iframes (same idiom as
    // MpToastStack.stories.ts) so one story's preset can't overwrite what another just rendered.
    docs: {
      story: { inline: false, height: '440px' },
      description: {
        component: `
### Overview
\`PlgTrialChip\` is the AppBar's trial-status pill — a self-contained popover that reads
\`usePlgStore\` directly and renders nothing outside an active free trial (paid and cancelled
accounts get nothing back). The pill's color and label escalate with urgency — steady primary
while there's time left, amber "Expiring soon" inside the last 3 days, red "Trial ended" once it
lapses — and opening it shows the trial progress bar, Da Vinci AI token usage, the plan's trial
limits, and "Upgrade now" / "Talk to sales" actions (the latter opens \`PlgTalkToSalesDialog\`).

**Use when:** mounted once in \`AppBar\`, alongside the other utility icons — it's the one place
in the shell that surfaces trial urgency.

**Don't use when:** the account is on a paid plan — it already renders nothing itself, so don't
wrap it in your own \`v-if\`; don't duplicate it elsewhere per page.

### Usage
\`\`\`html
<PlgTrialChip />
\`\`\`

### 🟢 Do's
- **Do** mount it once, in the AppBar — it derives everything from \`usePlgStore().active\`.
- **Do** drive demo/story states through \`usePlgStore().applyDemoPreset(...)\` rather than
  editing \`states\` directly.
- **Do** let "Talk to sales" open \`PlgTalkToSalesDialog\` — don't build a second entry point.

### 🔴 Don'ts
- **Don't** pass props — it takes none; every value comes from the active account's PLG state.
- **Don't** gate its visibility yourself — \`v-if="plg.isTrial"\` is already built in.

### A11y
- **Provides:** the pill is a real \`<button>\` with \`aria-label="Trial status"\`,
  \`aria-haspopup="menu"\`, and \`aria-expanded\` bound to the popover state; Vuetify's \`v-menu\`
  traps focus, closes on Escape, and restores focus to the pill on close; urgency is conveyed by
  the label text ("Expiring soon", "Trial ended"), not color alone.
- **Consumer must:** nothing beyond mounting it — the component is fully self-contained.
        

### Controls
This chip takes **no props** — the Controls panel is empty by design. It reads
\`usePlgStore()\` and \`useAccountsStore()\`, so the way to change what it shows is to change the
PLG demo state (the user-menu switcher, or the \`?plg=\` param).
`,
      },
    },
  },
} satisfies Meta<typeof PlgTrialChip>

export default meta
type Story = StoryObj<typeof meta>

/** Seeds usePlgStore from setup() via applyDemoPreset — same idiom as MpMoveToFolderDialog's
 * use of useFoldersStore. Renders the closed pill for the given trial preset. */
function presetStory(preset: PlgDemoPreset): Story {
  return {
    render: () => ({
      components: { PlgTrialChip },
      setup() {
        const plg = usePlgStore()
        plg.applyDemoPreset(preset)
        return {}
      },
      template: `
        <div style="min-height: 100px; padding: 24px; display: flex; align-items: center;">
          <PlgTrialChip />
        </div>
      `,
    }),
  }
}

/** Steady mid-trial state — primary pill, "Trial · Nd". */
export const Default: Story = presetStory('trial-d3')

/** Inside the last 3 days — the pill escalates to warning color, "Expiring soon". */
export const ExpiringSoon: Story = presetStory('trial-d12')

/** Trial over — the pill turns error/red, "Trial ended"; the popover still offers the same actions. */
export const Expired: Story = presetStory('trial-expired')

/**
 * The popover opened automatically (expiring-soon preset): progress bar, Da Vinci AI token
 * meter, trial limits, and the Upgrade now / Talk to sales actions.
 */
export const OpenPopover: Story = {
  render: () => ({
    components: { PlgTrialChip },
    setup() {
      const plg = usePlgStore()
      plg.applyDemoPreset('trial-d12')
      return {}
    },
    template: `
      <div style="min-height: 420px; padding: 24px; display: flex; justify-content: flex-end;">
        <PlgTrialChip />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const trigger = canvasElement.querySelector<HTMLElement>('[aria-label="Trial status"]')
    trigger?.click()
  },
}
