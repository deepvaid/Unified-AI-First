import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MpBanner from './MpBanner.vue'

const meta = {
  title: 'Molecules/MpBanner',
  component: MpBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpBanner\` is the full-width announcement strip that spans the app frame (or a whole page
region): square corners, a soft tone fill, and a bottom hairline as its boundary against the
chrome below. It mounts at the top of \`<v-main>\` (see \`App.vue\` — \`PlgTrialBanner\` composes
it there) or directly above a page's content.

**The split with MpAlert:** \`MpAlert\` is the *rounded, borderless in-page block* attached to a
region of content; \`MpBanner\` is the *edge strip* that belongs to the frame. Same tones, same
role/\`aria-live\` semantics, different geometry — don't swap them.

**Use when:** an account-level or page-level condition needs standing visibility — trial
expiring, payment failed, sync degraded, scheduled maintenance.

**Don't use when:** the feedback belongs to a specific region (\`MpAlert\`), is transient
(\`useToast\`), or is marketing content inside merchant surfaces (those are product features,
not chrome).

### Usage
\`\`\`html
<MpBanner
  tone="warning"
  :message="\`Your trial ends in \${daysLeft} days.\`"
  dismissible
  dismiss-label="Dismiss for this session"
  @dismiss="dismissedThisSession = true"
>
  <template #actions>
    <v-btn size="small" color="primary" variant="flat" class="text-none">Upgrade</v-btn>
  </template>
</MpBanner>
\`\`\`

### 🟢 Do's
- **Do** keep one banner visible at a time — two stacked strips mean the page has a status
  problem, not a banner shortage.
- **Do** put the remedy in \`#actions\` as small buttons; the message states the condition only.
- **Do** own dismissal state in the consumer (session ref, store, localStorage) — the component
  only emits.

### 🔴 Don'ts
- **Don't** round its corners or float it — if it needs a radius, it's an \`MpAlert\`.
- **Don't** use it for success confirmations — those are toasts; a success banner is only for
  standing state ("Domain verified" during a longer setup flow).

### A11y
- **Provides:** \`role="status"\` (info/success) or \`role="alert"\` (warning/error); a
  \`d-sr-only\` tone prefix; the icon is \`aria-hidden\`; a labelled dismiss button
  (\`dismissLabel\` — say what dismissing means, e.g. "Dismiss for this session"); every tone
  pair is contrast-checked.
- **Consumer must:** own visibility, keep the message meaningful without color, and not stack
  banners.
- **Gaps:** a banner rendered with the initial page may not be announced by all screen readers
  (inherent to live regions).

### API
Props \`tone\` · \`message?\` (or default slot for rich markup) · \`icon?: string | false\` ·
\`dismissible?\` · \`dismissLabel?\` (default "Dismiss"). Emits \`dismiss\`. Slots: default,
\`#actions\`.
        `,
      },
    },
  },
  args: {
    tone: 'info',
    message: 'Scheduled maintenance on Sep 6, 02:00–03:00 UTC. Sends queued during the window go out afterward.',
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'error'],
      description: 'Feedback severity — drives tint, default icon and role.',
    },
    message: {
      control: 'text',
      description: 'One-line message. Use the default slot instead for rich markup.',
    },
    icon: {
      control: 'text',
      description: 'Lucide icon override; pass `false` to hide. Defaults per tone.',
    },
    dismissible: {
      control: 'boolean',
      description: 'Renders a dismiss button. Visibility stays consumer-owned: v-if + @dismiss.',
    },
    dismissLabel: {
      control: 'text',
      description: 'Accessible label for the dismiss button — say what dismissing means.',
    },
    default: {
      control: false,
      description: 'Slot — rich message markup (bold lead + body). Overrides `message`.',
      table: { category: 'slots' },
    },
    actions: {
      control: false,
      description: 'Slot — remedy buttons (small v-btns), pinned to the trailing edge before the dismiss button.',
      table: { category: 'slots' },
    },
  },
} satisfies Meta<typeof MpBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The four tones — soft fill + tone-ink hairline, always full-width and square. */
export const Variants: Story = {
  render: () => ({
    components: { MpBanner },
    template: `
      <div class="d-flex flex-column">
        <MpBanner tone="info" message="Scheduled maintenance on Sep 6, 02:00–03:00 UTC." />
        <MpBanner tone="success" message="Migration complete — all 48,120 contacts moved to the new workspace." />
        <MpBanner tone="warning" message="Your trial ends in 3 days." />
        <MpBanner tone="error" message="Your last payment failed. Update your payment method to keep access." />
      </div>
    `,
  }),
  args: {} as never,
}

/** Actions, dismissal (consumer-owned), and rich slot content with a bold lead. */
export const States: Story = {
  render: () => ({
    components: { MpBanner },
    setup() {
      const visible = ref(true)
      return { visible }
    },
    template: `
      <div class="d-flex flex-column ga-4">
        <MpBanner tone="warning" message="Your trial ends in 3 days.">
          <template #actions>
            <v-btn size="small" color="primary" variant="flat" class="text-none">Upgrade</v-btn>
            <v-btn size="small" variant="text" class="text-none">Talk to sales</v-btn>
          </template>
        </MpBanner>
        <MpBanner
          v-if="visible"
          tone="info"
          message="Dismissible — visibility is owned by the consumer."
          dismissible
          dismiss-label="Dismiss for this session"
          @dismiss="visible = false"
        />
        <MpBanner tone="error">
          <strong>3 products failed to sync.</strong>&nbsp;Prices on this channel may be stale until the next successful sync.
          <template #actions>
            <v-btn size="small" variant="outlined" class="text-none">Review sync</v-btn>
          </template>
        </MpBanner>
      </div>
    `,
  }),
  args: {} as never,
}
